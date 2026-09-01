import { describe, expect, it } from 'vitest';
import { matchRanges, searchDocs, toPlainText, type SearchDoc } from './search';

const doc = (over: Partial<SearchDoc>): SearchDoc => ({
	id: 'x',
	title: '',
	description: '',
	section: 'cs',
	subsection: 'study',
	concept: [],
	stack: [],
	body: '',
	pubDate: '2026-07-24T00:00:00Z',
	...over,
});

describe('toPlainText', () => {
	it('keeps code block content but drops the fence markers', () => {
		const md = '설명\n\n```bash\ndocker run --rm -it\n```\n\n끝';
		const text = toPlainText(md);
		expect(text).toContain('docker run --rm -it');
		expect(text).not.toContain('```');
		expect(text).not.toContain('bash\ndocker'); // 언어 태그는 버린다
	});

	it('keeps heading text without the hashes and link text without the url', () => {
		const text = toPlainText('## 내 진단\n\n[커널 문서](https://kernel.org)를 봤다');
		expect(text).toContain('내 진단');
		expect(text).toContain('커널 문서를 봤다');
		expect(text).not.toContain('#');
		expect(text).not.toContain('kernel.org');
	});

	it('drops images and math', () => {
		const text = toPlainText('![그림](a.png) $x^2$ 본문');
		expect(text).not.toContain('a.png');
		expect(text).not.toContain('x^2');
		expect(text).toContain('본문');
	});
});

describe('searchDocs', () => {
	it('returns nothing for an empty or whitespace query', () => {
		const docs = [doc({ title: '컨테이너' })];
		expect(searchDocs(docs, '')).toEqual([]);
		expect(searchDocs(docs, '   ')).toEqual([]);
	});

	it('matches a substring in the title, case-insensitive', () => {
		const docs = [doc({ id: 'a', title: 'Docker 컨테이너 해부' }), doc({ id: 'b', title: '쿼터니언' })];
		const hits = searchDocs(docs, 'docker');
		expect(hits.map((h) => h.doc.id)).toEqual(['a']);
	});

	it('requires every token to match somewhere (AND)', () => {
		const docs = [
			doc({ id: 'a', title: '컨테이너 해부', body: '격리된 프로세스' }),
			doc({ id: 'b', title: '컨테이너 소개', body: '설치 방법' }),
		];
		expect(searchDocs(docs, '컨테이너 격리').map((h) => h.doc.id)).toEqual(['a']);
	});

	it('ranks title matches above body-only matches', () => {
		const docs = [
			doc({ id: 'body-hit', title: '다른 제목', body: '컨테이너 이야기' }),
			doc({ id: 'title-hit', title: '컨테이너 해부' }),
		];
		expect(searchDocs(docs, '컨테이너').map((h) => h.doc.id)).toEqual(['title-hit', 'body-hit']);
	});

	it('ranks concept/stack matches above body-only matches', () => {
		const docs = [
			doc({ id: 'body-hit', body: 'overlayfs 언급' }),
			doc({ id: 'concept-hit', concept: ['overlayfs'] }),
		];
		expect(searchDocs(docs, 'overlayfs').map((h) => h.doc.id)).toEqual(['concept-hit', 'body-hit']);
	});

	it('breaks score ties by newer pubDate first', () => {
		const docs = [
			doc({ id: 'old', title: '컨테이너 1', pubDate: '2026-06-01T00:00:00Z' }),
			doc({ id: 'new', title: '컨테이너 2', pubDate: '2026-07-24T00:00:00Z' }),
		];
		expect(searchDocs(docs, '컨테이너').map((h) => h.doc.id)).toEqual(['new', 'old']);
	});

	it('caps results at the limit', () => {
		const docs = Array.from({ length: 12 }, (_, i) => doc({ id: `d${i}`, title: `컨테이너 ${i}` }));
		expect(searchDocs(docs, '컨테이너', 8)).toHaveLength(8);
	});

	it('attaches a snippet around the first body match', () => {
		const body = '앞부분 '.repeat(30) + 'namespace 격리를 inode로 확인했다' + ' 뒷부분'.repeat(30);
		const docs = [doc({ id: 'a', title: '다른 제목', body })];
		const [hit] = searchDocs(docs, 'inode');
		expect(hit.snippet).toContain('inode');
		expect(hit.snippet!.length).toBeLessThan(120);
	});

	it('gives no snippet when only the title matches', () => {
		const docs = [doc({ id: 'a', title: '컨테이너 해부', body: '본문에는 다른 이야기' })];
		const [hit] = searchDocs(docs, '컨테이너');
		expect(hit.snippet).toBeUndefined();
	});
});

describe('matchRanges', () => {
	it('finds every occurrence of every token, case-insensitive', () => {
		expect(matchRanges('Docker와 docker', ['docker'])).toEqual([
			[0, 6],
			[8, 14],
		]);
	});

	it('merges overlapping ranges from different tokens', () => {
		// "컨테이너" 와 "테이" 가 겹치면 한 구간으로
		expect(matchRanges('컨테이너 구조', ['컨테이너', '테이'])).toEqual([[0, 4]]);
	});

	it('returns sorted disjoint ranges', () => {
		expect(matchRanges('격리와 namespace 격리', ['namespace', '격리'])).toEqual([
			[0, 2],
			[4, 13],
			[14, 16],
		]);
	});
});
