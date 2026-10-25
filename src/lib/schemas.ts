import { z } from 'zod';
import { themes } from './themes';

export const assignmentTypes = [
  'midterm',
  'final',
  'weekly_quiz',
  'monthly_quiz',
  'homework',
] as const;
export const efforts = ['small', 'medium', 'large', 'unknown'] as const;
export const statuses = ['not_started', 'in_progress', 'completed'] as const;
export const labels: Record<string, string> = {
  midterm: 'Midterm',
  final: 'Final',
  weekly_quiz: 'Weekly Quiz',
  monthly_quiz: 'Monthly Quiz',
  homework: 'Homework',
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  unknown: 'I’m Not Sure',
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
};
export const themeSchema = z.enum(themes.map((t) => t.id));
export const timezoneSchema = z
  .string()
  .max(80)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, 'Choose a valid IANA timezone.');
export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Use at least 3 characters.')
  .max(24)
  .regex(/^[a-zA-Z0-9_]+$/, 'Use letters, numbers, and underscores.');
export const passwordSchema = z
  .string()
  .min(12, 'Use at least 12 characters.')
  .max(128)
  .regex(/[a-z]/, 'Include a lowercase letter.')
  .regex(/[A-Z]/, 'Include an uppercase letter.')
  .regex(/[0-9]/, 'Include a number.');
export const signupSchema = z
  .object({
    email: z.email().max(254),
    username: usernameSchema,
    password: passwordSchema,
    confirm_password: z.string(),
    selected_theme: themeSchema,
    timezone: timezoneSchema,
  })
  .refine((v) => v.password === v.confirm_password, {
    path: ['confirm_password'],
    message: 'Your passwords don’t match.',
  });
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const d = new Date(`${value}T12:00:00Z`);
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
  }, 'Enter a valid calendar date.');
const optionalMinutes = z.preprocess(
  (v) => (v === '' || v == null ? null : Number(v)),
  z.number().int().min(1).max(60000).nullable(),
);
const requiredNumber = (minimum: number, maximum: number) =>
  z.preprocess(
    (v) => (v === '' || v == null ? NaN : Number(v)),
    z.number().min(minimum).max(maximum),
  );
export const assignmentSchema = z.object({
  title: z.string().trim().min(1, 'Give your assignment a name.').max(160),
  course_id: z.uuid(),
  description: z.string().trim().max(2000).default(''),
  assignment_type: z.enum(assignmentTypes),
  due_date: dateSchema,
  due_time: z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable(),
  ),
  grade_weight: requiredNumber(0, 100),
  effort_level: z.enum(efforts),
  estimated_minutes: optionalMinutes,
});
export const sessionSchema = z.object({
  available_minutes: requiredNumber(1, 720).pipe(z.number().int()),
});
export const blockSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    end_time: z.string().regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/),
  })
  .refine((b) => b.start_time !== b.end_time, 'Start and end times must differ.');
export const scheduleSchema = z.array(blockSchema).max(70);
export type Block = z.infer<typeof blockSchema>;
export type AssignmentInput = z.infer<typeof assignmentSchema>;
export function errorMessage(error: z.ZodError) {
  return error.issues.map((i) => `${i.path.join(' ')}: ${i.message}`).join(' ');
}
