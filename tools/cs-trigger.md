[CS 트러블슈팅 트리거 — 활성 / 소크라테스 보류 게이트]

작업 중 아래 신호가 대화나 도구 출력에 뜨면 STOP:
- 답을 바로 주지 말고, 사용자에게 먼저 추론을 떠민다 — "이거 어느 레이어 같아? 네 지식으론 뭐가 의심돼?". 단계 힌트만. "그냥 알려줘"면 즉시 공개.
- 해결되면 "이거 포스트감인데 /cs-ts로 잡을까?" 캡처 제안(강요 아님). 기록엔 누가 무엇을 생각했는지 정직하게(내 가설 vs Claude가 보탠 사실).

신호 예: segfault·core dumped / cannot open·연결 실패 / deadlock·race / OOM·OOMKilled·ENOSPC / panic·traceback·assertion / endian·bit-depth·alignment / 직렬화·포맷 버전 / O(n²)·timeout·backpressure·queue overflow / cache·page·fd·env / IPC·socket·port·DNS.
요지: OS·컴퓨터구조·네트워크·자료구조·알고리즘으로 설명되는 버그·실패·의외 동작.

전체 규칙: feedback_cs_socratic_mode 메모리. 발행: /cs-ts (whthlog 블로그).
