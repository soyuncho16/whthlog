import { describe, expect, it } from 'vitest';
import { countBySubsection } from './stats';

const posts = [
	{ data: { concept: ['IPC', 'mutex'], section: 'cs', subsection: 'troubleshooting' } },
	{ data: { concept: ['mutex', 'lock-file'], section: 'cs', subsection: 'troubleshooting' } },
	{ data: { concept: [], section: 'cs', subsection: 'study' } },
];

describe('countBySubsection', () => {
	it('keys by section/subsection', () => {
		expect(countBySubsection(posts)).toEqual({
			'cs/troubleshooting': 2,
			'cs/study': 1,
		});
	});
});
