import type { Assignment } from '@/lib/database.types';
export const firstId = '00000000-0000-4000-8000-000000000001';
export const secondId = '00000000-0000-4000-8000-000000000002';
export function assignment(overrides: Partial<Assignment> = {}): Assignment {
  return {
    id: firstId,
    user_id: '00000000-0000-4000-8000-000000000010',
    course_id: '00000000-0000-4000-8000-000000000020',
    title: 'Statistics homework',
    description: null,
    assignment_type: 'homework',
    due_date: '2026-10-26',
    due_time: null,
    grade_weight: 15,
    effort_level: 'medium',
    estimated_minutes: null,
    status: 'not_started',
    completed_at: null,
    created_at: '2026-10-25T00:00:00Z',
    updated_at: '2026-10-25T00:00:00Z',
    ...overrides,
  };
}
