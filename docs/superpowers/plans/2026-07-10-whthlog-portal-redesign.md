# whthlog 포털형 리디자인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** whthlog를 단일 컬럼 미니멀 블로그에서 CS·Dev·paper 다부문 확장이 가능한 "포털형" 사이트로 전환하되, 차분한 sand/amber 정체성·읽기 중심·다크모드·CS 렌즈를 유지한다 (Phase 1).

**Architecture:** 대/소분류는 단일 설정 모듈(`src/lib/taxonomy.ts`)에 두어 한 곳만 고치면 부문이 늘어난다. 순수 로직(taxonomy 조회, 읽기시간, 빌드 통계)은 vitest 유닛 테스트로 TDD하고, 프레젠테이션 컴포넌트는 `astro build` 통과 + dist HTML 마커 검사 + 육안 확인으로 검증한다. 페이지마다 중복되던 `<html>/head/body/Header/Footer` 골격을 `BaseLayout.astro` 한 곳으로 모아 스티키 헤더·큰 푸터·스크롤 진입 애니메이션을 DRY하게 공유한다.

**Tech Stack:** Astro 6, MDX, TypeScript, vanilla CSS custom properties, vanilla client JS (IntersectionObserver), vitest (dev-only), 기존 rehype-diagnosis / remark-math / KaTeX / Shiki dual-theme / giscus / @astrojs/rss / @astrojs/sitemap.

## Global Constraints

- `astro.config.mjs`는 그대로 유지: `site: 'https://soyuncho16.github.io'`, `base: '/whthlog'`.
- 모든 내부 링크는 `src/lib/url.ts`의 `base`(항상 trailing slash `'/whthlog/'`)를 접두어로 쓴다. 하드코딩 `/whthlog/` 금지.
- 개별 글 URL은 **`${base}blog/<post.id>/` 그대로 유지**한다 (RSS·canonical·sitemap·기존 링크 보존). 대/소분류는 **랜딩 페이지** URL(`${base}cs/`, `${base}cs/troubleshooting/`)만 새로 추가한다.
- 런타임(클라이언트) 무거운 프론트 의존성 금지. 연출은 바닐라 CSS/JS. vitest는 devDependency(사이트에 번들되지 않음)라 허용.
- 제목·본문 카피에 em dash(—) 금지 (POST_FORMAT.md 톤 규칙). 코드/주석/문서는 예외.
- 다크모드는 `document.documentElement.dataset.theme` (`'light'|'dark'`)로 제어. 새 색은 라이트/다크 양쪽 정의.
- `prefers-reduced-motion: reduce`에서 진입 애니메이션은 비활성(요소는 즉시 최종 상태).
- 본문 폰트 규칙 유지: Pretendard Variable, 17px, line-height 1.75, `word-break: keep-all`. mono는 `var(--mono)`.
- cs_area enum 순서·키 고정: `os · arch · network · data-structures · algorithms`. 라벨: `os · arch · network · ds · algo`.
- cs_area 색(라이트): os `#ab6400` · network `#2f7d9a` · arch `#7b53b3` · data-structures `#3d8b47` · algorithms `#b0507e`.

---

## File Structure

**신규 (create)**
- `vitest.config.ts` — vitest 설정(node 환경, `src/**/*.test.ts`).
- `src/lib/taxonomy.ts` — 대/소분류·cs_area 단일 설정 + 조회 헬퍼. **단일 진실 원천.**
- `src/lib/taxonomy.test.ts` — taxonomy 유닛 테스트.
- `src/lib/reading-time.ts` — 본문 → 읽기시간(분) 계산.
- `src/lib/reading-time.test.ts`
- `src/lib/stats.ts` — 빌드 통계(글/개념/섹션 수), 개념 클라우드, 소분류별 개수.
- `src/lib/stats.test.ts`
- `src/layouts/BaseLayout.astro` — 공통 `<html>/head/body` + Header + `<slot>` + Footer + ScrollReveal.
- `src/components/ScrollReveal.astro` — 진입 애니메이션 IntersectionObserver 스크립트(1회).
- `src/components/PostCard.astro` — 글 카드(mono 라벨 + cs_area 컬러 언더라인, 호버 rise).
- `src/components/Hero.astro` — 그라디언트 히어로 + 터미널 모티프 카드.
- `src/components/StatStrip.astro` — 글/개념/섹션 스탯.
- `src/components/Sidebar.astro` — About + CategoryTree + TagCloud(props로만 통신).
- `src/components/FloatingToc.astro` — 우하단 플로팅 목차(펼침 패널 ↔ 알약, IO active).
- `src/components/SectionLanding.astro` — 섹션/소분류 랜딩 공용 뷰(카드 그리드 + 헤더).
- `src/pages/[section]/index.astro` — 대분류 랜딩 (getStaticPaths ← taxonomy).
- `src/pages/[section]/[subsection].astro` — 소분류 랜딩 (getStaticPaths ← taxonomy).

**수정 (modify)**
- `package.json` — vitest devDep + `test` 스크립트.
- `src/content.config.ts` — `section`·`subsection` 필드 추가.
- `src/content/blog/2026-06-06-headless-x-server-xvfb.md` — frontmatter에 section/subsection.
- `src/content/blog/2026-06-25-discord-singleton-lock-js-error.md` — 동일.
- `src/styles/global.css` — cs_area 색 토큰, 히어로 그라디언트, 카드 그림자, 스티키 blur, 진입 애니메이션 CSS.
- `src/components/Header.astro` — 스티키 + 대분류 메뉴(드롭다운) + 검색 placeholder + 스크롤 축소.
- `src/components/Footer.astro` — 멀티컬럼 사이트맵 푸터.
- `src/layouts/BlogPost.astro` — BaseLayout 사용 + breadcrumb·읽기시간·prev/next·FloatingToc.
- `src/pages/blog/[...slug].astro` — prev/next 계산해 BlogPost에 전달.
- `src/pages/index.astro` — Hero + StatStrip + 필터 + Featured + 카드 그리드 + Sidebar.
- `src/pages/about.astro` — BaseLayout으로 리팩터(중복 골격 제거) 확인용.

**불변 (untouched)**
- `astro.config.mjs`, `src/lib/url.ts`, `src/lib/excerpt.ts`, `src/components/BaseHead.astro`, `src/components/ThemeToggle.astro`, `src/components/Comments.astro`, `src/components/FormattedDate.astro`, `src/plugins/rehype-diagnosis.mjs`, `src/pages/rss.xml.js`, `src/pages/blog/index.astro`, `POST_FORMAT.md`.

---

## Task 1: 테스트 도구 + taxonomy 설정 모듈

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/taxonomy.ts`
- Test: `src/lib/taxonomy.test.ts`

**Interfaces:**
- Consumes: (없음)
- Produces:
  - `type SectionKey = 'cs' | 'dev' | 'paper'`
  - `type CsAreaKey = 'os' | 'arch' | 'network' | 'data-structures' | 'algorithms'`
  - `interface Subsection { key: string; label: string }`
  - `interface Section { key: SectionKey; label: string; blurb: string; subsections: Subsection[] }`
  - `interface CsArea { key: CsAreaKey; label: string; cssVar: string }`
  - `const SECTIONS: Section[]` (순서: cs, dev, paper)
  - `const CS_AREAS: CsArea[]` (순서: os, arch, network, data-structures, algorithms)
  - `function sectionByKey(key: string): Section | undefined`
  - `function sectionLabel(key: string): string`
  - `function subsectionLabel(sectionKey: string, subKey: string): string`
  - `function areaMeta(key: string): CsArea | undefined`
  - `function areaLabel(key: string): string`
  - `function isValidSubsection(sectionKey: string, subKey: string): boolean`

- [ ] **Step 1: vitest 의존성 설치 + 스크립트 추가**

Run:
```bash
cd /home/whth/whth/whthlog && npm install -D vitest@^3
```
그리고 `package.json`의 `scripts`에 `test` 추가 (Edit):
```json
	"scripts": {
		"dev": "astro dev",
		"build": "astro build",
		"preview": "astro preview",
		"astro": "astro",
		"test": "vitest run"
	},
```

- [ ] **Step 2: vitest 설정 파일 작성**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts'],
	},
});
```

- [ ] **Step 3: 실패하는 테스트 작성**

Create `src/lib/taxonomy.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
	SECTIONS,
	CS_AREAS,
	sectionByKey,
	sectionLabel,
	subsectionLabel,
	areaMeta,
	areaLabel,
	isValidSubsection,
} from './taxonomy';

describe('taxonomy SECTIONS', () => {
	it('lists cs, dev, paper in order', () => {
		expect(SECTIONS.map((s) => s.key)).toEqual(['cs', 'dev', 'paper']);
	});
	it('cs has troubleshooting + study subsections', () => {
		const cs = sectionByKey('cs');
		expect(cs?.subsections.map((s) => s.key)).toEqual(['troubleshooting', 'study']);
	});
});

describe('taxonomy CS_AREAS', () => {
	it('keeps fixed key order and labels', () => {
		expect(CS_AREAS.map((a) => a.key)).toEqual([
			'os',
			'arch',
			'network',
			'data-structures',
			'algorithms',
		]);
		expect(areaLabel('data-structures')).toBe('ds');
		expect(areaLabel('algorithms')).toBe('algo');
	});
	it('maps each area to a css var', () => {
		expect(areaMeta('os')?.cssVar).toBe('--area-os');
		expect(areaMeta('data-structures')?.cssVar).toBe('--area-data-structures');
	});
});

describe('taxonomy lookups', () => {
	it('resolves labels with fallback to the raw key', () => {
		expect(sectionLabel('cs')).toBe('CS');
		expect(sectionLabel('unknown')).toBe('unknown');
		expect(subsectionLabel('cs', 'troubleshooting')).toBe('트러블슈팅');
		expect(subsectionLabel('cs', 'nope')).toBe('nope');
	});
	it('validates subsection membership per section', () => {
		expect(isValidSubsection('cs', 'troubleshooting')).toBe(true);
		expect(isValidSubsection('cs', 'review')).toBe(false);
		expect(isValidSubsection('paper', 'review')).toBe(true);
		expect(isValidSubsection('ghost', 'x')).toBe(false);
	});
});
```

- [ ] **Step 4: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module './taxonomy'`.

- [ ] **Step 5: taxonomy 모듈 구현**

Create `src/lib/taxonomy.ts`:
```ts
/** 대/소분류·cs_area 단일 설정. 부문 추가는 여기 한 곳만 고친다. */

export type SectionKey = 'cs' | 'dev' | 'paper';
export type CsAreaKey = 'os' | 'arch' | 'network' | 'data-structures' | 'algorithms';

export interface Subsection {
	key: string;
	label: string;
}
export interface Section {
	key: SectionKey;
	label: string;
	blurb: string;
	subsections: Subsection[];
}
export interface CsArea {
	key: CsAreaKey;
	label: string;
	cssVar: string;
}

