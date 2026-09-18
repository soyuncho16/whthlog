---
title: 'VSCode로 홈을 열자 CPU 폭주: 심볼릭 링크 탈출과 메모리 스래싱'
description: '홈 디렉토리를 워크스페이스로 열었더니 파일 열거용 ripgrep이 wine의 z: 링크를 타고 루트 파일시스템으로 나가 2분에 3억 경로를 만들고 OOM으로 죽었다. 순환 탐지가 무엇을 조상으로 치는지, 메모리 고갈이 왜 CPU 폭주로 보이는지.'
pubDate: '2026-09-18T14:38:04+09:00'
section: cs
subsection: troubleshooting
cs_area: [os, data-structures]
concept: [symlink-loop-detection, tree-traversal, procfs, mount-namespace, page-reclaim, swap, load-average, inotify]
status: resolved
stack: [vscode, ripgrep, linux, wine]
---

## 한 줄

VSCode에서 홈 디렉토리(`/home/whth`)를 통째로 열자 CPU가 치솟고 창이 세 번 죽었다. 파일 열거를 맡은 ripgrep이 wine 프리픽스의 `dosdevices/z: -> /` 링크를 따라 루트 파일시스템 전체로 나갔고, `/proc` 아래의 cwd·root 링크로 같은 트리를 반복해 훑다가 메모리 50 GB를 넘겨 OOM 킬을 받았다. 재귀 탐색의 순환 탐지는 "걸어 내려온 경로"만 조상으로 친다는 것, 그리고 메모리 고갈이 커널의 페이지 회수 작업 때문에 CPU 사용량으로 나타난다는 것이 핵심이다. 해결은 홈을 워크스페이스로 열지 않는 것이고, 꼭 열어야 하면 `search.followSymlinks`를 끄는 것이다.

## 증상

- 2026-09-18 11:36, VSCode 1.135로 `/home/whth`를 열었다. 상단바의 CPU 표시기(runcat)가 바로 뛰었다.
- 창이 세 번 죽었다. 11:37:57과 11:42:02는 종료 코드 132, 11:42:51은 135. Crashpad 덤프가 세 개 남았다.
- 커널 로그 11:41:43에 OOM 킬 기록. 그 순간 프로세스 메모리:

| 프로세스 | anon RSS |
|---|---|
| rg (VSCode가 띄움) | 18.6 GB |
| rg (VSCode가 띄움) | 17.2 GB |
| code 프로세스 5개 | 5.0 / 4.3 / 2.9 / 1.4 / 1.4 GB |
| 합계 | 50.8 GB. RAM은 31 GB, 스왑 2 GB는 전부 소진 |

- 로드 평균은 5분 기준 8.5. 점검을 시작한 11:46에는 이미 VSCode 본체가 없고 CPU는 92% 유휴였다. 몇 분 전에 폭발했다가 가라앉은 흔적이다.
- VSCode 로그. Pylance가 "Enumeration of workspace source files is taking longer than 10 seconds. You have opened your home directory or entire hard drive as a workspace" 경고를 남겼다. git 확장은 하위 폴더 전부에 git을 돌려 "not a git repository"를 수십 줄 찍었다. 파일 워처는 홈의 디렉토리 135,455개를 감시하려다 inotify 한도 65,536에 걸려 parcel 워처가 실패하고 universal 워처로 후퇴했다.
- 홈 디렉토리 규모: 파일 약 200만 개(whth 119만, nvidia 19만, miniconda3 15만, .cache 9만), 용량 461 GB. wine 프리픽스가 넷(.wine, .wine-aip, .wine-kakao, .wine-dogfight) 있고 전부 `dosdevices/z: -> /` 링크를 갖고 있다.

## 내 진단

> **내 진단** 홈이 너무 커서 그걸 VSCode가 다 열려고 하니까 CPU가 과하게 도는구나, 정도였다. 어느 컴포넌트가 무엇을 하다 터지는지는 몰랐다. 나중에 rg가 `z: -> /` 링크를 따라 나갔다는 얘기를 듣고는 "z:가 /면 home 위에 있는 조상이잖아, 그럼 순환으로 잡혔어야 하지 않나"라고 생각했다. 파일시스템 모양으로는 맞는 말인데, 탐색기가 조상을 세는 방식은 달랐다. 메모리가 터졌는데 왜 CPU로 보였는지는 감이 안 잡혔다.

