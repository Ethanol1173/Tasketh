# Tasketh

**Less planning. More doing.**

Tasketh helps university students decide what to study in the time they have now. It combines real Supabase assignment data, Gemini recommendations, and an explainable deterministic fallback.

## Features

- Next.js App Router, TypeScript, React, Tailwind CSS, Geist, and Lucide icons.
- Supabase email/password registration, case-insensitive unique usernames, email confirmation, login, logout, recovery, and protected pages.
- Six instant theme previews: Obsidian, Midnight, Plum, Forest, Rose, and Ivory. Authenticated preferences are stored in PostgreSQL and loaded server-side.
- Saved onboarding: weekly availability → assignments → current study time → first recommendation → dashboard.
- Course management and assignment creation, editing, deletion, status changes, filters, and sorting. Grade weight is required; exact duration is optional.
- Recurring weekly availability with multiple blocks, copy-day controls, overlap prevention, overnight splitting, and atomic database updates.
- Real server-side Gemini integration with structured JSON, strict output validation, bounded context, timeouts, PostgreSQL-backed rate limiting, in-flight locking, and short-lived duplicate caching.
- A functional priority-based fallback when Gemini is missing, unavailable, or returns invalid output.
- User-owned rows protected with RLS, composite course ownership, database constraints, and timestamps.
- Responsive layouts, loading states, accessible native dialogs, keyboard focus, and reduced-motion support.

There is no mock application mode, localStorage database, or service-role dependency. The public landing illustration is labeled as an illustration. Private pages require a real Supabase session and the migrated database.

## Install and run

Use Node **24** (`.nvmrc` pins the verified version) and npm.

```sh
npm ci
cp .env.example .env.local
# Enter configuration securely in .env.local; never commit it.
npm run dev
```

| Variable                               | Purpose                                                                                                         |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | `https://kxgiipiaxwxmzuuskvjw.supabase.co`                                                                      |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The existing project's public publishable key (legacy anon key also supported)                                  |
| `NEXT_PUBLIC_APP_URL`                  | Application origin, without trailing slash; use your HTTPS deployment origin in production                      |
| `GEMINI_API_KEY`                       | Server-only Google Gemini API key; missing keys activate the fallback                                           |
| `GEMINI_MODEL`                         | Configurable model; initial default `gemini-2.5-flash`                                                          |
| `SUPABASE_ACCESS_TOKEN`                | Optional management-only credential for read-only schema inspection and Supabase CLI; never required by the app |

Public Supabase variables are embedded at build time. Rebuild after changing them. Do not prefix Gemini or administrative keys with `NEXT_PUBLIC_`. The application never uses a Supabase service-role key.

If a cloud machine has a read-only home directory, use a writable npm cache and the CLI's supported configuration override:

```sh
NPM_CONFIG_CACHE=/tmp/tasketh-npm-cache npm ci
SUPABASE_HOME=/workspace/.tasketh-tools/supabase npx supabase --version
```

This cloud machine also routes outbound requests through an HTTPS proxy. Start Node with its
supported proxy configuration so Supabase and Gemini requests follow that route:

```sh
export NODE_USE_ENV_PROXY=1
npm run dev
# The same export applies to npm run db:inspect and npm run test:live.
```

Keep the platform's certificate settings intact. Standard Vercel deployments do not need this
cloud-specific export.

## Existing Supabase project and migration safety

Use **only** project reference `kxgiipiaxwxmzuuskvjw`. Do not create another project or reset this database.

The initial migration is `supabase/migrations/20261025160439_tasketh_initial_schema.sql`. It creates `profiles`, `courses`, `assignments`, `weekly_availability`, and the private `tasketh_recommendation_limits` table. The last table supports rate limiting and duplicate prevention; it is not a history feature.

**The initial migration has been applied to the existing Supabase project, followed by `20261025160552_tasketh_function_permissions_hardening.sql`. Do not reapply either migration.** When working on another project or revising the schema, first inspect the remote schema and migration history. Its preflight refuses any existing table with these names instead of silently replacing or assuming compatibility. The project had no Auth users when the initial migration was deployed; for future schema changes, review existing Auth users and profile needs first. Nothing automatically resets, backfills, or drops existing data.

1. Authenticate the installed Supabase CLI securely and inspect the existing project and migration history:

   ```sh
   npx supabase login
   npx supabase projects list
   npm run db:inspect
   npx supabase link --project-ref kxgiipiaxwxmzuuskvjw
   npx supabase migration list --linked
   npx supabase db dump --linked --schema public --file /tmp/tasketh-existing-schema.sql
   ```

   `npm run db:inspect` uses `SUPABASE_ACCESS_TOKEN` through the Supabase management API and only requests schema metadata. Do not commit schema dumps without reviewing their contents. Linking/dumping may need the project's database password through the CLI's secure prompt or supported environment configuration. A proxy credential bound to HTTPS cannot authenticate a direct PostgreSQL connection.

2. Compare existing columns, policies, constraints, triggers, functions, and migrations. Adapt safely if anything already exists. Review the versioned SQL and run the local database tests.
3. Inspect the dry run, then apply only reviewed, compatible changes:

   ```sh
   npm run test:db
   npx supabase db push --linked --dry-run
   npx supabase db push --linked
   npx supabase db lint --linked
   npx supabase gen types typescript --linked > /tmp/tasketh-generated.types.ts
   ```

   Compare generated types with `src/lib/database.types.ts` before replacing them. A local dry-run or embedded PostgreSQL test does not establish remote compatibility.

