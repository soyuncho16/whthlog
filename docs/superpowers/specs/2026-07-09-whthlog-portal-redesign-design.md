# whthlog 포털형 리디자인 — 설계 문서

- 날짜: 2026-07-09
- 상태: 설계 확정 (구현 대기)
- 레퍼런스: `inpa.tistory.com`(포털 구조·플로팅 TOC·풀스크린 로더), 대기업 홈(Toss·Stripe·Samsung: 풀블리드 히어로·스택 밴드·스탯·큰 푸터)

## 1. 배경 / 목표

**현재.** whthlog는 Astro 기반 단일 컬럼 미니멀 블로그(Bear Blog 계열)로, CS 기초로 푼 트러블슈팅만 기록한다. 홈은 `날짜 — 제목` 텍스트 리스트 + `cs_area` 필터뿐이다.

**목표.** "홈페이지/포털"다운 사이트로 전환하되 whthlog 정체성(차분한 sand/amber, 읽기 중심, CS 렌즈, 다크모드)을 유지한다. 앞으로 **CS · Dev · paper** 여러 부문으로 확장할 수 있는 골격을 만든다. 당장 채우는 콘텐츠는 CS 트러블슈팅뿐이고, 나머지는 골격만 준비한다.

**비목표 (YAGNI).**
- inpa의 방문자 카운트·팔로우·최근 댓글·인기글 위젯 복제 (정적 사이트라 실시간 데이터 없음).
- 캐러셀/패럴랙스/타이핑 전용 라이브러리(Bootstrap·Swiper·jarallax·typed.js) 도입. 필요한 연출만 바닐라 CSS/JS로 최소 구현.

## 2. 정보 구조 (IA)

2단 계층. **대분류는 설정 기반으로 나중에 추가 가능**하게 만든다.

| 대분류 | 소분류 | 지금 콘텐츠 |
|--------|--------|-------------|
| CS     | 트러블슈팅, 공부 | 트러블슈팅 2편 (기존) |
| Dev    | 회고, 진행 로그 | 골격만 |
| paper  | 리뷰 | 골격만 |

- URL 예: `/cs/troubleshooting/`, `/dev/retro/`, `/paper/review/` (최종 slug는 구현 시 확정).
- 대분류/소분류 정의는 단일 설정(예: `src/consts.ts` 또는 `src/lib/taxonomy.ts`)에 두어, 추가 시 한 곳만 수정.

## 3. 콘텐츠 모델

`src/content.config.ts` blog 스키마 확장 (기존 필드 전부 유지):
- `section`: enum `cs | dev | paper` (필수화하되 기본값 마이그레이션으로 처리)
- `subsection`: string (대분류별 허용값; 최소 런타임 검증)
- 기존 `cs_area · concept · status · stack · pubDate · updatedDate · heroImage` 유지.

**마이그레이션.** 기존 글 2개(`2026-06-06-headless-x-server-xvfb`, `2026-06-25-discord-singleton-lock-js-error`)에 `section: cs`, `subsection: troubleshooting` 추가.

**cs_area 색상 매핑** (토큰으로 정의, 라이트/다크 공용 또는 각기):
| area | 색 |
|------|-----|
| os | `#ab6400` (amber) |
| network | `#2f7d9a` (청록) |
| arch | `#7b53b3` (보라) |
| data-structures | `#3d8b47` (초록) |
| algorithms | `#b0507e` (로즈) |

## 4. 디자인 시스템 / 토큰

- `src/styles/global.css` 기존 토큰 유지·확장: cs_area 색, 히어로 그라디언트, 카드 그림자, 스티키바 배경 blur 등.
- 다크모드(`data-theme`) 유지. cs_area 색은 다크에서 가독 보정.
- 폰트/본문 규칙(Pretendard, 17px, lh 1.75, keep-all) 유지.

## 5. 레이아웃 & 컴포넌트 — Phase 1

### 5.1 전역
- **스티키 상단바**: 브랜드 + 대분류 메뉴(CS·Dev·paper, 드롭다운으로 소분류) + 검색 자리(Phase 2, 지금은 비활성/placeholder) + 테마토글. 스크롤 시 축소 + 그림자.
- **큰 멀티컬럼 푸터**: 브랜드/한 줄 소개 · 섹션 · 사이트(소개·전체글·태그·RSS) · 링크(GitHub·giscus).

