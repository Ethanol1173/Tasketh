import type { Theme } from './themes';
import type { assignmentTypes, efforts, statuses } from './schemas';

export type Profile = {
  id: string;
  username: string;
  selected_theme: Theme;
  custom_background: string | null;
  timezone: string;
  onboarding_completed: boolean;
  onboarding_step: number;
  created_at: string;
  updated_at: string;
};
export type Course = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};
export type Assignment = {
  id: string;
  user_id: string;
  course_id: string;
  title: string;
  description: string | null;
  assignment_type: (typeof assignmentTypes)[number];
  due_date: string;
  due_time: string | null;
  grade_weight: number;
  effort_level: (typeof efforts)[number];
  estimated_minutes: number | null;
  status: (typeof statuses)[number];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};
export type Availability = {
  id: string;
  user_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
};
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
type Table<T, Required extends keyof T> = {
  Row: T;
  Insert: Pick<T, Required> & Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};
export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, 'id' | 'username'>;
      courses: Table<Course, 'user_id' | 'name'>;
      assignments: Table<
        Assignment,
        | 'user_id'
        | 'course_id'
        | 'title'
        | 'assignment_type'
        | 'due_date'
        | 'grade_weight'
        | 'effort_level'
      >;
      weekly_availability: Table<Availability, 'user_id' | 'weekday' | 'start_time' | 'end_time'>;
    };
    Views: Record<string, never>;
    Functions: {
      tasketh_username_available: { Args: { p_username: string }; Returns: boolean };
      replace_weekly_availability: {
        Args: { p_blocks: Json; p_advance?: boolean };
        Returns: undefined;
      };
      reserve_recommendation: { Args: { p_key: string }; Returns: Json };
      complete_recommendation: { Args: { p_key: string; p_result: Json }; Returns: undefined };
      finish_onboarding: { Args: Record<string, never>; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
