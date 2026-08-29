import { describe, expect, it } from 'vitest';
import { sortBlogPosts } from './posts';

describe('sortBlogPosts', () => {
	it('sorts newest posts first and keeps same-day series in explicit order', () => {
		const posts = [
			{ id: 'b', data: { pubDate: new Date('2026-07-24T00:00:00Z'), seriesOrder: 2 } },
			{ id: 'a', data: { pubDate: new Date('2026-07-24T00:00:00Z'), seriesOrder: 1 } },
			{ id: 'c', data: { pubDate: new Date('2026-07-25T00:00:00Z') } },
		] as any;

		const sorted = sortBlogPosts(posts);
		expect(sorted.map((p) => p.id)).toEqual(['c', 'a', 'b']);
	});

	it('keeps fallback order for same-day posts without explicit seriesOrder', () => {
		const posts = [
			{ id: 'x', data: { pubDate: new Date('2026-07-24T00:00:00Z') } },
			{ id: 'y', data: { pubDate: new Date('2026-07-24T00:00:00Z') } },
		] as any;

		expect(sortBlogPosts(posts).map((p) => p.id)).toEqual(['x', 'y']);
	});
});
