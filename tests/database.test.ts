import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
const userA = '00000000-0000-4000-8000-000000000001',
  userB = '00000000-0000-4000-8000-000000000002';
const courseA = '00000000-0000-4000-8000-000000000010',
  courseB = '00000000-0000-4000-8000-000000000020';
let db: PGlite;
async function asUser(id: string | null) {
  await db.exec(
    `reset role; set role ${id ? 'authenticated' : 'anon'}; select set_config('request.jwt.claim.sub','${id || ''}',false);`,
  );
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create schema auth; create role authenticated; create role anon; create table auth.users(id uuid primary key,raw_user_meta_data jsonb not null); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth,public to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`,
  );
  await db.exec(readFileSync('supabase/migrations/20261025000100_tasketh.sql', 'utf8'));
});
beforeEach(async () => {
  await db.exec(
    `reset role; truncate auth.users cascade; insert into auth.users values ('${userA}','{"username":"studentA","selected_theme":"plum","timezone":"Asia/Taipei"}'),('${userB}','{"username":"studentB"}'); insert into public.courses(id,user_id,name) values ('${courseA}','${userA}','Statistics'),('${courseB}','${userB}','Databases');`,
  );
});
afterAll(async () => {
  await db?.close();
});
async function addAssignment(owner = userA, course = courseA) {
  return db.query(
    `insert into public.assignments(user_id,course_id,title,assignment_type,due_date,grade_weight,effort_level) values ($1,$2,'Homework','homework','2026-10-26',15,'unknown') returning *`,
    [owner, course],
  );
}
describe('versioned migration against actual embedded PostgreSQL (not remote Supabase)', () => {
  it('allows a bounded availability check without exposing profiles', async () => {
    await asUser(null);
    const taken = await db.query<{ available: boolean }>(
      'select tasketh_username_available($1) as available',
      ['STUDENTA'],
    );
    expect(taken.rows[0].available).toBe(false);
    const free = await db.query<{ available: boolean }>(
      'select tasketh_username_available($1) as available',
      ['new_student'],
    );
    expect(free.rows[0].available).toBe(true);
    await expect(db.query('select * from profiles')).rejects.toThrow(/permission denied/);
  });
  it('creates profiles atomically and enforces case-insensitive username uniqueness', async () => {
    const profile = await db.query<{ selected_theme: string; timezone: string }>(
      `select * from profiles where id=$1`,
      [userA],
    );
    expect(profile.rows[0]).toMatchObject({ selected_theme: 'plum', timezone: 'Asia/Taipei' });
    await expect(
      db.exec(
        `insert into auth.users values ('00000000-0000-4000-8000-000000000003','{"username":"STUDENTA"}')`,
      ),
    ).rejects.toThrow(/unique/i);
    expect((await db.query(`select * from auth.users`)).rows).toHaveLength(2);
  });
  it('isolates reads, inserts, updates and deletes between users', async () => {
    await asUser(userA);
    const created = await addAssignment();
    const id = (created.rows[0] as { id: string }).id;
    await asUser(userB);
    expect((await db.query('select * from assignments')).rows).toHaveLength(0);
    expect((await db.query('select * from courses')).rows).toHaveLength(1);
    expect(
      (await db.query("update assignments set title='stolen' where id=$1 returning id", [id])).rows,
    ).toHaveLength(0);
    expect(
      (await db.query('delete from assignments where id=$1 returning id', [id])).rows,
    ).toHaveLength(0);
    await expect(addAssignment(userA, courseA)).rejects.toThrow(/row-level security/);
    await asUser(userA);
    expect((await db.query('select * from assignments')).rows).toHaveLength(1);
  });
  it('prevents cross-user course references and anonymous private access', async () => {
    await asUser(userA);
    await expect(addAssignment(userA, courseB)).rejects.toThrow(/foreign key/);
    await asUser(null);
    await expect(db.query('select * from assignments')).rejects.toThrow(/permission denied/);
    await expect(db.query('select * from profiles')).rejects.toThrow(/permission denied/);
  });
  it('persists completion timestamps and clears them when reopened', async () => {
    await asUser(userA);
    await addAssignment();
    await db.exec("update assignments set status='completed'");
    expect(
      (await db.query<{ completed_at: unknown }>('select completed_at from assignments')).rows[0]
        .completed_at,
    ).not.toBeNull();
    await db.exec("update assignments set status='in_progress'");
    expect(
      (await db.query<{ completed_at: unknown }>('select completed_at from assignments')).rows[0]
        .completed_at,
    ).toBeNull();
  });
  it('saves availability atomically, rejects overlap and preserves old data on failure', async () => {
    await asUser(userA);
    await db.query('select replace_weekly_availability($1::jsonb,true)', [
      JSON.stringify([{ weekday: 0, start_time: '09:00', end_time: '10:00' }]),
    ]);
    const invalid = [
      { weekday: 1, start_time: '09:00', end_time: '11:00' },
      { weekday: 1, start_time: '10:00', end_time: '12:00' },
    ];
    await expect(
      db.query('select replace_weekly_availability($1::jsonb,false)', [JSON.stringify(invalid)]),
    ).rejects.toThrow(/overlap/);
    const saved = await db.query<{ weekday: number }>('select * from weekly_availability');
    expect(saved.rows).toHaveLength(1);
    expect(saved.rows[0].weekday).toBe(0);
    await asUser(userB);
    expect((await db.query('select * from weekly_availability')).rows).toHaveLength(0);
  });
  it('enforces shared request locking, duplicate caching and per-user rate limits', async () => {
    await asUser(userA);
    const reserve = async (key: string) =>
      (
        await db.query<{ result: { state: string; result?: unknown } }>(
          'select reserve_recommendation($1) as result',
          [key],
        )
      ).rows[0].result;
    const key = 'a'.repeat(64);
    expect((await reserve(key)).state).toBe('allowed');
    expect((await reserve(key)).state).toBe('busy');
    await db.query('select complete_recommendation($1,$2::jsonb)', [key, '{"source":"fallback"}']);
    expect((await reserve(key)).state).toBe('cached');
    for (const char of ['b', 'c', 'd', 'e']) {
      const next = char.repeat(64);
      expect((await reserve(next)).state).toBe('allowed');
      await db.query('select complete_recommendation($1,$2::jsonb)', [next, '{}']);
    }
    expect((await reserve('f'.repeat(64))).state).toBe('limited');
    await asUser(userB);
    expect((await reserve(key)).state).toBe('allowed');
    await expect(db.query('select * from tasketh_recommendation_limits')).rejects.toThrow(
      /permission denied/,
    );
  });
  it('requires an active assignment and a recommendation before finishing onboarding', async () => {
    await asUser(userA);
    await expect(db.query('select finish_onboarding()')).rejects.toThrow(/active assignment/);
    await addAssignment();
    await expect(db.query('select finish_onboarding()')).rejects.toThrow(/recommendation first/);
    const key = 'a'.repeat(64);
    await db.query('select reserve_recommendation($1)', [key]);
    await db.query('select complete_recommendation($1,$2::jsonb)', [key, '{"source":"fallback"}']);
    await db.query('select finish_onboarding()');
    expect(
      (
        await db.query<{ onboarding_completed: boolean }>(
          'select onboarding_completed from profiles',
        )
      ).rows[0].onboarding_completed,
    ).toBe(true);
  });
});
