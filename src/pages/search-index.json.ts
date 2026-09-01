import { getCollection } from 'astro:content';
import type { SearchDoc } from '../lib/search';
import { toPlainText } from '../lib/search';
import { publishedAt } from '../lib/posts';

/** 클라이언트 검색용 정적 인덱스. 헤더 검색창이 첫 타이핑에 한 번 fetch 한다. */
export async function GET() {
	const posts = await getCollection('blog');
	const docs: SearchDoc[] = posts.map((p) => ({
		id: p.id,
		title: p.data.title,
		description: p.data.description ?? '',
		section: p.data.section,
		subsection: p.data.subsection,
		concept: p.data.concept ?? [],
		stack: p.data.stack ?? [],
		body: toPlainText(p.body ?? ''),
		// 목록·페이저와 같은 시간 축 (pubDate + seriesOrder)
		pubDate: new Date(publishedAt(p)).toISOString(),
	}));
	return new Response(JSON.stringify(docs), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}
