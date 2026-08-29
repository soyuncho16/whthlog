type BlogPostLike = {
	id?: string;
	data: {
		pubDate: Date;
		seriesOrder?: number;
	};
};

// seriesOrder 한 칸 = 1분. pubDate 에 시각이 없을 때 같은 날 안의 순서만 정하는 용도라
// 하루(1440분)를 넘지 않게 999 까지만 의미를 둔다.
const SERIES_STEP_MS = 60 * 1000;

/** 글의 발행 시각(ms). 목록·페이저가 공유하는 단 하나의 시간 축. */
export function publishedAt(post: BlogPostLike): number {
	const order = Math.min(post.data.seriesOrder ?? 0, 999);
	return post.data.pubDate.valueOf() + order * SERIES_STEP_MS;
}

function compareChrono(a: BlogPostLike, b: BlogPostLike): number {
	const diff = publishedAt(a) - publishedAt(b);
	if (diff !== 0) return diff;
	return (a.id ?? '').localeCompare(b.id ?? '');
}

/** 목록용: 최신 글 먼저. 같은 날이면 나중에 올린 글이 위. */
export function sortBlogPosts<T extends BlogPostLike>(posts: T[]): T[] {
	return [...posts].sort((a, b) => compareChrono(b, a));
}

/** 페이저용: 오래된 글 먼저. 다음 글 = 시간상 더 나중 글. */
export function getReadingOrderPosts<T extends BlogPostLike>(posts: T[]): T[] {
	return [...posts].sort(compareChrono);
}
