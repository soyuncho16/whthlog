/** 한국어 본문 기준 대략적인 읽기 시간(분). 코드/수식/마크다운 문법 제거 후 글자 수 / cpm, 최소 1. */
export function readingTime(body: string | undefined, cpm = 500): number {
	if (!body) return 1;
	const text = body
		.replace(/```[\s\S]*?```/g, ' ') // 코드블록
		.replace(/`[^`]*`/g, ' ') // 인라인 코드
		.replace(/\$\$[\s\S]*?\$\$/g, ' ') // 블록 수식
		.replace(/\$[^$\n]+\$/g, ' ') // 인라인 수식
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 이미지
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 링크는 텍스트만
		.replace(/[#>*_~|`-]/g, ' ') // 마크다운 기호
		.replace(/\s+/g, ''); // 공백 제거 후 글자 수
	return Math.max(1, Math.round(text.length / cpm));
}