export const SECTIONS: Section[] = [
	{
		key: 'cs',
		label: 'CS',
		blurb: 'CS 기초로 되짚어 푼 트러블슈팅과 공부 기록',
		subsections: [
			{ key: 'troubleshooting', label: '트러블슈팅' },
			{ key: 'study', label: '공부' },
		],
	},
	{
		key: 'dev',
		label: 'Dev',
		blurb: '개발하며 남기는 회고와 진행 로그',
		subsections: [
			{ key: 'retro', label: '회고' },
			{ key: 'log', label: '진행 로그' },
		],
	},
	{
		key: 'paper',
		label: 'paper',
		blurb: '읽은 논문 리뷰',
		subsections: [{ key: 'review', label: '리뷰' }],
	},
];

export const CS_AREAS: CsArea[] = [
	{ key: 'os', label: 'os', cssVar: '--area-os' },
	{ key: 'arch', label: 'arch', cssVar: '--area-arch' },
	{ key: 'network', label: 'network', cssVar: '--area-network' },
	{ key: 'data-structures', label: 'ds', cssVar: '--area-data-structures' },
	{ key: 'algorithms', label: 'algo', cssVar: '--area-algorithms' },
];

const SECTION_BY_KEY = new Map(SECTIONS.map((s) => [s.key, s]));
const AREA_BY_KEY = new Map(CS_AREAS.map((a) => [a.key, a]));

export function sectionByKey(key: string): Section | undefined {
	return SECTION_BY_KEY.get(key as SectionKey);
}
export function sectionLabel(key: string): string {
	return SECTION_BY_KEY.get(key as SectionKey)?.label ?? key;
}
export function subsectionLabel(sectionKey: string, subKey: string): string {
	const s = SECTION_BY_KEY.get(sectionKey as SectionKey);
	return s?.subsections.find((x) => x.key === subKey)?.label ?? subKey;
}
export function areaMeta(key: string): CsArea | undefined {
	return AREA_BY_KEY.get(key as CsAreaKey);
}
export function areaLabel(key: string): string {
	return AREA_BY_KEY.get(key as CsAreaKey)?.label ?? key;
}
export function isValidSubsection(sectionKey: string, subKey: string): boolean {
	const s = SECTION_BY_KEY.get(sectionKey as SectionKey);
	return !!s && s.subsections.some((x) => x.key === subKey);
}
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `npm test`
Expected: PASS (taxonomy 스위트 전부 green).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/taxonomy.ts src/lib/taxonomy.test.ts
git commit -m "feat: taxonomy 설정 모듈 + vitest 도입"
```

---

## Task 2: 읽기시간 · 빌드 통계 로직

**Files:**
- Create: `src/lib/reading-time.ts`
- Test: `src/lib/reading-time.test.ts`
- Create: `src/lib/stats.ts`
- Test: `src/lib/stats.test.ts`

**Interfaces:**
- Consumes: `SECTIONS` from `./taxonomy`
- Produces:
  - `function readingTime(body: string | undefined, cpm?: number): number` — 분, 최소 1.
  - `interface PostLike { data: { concept?: string[]; section?: string; subsection?: string } }`
  - `interface Stats { postCount: number; conceptCount: number; sectionCount: number }`
  - `function computeStats(posts: PostLike[]): Stats`
  - `function conceptCloud(posts: PostLike[]): { concept: string; count: number }[]` — count 내림차순, 동률은 이름 오름차순.
  - `function countBySubsection(posts: PostLike[]): Record<string, number>` — 키 `"${section}/${subsection}"`.

- [ ] **Step 1: reading-time 실패 테스트 작성**

Create `src/lib/reading-time.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { readingTime } from './reading-time';