### 5.2 홈 (레이아웃 안 B)
1. 그라디언트 **히어로**: kicker(mono) + H1(핵심어에 amber 언더라인) + 서브 + 듀얼 CTA(최근 글/소개) + 우측 **터미널 모티프 카드**(실제 트러블슈팅을 코드 세션으로 표현).
2. **스탯 스트립**: 글 수 · 고유 개념(concept) 수 · 섹션 수(대분류 개수) — 전부 빌드 시 계산. *커밋 수는 제외.*
3. **2단**:
   - 본문: "최근 글" 헤더(amber 언더라인) + `cs_area` 필터 칩(색상 코딩) + Featured 카드(최신 대표글) + **글 카드 그리드**.
   - 사이드바(sticky): 소개 카드(그라디언트 아바타·bio·GitHub/RSS) + 카테고리 트리(대/소분류 + 글 개수) + 개념 태그 클라우드.

### 5.3 글 카드 (확정)
- **언더라인 액센트**: 카테고리를 mono 라벨 + 밑에 짧은 컬러 밑줄(cs_area 색)로. 제목 · 개념 태그 · 날짜(mono).
- **호버**: `translateY(-3px)` + 부드러운 그림자 + 테두리 진해짐. (좌측 컬러 스트립 폐기)

### 5.4 읽기 페이지 (확정)
- 아티클 헤더: breadcrumb(대 › 소분류) + H1 + 메타(날짜·읽기시간) + 칩(cs_area 액센트·concept·status).
- 본문: **기존 스타일 유지** — Shiki 듀얼테마 코드블록, `blockquote.diagnosis`("내 진단" amber 콜아웃), KaTeX.
- **우하단 플로팅 목차(TOC)**:
  - 기본 = **펼쳐진 패널**(제목 + 목차 + 현재 섹션 amber 하이라이트).
  - 헤더 탭 → **알약 버튼으로 접힘**, 다시 탭 → 펼침.
  - 본문은 **왼쪽 끝 고정**. 목차 펼침 = 본문 오른쪽 경계가 목차 앞까지 / 접힘 = 화면 오른쪽 끝까지 확장(부드러운 전환). *경계 표식(점선) 없음 — 데모 전용이었음.*
  - 스크롤 위치 따라 active 항목 갱신(IntersectionObserver).
- 하단: **이전/다음 글** 네비 + **giscus** 댓글.

### 5.5 섹션 / 소분류 랜딩
- 해당 분류 글 목록(카드 그리드) + 필터. 대분류 페이지는 소분류 요약 + 최근 글.

### 5.6 진입 애니메이션
- 카드·섹션이 스크롤로 들어올 때 은은한 fade+rise, **한 번만**(IntersectionObserver, `prefers-reduced-motion` 존중).

## 6. Phase 2 (다음 단계)
- **풀스크린 로더**: 터미널 캐릭터 SVG(눈 깜빡임·커서) → 페이지 준비되면 `fade-out`. 재방문 거슬리지 않게 최초/짧게.
- **히어로 통계 카운트업** 애니메이션.
- **클라이언트 검색**: pagefind 등 정적 검색 인덱스. (글 수 늘면 실익 커짐)

## 7. 정적 사이트(GitHub Pages) 제약
- 실시간 방문자·인기글·최근 댓글 제외. 스탯은 빌드 계산값만.
- 무거운 프론트 의존성 금지. 연출은 바닐라 CSS/JS.

## 8. 유지되는 것
Astro · MDX · RSS · sitemap · giscus · Shiki dual theme · KaTeX · `rehype-diagnosis`("내 진단") · `cs_area` 필터 · base `/whthlog` · site `soyuncho16.github.io`.

## 9. 컴포넌트 경계 (단일 책임)
`Header`(스티키·메뉴), `Footer`(사이트맵), `Hero`, `StatStrip`, `PostCard`, `Sidebar`(About·CategoryTree·TagCloud), `FloatingToc`, `SectionLanding`, `BlogPost` 레이아웃, `taxonomy` 설정 모듈. 각 컴포넌트는 props로만 통신하고 독립 이해·수정 가능해야 한다.

## 10. 검증
- `astro build` 통과, 라우팅·링크 확인.
- 라이트/다크 양쪽 육안 확인.
- 반응형: 좁은 화면에서 사이드바는 본문 아래로, 상단바 메뉴는 접힘, 플로팅 TOC 유지.
- `prefers-reduced-motion`에서 진입 애니메이션·카운트업 비활성.
- 기존 2개 글이 새 레이아웃/라우팅에서 정상 렌더.

## 11. 범위 요약
- **Phase 1 (이번 구현 계획 대상)**: 2~5절 + 마이그레이션 + 섹션 라우팅 + 진입 애니메이션.
- **Phase 2 (별도)**: 로더 · 카운트업 · 검색.
