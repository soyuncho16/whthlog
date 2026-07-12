import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { isValidSubsection } from './lib/taxonomy';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z
			.object({
				title: z.string(),
				description: z.string().optional(),
				// Transform string to Date object
				pubDate: z.coerce.date(),
				updatedDate: z.coerce.date().optional(),
				heroImage: z.optional(image()),
				// 부문 분류 (기본값으로 최소 frontmatter·기존 글 비파괴)
				section: z.enum(['cs', 'dev', 'paper']).default('cs'),
				subsection: z.string().default('troubleshooting'),
				// CS-렌즈 트러블슈팅 필드 (전부 optional — 일반 글도 허용)
				cs_area: z
					.array(z.enum(['os', 'arch', 'network', 'data-structures', 'algorithms']))
					.optional(),
				concept: z.array(z.string()).optional(),
				status: z.enum(['resolved', 'partial', 'resolved-negative']).optional(),
				stack: z.array(z.string()).optional(),
			})
			.superRefine((data, ctx) => {
				if (!isValidSubsection(data.section, data.subsection)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: `subsection "${data.subsection}" is not valid for section "${data.section}"`,
						path: ['subsection'],
					});
				}
			}),
});

export const collections = { blog };