describe('readingTime', () => {
	it('returns at least 1 minute for empty/short input', () => {
		expect(readingTime(undefined)).toBe(1);
		expect(readingTime('')).toBe(1);
		expect(readingTime('짧은 글')).toBe(1);
	});
	it('scales by character count (~500 cpm)', () => {
		expect(readingTime('가'.repeat(1000))).toBe(2);
		expect(readingTime('가'.repeat(2500))).toBe(5);
	});
	it('ignores code fences, math, and markdown syntax', () => {
		const body = '```\n' + 'x'.repeat(5000) + '\n```\n' + '본문 열 글자입니다';
		expect(readingTime(body)).toBe(1);
	});
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module './reading-time'`.

- [ ] **Step 3: reading-time 구현**

Create `src/lib/reading-time.ts`:
```ts
/** 한국어 본문 기준 대략적인 읽기 시간(분). 코드/수식/마크다운 문법 제거 후 글자 수 / cpm, 최소 1. */
export function readingTime(body: string | undefined, cpm = 500): number {
	if (!body) return 1;
	const text = body
		.replace(/```[\s\S]*?```/g, ' ') // 코드블록
		.replace(/`[^`]*`/g, ' ') // 인라인 코드
		.replace(/\$\$[\s\S]*?\$\$/g, ' ') // 블록 수식
		.replace(/\$[^$\n]+\$/g, ' ') // 인라인 수식
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 이미지
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 링크는 텍스트만
		.replace(/[#>*_~|`-]/g, ' ') // 마크다운 기호
		.replace(/\s+/g, ''); // 공백 제거 후 글자 수
	return Math.max(1, Math.round(text.length / cpm));
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test`
Expected: PASS (reading-time 스위트 green).

- [ ] **Step 5: stats 실패 테스트 작성**

Create `src/lib/stats.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { computeStats, conceptCloud, countBySubsection } from './stats';

const posts = [
	{ data: { concept: ['IPC', 'mutex'], section: 'cs', subsection: 'troubleshooting' } },
	{ data: { concept: ['mutex', 'lock-file'], section: 'cs', subsection: 'troubleshooting' } },
	{ data: { concept: [], section: 'cs', subsection: 'study' } },
];

describe('computeStats', () => {
	it('counts posts, unique concepts, and configured sections', () => {
		const s = computeStats(posts);
		expect(s.postCount).toBe(3);
		expect(s.conceptCount).toBe(3); // IPC, mutex, lock-file
		expect(s.sectionCount).toBe(3); // cs, dev, paper (configured)
	});
});

describe('conceptCloud', () => {
	it('orders by count desc then name asc', () => {
		expect(conceptCloud(posts)).toEqual([
			{ concept: 'mutex', count: 2 },
			{ concept: 'IPC', count: 1 },
			{ concept: 'lock-file', count: 1 },
		]);
	});
});

describe('countBySubsection', () => {
	it('keys by section/subsection', () => {
		expect(countBySubsection(posts)).toEqual({
			'cs/troubleshooting': 2,
			'cs/study': 1,
		});
	});
});
```

- [ ] **Step 6: 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module './stats'`.

- [ ] **Step 7: stats 구현**

Create `src/lib/stats.ts`:
```ts
import { SECTIONS } from './taxonomy';

export interface PostLike {
	data: { concept?: string[]; section?: string; subsection?: string };
}
export interface Stats {
	postCount: number;
	conceptCount: number;
	sectionCount: number;
}

export function computeStats(posts: PostLike[]): Stats {
	const concepts = new Set<string>();
	for (const p of posts) for (const c of p.data.concept ?? []) concepts.add(c);
	return {
		postCount: posts.length,
		conceptCount: concepts.size,
		sectionCount: SECTIONS.length,
	};
}

export function conceptCloud(posts: PostLike[]): { concept: string; count: number }[] {
	const counts = new Map<string, number>();
	for (const p of posts)
		for (const c of p.data.concept ?? []) counts.set(c, (counts.get(c) ?? 0) + 1);
	return [...counts.entries()]
		.map(([concept, count]) => ({ concept, count }))
		.sort((a, b) => b.count - a.count || a.concept.localeCompare(b.concept));
}

export function countBySubsection(posts: PostLike[]): Record<string, number> {
	const out: Record<string, number> = {};
	for (const p of posts) {
		if (!p.data.section || !p.data.subsection) continue;
		const key = `${p.data.section}/${p.data.subsection}`;
		out[key] = (out[key] ?? 0) + 1;
	}
	return out;
}
```

- [ ] **Step 8: 통과 확인**

Run: `npm test`
Expected: PASS (taxonomy + reading-time + stats 전부 green).

- [ ] **Step 9: Commit**

```bash
git add src/lib/reading-time.ts src/lib/reading-time.test.ts src/lib/stats.ts src/lib/stats.test.ts
git commit -m "feat: 읽기시간·빌드 통계 로직 + 테스트"
```

---

## Task 3: 콘텐츠 스키마 확장 + 기존 글 마이그레이션

**Files:**
- Modify: `src/content.config.ts`
- Modify: `src/content/blog/2026-06-06-headless-x-server-xvfb.md:5` (frontmatter)
- Modify: `src/content/blog/2026-06-25-discord-singleton-lock-js-error.md:8` (frontmatter)

**Interfaces:**
- Consumes: `isValidSubsection` from `./lib/taxonomy`
- Produces: blog 엔트리 `data`에 `section: SectionKey` (항상 존재, 기본 `'cs'`), `subsection: string` (항상 존재, 기본 `'troubleshooting'`).

- [ ] **Step 1: 스키마에 section/subsection 추가 + 교차검증**

Edit `src/content.config.ts` — 상단 import와 schema를 다음으로 교체:
```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { isValidSubsection } from './lib/taxonomy';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z
			.object({
				title: z.string(),
				description: z.string().optional(),
				pubDate: z.coerce.date(),
				updatedDate: z.coerce.date().optional(),
				heroImage: z.optional(image()),
				// 부문 분류 (기본값으로 최소 frontmatter·기존 글 비파괴)
				section: z.enum(['cs', 'dev', 'paper']).default('cs'),
				subsection: z.string().default('troubleshooting'),
				// CS-렌즈 트러블슈팅 필드 (전부 optional)
				cs_area: z
					.array(z.enum(['os', 'arch', 'network', 'data-structures', 'algorithms']))
					.optional(),
				concept: z.array(z.string()).optional(),
				status: z.enum(['resolved', 'partial', 'resolved-negative']).optional(),
				stack: z.array(z.string()).optional(),
			})
			.superRefine((data, ctx) => {
				if (!isValidSubsection(data.section, data.subsection)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: `subsection "${data.subsection}" is not valid for section "${data.section}"`,
						path: ['subsection'],
					});
				}
			}),
});

export const collections = { blog };
```

- [ ] **Step 2: 2026-06-06 글 frontmatter에 분류 추가**

Edit `src/content/blog/2026-06-06-headless-x-server-xvfb.md` — `pubDate` 줄 다음에 두 줄 삽입:
```yaml
pubDate: 'Jun 06 2026'
section: cs
subsection: troubleshooting
cs_area: [os, network]
```

- [ ] **Step 3: 2026-06-25 글 frontmatter에 분류 추가**

Edit `src/content/blog/2026-06-25-discord-singleton-lock-js-error.md` — `pubDate` 줄 다음에 두 줄 삽입:
```yaml
pubDate: 'Jun 25 2026'
section: cs
subsection: troubleshooting
cs_area: [os]
```

- [ ] **Step 4: 빌드로 스키마 검증**

Run: `npm run build`
Expected: PASS — content collection 타입 에러 없음, dist 생성. (기존 두 글이 section/subsection 통과.)

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts src/content/blog/2026-06-06-headless-x-server-xvfb.md src/content/blog/2026-06-25-discord-singleton-lock-js-error.md
git commit -m "feat: blog 스키마에 section/subsection + 기존 글 마이그레이션"
```

---

## Task 4: 디자인 토큰 확장 (cs_area 색 · 그라디언트 · 그림자 · 진입 애니메이션)

**Files:**
- Modify: `src/styles/global.css`

**Interfaces:**
- Produces (CSS custom properties, `:root` = light, `[data-theme='dark']` = dark):
  - `--area-os --area-arch --area-network --area-data-structures --area-algorithms`
  - `--hero-grad` (배경 그라디언트), `--card-shadow`, `--card-shadow-hover`, `--bar-bg` (스티키바 반투명 배경), `--radius` (카드 반경)
  - 유틸 클래스: `.reveal` / `.reveal.in` (진입 애니메이션), `.u-underline` (amber 언더라인 헤더 액센트)

- [ ] **Step 1: 라이트 토큰에 cs_area 색·그라디언트·그림자 추가**

Edit `src/styles/global.css` — `:root { ... }` 블록의 `--mono:` 줄 앞에 삽입:
```css
	--accent-tint: #fdf6e3; /* aside 배경 */
	/* cs_area 색 (라이트) */
	--area-os: #ab6400;
	--area-arch: #7b53b3;
	--area-network: #2f7d9a;
	--area-data-structures: #3d8b47;
	--area-algorithms: #b0507e;
	/* 포털 표면 토큰 */
	--radius: 12px;
	--card-shadow: 0 1px 2px rgba(33, 32, 28, 0.04), 0 4px 12px rgba(33, 32, 28, 0.05);
	--card-shadow-hover: 0 2px 6px rgba(33, 32, 28, 0.08), 0 12px 28px rgba(33, 32, 28, 0.1);
	--bar-bg: rgba(253, 253, 251, 0.82);
	--hero-grad: radial-gradient(120% 120% at 100% 0%, #fdf6e3 0%, var(--bg) 55%);
	--mono: 'JetBrains Mono', 'Pretendard Variable', monospace;
```

- [ ] **Step 2: 다크 토큰에 cs_area 색(가독 보정)·그라디언트·그림자 추가**

Edit `src/styles/global.css` — `[data-theme='dark'] { ... }` 블록의 `--accent-tint:` 줄 다음에 삽입:
```css
	--accent-tint: #26221a;
	/* cs_area 색 (다크 — 밝게 보정) */
	--area-os: #f0b429;
	--area-arch: #b18ae8;
	--area-network: #6cc4e0;
	--area-data-structures: #6dd07f;
	--area-algorithms: #e88ab5;
	/* 포털 표면 토큰 (다크) */
	--card-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.28);
	--card-shadow-hover: 0 2px 6px rgba(0, 0, 0, 0.4), 0 12px 28px rgba(0, 0, 0, 0.42);
	--bar-bg: rgba(25, 25, 24, 0.82);
	--hero-grad: radial-gradient(120% 120% at 100% 0%, #26221a 0%, var(--bg) 55%);
```

- [ ] **Step 3: 진입 애니메이션 + 언더라인 유틸 클래스 추가**

Edit `src/styles/global.css` — 파일 끝 `.sr-only { ... }` 블록 다음에 추가:
```css
/* 스크롤 진입 애니메이션 — ScrollReveal 스크립트가 .in 을 붙인다 */
.reveal {
	opacity: 0;
	transform: translateY(16px);
	transition:
		opacity 0.5s ease,
		transform 0.5s ease;
	will-change: opacity, transform;
}
.reveal.in {
	opacity: 1;
	transform: none;
}

/* 섹션 헤더 amber 언더라인 액센트 */
.u-underline {
	position: relative;
	display: inline-block;
}
.u-underline::after {
	content: '';
	position: absolute;
	left: 0;
	right: 0;
	bottom: -0.15em;
	height: 3px;
	border-radius: 3px;
	background: var(--accent);
}

@media (prefers-reduced-motion: reduce) {
	.reveal {
		opacity: 1;
		transform: none;
		transition: none;
	}
}
```

- [ ] **Step 4: 빌드로 CSS 유효성 확인**

Run: `npm run build`
Expected: PASS (CSS 파싱 에러 없음).

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: cs_area 색 토큰·그라디언트·카드 그림자·진입 애니메이션 CSS"
```

---

## Task 5: BaseLayout + ScrollReveal + 스티키 Header (about 페이지로 검증)

**Files:**
- Create: `src/components/ScrollReveal.astro`
- Create: `src/layouts/BaseLayout.astro`
- Modify: `src/components/Header.astro`
- Modify: `src/pages/about.astro`

**Interfaces:**
- Consumes: `SECTIONS` from `../lib/taxonomy`, `base` from `../lib/url`, `SITE_TITLE`.
- Produces:
  - `BaseLayout.astro` props: `{ title: string; description: string; image?: ImageMetadata; wide?: boolean }`. `<slot />`로 본문 받음. `wide`가 true면 `<main>`에 `wide` 클래스(포털형 넓은 폭).
  - `ScrollReveal.astro`: 클라이언트 스크립트만 렌더(마크업 없음). `.reveal` 요소에 `.in` 부여.
  - `Header.astro`: 스티키, `.scrolled` 토글, 대분류 드롭다운, 검색 placeholder(비활성), 모바일 햄버거.

- [ ] **Step 1: ScrollReveal 컴포넌트 작성**

Create `src/components/ScrollReveal.astro`:
```astro
---
// .reveal 요소를 뷰포트 진입 시 한 번만 나타낸다. prefers-reduced-motion 은 CSS 가 처리.
---

<script>
	const els = document.querySelectorAll<HTMLElement>('.reveal');
	if (!els.length) {
		// nothing to observe
	} else if (!('IntersectionObserver' in window)) {
		els.forEach((el) => el.classList.add('in'));
	} else {
		const io = new IntersectionObserver(
			(entries, obs) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						e.target.classList.add('in');
						obs.unobserve(e.target);
					}
				}
			},
			{ rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
		);
		els.forEach((el) => io.observe(el));
	}
</script>
```

- [ ] **Step 2: 스티키 Header 재작성**

Overwrite `src/components/Header.astro`:
```astro
---
import { SITE_TITLE } from '../consts';
import ThemeToggle from './ThemeToggle.astro';
import { base } from '../lib/url';
import { SECTIONS } from '../lib/taxonomy';
---

<header id="site-header">
	<nav>
		<a class="brand" href={base}>{SITE_TITLE}</a>

		<button class="menu-toggle" aria-label="메뉴 열기" aria-expanded="false">☰</button>

		<div class="menu">
			<ul class="sections">
				{
					SECTIONS.map((s) => (
						<li class="section">
							<a href={`${base}${s.key}/`}>{s.label}</a>
							<ul class="dropdown">
								{s.subsections.map((sub) => (
									<li>
										<a href={`${base}${s.key}/${sub.key}/`}>{sub.label}</a>
									</li>
								))}
							</ul>
						</li>
					))
				}
			</ul>
			<div class="tail">
				<input
					class="search"
					type="search"
					placeholder="검색 (준비 중)"
					disabled
					aria-label="검색 (준비 중)"
				/>
				<ThemeToggle />
			</div>
		</div>
	</nav>
</header>

<script>
	// 스크롤 시 헤더 축소 + 그림자
	const header = document.getElementById('site-header');
	const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 8);
	onScroll();
	window.addEventListener('scroll', onScroll, { passive: true });

	// 모바일 햄버거
	const toggle = header?.querySelector<HTMLButtonElement>('.menu-toggle');
	toggle?.addEventListener('click', () => {
		const open = header?.classList.toggle('open') ?? false;
		toggle.setAttribute('aria-expanded', String(open));
	});
</script>

<style>
	header {
		position: sticky;
		top: 0;
		z-index: 50;
		background: var(--bar-bg);
		backdrop-filter: saturate(180%) blur(12px);
		border-bottom: 1px solid transparent;
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease,
			padding 0.2s ease;
	}
	header.scrolled {
		border-bottom-color: var(--line);
		box-shadow: 0 1px 12px rgba(0, 0, 0, 0.05);
	}
	nav {
		max-width: 72rem;
		margin: 0 auto;
		padding: 0.85em 1.25em;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: padding 0.2s ease;
	}
	header.scrolled nav {
		padding-top: 0.55em;
		padding-bottom: 0.55em;
	}
	.brand {
		font-weight: 700;
		font-size: 1.1em;
		text-decoration: none;
		color: var(--ink);
	}
	.menu {
		display: flex;
		align-items: center;
		gap: 1.5em;
	}
	.sections {
		list-style: none;
		display: flex;
		gap: 1.25em;
		margin: 0;
		padding: 0;
	}
	.section {
		position: relative;
	}
	.section > a {
		color: var(--ink-soft);
		text-decoration: none;
		font-weight: 550;
		padding: 0.4em 0;
	}
	.section > a:hover,
	.section:focus-within > a {
		color: var(--ink);
	}
	.dropdown {
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%) translateY(4px);
		list-style: none;
		margin: 0;
		padding: 0.35em;
		min-width: 8em;
		background: var(--bg);
		border: 1px solid var(--line);
		border-radius: 10px;
		box-shadow: var(--card-shadow);
		opacity: 0;
		visibility: hidden;
		transition:
			opacity 0.15s ease,
			transform 0.15s ease;
	}
	.section:hover .dropdown,
	.section:focus-within .dropdown {
		opacity: 1;
		visibility: visible;
		transform: translateX(-50%) translateY(0);
	}
	.dropdown a {
		display: block;
		padding: 0.35em 0.7em;
		border-radius: 6px;
		color: var(--ink-soft);
		text-decoration: none;
		font-size: 0.92em;
		white-space: nowrap;
	}
	.dropdown a:hover {
		background: var(--bg-tint);
		color: var(--ink);
	}
	.tail {
		display: flex;
		align-items: center;
		gap: 0.75em;
	}
	.search {
		font: inherit;
		font-size: 0.85em;
		padding: 0.3em 0.7em;
		border-radius: 999px;
		border: 1px solid var(--line);
		background: var(--bg-tint);
		color: var(--ink-soft);
		width: 11em;
	}
	.menu-toggle {
		display: none;
		background: none;
		border: none;
		font-size: 1.3em;
		color: var(--ink);
		cursor: pointer;
	}
	@media (max-width: 720px) {
		.menu-toggle {
			display: block;
		}
		.menu {
			position: absolute;
			top: 100%;
			left: 0;
			right: 0;
			flex-direction: column;
			align-items: stretch;
			gap: 0.5em;
			padding: 1em 1.25em;
			background: var(--bg);
			border-bottom: 1px solid var(--line);
			display: none;
		}
		header.open .menu {
			display: flex;
		}
		.sections {
			flex-direction: column;
			gap: 0.25em;
		}
		.dropdown {
			position: static;
			transform: none;
			opacity: 1;
			visibility: visible;
			box-shadow: none;
			border: none;
			padding: 0 0 0 1em;
		}
		.search {
			width: 100%;
		}
	}
</style>
```

- [ ] **Step 3: BaseLayout 작성**

Create `src/layouts/BaseLayout.astro`:
```astro
---
import type { ImageMetadata } from 'astro';
import BaseHead from '../components/BaseHead.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import ScrollReveal from '../components/ScrollReveal.astro';

interface Props {
	title: string;
	description: string;
	image?: ImageMetadata;
	wide?: boolean;
}
const { title, description, image, wide } = Astro.props;
---

<!doctype html>
<html lang="ko">
	<head>
		<BaseHead title={title} description={description} image={image} />
	</head>
	<body>
		<Header />
		<main class={wide ? 'wide' : undefined}>
			<slot />
		</main>
		<Footer />
		<ScrollReveal />
	</body>
</html>

<style is:global>
	main.wide {
		max-width: 72rem;
	}
</style>
```

- [ ] **Step 4: about 페이지를 BaseLayout으로 리팩터 (검증용)**

Overwrite `src/pages/about.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="소개 · whthlog" description="whthlog: CS 기초로 푼 트러블슈팅 기록">
	<h1>소개</h1>
	<p>
		연구하다 만나는 문제를 CS 기초(OS, 컴퓨터구조, 네트워크, 자료구조,
		알고리즘)로 되짚어 푸는 기록입니다. 증상만 고치고 넘어가는 대신,
		"이게 어느 레이어 문제고, 어떤 개념이라서 이렇게 풀리는가"를 직접
		추론해 1인칭으로 남깁니다.
	</p>
	<p>
		대부분은 VIO(Visual-Inertial Odometry) 비교 연구와 ROS2·Docker 인프라를
		만지다 나온 사건들입니다. 막혀서 검색·문서·도구의 도움을 받은 지점은
		글 안에 솔직하게 적습니다. 매끈하게 포장하기보다 실제로 어떻게
		생각했는지가 남아야 다시 꺼내 쓸 수 있으니까요.
	</p>
</BaseLayout>
```

- [ ] **Step 5: 빌드 + about 라우팅 검증**

Run:
```bash
npm run build && test -f dist/whthlog/about/index.html && grep -q 'site-header' dist/whthlog/about/index.html && echo OK
```
Expected: `OK` 출력 (about 페이지가 새 Header와 함께 렌더).

- [ ] **Step 6: Commit**

```bash
git add src/components/ScrollReveal.astro src/layouts/BaseLayout.astro src/components/Header.astro src/pages/about.astro
git commit -m "feat: BaseLayout·ScrollReveal·스티키 Header + about 리팩터"
```

---

## Task 6: 멀티컬럼 Footer

**Files:**
- Modify: `src/components/Footer.astro`

**Interfaces:**
- Consumes: `SECTIONS` from `../lib/taxonomy`, `base`, `SITE_TITLE`, `SITE_DESCRIPTION`.
- Produces: `Footer.astro` (props 없음) — 브랜드/소개 · 섹션 열 · 사이트 열(소개·전체글·RSS) · 링크 열(GitHub·giscus 안내). `<main>` 폭(72rem)과 맞춘 넓은 그리드.

- [ ] **Step 1: Footer 재작성**

Overwrite `src/components/Footer.astro`:
```astro
---
import { base } from '../lib/url';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import { SECTIONS } from '../lib/taxonomy';

const today = new Date();
---

<footer>
	<div class="cols">
		<div class="brand-col">
			<a class="brand" href={base}>{SITE_TITLE}</a>
			<p class="blurb">{SITE_DESCRIPTION}</p>
		</div>

		<nav class="col">
			<h3>섹션</h3>
			<ul>
				{
					SECTIONS.map((s) => (
						<li>
							<a href={`${base}${s.key}/`}>{s.label}</a>
						</li>
					))
				}
			</ul>
		</nav>

		<nav class="col">
			<h3>사이트</h3>
			<ul>
				<li><a href={`${base}about/`}>소개</a></li>
				<li><a href={base}>전체 글</a></li>
				<li><a href={`${base}rss.xml`}>RSS</a></li>
			</ul>
		</nav>

		<nav class="col">
			<h3>링크</h3>
			<ul>
				<li>
					<a href="https://github.com/soyuncho16/whthlog" target="_blank" rel="noopener">
						GitHub
					</a>
				</li>
				<li>
					<a href="https://github.com/soyuncho16/whthlog/discussions" target="_blank" rel="noopener">
						댓글(giscus)
					</a>
				</li>
			</ul>
		</nav>
	</div>

	<div class="baseline">
		<span>© {today.getFullYear()} whth</span>
	</div>
</footer>

<style>
	footer {
		border-top: 1px solid var(--line);
		background: var(--bg-tint);
		color: var(--ink-soft);
		font-size: 0.9em;
	}
	.cols {
		max-width: 72rem;
		margin: 0 auto;
		padding: 3em 1.25em 2em;
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
		gap: 2em;
	}
	.brand {
		font-weight: 700;
		font-size: 1.1em;
		color: var(--ink);
		text-decoration: none;
	}
	.blurb {
		margin: 0.6em 0 0;
		max-width: 28ch;
		line-height: 1.6;
	}
	.col h3 {
		margin: 0 0 0.8em;
		font-size: 0.8em;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--ink);
	}
	.col ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}
	.col a {
		color: var(--ink-soft);
		text-decoration: none;
	}
	.col a:hover {
		color: var(--accent);
	}
	.baseline {
		max-width: 72rem;
		margin: 0 auto;
		padding: 1.2em 1.25em 2.5em;
		border-top: 1px solid var(--line);
		font-size: 0.85em;
	}
	@media (max-width: 720px) {
		.cols {
			grid-template-columns: 1fr 1fr;
			gap: 1.5em 1em;
		}
		.brand-col {
			grid-column: 1 / -1;
		}
	}
</style>
```

- [ ] **Step 2: 빌드 검증**

Run:
```bash
npm run build && grep -q 'giscus' dist/whthlog/about/index.html && echo OK
```
Expected: `OK` (Footer 링크 열 렌더).

- [ ] **Step 3: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat: 멀티컬럼 사이트맵 푸터"
```

---

## Task 7: PostCard 컴포넌트

**Files:**
- Create: `src/components/PostCard.astro`

**Interfaces:**
- Consumes: `base`, `areaMeta`, `subsectionLabel`, `sectionLabel` from taxonomy, `FormattedDate`.
- Produces: `PostCard.astro` props:
  ```ts
  interface Props {
    id: string;              // post.id → 링크 ${base}blog/${id}/
    title: string;
    section: string;
    subsection: string;
    cs_area?: string[];
    concept?: string[];
    pubDate: Date;
    featured?: boolean;      // true 면 큰 카드 변형
  }
  ```
  루트 요소는 `<article class="card reveal" data-areas="...">` — data-areas는 홈 필터가 사용(공백 구분 cs_area 키). 대표 cs_area(첫 항목) 색을 인라인 `style="--card-accent: var(--area-…)"`로 주입해 언더라인에 사용.

- [ ] **Step 1: PostCard 작성**

Create `src/components/PostCard.astro`:
```astro
---
import { base } from '../lib/url';
import { areaMeta, subsectionLabel } from '../lib/taxonomy';
import FormattedDate from './FormattedDate.astro';

interface Props {
	id: string;
	title: string;
	section: string;
	subsection: string;
	cs_area?: string[];
	concept?: string[];
	pubDate: Date;
	featured?: boolean;
}
const { id, title, section, subsection, cs_area, concept, pubDate, featured } = Astro.props;

const areas = cs_area ?? [];
const primaryVar = areaMeta(areas[0] ?? '')?.cssVar ?? '--accent';
const label = subsectionLabel(section, subsection);
---

<article
	class:list={['card', 'reveal', { featured }]}
	data-areas={areas.join(' ')}
	style={`--card-accent: var(${primaryVar})`}
>
	<a class="hit" href={`${base}blog/${id}/`} aria-label={title}></a>
	<div class="cat">
		<span class="cat-label">{label}</span>
		<span class="cat-rule"></span>
	</div>
	<h3 class="title">{title}</h3>
	{
		(concept ?? []).length > 0 && (
			<div class="concepts">
				{(concept ?? []).slice(0, featured ? 6 : 3).map((c) => (
					<span class="concept">{c}</span>
				))}
			</div>
		)
	}
	<FormattedDate date={pubDate} />
</article>

<style>
	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		padding: 1.25em 1.35em 1.35em;
		background: var(--bg);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		box-shadow: var(--card-shadow);
		transition:
			transform 0.18s ease,
			box-shadow 0.18s ease,
			border-color 0.18s ease;
	}
	.card:hover {
		transform: translateY(-3px);
		box-shadow: var(--card-shadow-hover);
		border-color: var(--ink-soft);
	}
	/* 카드 전체를 클릭 타깃으로 (텍스트 선택은 유지) */
	.hit {
		position: absolute;
		inset: 0;
		z-index: 1;
		border-radius: inherit;
	}
	.cat {
		display: flex;
		flex-direction: column;
		gap: 0.35em;
	}
	.cat-label {
		font-family: var(--mono);
		font-size: 0.72rem;
		letter-spacing: 0.03em;
		color: var(--ink-soft);
	}
	.cat-rule {
		width: 2.2em;
		height: 3px;
		border-radius: 3px;
		background: var(--card-accent);
	}
	.title {
		margin: 0;
		font-size: 1.08em;
		line-height: 1.4;
		color: var(--ink);
	}
	.card:hover .title {
		color: var(--accent);
	}
	.concepts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35em;
	}
	.concept {
		font-family: var(--mono);
		font-size: 0.68rem;
		padding: 1px 8px;
		border-radius: 999px;
		background: var(--bg-tint);
		border: 1px solid var(--line);
		color: var(--ink-soft);
	}
	.featured {
		gap: 0.7em;
		padding: 1.8em 1.9em 1.9em;
	}
	.featured .title {
		font-size: 1.5em;
	}
