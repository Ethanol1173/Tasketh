-- Candidate initial migration. Inspect the existing remote schema before applying.
-- Refuse collisions rather than silently adopting or overwriting existing tables.
begin;
do $$
declare object_name text;
begin
  foreach object_name in array array['profiles','courses','assignments','weekly_availability','tasketh_recommendation_limits'] loop
    if to_regclass('public.' || object_name) is not null then
      raise exception 'Existing public.% detected. Inspect and adapt this migration to preserve existing data.', object_name;
    end if;
  end loop;
end $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[a-zA-Z0-9_]{3,24}$'),
  selected_theme text not null default 'obsidian' check (selected_theme in ('obsidian','midnight','plum','forest','rose','ivory')),
  custom_background text check (custom_background is null or custom_background ~ '^#[a-fA-F0-9]{6}$'),
  timezone text not null default 'UTC',
  onboarding_completed boolean not null default false,
  onboarding_step integer not null default 1 check (onboarding_step between 1 and 3),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index profiles_username_ci on public.profiles (lower(username));

-- Registration can check availability without reading private profile rows.
-- The unique index remains the authority for simultaneous sign-up attempts.
create function public.tasketh_username_available(p_username text) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_username ~ '^[a-zA-Z0-9_]{3,24}$'
    and not exists(select 1 from public.profiles where lower(username) = lower(p_username));
$$;
revoke all on function public.tasketh_username_available(text) from public;
grant execute on function public.tasketh_username_available(text) to anon, authenticated;

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, id)
);
create unique index courses_user_name_ci on public.courses(user_id, lower(name));

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null,
  title text not null check (length(trim(title)) between 1 and 160),
  description text check (length(description) <= 2000),
  assignment_type text not null check (assignment_type in ('midterm','final','weekly_quiz','monthly_quiz','homework')),
  due_date date not null, due_time time,
  grade_weight numeric(5,2) not null check (grade_weight between 0 and 100),
  effort_level text not null check (effort_level in ('small','medium','large','unknown')),
  estimated_minutes integer check (estimated_minutes between 1 and 60000),
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (user_id, course_id) references public.courses(user_id, id) on delete restrict,
  check (due_time is null or due_time < time '24:00'),
  check ((status = 'completed') = (completed_at is not null))
);
create index assignments_user_status_deadline on public.assignments(user_id,status,due_date);
create index assignments_course on public.assignments(user_id,course_id);

-- Overnight input is split atomically into adjacent day blocks before insertion.
create table public.weekly_availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  start_time time not null, end_time time not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (start_time < end_time)
);
create index weekly_availability_user_day on public.weekly_availability(user_id,weekday,start_time);

create function public.tasketh_touch_row() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if tg_table_name = 'assignments' then
    if new.status = 'completed' then new.completed_at := coalesce(new.completed_at, now());
    else new.completed_at := null; end if;
  end if;
  if tg_table_name = 'profiles' then
    if not exists (select 1 from pg_timezone_names where name = new.timezone) then
      raise exception 'Invalid timezone';
    end if;
  end if;
  return new;
end $$;
create trigger touch_profiles before insert or update on public.profiles for each row execute function public.tasketh_touch_row();
create trigger touch_courses before update on public.courses for each row execute function public.tasketh_touch_row();
create trigger touch_assignments before insert or update on public.assignments for each row execute function public.tasketh_touch_row();
create trigger touch_availability before update on public.weekly_availability for each row execute function public.tasketh_touch_row();

create function public.tasketh_handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, username, selected_theme, timezone)
  values (new.id, trim(new.raw_user_meta_data->>'username'),
    coalesce(new.raw_user_meta_data->>'selected_theme','obsidian'),
    coalesce(new.raw_user_meta_data->>'timezone','UTC'));
  return new;
end $$;
create trigger tasketh_auth_user_created after insert on auth.users for each row execute function public.tasketh_handle_new_user();

create function public.tasketh_check_availability() returns trigger language plpgsql set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
  if exists (select 1 from public.weekly_availability a where a.user_id = new.user_id
    and a.weekday = new.weekday and a.id <> new.id
    and a.start_time < new.end_time and new.start_time < a.end_time) then
    raise exception 'Study blocks overlap';
  end if;
  return new;
