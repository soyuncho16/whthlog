import { describe, expect, it } from 'vitest';
import {
	SECTIONS,
	CS_AREAS,
	sectionByKey,
	sectionLabel,
	subsectionLabel,
	areaMeta,
	areaLabel,
	isValidSubsection,
} from './taxonomy';

describe('taxonomy SECTIONS', () => {
	it('lists cs, dev, paper in order', () => {
		expect(SECTIONS.map((s) => s.key)).toEqual(['cs', 'dev', 'paper']);
	});
	it('cs has troubleshooting + study subsections', () => {
		const cs = sectionByKey('cs');
		expect(cs?.subsections.map((s) => s.key)).toEqual(['troubleshooting', 'study']);
	});
});

describe('taxonomy CS_AREAS', () => {
	it('keeps fixed key order and labels', () => {
		expect(CS_AREAS.map((a) => a.key)).toEqual([
			'os',
			'arch',
			'network',
			'data-structures',
			'algorithms',
		]);
		expect(areaLabel('data-structures')).toBe('ds');
		expect(areaLabel('algorithms')).toBe('algo');
	});
	it('maps each area to a css var', () => {
		expect(areaMeta('os')?.cssVar).toBe('--area-os');
		expect(areaMeta('data-structures')?.cssVar).toBe('--area-data-structures');
	});
});

describe('taxonomy lookups', () => {
	it('resolves labels with fallback to the raw key', () => {
		expect(sectionLabel('cs')).toBe('CS');
		expect(sectionLabel('unknown')).toBe('unknown');
		expect(subsectionLabel('cs', 'troubleshooting')).toBe('트러블슈팅');
		expect(subsectionLabel('cs', 'nope')).toBe('nope');
	});
	it('validates subsection membership per section', () => {
		expect(isValidSubsection('cs', 'troubleshooting')).toBe(true);
		expect(isValidSubsection('cs', 'review')).toBe(false);
		expect(isValidSubsection('paper', 'review')).toBe(true);
		expect(isValidSubsection('ghost', 'x')).toBe(false);
	});
});
