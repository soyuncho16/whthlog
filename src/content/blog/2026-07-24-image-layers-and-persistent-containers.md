---
title: 'overlayfs와 쓰기 레이어: persistent 컨테이너의 정체'
description: '도커 이미지가 읽기전용 레이어 스택이고 컨테이너가 그 위에 자기 쓰기 레이어를 얹는다는 걸 overlayfs로 확인하고, persistent 컨테이너가 왜 --rm 안 한 것뿐인지 stop/start로 확인한 공부 기록'
pubDate: 'Jul 24 2026'
section: cs
subsection: study
cs_area: [os]
concept: [overlayfs, copy-on-write, layer, volume]
stack: [docker, linux, ros2]
---

시리즈의 마지막이자 이 공부를 시작한 이유다.

> **내 진단** 나는 컨테이너를 '띄워서 한 번 쓰고 마는 것'으로만 다뤘다. 그래서 persistent 컨테이너라는 말이 뭔가 특별한 기능처럼 들렸다. 알고 보니 특별한 종류가 아니라, `--rm`을 안 붙여 쓰기 레이어를 유지하는 것뿐이었다.

2편에서 컨테이너의 `/`가 `overlay`라는 것만 보고 넘어갔다. 그 overlay가 뭐고, 컨테이너가 파일을 고치면 어디로 가고, 왜 `--rm`이면 사라지는지가 persistent의 정체였다.

## 이미지는 읽기전용 레이어 스택이다

이미지는 하나의 통짜 파일시스템이 아니다. 읽기전용 레이어를 쌓은 스택이다. 우리 이미지 둘을 재보면 나온다.

```
base     : 16 레이어
openvins : 26 레이어  (하위 16개는 base 와 동일, 위에 10개만 더 얹음)
```

Dockerfile의 명령 하나(`FROM`, `RUN apt install`, `COPY`)마다 레이어가 하나씩 얹힌다. `vio/openvins-ofm`은 `FROM vio/base`로 시작하니 base의 16 레이어를 밑에 깔고 위에 OpenVINS 전용 10 레이어를 얹은 것이다.

이 구조가 좋은 건 하위 레이어를 공유하기 때문이다. base 16 레이어는 디스크에 딱 한 벌만 있고, openvins도 orbslam도 그걸 같이 가리킨다. 이미지가 여러 개라도 공통 부분은 중복 저장되지 않는다. 빌드 캐시도 이 단위라, base가 안 바뀌면 openvins를 다시 빌드해도 앞 16 레이어는 재사용한다.

## overlayfs가 레이어들을 하나의 `/`로 합친다

읽기전용 레이어만 쌓으면 컨테이너가 파일을 못 고친다. 여기서 overlayfs가 등장한다. 도는 컨테이너의 GraphDriver를 보면 3층 구조가 나온다.

```
LowerDir  : 27 겹      (읽기전용 이미지 레이어들, 공유)
UpperDir  : .../diff   (이 컨테이너 전용 쓰기 레이어, 혼자 씀)
MergedDir : .../merged (컨테이너가 실제로 보는 /)
```

overlayfs는 lower(읽기전용)와 upper(쓰기)를 겹쳐 하나의 `/`(merged)로 보여준다. 컨테이너가 `/`를 읽으면 위에서부터 훑어 upper에 있으면 그걸, 없으면 아래 lower에서 찾는다. 컨테이너 입장에선 평범한 파일시스템 하나로 보이지만, 실은 여러 겹을 합쳐 만든 뷰다.

## 파일을 고치면 어디로 가나: copy-on-write

컨테이너가 이미지 안의 파일(lower의 읽기전용)을 고치면, 이미지 원본은 못 건드리니 커널이 그 파일을 upper로 복사한 뒤 복사본을 고친다. 이게 copy-on-write(CoW)다. 쓸 때 비로소 복사한다는 뜻. 새로 만든 파일도 upper에 생긴다.

이 덕에 이미지 원본은 절대 안 바뀐다. 그래서 한 이미지를 컨테이너 열 개가 동시에 써도 안전하다. 다들 같은 lower를 공유하고, 각자 자기 upper에만 변경을 쌓는다. 컨테이너끼리 서로의 변경이 안 보이는 이유도 upper가 각자 따로여서다.