end $$;
create trigger check_availability before insert or update on public.weekly_availability for each row execute function public.tasketh_check_availability();

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.assignments enable row level security;
alter table public.weekly_availability enable row level security;
create policy profiles_select on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy courses_owner on public.courses for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy assignments_owner on public.assignments for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy availability_owner on public.weekly_availability for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.courses, public.assignments, public.weekly_availability to authenticated;
revoke all on public.profiles, public.courses, public.assignments, public.weekly_availability from anon;

create function public.replace_weekly_availability(p_blocks jsonb, p_advance boolean default false)
returns void language plpgsql security invoker set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(p_blocks) <> 'array' or jsonb_array_length(p_blocks) > 140 then raise exception 'Invalid schedule'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  delete from public.weekly_availability where user_id = uid;
  insert into public.weekly_availability(user_id,weekday,start_time,end_time)
    select uid, (b->>'weekday')::integer, (b->>'start_time')::time, (b->>'end_time')::time
    from jsonb_array_elements(p_blocks) b;
  if p_advance then update public.profiles set onboarding_step = greatest(onboarding_step,2) where id = uid; end if;
end $$;

-- Shared PostgreSQL rate limiter, in-flight lock and short-lived duplicate cache.
-- Accessible only through authenticated, identity-bound SECURITY DEFINER functions.
create table public.tasketh_recommendation_limits (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  window_started_at timestamptz not null default now(), request_count integer not null default 0,
  last_request_key text, cached_result jsonb, cached_at timestamptz, pending_until timestamptz
);
alter table public.tasketh_recommendation_limits enable row level security;
revoke all on public.tasketh_recommendation_limits from anon, authenticated;

create function public.reserve_recommendation(p_key text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); quota public.tasketh_recommendation_limits%rowtype;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if length(p_key) <> 64 then raise exception 'Invalid request key'; end if;
  insert into public.tasketh_recommendation_limits(user_id) values(uid) on conflict do nothing;
  select * into quota from public.tasketh_recommendation_limits where user_id = uid for update;
  if quota.last_request_key = p_key and quota.cached_at > now() - interval '60 seconds' and quota.cached_result is not null then
    return jsonb_build_object('state','cached','result',quota.cached_result);
  end if;
  if quota.pending_until > now() then return jsonb_build_object('state','busy'); end if;
  if quota.window_started_at > now() - interval '60 seconds' and quota.request_count >= 5 then return jsonb_build_object('state','limited'); end if;
  update public.tasketh_recommendation_limits set
    request_count = case when window_started_at <= now() - interval '60 seconds' then 1 else request_count + 1 end,
    window_started_at = case when window_started_at <= now() - interval '60 seconds' then now() else window_started_at end,
    last_request_key = p_key, cached_result = null, cached_at = null, pending_until = now() + interval '30 seconds'
    where user_id = uid;
  return jsonb_build_object('state','allowed');
end $$;

create function public.complete_recommendation(p_key text, p_result jsonb) returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if pg_column_size(p_result) > 16000 then raise exception 'Result too large'; end if;
  update public.tasketh_recommendation_limits set cached_result = p_result, cached_at = now(), pending_until = null
  where user_id = auth.uid() and last_request_key = p_key;
end $$;

create function public.finish_onboarding() returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.assignments where user_id = uid and status <> 'completed') then raise exception 'Add an active assignment first'; end if;
  if not exists(select 1 from public.tasketh_recommendation_limits where user_id = uid and cached_result is not null) then raise exception 'Get your first recommendation first'; end if;
  update public.profiles set onboarding_completed = true, onboarding_step = 3 where id = uid;
end $$;

revoke all on function public.tasketh_handle_new_user(), public.tasketh_touch_row(), public.tasketh_check_availability() from public;
revoke all on function public.replace_weekly_availability(jsonb,boolean), public.reserve_recommendation(text), public.complete_recommendation(text,jsonb), public.finish_onboarding() from public;
grant execute on function public.replace_weekly_availability(jsonb,boolean), public.reserve_recommendation(text), public.complete_recommendation(text,jsonb), public.finish_onboarding() to authenticated;
commit;
