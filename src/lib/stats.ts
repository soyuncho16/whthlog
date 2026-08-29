export interface PostLike {
	data: { concept?: string[]; section?: string; subsection?: string };
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
