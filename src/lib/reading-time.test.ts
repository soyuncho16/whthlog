import { describe, expect, it } from 'vitest';
import { readingTime } from './reading-time';

describe('readingTime', () => {
	it('returns at least 1 minute for empty/short input', () => {
		expect(readingTime(undefined)).toBe(1);
		expect(readingTime('')).toBe(1);
		expect(readingTime('짧은 글')).toBe(1);
	});
	it('scales by character count (~500 cpm)', () => {
		expect(readingTime('가'.repeat(1000))).toBe(2);
		expect(readingTime('가'.repeat(2500))).toBe(5);
	});
	it('ignores code fences, math, and markdown syntax', () => {
		const body = '```\n' + 'x'.repeat(5000) + '\n```\n' + '본문 열 글자입니다';
		expect(readingTime(body)).toBe(1);
	});
});
