import { describe, expect, it } from 'vitest';
import { computeStats, countBySubsection } from './stats';

const posts = [
	{ data: { concept: ['IPC', 'mutex'], section: 'cs', subsection: 'troubleshooting' } },
	{ data: { concept: ['mutex', 'lock-file'], section: 'cs', subsection: 'troubleshooting' } },
	{ data: { concept: [], section: 'cs', subsection: 'study' } },
];

describe('computeStats', () => {
	it('counts posts, unique concepts, and configured sections', () => {
		const s = computeStats(posts);
		expect(s.postCount).toBe(3);
		expect(s.conceptCount).toBe(3); // IPC, mutex, lock-file
		expect(s.sectionCount).toBe(3); // cs, dev, paper (configured)
	});
});

describe('countBySubsection', () => {
	it('keys by section/subsection', () => {
		expect(countBySubsection(posts)).toEqual({
			'cs/troubleshooting': 2,
			'cs/study': 1,
		});
	});
});
