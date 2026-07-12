/** 대/소분류·cs_area 단일 설정. 부문 추가는 여기 한 곳만 고친다. */

export type SectionKey = 'cs' | 'dev' | 'paper';
export type CsAreaKey = 'os' | 'arch' | 'network' | 'data-structures' | 'algorithms';

export interface Subsection {
	key: string;
	label: string;
}
export interface Section {
	key: SectionKey;
	label: string;
	blurb: string;
	subsections: Subsection[];
}
export interface CsArea {
	key: CsAreaKey;
	label: string;
	cssVar: string;
}

export const SECTIONS: Section[] = [
	{
		key: 'cs',
		label: 'CS',
		blurb: 'CS 기초로 되짚어 푼 트러블슈팅과 공부 기록',
		subsections: [
			{ key: 'troubleshooting', label: '트러블슈팅' },
			{ key: 'study', label: '공부' },
		],
	},
	{
		key: 'dev',
		label: 'Dev',
		blurb: '개발하며 남기는 회고와 진행 로그',
		subsections: [
			{ key: 'retro', label: '회고' },
			{ key: 'log', label: '진행 로그' },
		],
	},
	{
		key: 'paper',
		label: 'paper',
		blurb: '읽은 논문 리뷰',
		subsections: [{ key: 'review', label: '리뷰' }],
	},
];

export const CS_AREAS: CsArea[] = [
	{ key: 'os', label: 'os', cssVar: '--area-os' },
	{ key: 'arch', label: 'arch', cssVar: '--area-arch' },
	{ key: 'network', label: 'network', cssVar: '--area-network' },
	{ key: 'data-structures', label: 'ds', cssVar: '--area-data-structures' },
	{ key: 'algorithms', label: 'algo', cssVar: '--area-algorithms' },
];

const SECTION_BY_KEY = new Map(SECTIONS.map((s) => [s.key, s]));
const AREA_BY_KEY = new Map(CS_AREAS.map((a) => [a.key, a]));

export function sectionByKey(key: string): Section | undefined {
	return SECTION_BY_KEY.get(key as SectionKey);
}
export function sectionLabel(key: string): string {
	return SECTION_BY_KEY.get(key as SectionKey)?.label ?? key;
}
export function subsectionLabel(sectionKey: string, subKey: string): string {
	const s = SECTION_BY_KEY.get(sectionKey as SectionKey);
	return s?.subsections.find((x) => x.key === subKey)?.label ?? subKey;
}
export function areaMeta(key: string): CsArea | undefined {
	return AREA_BY_KEY.get(key as CsAreaKey);
}
export function areaLabel(key: string): string {
	return AREA_BY_KEY.get(key as CsAreaKey)?.label ?? key;
}
export function isValidSubsection(sectionKey: string, subKey: string): boolean {
	const s = SECTION_BY_KEY.get(sectionKey as SectionKey);
	return !!s && s.subsections.some((x) => x.key === subKey);
}
