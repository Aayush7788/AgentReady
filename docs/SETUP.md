# AgentReady Setup

This is the setup checklist for turning the local codebase into a working hosted
MVP.

## Local Checks

Run these before touching Supabase or deployment:

```bash
npm test
npm run lint
npm run build
```

Check the app can boot without secrets:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000/api/health
```

The health route should return `setup_required` until Supabase and maintenance
values are set.

## Supabase

Create a Supabase project, then copy:

```bash
copy .env.example .env.local
```

Fill in:

```text
NEXT_PUBLIC_SITE_URL=https://agentready.vercel.app
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

Generate `CRON_SECRET` locally with:

```powershell
-join (1..32 | ForEach-Object { '{0:x2}' -f (Get-Random -Minimum 0 -Maximum 256) })
```

Store all three secrets in the Vercel project settings. Never expose the
service-role key in a browser variable or commit it to git.

Apply the schema from:

```text
supabase/schema.sql
```

If the original score table already exists, apply this idempotent migration in
the Supabase SQL editor:

```text
supabase/migrations/20260618_production_frontend.sql
```

It adds the preferred durable storage tables:

- `score_jobs` for durable private scan polling
- `contact_requests` for audit-call submissions
- `request_limits` for abuse prevention shared across serverless instances

Until that migration is applied, AgentReady uses the private
`agentready-internal` Supabase Storage bucket as a fallback.

Then verify:

```bash
npm run check:supabase
```

The production smoke suite verifies the active persistence layer and removes
its own temporary records:

```bash
npm run build
npm run start
npm run smoke:production
```

## Vercel

Import the GitHub repository into Vercel and keep the project root at the
repository root. The checked-in `vercel.json` configures the long-running score
route and one daily cleanup task.

Set these production environment variables:

```text
NEXT_PUBLIC_SITE_URL=https://agentready.vercel.app
SUPABASE_URL=<project URL>
SUPABASE_SERVICE_ROLE_KEY=<server-only service role key>
CRON_SECRET=<32-byte random secret>
```

The Vercel Hobby plan is suitable only for a non-commercial validation/demo.
Commercial use requires a paid Vercel plan under Vercel's current fair-use
rules.

## First Scores

Run a local report without Supabase:

```bash
npm run score:local -- https://docs.sarvam.ai "Sarvam AI" sarvam-ai "AI/ML"
```

After Supabase is configured, populate the leaderboard:

```bash
npm run score:all
```

## Seed URL Audit

To re-check that every seed entry still points at docs or developer resources:

```bash
npm run data:audit
```
