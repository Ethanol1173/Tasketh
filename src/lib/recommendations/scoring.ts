import type { Assignment } from '../database.types';
import { deadlineInstant } from '../time';
import { z } from 'zod';

export const weights = { urgency: 0.5, grade: 0.35, suitability: 0.15 } as const;
export function urgencyScore(hours: number) {
  if (hours < 0) return 100;
  if (hours <= 24) return 95;
  if (hours <= 48) return 85;
  if (hours <= 72) return 75;
  if (hours <= 168) return 60;
  if (hours <= 336) return 40;
  return 20;
}
// Broad effort assumptions, not predictions of completion time. Unknown stays neutral.
export function suitabilityScore(assignment: Assignment, minutes: number) {
  if (assignment.estimated_minutes)
    return minutes >= assignment.estimated_minutes
      ? 100
      : Math.max(40, Math.round((100 * minutes) / assignment.estimated_minutes));
  if (assignment.effort_level === 'unknown') return 60;
  const values = { small: [90, 95, 100], medium: [60, 80, 95], large: [45, 65, 85] };
  return values[assignment.effort_level][minutes < 30 ? 0 : minutes < 60 ? 1 : 2];
}
export function rankAssignments(
  assignments: Assignment[],
  minutes: number,
  timezone: string,
  now = new Date(),
) {
  return assignments
    .filter((a) => a.status !== 'completed')
    .map((assignment) => {
      const deadline = deadlineInstant(
        assignment.due_date,
        assignment.due_time,
        timezone,
      ).getTime();
      if (!Number.isFinite(deadline)) throw new Error('Invalid assignment deadline.');
      const urgency = urgencyScore((deadline - now.getTime()) / 3600000);
      const suitability = suitabilityScore(assignment, minutes);
      return {
        assignment,
        deadline,
        urgency,
        suitability,
        score:
          weights.urgency * urgency +
          weights.grade * assignment.grade_weight +
          weights.suitability * suitability,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.deadline - b.deadline ||
        b.assignment.grade_weight - a.assignment.grade_weight ||
        a.assignment.id.localeCompare(b.assignment.id),
    );
}
export const recommendationSchema = z
  .object({
    recommended_assignment_id: z.uuid(),
    reason: z.string().trim().min(10).max(700),
    suggested_action: z.string().trim().min(10).max(500),
    suggested_minutes: z.number().int().min(1).max(720),
    alternative_assignment_id: z.uuid().nullable(),
    alternative_reason: z.string().trim().min(10).max(400).nullable(),
  })
  .strict();
export type Recommendation = z.infer<typeof recommendationSchema> & {
  source: 'gemini' | 'fallback';
};
export function validateRecommendation(value: unknown, candidates: Assignment[], minutes: number) {
  const parsed = recommendationSchema.safeParse(value);
  if (!parsed.success) return null;
  const result = parsed.data;
  const ids = new Set(candidates.filter((a) => a.status !== 'completed').map((a) => a.id));
  if (!ids.has(result.recommended_assignment_id) || result.suggested_minutes > minutes) return null;
  if (
    result.alternative_assignment_id &&
    (!ids.has(result.alternative_assignment_id) ||
      result.alternative_assignment_id === result.recommended_assignment_id)
  )
    return null;
  if (!!result.alternative_assignment_id !== !!result.alternative_reason) return null;
  return result;
}
export function fallbackRecommendation(
  assignments: Assignment[],
  minutes: number,
  timezone: string,
  now = new Date(),
): Recommendation | null {
  const ranked = rankAssignments(assignments, minutes, timezone, now);
  if (!ranked.length) return null;
  const { assignment: first, deadline } = ranked[0];
  const overdue = deadline < now.getTime();
  return {
    source: 'fallback',
    recommended_assignment_id: first.id,
    reason: `${overdue ? 'This deadline has passed' : 'This assignment balances deadline urgency with academic impact'}; its estimated grade weight is ${first.grade_weight}%. A focused session can help you ${first.status === 'in_progress' ? 'keep moving' : 'get started'} without needing to finish everything now.`,
    suggested_action: `Spend ${minutes} minutes ${first.status === 'in_progress' ? 'reviewing where you left off and continuing the next manageable part' : 'reviewing the requirements, choosing a manageable part, and beginning focused work'}. Leave a short note about your next step.`,
    suggested_minutes: minutes,
    alternative_assignment_id: ranked[1]?.assignment.id ?? null,
    alternative_reason: ranked[1]
      ? 'Another useful option based on its deadline, estimated grade impact, and fit for this session.'
      : null,
  };
}
