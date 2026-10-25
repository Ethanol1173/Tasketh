# Tasketh development rules

1. The application is **Tasketh**. Its tagline is **Less planning. More doing.**
2. Use the existing Supabase project `kxgiipiaxwxmzuuskvjw` at `https://kxgiipiaxwxmzuuskvjw.supabase.co`. Never create a replacement project.
3. Supabase PostgreSQL is the primary persistent database.
4. Store every user-created profile, preference, course, assignment, schedule, status, and onboarding state in Supabase. Browser state is only for unsaved input and pre-registration theme previews.
5. Use Supabase Auth for signup, login, recovery, and sessions. Never store passwords in application tables.
6. Maintain RLS on every exposed user-owned table. Derive ownership from the verified session and protect composite course ownership.
7. All schema changes belong in version-controlled `supabase/migrations/` SQL files.
8. Inspect remote tables, constraints, policies, functions, and migration history before proposing or applying schema changes. Do not assume the remote database is empty.
9. Never reset or destroy remote data without explicit approval. Refuse migration collisions and adapt safely after inspection.
10. Gemini is the primary recommendation provider, using the official `@google/genai` SDK and configurable `GEMINI_MODEL`.
11. Gemini calls and `GEMINI_API_KEY` must remain server-side.
12. Never expose, print, log, or commit secret credentials. Preserve `.env.local`; never commit it. `.env.example` contains placeholders only.
13. Keep the deterministic fallback available, explainable, and independently testable.
14. Label Gemini output **AI Recommendation** and fallback output **Priority-Based Recommendation**. Never fabricate live integration results.
15. Preserve all six customizable themes and early **Choose Your Vibe** onboarding.
16. Save authenticated theme preferences in Supabase and restore them server-side across devices.
17. Maintain the youthful, minimal design, Obsidian default, Geist typography, and restrained lime accents.
18. Keep the interface responsive, keyboard accessible, readable, and respectful of reduced motion.
19. Preserve working functionality and existing user changes.
20. Never substitute mock data, localStorage, fake APIs, or simulated persistence for production database operations. Test fixtures and explicitly mocked SDK unit tests are allowed only under tests.
21. Validate input with Zod on the server and constraints in PostgreSQL. Treat assignment descriptions as untrusted data. Validate AI IDs, alternatives, and durations before displaying output.
22. Test authorization, concurrent uniqueness, timestamps, schedule atomicity, and data persistence. Run two-account remote tests only against configured development accounts.
23. Avoid unnecessary dependencies. Use the lockfile, Node 24, and `npm ci` for repeatable installation.
24. Run relevant tests after feature changes: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e`. Live tests require actual credentials and must be reported separately.
25. Keep README, environment documentation, migrations, types, and verification instructions synchronized with the implementation.

Cloud tasks already have isolated checkouts. Use `/workspace/Tasketh`; do not create a Git worktree unless explicitly requested. Use a feature branch and never force-push.

Architecture: `src/app` contains routes and server actions; `src/components` contains interactive UI; `src/lib` contains typed Supabase access, validation, time conversion, and recommendations. Production UI must never import test fixtures. Service-role credentials are not required by the application.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
