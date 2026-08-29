import { describe, expect, it } from 'vitest';
import { getReadingOrderPosts, sortBlogPosts } from './posts';

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

	it('keeps reading-order navigation in the natural series sequence for same-day posts', () => {
		const posts = [
			{ id: 'p3', data: { pubDate: new Date('2026-07-24T00:00:00Z'), seriesOrder: 3 } },
			{ id: 'p1', data: { pubDate: new Date('2026-07-24T00:00:00Z'), seriesOrder: 1 } },
			{ id: 'p2', data: { pubDate: new Date('2026-07-24T00:00:00Z'), seriesOrder: 2 } },
		] as any;

		expect(getReadingOrderPosts(posts).map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
	});
});