If MCP is preferred, configure and authenticate the existing project:

```sh
codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=kxgiipiaxwxmzuuskvjw&features=database,docs,debugging,development"
codex mcp login supabase
```

MCP availability must be verified in the current session. It was not available during initial implementation.

## Authentication configuration

Enable email/password authentication in the existing Supabase project. Set the Auth Site URL to `NEXT_PUBLIC_APP_URL`, configure a working email provider, and allow these redirect URLs for each deployment:

- `https://YOUR_APP_DOMAIN/auth/callback`
- `https://YOUR_APP_DOMAIN/auth/callback?next=/onboarding`
- `https://YOUR_APP_DOMAIN/auth/callback?next=/reset-password`

Use equivalent local redirects for development. Prefer a narrowly scoped wildcard for preview deployments only when needed.

Keep email confirmation enabled. Supabase's default `{{ .ConfirmationURL }}` email templates work with the PKCE callback in the same browser. For token-hash templates that also support confirmation on another device, use these application callback forms:

```text
Signup: {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/onboarding
Recovery: {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
```

The profile is created by an atomic `auth.users` trigger, including username, chosen theme, and timezone. A unique lowercase index handles concurrent username attempts. Password confirmation is validated but never stored or included in user metadata. Sign-up without a session shows a verification screen. Recovery requires a valid authenticated callback and an expiring HTTP-only recovery cookie.

## Recommendation engine

`src/lib/recommendations/scoring.ts` implements:

```text
Priority = 0.50 × Urgency + 0.35 × Grade Weight + 0.15 × Session Suitability
```

Urgency: overdue 100; ≤1 day 95; ≤2 days 85; ≤3 days 75; ≤7 days 60; ≤14 days 40; later 20. Dates without times mean 23:59:59 in the profile timezone, converted to an absolute instant before comparing deadlines.

Suitability: unknown effort is 60. For sessions under 30 / under 60 / at least 60 minutes, small effort is 90/95/100, medium 60/80/95, and large 45/65/85. With an optional exact estimate, suitability is 100 if it fits, otherwise `max(40, round(100 × available / estimate))`. Large tasks are never excluded. Ties break by earlier deadline, greater weight, then stable ID. Assignment type does not add points. These are configurable starting assumptions, not scientifically established predictions.

Gemini receives only the top 40 eligible baseline candidates with limited assignment context, current time, timezone, and session duration. It can choose a different ranking. Descriptions are explicitly untrusted input. No account email, authentication token, password, or API key enters the prompt. Output IDs, alternatives, lengths, and duration are validated with Zod. The prompt forbids invented assignment details and requests generic steps when instructions are absent; structural validation cannot prove every natural-language statement is true, so users should still review suggestions.

The server uses the official SDK, a configurable model, a 12-second provider timeout, and no automatic application retries. The authenticated database limiter permits five new recommendations per minute; identical results are reused for 60 seconds. A 30-second in-flight lock avoids parallel calls across server instances. Relevant data processing is disclosed in the UI and `/privacy`.

## Tests and verification

```sh
npm run lint
npm run typecheck
npm test                  # Unit tests + migration/RLS tests in embedded PostgreSQL
npm run test:unit
npm run test:db
npm run build
npx playwright install chromium
npm run test:e2e          # Production-server browser tests, desktop + mobile
```

In this cloud image Chromium is already installed:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

The PostgreSQL tests run the actual migration against PGlite, with an explicit minimal test Auth schema and two PostgreSQL roles. They exercise real RLS and constraints; they do not impersonate a successful remote Supabase connection. Gemini unit tests mock only the SDK boundary and are explicitly separate from live calls. Browser tests cover public navigation, all theme previews, reload persistence, responsive layouts, password visibility, recovery navigation, API protection, and browser errors.

For real remote verification, configure **two distinct confirmed development accounts** and securely supply `TASKETH_TEST_USER_A_EMAIL`, `TASKETH_TEST_USER_A_PASSWORD`, `TASKETH_TEST_USER_B_EMAIL`, and `TASKETH_TEST_USER_B_PASSWORD`, together with the application's environment variables:

```sh
npm run test:live
```

This signs in to real Supabase, reads saved profiles/themes, creates isolated verification records, tests cross-user RLS and completion/reopening, and checks the configured Gemini model and a real AI call using a non-sensitive database assignment. It deletes only records it created in a `finally` block. Missing prerequisites produce an explicit nonzero blocked result. It does not claim to verify email delivery or account registration. Manually exercise signup, confirmation, recovery, cross-device theme restoration, and the complete authenticated browser journey before release.

## Deployment on Vercel

1. Import this GitHub repository into Vercel; choose the Next.js preset and Node 24.
2. Set the environment variables above. Use the final HTTPS app origin and keep Gemini server-only.
3. Inspect/apply the safe migration to the existing Supabase project and configure Auth redirect URLs and email delivery.
4. Deploy with the standard `npm run build`. No mandatory paid service is enabled by this code.
5. Run live checks and the authenticated acceptance journey. The local build can pass without credentials; it does not prove that live authentication or persistence is configured.

Routes include `/`, `/onboarding/theme`, `/signup`, `/verify-email`, `/login`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/onboarding`, `/dashboard`, `/assignments`, `/assignments/new`, `/assignments/[id]`, `/courses`, `/schedule`, `/recommendation`, `/settings`, and `/privacy`.

`AGENTS.md` contains permanent development and data-safety rules. GitHub Actions runs lint, types, tests, a production build, and browser checks on pushes and pull requests.
