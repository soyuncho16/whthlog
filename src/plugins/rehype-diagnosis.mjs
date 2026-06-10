import { visit } from 'unist-util-visit';

/**
 * `> **내 진단** ...` blockquote 에 class="diagnosis" 를 부여한다.
 * 별도 문법을 만들지 않으므로 같은 마크다운이 벨로그/GitHub 에선
 * 평범한 인용문으로 자연 강등된다.
 */
export default function rehypeDiagnosis() {
	return (tree) => {
		visit(tree, 'element', (node) => {
			if (node.tagName !== 'blockquote') return;
			const firstP = node.children.find(
				(c) => c.type === 'element' && c.tagName === 'p',
			);
			if (!firstP) return;
			const firstStrong = firstP.children.find(
				(c) => c.type === 'element' && c.tagName === 'strong',
			);
			if (!firstStrong) return;
			const label = (firstStrong.children?.[0]?.value ?? '').trim();
			if (label !== '내 진단') return;
			node.properties ??= {};
			node.properties.className = [
				...(node.properties.className ?? []),
				'diagnosis',
			];
		});
	};
}