</style>
```

- [ ] **Step 2: 빌드 검증(구문 확인)**

Run: `npm run build`
Expected: PASS (아직 어디서도 import 안 하므로 빌드만 통과하면 됨).

- [ ] **Step 3: Commit**

```bash
git add src/components/PostCard.astro
git commit -m "feat: PostCard — mono 라벨 + cs_area 언더라인, 호버 rise"
```

---

## Task 8: Hero 컴포넌트

**Files:**
- Create: `src/components/Hero.astro`

**Interfaces:**
- Consumes: `base`.
- Produces: `Hero.astro` props:
  ```ts
  interface Props {
    latestId?: string;   // "최근 글" CTA 대상 (없으면 홈 앵커)
  }
  ```
  좌측 카피(kicker·H1·서브·듀얼 CTA) + 우측 터미널 모티프 카드(실제 트러블슈팅 세션 표현). H1의 "CS 기초"에 `.u-underline` 적용.

- [ ] **Step 1: Hero 작성**

Create `src/components/Hero.astro`:
```astro
---
import { base } from '../lib/url';

interface Props {
	latestId?: string;
}
const { latestId } = Astro.props;
const recentHref = latestId ? `${base}blog/${latestId}/` : '#recent';
---

<section class="hero reveal">
	<div class="copy">
		<p class="kicker">// troubleshooting, through CS fundamentals</p>
		<h1>
			증상만 고치지 않는다.<br />
			<span class="u-underline">CS 기초</span>로 되짚어 푼다.
		</h1>
		<p class="sub">
			OS·컴퓨터구조·네트워크·자료구조·알고리즘 렌즈로 실제 문제를 진단한 기록.
			"무엇을 고쳤나"보다 "어떤 개념으로, 왜"에 무게를 둡니다.
		</p>
		<div class="cta">
			<a class="btn primary" href={recentHref}>최근 글 읽기</a>
			<a class="btn ghost" href={`${base}about/`}>소개</a>
		</div>
	</div>

	<div class="terminal" aria-hidden="true">
		<div class="bar"><span></span><span></span><span></span></div>
		<pre><code><span class="c-dim">$</span> ./vio --headless
