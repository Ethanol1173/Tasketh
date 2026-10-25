-- Harden Tasketh's user-owned tables: RLS does not protect TRUNCATE.
-- Keep SELECT, INSERT, UPDATE and DELETE for authenticated sessions.
revoke truncate, trigger, references on table
  public.profiles,
  public.courses,
  public.assignments,
  public.weekly_availability,
  public.tasketh_recommendation_limits
from anon, authenticated;