여기서부터의 측정과 메커니즘은 Claude Code가 로그와 재현 실험으로 보탰다. 내가 세운 가설은 "홈이 커서"까지고, 그 뒤 "왜 200만 파일이 3억 경로가 됐나"와 "왜 메모리 문제가 CPU로 보였나"는 아래 실험과 설명을 따라가며 배운 것이다.

## CS 개념

**재귀 탐색과 심볼릭 링크 순환 탐지.** 디렉토리 트리를 훑는 건 깊이 우선 탐색이다. 트리라서 끝이 있다. 그런데 심볼릭 링크는 트리에 간선을 하나 더 얹는다. `a/b/link -> a`처럼 위쪽을 가리키는 링크를 따라가면 `a/b/link/b/link/b/...`로 영원히 내려간다. 그래서 링크를 따라가는 도구는 순환 탐지가 필요하다. 방법은 둘이다. 하나는 방문한 디렉토리를 전부 집합에 기억하는 것(메모리가 파일 수만큼 든다). 다른 하나는 링크를 만날 때 "이 링크가 가리키는 곳이 지금 내가 내려온 경로 위에 있는 디렉토리인가"만 검사하는 것이다. dev와 inode 번호를 비교하면 된다. ripgrep은 후자다.

여기서 조상은 파일시스템의 조상이 아니라 탐색이 실제로 지나온 디렉토리 스택이다. 이걸 작은 트리로 확인했다. `outer/root`에서 출발해 링크 셋을 두었다.

```
outer/root/a/b/up_to_walkroot    -> outer/root   (출발점으로)
outer/root/a/b/up_above_walkroot -> outer        (출발점보다 위로)
outer/root/a/b/to_sibling        -> outer/sib    (형제 트리로)
```

`rg --files --follow` 결과, 출발점으로 가는 링크만 "File system loop found ... points to an ancestor ."로 차단됐다. 출발점보다 위로 가는 링크는 처음엔 그냥 따라 들어가서 `up_above_walkroot/root/a/b/f1`처럼 같은 파일을 한 번 더 나열했고, 그 안에서 두 번째로 만났을 때에야 차단됐다. 형제로 가는 링크는 순환이 아니니 그냥 통과다. 정리하면, 조상 검사는 무한 루프만 막고 중복 탐색은 못 막는다. 링크가 자손이나 형제를 가리키면 그 서브트리를 통째로 다시 훑는다.

**/proc의 마법 링크.** `/proc/<pid>/cwd`, `/proc/<pid>/root`, `/proc/<pid>/fd/*`는 커널이 프로세스마다 만들어 주는 링크다. 작업 디렉토리가 `/home/whth/whth`인 프로세스가 N개면, `/proc` 아래에 그 디렉토리를 가리키는 링크가 N개 생긴다. `/home/whth`에서 출발한 탐색기 입장에서 `/home/whth/whth`는 조상이 아니라 자손이다. 그러니 순환이 아니고, 링크마다 119만 파일을 다시 훑는다. `/proc/<pid>/root`는 보통 `/`를 가리키지만, snap으로 실행된 프로세스는 마운트 네임스페이스가 달라서 커널이 돌려주는 root의 dev:inode가 실제 `/`(66306:2)와 다르다(53:1). 탐색기 눈에는 다른 디렉토리다. 순환이 아니니 그 네임스페이스가 보는 파일시스템 전체를 또 훑는다. 지난 [namespace와 cgroup 글](/whthlog/blog/2026-07-24-namespace-and-cgroup/)에서 본 마운트 네임스페이스가 이런 식으로 돌아온다.