<span class="c-err">X Error: cannot open display</span>
<span class="c-dim"># 어느 레이어? 파일도 권한도 아닌 "연결 실패"</span>
<span class="c-dim">$</span> echo $DISPLAY
<span class="c-dim">(empty)</span>
<span class="c-ok"># 진단: X11 은 client-server. 서버가 없다.</span>
<span class="c-dim">$</span> Xvfb :99 &amp; export DISPLAY=:99
<span class="c-ok">✓ resolved</span></code></pre>
	</div>
</section>

<style>
	.hero {
		display: grid;
		grid-template-columns: 1.1fr 1fr;
		gap: 2.5em;
		align-items: center;
		background: var(--hero-grad);
		border: 1px solid var(--line);
		border-radius: 20px;
		padding: 3em 2.5em;
		margin: 1.5em 0 2.5em;
	}
	.kicker {
		font-family: var(--mono);
		font-size: 0.8rem;
		color: var(--accent);
		margin: 0 0 1em;
	}
	.hero h1 {
		margin: 0;
		font-size: 2.1em;
		line-height: 1.3;
	}
	.sub {
		color: var(--ink-soft);
		margin: 1em 0 1.6em;
		max-width: 42ch;
	}
	.cta {
		display: flex;
		gap: 0.75em;
		flex-wrap: wrap;
	}
	.btn {
		display: inline-block;
		padding: 0.6em 1.3em;
		border-radius: 999px;
		font-weight: 600;
		font-size: 0.95em;
		text-decoration: none;
		border: 1px solid transparent;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}
	.btn:hover {
		transform: translateY(-2px);
	}
	.btn.primary {
		background: var(--accent);
		color: var(--bg);
		box-shadow: var(--card-shadow);
	}
	.btn.ghost {
		border-color: var(--line);
		color: var(--ink);
		background: var(--bg);
	}
	.terminal {
		border: 1px solid var(--line);
		border-radius: 12px;
		overflow: hidden;
		background: var(--bg);
		box-shadow: var(--card-shadow);
		font-size: 0.82em;
	}
	.bar {
		display: flex;
		gap: 0.4em;
		padding: 0.7em 0.9em;
		background: var(--bg-tint);
		border-bottom: 1px solid var(--line);
	}
	.bar span {
		width: 0.7em;
		height: 0.7em;
		border-radius: 50%;
		background: var(--line);
	}
	.terminal pre {
		margin: 0;
		border: none;
		border-radius: 0;
		background: transparent;
		font-size: 0.95em;
		line-height: 1.7;
	}
	.c-dim {
		color: var(--ink-soft);
	}
	.c-err {
		color: var(--area-algorithms);
	}
	.c-ok {
		color: var(--area-data-structures);
	}
	@media (max-width: 820px) {
		.hero {
			grid-template-columns: 1fr;
			padding: 2.2em 1.5em;
		}
		.hero h1 {
			font-size: 1.8em;
		}
	}
</style>
```

- [ ] **Step 2: 빌드 검증**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat: 그라디언트 히어로 + 터미널 모티프 카드"
```

---

## Task 9: StatStrip 컴포넌트

**Files:**
- Create: `src/components/StatStrip.astro`

**Interfaces:**
- Consumes: `Stats` shape from `../lib/stats` (props로 주입받음 — 컴포넌트는 계산하지 않음).
- Produces: `StatStrip.astro` props:
  ```ts
  interface Props {
    postCount: number;
    conceptCount: number;
    sectionCount: number;
  }
  ```
  세 통계를 라벨과 함께 가로 스트립으로 표시. (카운트업 애니메이션은 Phase 2 — 여기선 정적 숫자.)

- [ ] **Step 1: StatStrip 작성**

Create `src/components/StatStrip.astro`:
```astro
---
interface Props {
	postCount: number;
	conceptCount: number;
	sectionCount: number;
}
const { postCount, conceptCount, sectionCount } = Astro.props;
const items = [
	{ n: postCount, label: '글' },
	{ n: conceptCount, label: '고유 개념' },
	{ n: sectionCount, label: '섹션' },
];
---

<section class="stats reveal">
	{
		items.map((it) => (
			<div class="stat">
				<span class="num">{it.n}</span>
				<span class="label">{it.label}</span>
			</div>
		))
	}
</section>

<style>
	.stats {
		display: flex;
		gap: 1em;
		margin: 0 0 2.5em;
	}
	.stat {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		padding: 1.1em 1.3em;
		background: var(--bg-tint);
		border: 1px solid var(--line);
		border-radius: var(--radius);
	}
	.num {
		font-family: var(--mono);
		font-size: 1.9em;
		font-weight: 700;
		color: var(--accent);
		line-height: 1;
	}
	.label {
		font-size: 0.85em;
		color: var(--ink-soft);
	}
	@media (max-width: 520px) {
		.num {
			font-size: 1.5em;
		}
	}
</style>
```

- [ ] **Step 2: 빌드 검증**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/StatStrip.astro
git commit -m "feat: StatStrip — 글·개념·섹션 빌드 통계"
```

---

## Task 10: Sidebar 컴포넌트 (About · CategoryTree · TagCloud)

**Files:**
- Create: `src/components/Sidebar.astro`

**Interfaces:**
- Consumes: `base`, `SECTIONS`, `subsectionLabel`, `sectionLabel` from taxonomy.
- Produces: `Sidebar.astro` props (부모가 계산해 전달 — Sidebar는 순수 표시):
  ```ts
  interface Props {
    subsectionCounts: Record<string, number>;   // "cs/troubleshooting" → n
    concepts: { concept: string; count: number }[];
  }
  ```
  sticky 사이드바: 소개 카드(그라디언트 아바타·bio·GitHub/RSS) + 카테고리 트리(대/소분류 + 개수) + 개념 태그 클라우드(빈도 → 폰트 크기).

- [ ] **Step 1: Sidebar 작성**

Create `src/components/Sidebar.astro`:
```astro
---
import { base } from '../lib/url';
import { SECTIONS } from '../lib/taxonomy';

interface Props {
	subsectionCounts: Record<string, number>;
	concepts: { concept: string; count: number }[];
}
const { subsectionCounts, concepts } = Astro.props;

// 태그 클라우드 폰트 크기: 빈도 최소~최대를 0.72rem~1.05rem 로 선형 매핑
const maxCount = Math.max(1, ...concepts.map((c) => c.count));
const sizeFor = (n: number) => 0.72 + (n / maxCount) * 0.33;
---

<aside class="sidebar">
	<div class="card about reveal">
		<div class="avatar" aria-hidden="true">wt</div>
		<p class="bio">
			연구하다 만난 문제를 CS 기초로 되짚어 푸는 기록. VIO 비교 연구와 ROS2·Docker
			인프라에서 나온 사건들.
		</p>
		<div class="links">
			<a href="https://github.com/soyuncho16" target="_blank" rel="noopener">GitHub</a>
			<a href={`${base}rss.xml`}>RSS</a>
		</div>
	</div>

	<nav class="card tree reveal" aria-label="카테고리">
		<h3>카테고리</h3>
		<ul class="sections">
			{
				SECTIONS.map((s) => (
					<li>
						<a class="sec" href={`${base}${s.key}/`}>{s.label}</a>
						<ul>
							{s.subsections.map((sub) => {
								const n = subsectionCounts[`${s.key}/${sub.key}`] ?? 0;
								return (
									<li>
										<a href={`${base}${s.key}/${sub.key}/`}>
											<span>{sub.label}</span>
											<span class="count">{n}</span>
										</a>
									</li>
								);
							})}
						</ul>
					</li>
				))
			}
		</ul>
	</nav>

	{
		concepts.length > 0 && (
			<div class="card cloud reveal">
				<h3>개념</h3>
				<div class="tags">
					{concepts.map((c) => (
						<span class="tag" style={`font-size:${sizeFor(c.count)}rem`}>
							{c.concept}
						</span>
					))}
				</div>
			</div>
		)
	}
</aside>

