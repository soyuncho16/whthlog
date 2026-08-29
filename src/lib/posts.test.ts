import { describe, expect, it } from 'vitest';
import { getReadingOrderPosts, publishedAt, sortBlogPosts } from './posts';

const at = (iso: string, seriesOrder?: number, id = iso) =>
	({ id, data: { pubDate: new Date(iso), seriesOrder } }) as any;

describe('publishedAt', () => {
	it('uses pubDate time as the primary axis', () => {
		const a = at('2026-07-24T10:00:00+09:00');
		const b = at('2026-07-24T11:00:00+09:00');
		expect(publishedAt(a)).toBeLessThan(publishedAt(b));
	});

	it('treats seriesOrder as a later-in-the-day offset when times tie', () => {
		const p1 = at('2026-07-24T00:00:00Z', 1);
		const p2 = at('2026-07-24T00:00:00Z', 2);
		expect(publishedAt(p1)).toBeLessThan(publishedAt(p2));
	});

	it('keeps a seriesOrder offset smaller than one day', () => {
		const late = at('2026-07-24T00:00:00Z', 99);
		const nextDay = at('2026-07-25T00:00:00Z');
		expect(publishedAt(late)).toBeLessThan(publishedAt(nextDay));
	});
});

describe('sortBlogPosts (lists: newest first)', () => {
	it('orders same-day series by time, latest on top', () => {
		const posts = [at('2026-07-24T00:00:00Z', 2, 'p2'), at('2026-07-24T00:00:00Z', 1, 'p1'), at('2026-07-25T00:00:00Z', undefined, 'c')];
		expect(sortBlogPosts(posts).map((p) => p.id)).toEqual(['c', 'p2', 'p1']);
	});

	it('orders timed same-day posts by their time', () => {
		const posts = [at('2026-07-24T10:00:00+09:00', undefined, 'morning'), at('2026-07-24T15:00:00+09:00', undefined, 'afternoon')];
		expect(sortBlogPosts(posts).map((p) => p.id)).toEqual(['afternoon', 'morning']);
	});

	it('falls back to id (later slug = later post) when time and seriesOrder tie', () => {
		const posts = [at('2026-07-24T00:00:00Z', undefined, 'y'), at('2026-07-24T00:00:00Z', undefined, 'x')];
		expect(sortBlogPosts(posts).map((p) => p.id)).toEqual(['y', 'x']);
		expect(getReadingOrderPosts(posts).map((p) => p.id)).toEqual(['x', 'y']);
	});
});

describe('getReadingOrderPosts (pager: oldest first)', () => {
	it('is the exact reverse of the list order across days and series', () => {
		const posts = [
			at('2026-07-24T00:00:00Z', 3, 'p3'),
			at('2026-07-12T00:00:00Z', undefined, 'old'),
			at('2026-07-24T00:00:00Z', 1, 'p1'),
			at('2026-07-24T00:00:00Z', 2, 'p2'),
		];
		expect(getReadingOrderPosts(posts).map((p) => p.id)).toEqual(['old', 'p1', 'p2', 'p3']);
		expect(getReadingOrderPosts(posts).map((p) => p.id)).toEqual(
			sortBlogPosts(posts).map((p) => p.id).reverse(),
		);
	});
});