**메모리 고갈이 CPU 폭주로 보이는 이유.** 숫자부터. RAM 31 GB에 50 GB를 요구했고, 스왑 2 GB는 꽉 찼다. 스왑은 메모리가 아니라 디스크에 있는 파일(`/swapfile`)이다. RAM이 꽉 차면 커널은 빈 페이지를 만들어야 한다. 방법은 둘이다. 파일에서 읽어 온 페이지 캐시는 그냥 버린다(디스크에 원본이 있으니까). 프로그램이 만든 익명 페이지는 스왑 파일에 써 두고 RAM에서 뺀다. 이 작업을 하는 게 kswapd 커널 스레드고, 그래도 모자라면 메모리를 요청한 프로세스가 시스템 콜 안에서 직접 회수한다. 둘 다 CPU 시간이다. top의 `%Cpu` 줄에서 us는 사용자 코드가 돈 시간, sy는 커널이 대신 일한 시간인데, 이 회수 작업은 sy로 잡힌다. 스왑까지 꽉 차면 익명 페이지를 빼낼 곳이 없다. OOM 순간 페이지 캐시는 active_file 1.9 MB, inactive_file 5 MB로 사실상 0이었다. 더 비울 게 없으니 OOM 킬러가 가장 큰 프로세스(rg)를 죽였다.

CPU가 뛴 이유는 둘이 겹친 것이다. 첫째, rg 자체가 진짜로 계산을 했다. 재현에서 120초에 3억 경로를 출력했으니 초당 250만 경로, 전 코어를 썼다. 둘째, 커널의 페이지 회수. 그리고 스왑된 페이지를 다시 읽어야 하는 프로세스는 D 상태(uninterruptible sleep)로 기다리는데 로드 평균은 실행 중(R)과 D 상태를 둘 다 센다. 그래서 8.5가 나왔다. 상단바의 CPU 표시기는 `/proc/stat`의 "유휴가 아닌 시간"을 합산하니 이 전부가 CPU 폭주로 보인다.

**inotify 워치 한도.** 파일 워처는 감시할 디렉토리마다 inotify 워치를 하나 쓴다. 사용자당 한도 `fs.inotify.max_user_watches`가 65,536인데 홈에는 디렉토리가 135,455개다. 두 배가 모자라서 재귀 워처가 실패하고 후퇴했다. 이건 부수 요인이고, 폭주의 본체는 아니다.

## 좁혀가기

출발은 "홈이 커서"였다. 점검 시작 시점의 스냅샷은 CPU 92% 유휴였는데 로드 평균 5분이 8.5였다. 몇 분 전에 크게 돌다 가라앉았다는 뜻이다. VSCode 본체 프로세스는 없고 crashpad 핸들러만 고아로 남아 있었다. 로그 디렉토리가 11:36과 11:42에 하나씩 생겼다. 두 번 띄웠고 두 번 다 죽었다.

로그를 읽으니 렌더러 크래시 3회, Pylance의 홈 디렉토리 경고, git 확장의 하위 폴더 스캔, 파일 워처 오류가 나왔다. 여기까지는 전부 "홈이 커서"로 설명된다. 그런데 커널 저널에 OOM 킬이 있었다. rg 두 개가 합쳐 36 GB. 200만 파일을 나열하는 데 36 GB는 말이 안 된다. 파일 하나에 100바이트 잡아도 200 MB다.

첫 가설은 홈에 있던 4.2 GB짜리 로그 파일(`dbus-pid-snapshot.log`)이었다. rg는 줄 단위로 읽으니 한 줄이 수 GB면 버퍼가 그만큼 커진다. 앞 200 MB를 표본으로 재 보니 최장 줄이 119자였다. 기각.

다음은 "홈 밖으로 나가는 링크가 있나"였다. `find ~ -type l -lname '/*'`로 절대 경로 링크를 뽑으니 wine 프리픽스 네 개에 전부 `dosdevices/z: -> /`가 있었다. wine이 Z: 드라이브를 루트에 매핑하는 관례다. VSCode의 파일 열거는 `rg --files`에 `--follow`를 붙여 돌리는데(`search.followSymlinks` 기본값이 true다), `--follow`가 있으면 `z:`를 타고 `/` 전체로 나간다.

재현했다. VSCode 동봉 rg 15.0.0을 같은 인자로 `/home/whth`에서 돌렸다. 주소 공간 6 GB 제한과 120초 제한을 걸었다.

| 조건 | 결과 |
|---|---|
| `--follow` 없음 | 700,289 파일, 0.16초, RSS 44 MB |
| `--follow` 있음 | 120초 안에 299,897,638 경로, 그중 298,340,918이 `dosdevices/z:/` 경유 |

출력 끝부분의 경로 하나가 전체 메커니즘을 보여 준다.

