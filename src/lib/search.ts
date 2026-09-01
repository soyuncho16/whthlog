export interface SearchDoc {
	id: string;
	title: string;
	description: string;
	section: string;
	subsection: string;
	concept: string[];
	stack: string[];
	body: string; // 마크다운 벗긴 평문
	pubDate: string; // ISO
}

export interface SearchResult {
	doc: SearchDoc;
	score: number;
	snippet?: string; // 본문 매칭일 때만, 첫 매칭 주변 텍스트
}

/** 검색 인덱스용 평문 변환. excerpt 와 달리 코드블록 내용은 살린다 (명령어 검색 대상). */
export function toPlainText(md: string): string {
	return md
		.replace(/```[^\n]*\n([\s\S]*?)```/g, ' $1 ') // 펜스·언어 태그만 제거, 내용 유지
		.replace(/\$\$[\s\S]*?\$\$/g, ' ') // 블록 수식 제거
		.replace(/\$[^$\n]+\$/g, ' ') // 인라인 수식 제거
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 이미지 제거
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 링크는 텍스트만
		.replace(/[*_`>#~|]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/** 하이라이트용: 토큰들의 모든 등장 구간을 [start, end) 로, 겹침 병합·정렬해서 반환. */
export function matchRanges(text: string, tokens: string[]): Array<[number, number]> {
	const lower = text.toLowerCase();
	const raw: Array<[number, number]> = [];
	for (const t of tokens) {
		if (!t) continue;
		let i = lower.indexOf(t);
		while (i !== -1) {
			raw.push([i, i + t.length]);
			i = lower.indexOf(t, i + 1);
		}
	}
	raw.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
	const merged: Array<[number, number]> = [];
	for (const [s, e] of raw) {
		const last = merged[merged.length - 1];
		if (last && s <= last[1]) last[1] = Math.max(last[1], e);
		else merged.push([s, e]);
	}
	return merged;
}

const SNIPPET_RADIUS = 40;

function makeSnippet(body: string, index: number, tokenLen: number): string {
	const start = Math.max(0, index - SNIPPET_RADIUS);
	const end = Math.min(body.length, index + tokenLen + SNIPPET_RADIUS);
	const head = start > 0 ? '…' : '';
	const tail = end < body.length ? '…' : '';
	return head + body.slice(start, end).trim() + tail;
}

/** 토큰 전부 포함(AND)·부분 문자열·대소문자 무시. 제목 3 > concept/stack 2 > 설명/본문 1. */
export function searchDocs(docs: SearchDoc[], query: string, limit = 8): SearchResult[] {
	const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
	if (tokens.length === 0) return [];

	const results: SearchResult[] = [];
	for (const doc of docs) {
		const title = doc.title.toLowerCase();
		const tags = [...doc.concept, ...doc.stack].join(' ').toLowerCase();
		const desc = doc.description.toLowerCase();
		const body = doc.body.toLowerCase();

		let score = 0;
		let snippet: string | undefined;
		let ok = true;
		for (const t of tokens) {
			if (title.includes(t)) {
				score += 3;
			} else if (tags.includes(t)) {
				score += 2;
			} else if (desc.includes(t)) {
				score += 1;
			} else {
				const i = body.indexOf(t);
				if (i === -1) {
					ok = false;
					break;
				}
				score += 1;
				snippet ??= makeSnippet(doc.body, i, t.length);
			}
		}
		if (ok) results.push({ doc, score, snippet });
	}

	return results
		.sort(
			(a, b) =>
				b.score - a.score ||
				Date.parse(b.doc.pubDate) - Date.parse(a.doc.pubDate) ||
				a.doc.id.localeCompare(b.doc.id),
		)
		.slice(0, limit);
}