<style>
	.sidebar {
		position: sticky;
		top: 5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25em;
		align-self: start;
	}
	.card {
		background: var(--bg);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 1.3em;
		box-shadow: var(--card-shadow);
	}
	.card h3 {
		margin: 0 0 0.9em;
		font-size: 0.8em;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--ink-soft);
	}
	.avatar {
		width: 3em;
		height: 3em;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-family: var(--mono);
		font-weight: 700;
		color: var(--bg);
		background: linear-gradient(135deg, var(--accent), var(--area-arch));
		margin-bottom: 0.8em;
	}
	.bio {
		margin: 0 0 1em;
		font-size: 0.9em;
		color: var(--ink-soft);
		line-height: 1.6;
	}
	.about .links {
		display: flex;
		gap: 1em;
		font-size: 0.9em;
	}
	.tree ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.tree .sections > li {
		margin-bottom: 0.7em;
	}
	.tree .sec {
		font-weight: 650;
		color: var(--ink);
		text-decoration: none;
	}
	.tree .sections ul {
		margin: 0.35em 0 0;
		padding-left: 0.8em;
		border-left: 1px solid var(--line);
	}
	.tree .sections ul a {
		display: flex;
		justify-content: space-between;
		padding: 0.2em 0;
		color: var(--ink-soft);
		text-decoration: none;
		font-size: 0.92em;
	}
	.tree .sections ul a:hover {
		color: var(--accent);
	}
	.count {
		font-family: var(--mono);
		font-size: 0.85em;
		opacity: 0.7;
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4em 0.5em;
	}
	.tag {
		font-family: var(--mono);
		color: var(--ink-soft);
		line-height: 1.4;
	}
	.tag:hover {
		color: var(--accent);
	}
</style>
```

- [ ] **Step 2: 빌드 검증**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar.astro
git commit -m "feat: Sidebar — About·CategoryTree·개념 태그 클라우드"
```

---

## Task 11: 홈 페이지 조립 (Hero · StatStrip · 필터 · Featured · 그리드 · Sidebar)

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `getCollection`, `BaseLayout`, `Hero`, `StatStrip`, `PostCard`, `Sidebar`, `computeStats`/`conceptCloud`/`countBySubsection` from stats, `CS_AREAS`/`areaMeta` from taxonomy, `SITE_TITLE`/`SITE_DESCRIPTION`.
- Produces: 홈 라우트 `/whthlog/` — Hero + StatStrip + 2단(본문: 필터 칩 + Featured + 카드 그리드 / 사이드바). cs_area 필터는 기존 JS 패턴을 카드에 맞게 이식(카드 `data-areas` toggle `hidden`).

- [ ] **Step 1: index.astro 재작성**

Overwrite `src/pages/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import StatStrip from '../components/StatStrip.astro';
import PostCard from '../components/PostCard.astro';
import Sidebar from '../components/Sidebar.astro';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import { CS_AREAS } from '../lib/taxonomy';
import { computeStats, conceptCloud, countBySubsection } from '../lib/stats';

const posts = (await getCollection('blog')).sort(
	(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
);
const stats = computeStats(posts);
const concepts = conceptCloud(posts);
const subCounts = countBySubsection(posts);

const [featured, ...rest] = posts;
const areaCount = (area: string) =>
	posts.filter((p) => p.data.cs_area?.includes(area as never)).length;
---

<BaseLayout title={SITE_TITLE} description={SITE_DESCRIPTION} wide>
	<Hero latestId={featured?.id} />
	<StatStrip
		postCount={stats.postCount}
		conceptCount={stats.conceptCount}
		sectionCount={stats.sectionCount}
	/>

	<div class="layout" id="recent">
		<div class="content">
			<h2 class="head"><span class="u-underline">최근 글</span></h2>

			<div class="chips" role="group" aria-label="cs_area 필터">
				<button class="chip on" data-area="all">전체 {posts.length}</button>
				{
					CS_AREAS.map((a) => (
						<button class="chip" data-area={a.key} disabled={areaCount(a.key) === 0}>
							{a.label} {areaCount(a.key)}
						</button>
					))
				}
			</div>

			<div class="grid">
				{
					featured && (
						<PostCard
							id={featured.id}
							title={featured.data.title}
							section={featured.data.section}
							subsection={featured.data.subsection}
							cs_area={featured.data.cs_area}
							concept={featured.data.concept}
							pubDate={featured.data.pubDate}
							featured
						/>
					)
				}
				{
					rest.map((p) => (
						<PostCard
							id={p.id}
							title={p.data.title}
							section={p.data.section}
							subsection={p.data.subsection}
							cs_area={p.data.cs_area}
							concept={p.data.concept}
							pubDate={p.data.pubDate}
						/>
					))
				}
			</div>
		</div>

		<Sidebar subsectionCounts={subCounts} concepts={concepts} />
	</div>
</BaseLayout>

<script>
	const chips = [...document.querySelectorAll<HTMLButtonElement>('.chips .chip')];
	const cards = [...document.querySelectorAll<HTMLElement>('.grid .card')];

	function apply(area: string) {
		chips.forEach((c) => c.classList.toggle('on', c.dataset.area === area));
		cards.forEach((card) => {
			card.hidden =
				area !== 'all' && !(card.dataset.areas ?? '').split(' ').includes(area);
		});
	}

	chips.forEach((c) =>
		c.addEventListener('click', () => {
			const area = c.dataset.area ?? 'all';
			history.replaceState(null, '', area === 'all' ? location.pathname : `#${area}`);
			apply(area);
		}),
	);

	const initial = location.hash.slice(1);
	if (initial && chips.some((c) => c.dataset.area === initial)) apply(initial);
</script>

<style>
	.layout {
		display: grid;
		grid-template-columns: 1fr 20rem;
		gap: 2.5em;
		align-items: start;
	}
	.head {
		margin: 0 0 1em;
		font-size: 1.4em;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 1.5em;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.25em;
	}
	/* featured 카드는 그리드 한 줄 전체 폭 */
	.grid :global(.card.featured) {
		grid-column: 1 / -1;
	}
	/* [hidden] 을 grid item 에서도 확실히 숨김 */
	.grid :global(.card[hidden]) {
		display: none;
	}
	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 560px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
</BaseLayout>
```
> 주의: 위 코드에서 `</BaseLayout>` 마감은 한 번만. `<script>`/`<style>`는 `BaseLayout` 슬롯 밖(페이지 최상위)에 두어야 Astro가 클라이언트 번들·스코프 처리한다. 최종 구조는 `--- ... --- <BaseLayout>…</BaseLayout> <script>…</script> <style>…</style>` 순서(마지막 줄의 잘못된 여분 `</BaseLayout>`는 제거).

- [ ] **Step 2: 잘못된 여분 태그 제거 확인**

`index.astro` 최상위 구조가 `<BaseLayout ...> ... </BaseLayout>` 한 쌍 + 그 뒤 `<script>` + `<style>` 인지 확인. (Step 1 코드블록 끝의 여분 `</BaseLayout>` 줄은 넣지 말 것.)

- [ ] **Step 3: 빌드 + 홈 마커 검증**

Run:
```bash
npm run build \
  && grep -q 'troubleshooting' dist/whthlog/index.html \
  && grep -q 'cannot open display' dist/whthlog/index.html \
  && grep -q 'data-area="os"' dist/whthlog/index.html \
  && echo OK
```
Expected: `OK` (Hero 터미널 카피 + 필터 칩 + 카드 렌더).

- [ ] **Step 4: 로컬 미리보기로 육안 확인**

Run: `npm run preview` (백그라운드) 후 안내. 확인 항목: 히어로 그라디언트, 스탯, 2단 레이아웃, 카드 호버 rise, 필터 동작, 라이트/다크 토글. (자동화 불가 — 사용자 확인.)

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: 포털형 홈 — Hero·Stat·필터·Featured·카드 그리드·Sidebar"
```

---

## Task 12: FloatingToc 컴포넌트

**Files:**
- Create: `src/components/FloatingToc.astro`

**Interfaces:**
- Consumes: (없음 — 클라이언트에서 `article` 내 `h2,h3`를 읽어 목차 생성)
- Produces: `FloatingToc.astro` (props 없음). 우하단 고정. 기본 = 펼친 패널(제목 + 목차 + active amber 하이라이트). 헤더 탭 → 알약으로 접힘. IntersectionObserver로 active 갱신. 본문 폭은 `body[data-toc="open"|"closed"]` 상태에 따라 CSS가 조정(경계 표식 없음).

- [ ] **Step 1: FloatingToc 작성**

Create `src/components/FloatingToc.astro`:
```astro
---
// 우하단 플로팅 목차. 본문 article 의 h2/h3 를 클라이언트에서 수집해 렌더.
---

<div id="floating-toc" class="toc" data-state="open">
	<button class="toc-head" aria-expanded="true" aria-controls="toc-body">
		<span class="toc-title">목차</span>
		<span class="toc-caret">▾</span>
	</button>
	<nav id="toc-body" class="toc-body" aria-label="목차"></nav>
</div>

<script>
	const toc = document.getElementById('floating-toc');
	const body = document.getElementById('toc-body');
	const head = toc?.querySelector<HTMLButtonElement>('.toc-head');
	const article = document.querySelector('article');
	if (toc && body && head && article) {
		const headings = [...article.querySelectorAll<HTMLElement>('h2, h3')].filter(
			(h) => h.id,
		);

		if (headings.length < 2) {
			toc.remove();
		} else {
			// 목차 링크 생성
			const links = new Map<string, HTMLAnchorElement>();
			for (const h of headings) {
				const a = document.createElement('a');
				a.href = `#${h.id}`;
				a.textContent = h.textContent;
				a.className = h.tagName === 'H3' ? 'lvl3' : 'lvl2';
				body.appendChild(a);
				links.set(h.id, a);
			}

			// 펼침/접힘 토글 (body[data-toc] 로 본문 폭 제어)
			const setState = (open: boolean) => {
				toc.dataset.state = open ? 'open' : 'closed';
				head.setAttribute('aria-expanded', String(open));
				document.body.dataset.toc = open ? 'open' : 'closed';
			};
			setState(true);
			head.addEventListener('click', () => setState(toc.dataset.state !== 'open'));

			// active 갱신
			const io = new IntersectionObserver(
				(entries) => {
					for (const e of entries) {
						if (!e.isIntersecting) continue;
						links.forEach((a) => a.classList.remove('active'));
						links.get(e.target.id)?.classList.add('active');
					}
				},
				{ rootMargin: '0px 0px -70% 0px', threshold: 0 },
			);
			headings.forEach((h) => io.observe(h));
		}
	}
</script>

