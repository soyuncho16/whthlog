type BlogPostLike = {
	id?: string;
	data: {
		pubDate: Date;
		seriesOrder?: number;
	};
};

export function sortBlogPosts<T extends BlogPostLike>(posts: T[]): T[] {
	return [...posts].sort((a, b) => {
		const dateDiff = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
		if (dateDiff !== 0) return dateDiff;

		const aOrder = a.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
		const bOrder = b.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
		if (aOrder !== bOrder) return aOrder - bOrder;

		return (a.id ?? '').localeCompare(b.id ?? '');
	});
}

export function getReadingOrderPosts<T extends BlogPostLike>(posts: T[]): T[] {
	return [...posts].sort((a, b) => {
		const dateDiff = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
		if (dateDiff !== 0) return dateDiff;

		const aOrder = a.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
		const bOrder = b.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
		if (aOrder !== bOrder) return aOrder - bOrder;

		return (a.id ?? '').localeCompare(b.id ?? '');
	});
}