```
./.wine/dosdevices/z:/proc/6970/root/proc/2463918/task/2463920/cwd/workroom/realsense/...
```

`z:`로 `/`에 나가고, `/proc/6970/root`로 다시 루트에 들어가고, `/proc/2463918/task/2463920/cwd`로 `/home/whth/whth`에 들어간다. 표본을 나눠 보면 앞부분은 `usr/share` 40만, `usr/lib` 19만처럼 루트 파일시스템을 한 번 훑는 양이고, 뒷부분은 `proc/2073153` 170만, `proc/6970` 65만처럼 프로세스 하나당 수십만에서 백만 단위다. 6970은 snapd-desktop-integration(snap이라 마운트 네임스페이스가 다름), 2073153과 2073152는 작업 디렉토리가 `/home/whth/whth`인 MCP 서버 프로세스였다.

"왜 순환 탐지가 안 잡았나"는 앞의 작은 트리 실험으로 확인했다. `/`는 `/home/whth`에서 출발한 탐색이 지나온 경로에 없다. `/proc/<pid>/cwd`는 자손을 가리킨다. snap의 `/proc/<pid>/root`는 아예 다른 inode다. 셋 다 순환이 아니다.

재현 자체도 위험했다. 2분 만에 45 GB 출력이 나왔고, `timeout`이 `/usr/bin/time`만 죽이고 뒤의 파이프라인이 삭제된 파일을 붙들고 있어서 디스크가 잠깐 43 GB 줄었다. 정리하고 나서야 회복됐다. 재현은 출력을 파일로 받지 말고 `wc -l`로 세거나, 최소한 주소 공간과 시간에 더해 디스크 상한도 걸어야 한다.

## 해결 & 왜 되는가

홈을 워크스페이스로 열지 않는다. 프로젝트 폴더를 연다. 탐색 범위를 "링크가 어디를 가리키는지 알고 있는 트리"로 한정하는 게 근본 해법이다.

홈을 꼭 열어야 하면 `settings.json`에 `"search.followSymlinks": false`를 둔다. 그러면 rg에 `--follow`가 안 붙고 링크는 잎으로 취급돼 탈출이 없다. 재현에서 `--follow`를 뺀 쪽이 0.16초, 44 MB였던 게 그 증거다. 여기에 `files.watcherExclude`와 `search.exclude`에 `.wine*`, `.cache`, `nvidia`, `miniconda3`, `snap`, `.vscode-server`를 넣고 `git.autoRepositoryDetection`을 `openEditors`로 두면 Pylance 열거, git 스캔, 워처 부하도 같이 줄어든다.

inotify 한도를 올리거나 스왑을 늘리는 건 증상 완화다. 워처 오류는 사라지고 OOM은 조금 늦어지겠지만, 링크 탈출로 3억 경로가 생기는 건 그대로다.

왜 이게 맞는 해법인가. 조상 검사식 순환 탐지는 무한 루프를 막는 장치지 중복 탐색을 막는 장치가 아니다. 링크가 형제나 자손을 가리키면 그 서브트리가 링크 수만큼 다시 열거된다. `/proc`에는 프로세스 수만큼 그런 링크가 있고, snap의 root는 다른 inode라 아예 새 트리로 보인다. 링크를 따라가는 탐색은 링크의 목적지를 신뢰할 수 있는 트리 안에서만 안전하고, 홈 디렉토리는 그런 트리가 아니다.

## 일반화

링크를 따라가는 재귀 도구는 전부 같은 함정을 갖는다. `find -L`, `rsync -L`, `tar -h`, 백업 도구, 인덱서. 조상 검사는 루프 방지이지 중복 방지가 아니라서, 자손이나 형제를 가리키는 링크가 많은 트리(`/proc`, wine 프리픽스, 컨테이너 rootfs)에서는 탐색량이 링크 수에 비례해 불어난다.

그리고 "CPU가 돈다"는 증상은 메모리 문제의 얼굴일 수 있다. top의 sy 비중, 스왑 사용량, 로드 평균에 섞인 D 상태 프로세스를 같이 보면 갈린다.

## 링크

- 관련 글: [컨테이너 격리의 두 축: namespace와 cgroup](/whthlog/blog/2026-07-24-namespace-and-cgroup/)
- worklog 엔트리: 이 글 발행 후 캡처 예정