<style>
	.toc {
		position: fixed;
		right: 1.5rem;
		bottom: 1.5rem;
		z-index: 40;
		width: 16rem;
		max-height: 60vh;
		display: flex;
		flex-direction: column;
		background: var(--bar-bg);
		backdrop-filter: saturate(180%) blur(12px);
		border: 1px solid var(--line);
		border-radius: 14px;
		box-shadow: var(--card-shadow-hover);
		overflow: hidden;
		transition:
			width 0.25s ease,
			border-radius 0.25s ease;
	}
	.toc-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
		padding: 0.7em 1em;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--ink);
		font: inherit;
		font-weight: 650;
		font-size: 0.9em;
	}
	.toc-caret {
		transition: transform 0.25s ease;
		color: var(--ink-soft);
	}
	.toc-body {
		display: flex;
		flex-direction: column;
		padding: 0 0.5em 0.7em;
		overflow-y: auto;
	}
	.toc-body a {
		padding: 0.3em 0.6em;
		border-radius: 6px;
		color: var(--ink-soft);
		text-decoration: none;
		font-size: 0.85em;
		line-height: 1.4;
		border-left: 2px solid transparent;
	}
	.toc-body a.lvl3 {
		padding-left: 1.4em;
		font-size: 0.8em;
	}
	.toc-body a:hover {
		color: var(--ink);
		background: var(--bg-tint);
	}
	.toc-body a.active {
		color: var(--accent);
		border-left-color: var(--accent);
		background: var(--accent-tint);
	}
	/* 접힘 = 알약 */
	.toc[data-state='closed'] {
		width: auto;
		border-radius: 999px;
	}
	.toc[data-state='closed'] .toc-body {
		display: none;
	}
	.toc[data-state='closed'] .toc-caret {
		transform: rotate(180deg);
	}
	@media (max-width: 640px) {
		.toc {
			right: 1rem;
			bottom: 1rem;
			width: 13rem;
		}
	}
</style>
```

- [ ] **Step 2: 빌드 검증**

Run: `npm run build`
Expected: PASS. (아직 미사용이면 dist 변화 없음 — Task 13에서 BlogPost에 삽입.)

- [ ] **Step 3: Commit**

```bash
git add src/components/FloatingToc.astro
git commit -m "feat: FloatingToc — 펼침 패널↔알약, IO active 하이라이트"
```

---

## Task 13: 읽기 페이지 리팩터 (breadcrumb · 읽기시간 · prev/next · FloatingToc)

**Files:**
- Modify: `src/layouts/BlogPost.astro`
- Modify: `src/pages/blog/[...slug].astro`

**Interfaces:**
- Consumes: `BaseLayout`, `FloatingToc`, `Comments`, `FormattedDate`, `readingTime`, `sectionLabel`/`subsectionLabel`/`areaMeta`/`areaLabel` from taxonomy, `base`.
- `[...slug].astro`는 정렬된 컬렉션에서 현재 글의 prev/next를 계산해 넘긴다.
- Produces: `BlogPost.astro` props (기존 + 추가):
  ```ts
  interface Props {
    title, description, pubDate, updatedDate?, heroImage?,
    cs_area?, concept?, status?,        // 기존
    section: string; subsection: string;
    body: string;                        // 읽기시간 계산용
    prev?: { id: string; title: string };
    next?: { id: string; title: string };
  }
  ```
  본문 스타일(Shiki·diagnosis·KaTeX)은 그대로. 헤더에 breadcrumb + 읽기시간 추가, cs_area 칩은 각 area 색 언더라인, 하단에 prev/next + Comments, FloatingToc 삽입. 헤딩 id는 Astro 기본 `rehype`가 부여(별도 설정 불필요 — GitHub-slugger 기본 동작 확인).

- [ ] **Step 1: [...slug].astro 에서 prev/next 계산**

Overwrite `src/pages/blog/[...slug].astro`:
```astro
---
import { type CollectionEntry, getCollection, render } from 'astro:content';
import BlogPost from '../../layouts/BlogPost.astro';
import { excerpt } from '../../lib/excerpt';

export async function getStaticPaths() {
	const posts = (await getCollection('blog')).sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
	);
	return posts.map((post, i) => ({
		params: { slug: post.id },
		props: {
			post,
			// 최신순 정렬: newer = i-1, older = i+1
			newer: posts[i - 1] ?? null,
			older: posts[i + 1] ?? null,
		},
	}));
}
type Props = {
	post: CollectionEntry<'blog'>;
	newer: CollectionEntry<'blog'> | null;
	older: CollectionEntry<'blog'> | null;
};

const { post, newer, older } = Astro.props as Props;
const { Content } = await render(post);
const description = post.data.description ?? excerpt(post.body);
const toNav = (p: Props['newer']) => (p ? { id: p.id, title: p.data.title } : undefined);
---

<BlogPost
	{...post.data}
	description={description}
	body={post.body}
	next={toNav(newer)}
	prev={toNav(older)}
>
	<Content />
</BlogPost>
```

- [ ] **Step 2: BlogPost.astro 재작성 (BaseLayout 기반)**

Overwrite `src/layouts/BlogPost.astro`:
```astro
---
import type { ImageMetadata } from 'astro';
import { Image } from 'astro:assets';
import BaseLayout from './BaseLayout.astro';
import Comments from '../components/Comments.astro';
import FormattedDate from '../components/FormattedDate.astro';
import FloatingToc from '../components/FloatingToc.astro';
import { base } from '../lib/url';
import { readingTime } from '../lib/reading-time';
import { sectionLabel, subsectionLabel, areaMeta, areaLabel } from '../lib/taxonomy';

interface Props {
	title: string;
	description: string;
	pubDate: Date;
	updatedDate?: Date;
	heroImage?: ImageMetadata;
	cs_area?: string[];
	concept?: string[];
	status?: string;
	section: string;
	subsection: string;
	body: string;
	prev?: { id: string; title: string };
	next?: { id: string; title: string };
}
const {
	title,
	description,
	pubDate,
	updatedDate,
	heroImage,
	cs_area,
	concept,
	status,
	section,
	subsection,
	body,
	prev,
	next,
} = Astro.props;

const minutes = readingTime(body);
---

<BaseLayout title={title} description={description} image={heroImage}>
	<article>
		<header class="post-head">
			<nav class="crumb" aria-label="breadcrumb">
				<a href={`${base}${section}/`}>{sectionLabel(section)}</a>
				<span>›</span>
				<a href={`${base}${section}/${subsection}/`}>{subsectionLabel(section, subsection)}</a>
			</nav>
			<h1>{title}</h1>
			<div class="meta">
				<FormattedDate date={pubDate} />
				{
					updatedDate && (
						<span class="updated">
							(수정: <FormattedDate date={updatedDate} />)
						</span>
					)
				}
				<span class="dot">·</span>
				<span class="rt">{minutes}분</span>
			</div>
			<div class="chips">
				{
					(cs_area ?? []).map((a) => (
						<a
							class="chip area"
							href={`${base}#${a}`}
							style={`--card-accent: var(${areaMeta(a)?.cssVar ?? '--accent'})`}
						>
							{areaLabel(a)}
						</a>
					))
				}
				{(concept ?? []).map((c) => <span class="chip">{c}</span>)}
				{status && <span class="chip">{status}</span>}
			</div>
			<hr />
		</header>
		{heroImage && <Image width={1020} height={510} src={heroImage} alt="" />}
		<div class="prose">
			<slot />
		</div>

		<nav class="pager" aria-label="이전/다음 글">
			{
				prev ? (
					<a class="pg prev" href={`${base}blog/${prev.id}/`}>
						<span class="dir">← 이전 글</span>
						<span class="t">{prev.title}</span>
					</a>
				) : (
					<span />
				)
			}
			{
				next && (
					<a class="pg next" href={`${base}blog/${next.id}/`}>
						<span class="dir">다음 글 →</span>
						<span class="t">{next.title}</span>
					</a>
				)
			}
		</nav>

		<Comments />
	</article>

	<FloatingToc />
</BaseLayout>

<style>
	article {
		max-width: 68ch;
		margin: 0 auto;
	}
	/* 목차 펼침 시 본문을 왼쪽 정렬(오른쪽에 목차 공간 확보), 접힘 시 중앙 복귀 */
	:global(body[data-toc='open']) article {
		margin-left: 0;
		transition: margin 0.25s ease;
	}
	.crumb {
		display: flex;
		gap: 0.5em;
		font-size: 0.85em;
		color: var(--ink-soft);
		font-family: var(--mono);
	}
	.crumb a {
		color: var(--ink-soft);
		text-decoration: none;
	}
	.crumb a:hover {
		color: var(--accent);
	}
	.post-head h1 {
		margin: 0.4em 0 0.4em;
	}
	.meta {
		display: flex;
		align-items: baseline;
		gap: 0.5em;
		color: var(--ink-soft);
	}
	.rt {
		font-family: var(--mono);
		font-size: 0.85em;
	}
	.post-head .chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin: 1em 0 0;
	}
	.chip.area {
		color: var(--card-accent);
		border-color: color-mix(in srgb, var(--card-accent) 40%, var(--line));
	}
	.post-head hr {
		margin: 1.2em 0 1.5em;
	}
	.pager {
		display: flex;
		justify-content: space-between;
		gap: 1em;
		margin-top: 3em;
	}
	.pg {
		display: flex;
		flex-direction: column;
		gap: 0.2em;
		max-width: 45%;
		padding: 0.9em 1.1em;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		text-decoration: none;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}
	.pg:hover {
		transform: translateY(-2px);
		box-shadow: var(--card-shadow);
	}
	.pg.next {
		text-align: right;
		margin-left: auto;
	}
	.pg .dir {
		font-size: 0.78em;
		color: var(--ink-soft);
		font-family: var(--mono);
	}
	.pg .t {
		color: var(--ink);
		font-weight: 600;
		font-size: 0.95em;
	}
</style>
```

- [ ] **Step 3: 빌드 + 읽기페이지 마커 검증**

Run:
```bash
npm run build \
  && POST=dist/whthlog/blog/2026-06-06-headless-x-server-xvfb/index.html \
  && grep -q 'breadcrumb' "$POST" \
  && grep -q 'floating-toc' "$POST" \
  && grep -q '분' "$POST" \
  && grep -q 'diagnosis' "$POST" \
  && echo OK
```
Expected: `OK` (breadcrumb + TOC + 읽기시간 + 기존 diagnosis 콜아웃 모두 존재).

- [ ] **Step 4: 헤딩 id 존재 확인 (TOC 앵커 전제)**

Run:
```bash
grep -oE '<h2[^>]*id="[^"]+"' dist/whthlog/blog/2026-06-06-headless-x-server-xvfb/index.html | head
```
Expected: `id="..."` 가 붙은 h2 출력. 없으면 `astro.config.mjs`에 `rehype-slug` 추가 필요 — 이 경우 `npm i -D rehype-slug` 후 `rehypePlugins` 배열 앞에 `rehypeSlug` 삽입하고 재빌드.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/BlogPost.astro src/pages/blog/[...slug].astro
git commit -m "feat: 읽기 페이지 — breadcrumb·읽기시간·prev/next·FloatingToc"
```

---

## Task 14: 섹션 / 소분류 랜딩 페이지

**Files:**
- Create: `src/components/SectionLanding.astro`
- Create: `src/pages/[section]/index.astro`
- Create: `src/pages/[section]/[subsection].astro`

