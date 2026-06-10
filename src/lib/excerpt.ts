/** 마크다운 본문에서 메타 설명용 발췌문을 뽑는다 (description frontmatter 부재 시 fallback). */
export function excerpt(body: string | undefined, max = 150): string {
	if (!body) return '';
	const text = body
		.replace(/```[\s\S]*?```/g, ' ') // 코드블록 제거
		.replace(/\$\$[\s\S]*?\$\$/g, ' ') // 블록 수식 제거
		.replace(/\$[^$\n]+\$/g, ' ') // 인라인 수식 제거
		.replace(/^#+\s.*$/gm, ' ') // 헤딩 제거
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 이미지 제거
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 링크는 텍스트만
		.replace(/[*_`>#~|]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	return text.slice(0, max);
}