## persistent 컨테이너의 정체

이제 정리된다. **컨테이너 = 이미지 레이어(lower, 공유) + 자기 전용 쓰기 레이어(upper) + 돌고 있는 프로세스.** 여기서 두 종류가 갈린다.

- **ephemeral (`--rm`)**: 프로세스가 끝나면 컨테이너와 그 upperdir을 통째로 삭제한다. 안에 쌓인 변경은 다 증발한다. 그래서 결과를 upper가 아니라 `-v` bind mount로 밖에 빼야 한다.
- **persistent (`--rm` 안 붙임)**: 프로세스가 끝나도 컨테이너 객체와 upperdir이 남는다.

증명은 간단했다. 일회용 컨테이너를 `--rm` 없이 띄우고 파일을 하나 쓴 뒤 stop과 start를 해봤다.

```
AutoRemove          : false
[1] 파일 쓰고 읽기      : hello 2026-07-24
[2] stop→start 후 읽기 : hello 2026-07-24
```

프로세스를 껐다 켜도 파일이 살아남았다. 쓰기 레이어(upper)가 컨테이너와 함께 유지되기 때문이다. `--rm`이었다면 이 upperdir이 삭제돼 파일도 증발했을 것이다.

그리고 `sleep infinity` 패턴의 이유가 여기서 완성된다. 컨테이너는 메인 프로세스가 끝나면 멈춘다(persistent라도 stop 상태가 된다). 그래서 진짜 작업 대신 안 죽는 `sleep infinity`를 메인으로 걸어 컨테이너를 계속 running 상태로 살려두고, 실제 작업은 `docker exec`으로 그 안에 밀어넣는다. 우리 실행 컨테이너가 정확히 이 방식이라 며칠씩 살아서 언제든 들어가 볼 수 있다.

한 줄 요약: persistent 컨테이너 = `--rm` 없이 유지하는 컨테이너. 그 안의 변경(upper 레이어)이 프로세스를 껐다 켜도, 다시 exec해도 계속 쌓이고 살아남는다.

## 영속성 3층위: 쓰기 레이어 vs bind mount vs volume

주의할 게 있다. persistent 컨테이너의 upper 레이어는 '진짜 데이터를 두는 곳'이 아니다. 세 가지를 구분해야 한다.

| 저장 위치 | 수명 | 특징 |
|-----------|------|------|
| 쓰기 레이어 (upper) | 컨테이너와 운명 공동체 | CoW라 느리고, 컨테이너를 `rm`하면 사라짐 |
| bind mount (`-v host:cont`) | 컨테이너 넘어 영속 | 호스트 폴더 직결, 빠름 |
| named volume (`docker volume`) | 컨테이너 넘어 영속 | 도커가 `/var/lib/docker/volumes`에 관리, 이식성 |

persistent 컨테이너라도 upper는 컨테이너를 지우면 사라진다. 그래서 정말 지켜야 할 데이터(실험 결과)는 upper가 아니라 bind mount나 volume에 둔다. 우리는 결과를 `-v`로 호스트의 결과 폴더에 바로 쓴다. persistent는 '환경을 살려두고 반복 작업'에 좋은 것이고, '데이터 영속'은 bind나 volume 몫이다. 둘은 다른 문제를 푼다.

## 시리즈를 닫으며

이걸로 도커 그림이 완결됐다. 컨테이너는 격리된 프로세스(1편)이고, 그 격리는 namespace가 가린 장부와 cgroup이 조른 자원(2편)이며, 그 파일시스템은 overlayfs로 얹은 이미지 레이어와 자기 쓰기 레이어(3편)다. 처음 'persistent 컨테이너가 뭔지'로 시작한 질문이 결국 이 쓰기 레이어와 컨테이너 수명 이야기였다.

## 링크

VIO 6종 비교 실험의 Docker 인프라를 바닥부터 다시 공부한 시리즈. 3편(완결). 1편은 컨테이너와 명령어, 2편은 namespace와 cgroup.
