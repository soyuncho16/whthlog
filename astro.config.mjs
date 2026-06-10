// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeDiagnosis from './src/plugins/rehype-diagnosis.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://soyuncho16.github.io',
	base: '/whthlog',
	integrations: [mdx(), sitemap()],
	markdown: {
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatex, rehypeDiagnosis],
		shikiConfig: {
			themes: { light: 'github-light', dark: 'github-dark-dimmed' },
		},
	},
});