**Interfaces:**
- Consumes: `getCollection`, `BaseLayout`, `PostCard`, `SECTIONS`/`sectionByKey`/`subsectionLabel` from taxonomy, `base`.
- Produces:
  - `SectionLanding.astro` props:
    ```ts
    interface Props {
      heading: string;         // "CS" 또는 "CS › 트러블슈팅"
      blurb: string;
      posts: {
        id: string; title: string; section: string; subsection: string;
        cs_area?: string[]; concept?: string[]; pubDate: Date;
      }[];
    }
    ```
    카드 그리드 렌더. posts 비면 "준비 중" 안내.
  - `/whthlog/<section>/` (대분류) 와 `/whthlog/<section>/<subsection>/` (소분류) 정적 경로 — taxonomy에서 생성.

- [ ] **Step 1: SectionLanding 작성**

Create `src/components/SectionLanding.astro`:
```astro
---
import PostCard from './PostCard.astro';

interface Props {
	heading: string;
	blurb: string;
	posts: {
		id: string;
		title: string;
		section: string;
		subsection: string;
		cs_area?: string[];
		concept?: string[];
		pubDate: Date;
	}[];
}
const { heading, blurb, posts } = Astro.props;
---

<section class="landing">
	<header class="lead reveal">
		<h1><span class="u-underline">{heading}</span></h1>
		<p class="blurb">{blurb}</p>
	</header>

	{
		posts.length > 0 ? (
			<div class="grid">
				{posts.map((p) => (
					<PostCard
						id={p.id}
						title={p.title}
						section={p.section}
						subsection={p.subsection}
						cs_area={p.cs_area}
						concept={p.concept}
						pubDate={p.pubDate}
					/>
				))}
			</div>
		) : (
			<p class="empty reveal">아직 준비 중인 섹션입니다. 곧 채워집니다.</p>
		)
	}
</section>

<style>
	.landing {
		padding: 1.5em 0 2em;
	}
	.lead {
		margin-bottom: 2em;
	}
	.lead h1 {
		font-size: 1.9em;
		margin: 0 0 0.4em;
	}
	.blurb {
		color: var(--ink-soft);
		margin: 0;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
		gap: 1.25em;
	}
	.empty {
		color: var(--ink-soft);
		padding: 3em 0;
		text-align: center;
		border: 1px dashed var(--line);
		border-radius: var(--radius);
	}
</style>
```

- [ ] **Step 2: 대분류 랜딩 라우트 작성**

Create `src/pages/[section]/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import SectionLanding from '../../components/SectionLanding.astro';
import { SECTIONS } from '../../lib/taxonomy';

export async function getStaticPaths() {
	const posts = (await getCollection('blog')).sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
	);
	return SECTIONS.map((s) => ({
		params: { section: s.key },
		props: {
			section: s,
			posts: posts
				.filter((p) => p.data.section === s.key)
				.map((p) => ({
					id: p.id,
					title: p.data.title,
					section: p.data.section,
					subsection: p.data.subsection,
					cs_area: p.data.cs_area,
					concept: p.data.concept,
					pubDate: p.data.pubDate,
				})),
		},
	}));
}
const { section, posts } = Astro.props;
---

<BaseLayout title={`${section.label} · whthlog`} description={section.blurb} wide>
	<SectionLanding heading={section.label} blurb={section.blurb} posts={posts} />
</BaseLayout>
```

- [ ] **Step 3: 소분류 랜딩 라우트 작성**

Create `src/pages/[section]/[subsection].astro`:
```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import SectionLanding from '../../components/SectionLanding.astro';
import { SECTIONS } from '../../lib/taxonomy';

export async function getStaticPaths() {
	const posts = (await getCollection('blog')).sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
	);
	return SECTIONS.flatMap((s) =>
		s.subsections.map((sub) => ({
			params: { section: s.key, subsection: sub.key },
			props: {
				heading: `${s.label} › ${sub.label}`,
				blurb: s.blurb,
				posts: posts
					.filter((p) => p.data.section === s.key && p.data.subsection === sub.key)
					.map((p) => ({
						id: p.id,
						title: p.data.title,
						section: p.data.section,
						subsection: p.data.subsection,
						cs_area: p.data.cs_area,
						concept: p.data.concept,
						pubDate: p.data.pubDate,
					})),
			},
		})),
	);
}
const { heading, blurb, posts } = Astro.props;
---

<BaseLayout title={`${heading} · whthlog`} description={blurb} wide>
	<SectionLanding heading={heading} blurb={blurb} posts={posts} />
</BaseLayout>
```

- [ ] **Step 4: 빌드 + 라우팅 검증**

Run:
```bash
npm run build \
  && test -f dist/whthlog/cs/index.html \
  && test -f dist/whthlog/cs/troubleshooting/index.html \
  && test -f dist/whthlog/dev/index.html \
  && test -f dist/whthlog/paper/review/index.html \
  && grep -q '준비 중' dist/whthlog/dev/index.html \
  && grep -q 'cannot open display' dist/whthlog/cs/troubleshooting/index.html \
  && echo OK
```
Expected: `OK` (모든 섹션/소분류 라우트 생성, dev는 준비 중, cs/troubleshooting에 실제 글 카드).

- [ ] **Step 5: Commit**

```bash
git add src/components/SectionLanding.astro "src/pages/[section]/index.astro" "src/pages/[section]/[subsection].astro"
git commit -m "feat: 섹션/소분류 랜딩 라우트 + SectionLanding"
```

---

## Task 15: 최종 검증 (빌드 · 라우팅 · 반응형 · 다크/라이트 · reduced-motion · RSS)

**Files:** (없음 — 검증만; 발견된 결함은 해당 Task 파일에서 수정)

- [ ] **Step 1: 전체 유닛 테스트 + 빌드**

Run: `npm test && npm run build`
Expected: 모든 vitest 스위트 PASS, `astro build` 경고/에러 없이 완료.

- [ ] **Step 2: 라우트 인벤토리 확인**

Run:
```bash
find dist/whthlog -name index.html | sort
```
Expected 최소 목록: `/`, `/about/`, `/blog/2026-06-06-.../`, `/blog/2026-06-25-.../`, `/cs/`, `/cs/troubleshooting/`, `/cs/study/`, `/dev/`, `/dev/retro/`, `/dev/log/`, `/paper/`, `/paper/review/`. 그리고 `rss.xml`, `sitemap-index.xml` 존재.

- [ ] **Step 3: RSS·sitemap 무결성**

Run:
```bash
test -f dist/whthlog/rss.xml \
  && grep -q '/whthlog/blog/2026-06-06' dist/whthlog/rss.xml \
  && test -f dist/whthlog/sitemap-index.xml \
  && echo OK
```
Expected: `OK` (RSS item 링크에 base 포함, sitemap 생성).

- [ ] **Step 4: 내부 링크 base 누락 스캔**

Run:
```bash
grep -rEn 'href="/(cs|dev|paper|blog|about|rss)' dist/whthlog/index.html || echo "no base-less internal links"
```
Expected: `no base-less internal links` (모든 내부 링크가 `/whthlog/...` 형태).

- [ ] **Step 5: 육안 확인 (사용자와 함께)**

`npm run preview` 실행 후 브라우저에서 확인 (§10 검증 항목):
- 라이트/다크 양쪽: 히어로 그라디언트, 카드, cs_area 색 대비, TOC 가독.
- 반응형(≤720px): 상단바 햄버거 접힘, 사이드바 본문 아래로, 그리드 1열, 플로팅 TOC 유지.
- 카드 호버 rise, 스크롤 진입 fade+rise 1회.
- `prefers-reduced-motion` (DevTools 강제): 진입 애니메이션 즉시 표시(모션 없음).
- 플로팅 TOC: 펼침 패널 ↔ 알약 토글, 스크롤 시 active 항목 amber 하이라이트, 접힘 시 본문 폭 확장.
- 기존 2개 글 정상 렌더(Shiki 코드블록, "내 진단" 콜아웃, prev/next).

- [ ] **Step 6: 정리 커밋 (필요 시)**

육안 확인에서 나온 수정만 반영 후:
```bash
git add -A && git commit -m "fix: 리디자인 육안 검증 반영"
```

---

## Self-Review

**Spec coverage (설계 문서 §2~§5, §10 대비):**
- §2 IA (2단 계층, 설정 기반 확장) → Task 1 taxonomy + Task 14 라우트. ✅
- §3 콘텐츠 모델(section/subsection, 마이그레이션, cs_area 색) → Task 3 + Task 4. ✅
- §4 디자인 토큰(cs_area 색·그라디언트·그림자·blur) → Task 4. ✅
- §5.1 스티키 상단바 + 큰 푸터 → Task 5 + Task 6. ✅
- §5.2 홈(히어로·스탯·2단·필터·Featured·그리드·사이드바) → Task 8·9·7·10·11. ✅
- §5.3 글 카드(언더라인 액센트, 호버 rise, 좌측 스트립 폐기) → Task 7. ✅
- §5.4 읽기 페이지(breadcrumb·읽기시간·칩·본문 유지·플로팅 TOC·prev/next·giscus) → Task 12·13. ✅
- §5.5 섹션/소분류 랜딩 → Task 14. ✅
- §5.6 진입 애니메이션 → Task 4(CSS) + Task 5(ScrollReveal). ✅
- §10 검증(빌드·다크/라이트·반응형·reduced-motion·기존 글) → Task 15. ✅
- Phase 2(로더·카운트업·검색)는 비범위 — StatStrip은 정적 숫자로 남김. ✅

**Type consistency 확인:**
- taxonomy: `sectionByKey/sectionLabel/subsectionLabel/areaMeta/areaLabel/isValidSubsection` — 정의(Task 1)와 사용(Task 3·5·6·7·10·13·14) 이름 일치. ✅
- stats: `computeStats/conceptCloud/countBySubsection` — 정의(Task 2)와 사용(Task 11) 일치. ✅
- PostCard props(`id,title,section,subsection,cs_area,concept,pubDate,featured`) — 정의(Task 7)와 호출부(Task 11·14 SectionLanding) 일치. ✅
- `--card-accent` CSS 변수 — PostCard(Task 7)·BlogPost 칩(Task 13)에서 동일 이름 사용. ✅
- `body[data-toc]` 상태 — FloatingToc(Task 12) 설정, BlogPost(Task 13) CSS 소비 일치. ✅

**Placeholder scan:** "TODO/TBD/적절히 처리" 류 없음. 각 코드 스텝에 실제 코드 포함. Task 15 Step 5(육안)만 사람 확인 — 정적 사이트 시각 검증의 본질상 불가피하며 §10이 요구. ✅

**주의로 남긴 리스크:**
- Task 13 Step 4: Astro 기본이 헤딩 id를 안 붙이면 `rehype-slug` 추가 필요 — 검증 스텝에 fallback 명시.
- Task 11 Step 1~2: `<script>/<style>`는 `<BaseLayout>` 슬롯 밖 페이지 최상위에 두어야 함 — 여분 닫는 태그 금지 주의 명시.
