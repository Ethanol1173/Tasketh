# Implementation and verification

Recorded on 2026-10-25 for the initial Tasketh implementation and updated after remote database deployment. This report distinguishes tests, deployed schema, and still-unverified live application workflows.

| Area                    | Implemented                                                                                                                                                                                   | Verification                                                                                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application             | Next.js, TypeScript, Tailwind, App Router, reusable components, English UI, responsive Obsidian design and original SVG branding                                                              | Production build passed; public desktop/mobile journeys passed                                                                                                             |
| Authentication          | Real Supabase registration, four required fields, username availability check and database uniqueness, email confirmation, sign-in/out, recovery, callback, session refresh, route protection | Zod tests and anonymous route protection passed; real registration, email delivery, login and recovery remain unverified; migrations are deployed but application credentials have not been configured in Codex |
| Themes                  | Six instant previews, cookie-backed pre-registration selection, profile metadata at signup, server-rendered saved theme and Settings persistence                                              | All six previews, reload persistence, signup selection and responsive layout passed in desktop/mobile browsers; authenticated cross-device persistence remains unverified  |
| Courses and assignments | Database-backed CRUD, ownership checks, required estimated grade weight, optional duration, five types, four effort choices, descriptions, filters, sorting and status changes                | Validation and PostgreSQL ownership/constraint/completion tests passed; live Supabase CRUD and authenticated browser flows remain unverified                               |
| Weekly availability     | Multiple blocks per day, edit/remove/copy, overnight splitting, timezone display, overlap checks and transactional replacement                                                                | Timezone, overnight, overlap and real PostgreSQL atomicity tests passed; remote save/reload remains unverified                                                             |
| Onboarding/dashboard    | Saved steps, at least one active assignment, initial recommendation, completion gate, actual profile greeting and database-derived statistics                                                 | Database completion gate passed; full authenticated browser journey remains unverified                                                                                     |
| Gemini                  | Official server-only SDK, configurable model, bounded structured input, output validation, 12-second timeout, no SDK retries, rate limit and duplicate cache                                  | SDK-boundary unit tests passed; `GEMINI_API_KEY` is absent, so no live model availability, quota or generation check has passed                                            |
| Fallback                | Documented 50/35/15 priority formula, timezone-aware urgency, neutral unknown effort, stable ties, completed-task exclusion and honest source labels                                          | Unit tests passed, including missing-key, provider-failure and invalid-output fallback                                                                                     |
| Database security       | RLS, ownership-derived writes, composite course reference, profile uniqueness, timestamps and restricted quota functions                                                                      | Migration ran successfully in embedded PostgreSQL; two-role read/insert/update/delete isolation, foreign ownership, anonymous denial and rate limits passed                |
| Development             | AGENTS.md, environment placeholders, CI, read-only inspection and live-verification scripts, deployment docs                                                                                  | Frozen `npm ci`, lint, TypeScript, tests and build passed; `.env.local` is ignored                                                                                         |

## Actual check results

- `npm ci`: passed with the committed lockfile and Node 24.19.0.
- `npm run lint`: passed with no warnings or errors. Generated browser reports are excluded from source linting.
- `npm run typecheck`: passed.
- Initial `npm test`: **29 passed** with the original filename, including PGlite PostgreSQL execution (not remote Supabase). After migrations were renamed on GitHub, CI failed because the test still pointed to the old filename; this commit fixes that reference. Await new CI result.
- `npm run build`: passed; the App Router routes compile for production.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`: **10 passed** across desktop Chromium and mobile emulation. No unhandled browser errors were observed in the tested public journey.
- `npm run db:inspect`: blocked with nonzero exit status because `SUPABASE_ACCESS_TOKEN` is absent.
- `npm run test:live`: blocked with nonzero exit status because the publishable key and two development-account credential sets are absent. Gemini also lacks its key. No live checks are reported as passed.

## Remote database status

The existing project endpoint `https://kxgiipiaxwxmzuuskvjw.supabase.co/rest/v1/` responds with HTTP 401 and “No API key found in request.” This confirms transport reachability, not an authenticated connection.

The original Codex Cloud environment did not contain a Supabase access token or MCP connection. A separately connected Supabase integration in ChatGPT subsequently inspected and deployed the schema. That connection does not automatically provide credentials to Codex Cloud.

**Remote database deployment completed on 2026-10-25 via the connected Supabase integration.** Project `kxgiipiaxwxmzuuskvjw` was checked before deployment: zero public application tables, zero migrations, zero Auth users, no colliding functions/triggers. Two migrations now exist remotely: `20261025160439_tasketh_initial_schema` and `20261025160552_tasketh_function_permissions_hardening`. All five public tables exist with RLS enabled and zero initial application rows. Anonymous access to internal and authenticated RPCs was restricted. Actual signup and authenticated workflows have not yet been verified.

`supabase/migrations/20261025160439_tasketh_initial_schema.sql` was applied remotely and creates:

- `public.profiles`
- `public.courses`
- `public.assignments`
- `public.weekly_availability`
- `public.tasketh_recommendation_limits`

It includes a collision preflight, RLS policies, an Auth profile trigger, username availability lookup, schedule replacement, recommendation quota/cache functions and onboarding completion. The following migration hardens RPC execution permissions. The schema and migration histories were inspected before application. Do not reset or reapply the initial migration.

Security advisors still flag the intentionally anonymous `tasketh_username_available` SECURITY DEFINER function and several authenticated SECURITY DEFINER RPCs; review these before public launch. `tasketh_recommendation_limits` intentionally has RLS with no direct user policies. No live signup or cross-user session tests have been completed.

## Required external setup before release

1. Securely configure `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the existing project. The public project URL is already in `.env.example` and local ignored configuration.
2. The remote schema and migration setup have been completed with the connected Supabase integration. Before future schema changes, inspect migration history and use a dry-run. GitHub CI must be green after syncing migration filenames.
3. Configure Supabase Auth redirect URLs, Site URL and email delivery. Exercise signup, duplicate username handling, email confirmation, recovery and session persistence in a real browser.
4. Configure server-only `GEMINI_API_KEY` and verify `GEMINI_MODEL` availability and quota with a real call. Core fallback remains implemented; live recommendations still require authenticated database access.
5. Configure two confirmed development accounts, run `npm run test:live`, and manually verify the authenticated onboarding → recommendation → dashboard flow, CRUD, availability save/reload and cross-device theme restoration.
6. Set the deployment's HTTPS `NEXT_PUBLIC_APP_URL`, configure Vercel environment variables, rebuild and deploy. No hosting deployment has been performed in this task.

Secrets must be entered through secure environment configuration or ignored `.env.local`, never in chat or committed files. Cloud configuration draft persistence is separate from publication and does not prove a fresh task restores correctly.
