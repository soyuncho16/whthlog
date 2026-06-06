---
name: cs-ts
description: Use when the user confirms capturing a just-solved CS-applied troubleshooting moment into the whthlog public blog. Extracts the user's OWN reasoning from this conversation, fills the CS-lens post format, writes to ~/whth/whth/whthlog, cross-links worklog/wiki, and publishes via git push. NEVER writes the CS analysis itself.
---

# cs-ts — CS 트러블슈팅 포스트 캡처·발행

블로그: `~/whth/whth/whthlog/` (GitHub `soyuncho16/whthlog`, 라이브 `https://soyuncho16.github.io/whthlog/`).
포스트 위치: `src/content/blog/YYYY-MM-DD-<slug>.md`. 양식 본보기: `~/whth/whth/whthlog/POST_FORMAT.md`.

## 절대 규칙

- CS 분석을 **새로 짓지 않는다.** 이번 대화에서 *사용자가 실제로 말한* 가설·추론만 `어느 레이어인가 — 내 진단`에 옮긴다.
- 사용자가 안 한 추론을 위조하지 않는다. 사용자 추론이 빈약하면 → 포스트를 밀어붙이지 말고 멈춰서 "이 부분 네 생각은?" 되묻는다(소크라테스식). 끝내 사용자가 "그냥 써줘" 하면 그때만 채우되, 그 사실을 포스트에 정직하게 인라인 표기.
- 막혀서 Claude/문서/검색이 사실을 보탠 지점은 본문에 자연스러운 인라인으로 정직하게.

## 절차

1. **재료 수집** — 이번 대화에서 추린다: (a) 증상 (b) 사용자의 가설·틀린 시도·자기보정 (c) Claude가 보탠 사실 (d) 최종 해결 + 왜 되는지.
2. **양식 채움** — `POST_FORMAT.md` 순서대로 초안. `어느 레이어인가 — 내 진단`은 반드시 사용자 발화 기반. frontmatter `cs_area`·`concept`·`status`·`stack` 채움.
3. **파일 작성** — `src/content/blog/YYYY-MM-DD-<slug>.md`. slug 은 영어 kebab-case.
4. **빌드 검증** — `cd ~/whth/whth/whthlog && npm run build` (스키마·렌더 통과 확인).
5. **사용자 검토** — 초안 보여주고, 특히 `내 진단`이 진짜 본인 추론인지 확인받는다. 수정 반영.
6. **교차 링크** — 관련 worklog 엔트리·wiki `ts-` 페이지가 있으면 이 포스트 URL 한 줄 추가(각 vault 따로 커밋).
7. **발행**(승인 시) — `git add -A && git commit -m "post: <slug>" && git push`. GitHub Actions 가 Pages 배포(약 1분).
8. **리포트** — 라이브 URL(`https://soyuncho16.github.io/whthlog/blog/<slug>/`)을 사용자에게.

## 하지 않기

- 트러블슈팅마다 새 repo 만들기 — 전부 이 repo 한 곳.
- worklog/wiki 를 통째로 공개 — 사적 유지, 교차 링크만.
- "버퍼/타임아웃 늘려라" 식 미봉책을 CS 개념 설명 없이 적기.
- 빌드 안 돌려보고 push — frontmatter 스키마 깨지면 배포 실패.
