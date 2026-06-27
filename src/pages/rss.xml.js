import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { excerpt } from '../lib/excerpt';
import { base } from '../lib/url';

export async function GET(context) {
	const posts = await getCollection('blog');
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		// base 포함 블로그 홈으로 채널 link 고정. item 링크는 절대경로(/whthlog/...)라 그대로 정상 해석.
		site: new URL(base, context.site),
		items: posts.map((post) => ({
			title: post.data.title,
			pubDate: post.data.pubDate,
			description: post.data.description ?? excerpt(post.body),
			link: `${base}blog/${post.id}/`,
		})),
	});
}
