import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			// CS-렌즈 트러블슈팅 필드 (전부 optional — 일반 글도 허용)
			cs_area: z.array(z.enum(['os', 'arch', 'network', 'data-structures', 'algorithms'])).optional(),
			concept: z.array(z.string()).optional(),
			status: z.enum(['resolved', 'partial', 'resolved-negative']).optional(),
			stack: z.array(z.string()).optional(),
		}),
});

export const collections = { blog };
