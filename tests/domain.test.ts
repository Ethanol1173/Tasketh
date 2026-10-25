import { describe, expect, it } from 'vitest';
import { assignmentSchema, signupSchema, sessionSchema, dateSchema } from '@/lib/schemas';
import { splitAndValidateBlocks, deadlineInstant, displayDeadline } from '@/lib/time';
import {
  fallbackRecommendation,
  rankAssignments,
  suitabilityScore,
  urgencyScore,
  validateRecommendation,
} from '@/lib/recommendations/scoring';
import { assignment, firstId, secondId } from './fixtures';
const now = new Date('2026-10-25T12:00:00Z');
describe('registration validation', () => {
  const valid = {
    email: 'student@example.com',
    username: 'ethan',
    password: 'StudyFocus123!',
    confirm_password: 'StudyFocus123!',
    selected_theme: 'obsidian',
    timezone: 'Asia/Taipei',
  };
  it('accepts complete registration and rejects mismatched passwords', () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
    expect(signupSchema.safeParse({ ...valid, confirm_password: 'other' }).success).toBe(false);
  });
  it('rejects weak passwords, invalid usernames and timezones', () => {
    for (const change of [
      { password: '123' },
      { username: 'bad name' },
      { timezone: 'Mars/Olympus' },
    ])
      expect(signupSchema.safeParse({ ...valid, ...change }).success).toBe(false);
  });
});
describe('assignment and session validation', () => {
  const valid = {
    ...assignment(),
    grade_weight: '15',
    estimated_minutes: '',
    description: '',
    due_time: '',
  };
  it('allows estimated weight and no exact duration', () => {
    expect(assignmentSchema.parse(valid)).toMatchObject({
      grade_weight: 15,
      estimated_minutes: null,
      due_time: null,
    });
  });
  it('requires weight, effort, title, course and real dates', () => {
    for (const change of [
      { grade_weight: '' },
      { grade_weight: 101 },
      { grade_weight: -1 },
      { effort_level: '' },
      { title: '  ' },
      { course_id: '' },
      { due_date: '2026-02-30' },
      { estimated_minutes: -1 },
    ])
      expect(assignmentSchema.safeParse({ ...valid, ...change }).success).toBe(false);
  });
  it('accepts valid leap dates and bounds current minutes', () => {
    expect(dateSchema.safeParse('2028-02-29').success).toBe(true);
    for (const value of [0, -1, 721, 1.5, ''])
      expect(sessionSchema.safeParse({ available_minutes: value }).success).toBe(false);
    expect(sessionSchema.parse({ available_minutes: 30 }).available_minutes).toBe(30);
  });
});
describe('timezone-aware deadlines and recurring availability', () => {
  it('uses end of day in the profile timezone', () => {
    expect(deadlineInstant('2026-10-25', null, 'Asia/Taipei').toISOString()).toBe(
      '2026-10-25T15:59:59.000Z',
    );
  });
  it('renders deadlines without a specified due time as a literal end-of-day label', () => {
    expect(displayDeadline('2026-10-25', null, 'Asia/Taipei')).toBe(
      'Oct 25, 2026 · end of day',
    );
  });
  it('renders deadlines with an explicit due time', () => {
    expect(displayDeadline('2026-10-25', '12:00', 'Asia/Taipei')).toBe(
      'Oct 25, 2026 · 12:00 PM',
    );
  });
  it('handles a daylight-saving timezone', () => {
    expect(deadlineInstant('2026-07-01', '12:00', 'America/New_York').toISOString()).toBe(
      '2026-07-01T16:00:00.000Z',
    );
  });
  it('splits Sunday overnight into Monday without zero-length blocks', () => {
    expect(
      splitAndValidateBlocks([{ weekday: 6, start_time: '22:00', end_time: '02:00' }]),
    ).toEqual([
      { weekday: 0, start_time: '00:00', end_time: '02:00' },
      { weekday: 6, start_time: '22:00', end_time: '24:00' },
    ]);
    expect(
      splitAndValidateBlocks([{ weekday: 0, start_time: '22:00', end_time: '00:00' }]),
    ).toHaveLength(1);
  });
  it('allows adjacent blocks and rejects overlap including overnight', () => {
    expect(
      splitAndValidateBlocks([
        { weekday: 0, start_time: '09:00', end_time: '10:00' },
        { weekday: 0, start_time: '10:00', end_time: '11:00' },
      ]),
    ).toHaveLength(2);
    expect(() =>
      splitAndValidateBlocks([
        { weekday: 6, start_time: '23:00', end_time: '02:00' },
        { weekday: 0, start_time: '01:00', end_time: '03:00' },
      ]),
    ).toThrow('overlap');
    expect(() =>
      splitAndValidateBlocks([{ weekday: 0, start_time: '09:00', end_time: '09:00' }]),
    ).toThrow();
  });
});
describe('deterministic priorities', () => {
  it('implements documented urgency buckets', () => {
    expect([-1, 24, 48, 72, 168, 336, 400].map(urgencyScore)).toEqual([
      100, 95, 85, 75, 60, 40, 20,
    ]);
  });
  it('treats unknown neutrally and keeps long assignments eligible', () => {
    expect(suitabilityScore(assignment({ effort_level: 'unknown' }), 15)).toBe(60);
    expect(
      fallbackRecommendation(
        [assignment({ estimated_minutes: 600, effort_level: 'large' })],
        15,
        'UTC',
        now,
      )?.suggested_minutes,
    ).toBe(15);
  });
  it('balances factors rather than always choosing the nearest deadline', () => {
    const a = assignment({ grade_weight: 0, due_date: '2026-10-25' });
    const b = assignment({ id: secondId, grade_weight: 90, due_date: '2026-10-27' });
    expect(rankAssignments([a, b], 30, 'UTC', now)[0].assignment.id).toBe(secondId);
  });
  it('does not boost any assignment type', () => {
    expect(
      rankAssignments(
        [assignment(), assignment({ id: secondId, assignment_type: 'final' })],
        30,
        'UTC',
        now,
      ).map((r) => r.score)[0],
    ).toBe(rankAssignments([assignment()], 30, 'UTC', now)[0].score);
  });
  it('excludes completed work and consistently breaks ties', () => {
    expect(
      fallbackRecommendation([assignment({ status: 'completed' })], 30, 'UTC', now),
    ).toBeNull();
    expect(
      rankAssignments([assignment({ id: secondId }), assignment()], 30, 'UTC', now)[0].assignment
        .id,
    ).toBe(firstId);
  });
  it('labels fallback honestly without claiming the task will be finished', () => {
    const result = fallbackRecommendation([assignment()], 30, 'UTC', now)!;
    expect(result.source).toBe('fallback');
    expect(result.suggested_action).toContain('30 minutes');
  });
});
describe('provider output validation', () => {
  const valid = {
    recommended_assignment_id: firstId,
    reason: 'This balances urgency and grade impact.',
    suggested_action: 'Review requirements and start one manageable part.',
    suggested_minutes: 30,
    alternative_assignment_id: null,
    alternative_reason: null,
  };
  it('accepts an eligible recommendation', () =>
    expect(validateRecommendation(valid, [assignment()], 30)).toEqual(valid));
  it('rejects invented IDs, completed work, excess time, invalid alternatives and extra fields', () => {
    for (const change of [
      { recommended_assignment_id: secondId },
      { suggested_minutes: 31 },
      { suggested_minutes: 0 },
      { alternative_assignment_id: firstId, alternative_reason: 'Another task to try.' },
      { alternative_assignment_id: secondId, alternative_reason: 'Another task to try.' },
      { alternative_reason: 'Reason without an ID.' },
      { reason: '' },
      { secret: 'unexpected' },
    ])
      expect(validateRecommendation({ ...valid, ...change }, [assignment()], 30)).toBeNull();
    expect(validateRecommendation(valid, [assignment({ status: 'completed' })], 30)).toBeNull();
  });
});
