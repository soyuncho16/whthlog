import { SECTIONS } from './taxonomy';

export interface PostLike {
	data: { concept?: string[]; section?: string; subsection?: string };
}
export interface Stats {
	postCount: number;
	conceptCount: number;
	sectionCount: number;
}

export function computeStats(posts: PostLike[]): Stats {
	const concepts = new Set<string>();
	for (const p of posts) for (const c of p.data.concept ?? []) concepts.add(c);
	return {
		postCount: posts.length,
		conceptCount: concepts.size,
		sectionCount: SECTIONS.length,
	};
}

export function conceptCloud(posts: PostLike[]): { concept: string; count: number }[] {
	const counts = new Map<string, number>();
	for (const p of posts)
		for (const c of p.data.concept ?? []) counts.set(c, (counts.get(c) ?? 0) + 1);
	return [...counts.entries()]
		.map(([concept, count]) => ({ concept, count }))
		.sort((a, b) => b.count - a.count || a.concept.localeCompare(b.concept));
}

export function countBySubsection(posts: PostLike[]): Record<string, number> {
	const out: Record<string, number> = {};
	for (const p of posts) {
		if (!p.data.section || !p.data.subsection) continue;
		const key = `${p.data.section}/${p.data.subsection}`;
		out[key] = (out[key] ?? 0) + 1;
	}
	return out;
}
