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

The health route should return `setup_required` until Supabase values are set.

## Supabase

Create a Supabase project, then copy:

```bash
copy .env.example .env.local
```

Fill in:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Apply the schema from:

```text
supabase/schema.sql
```

Then verify:

```bash
npm run check:supabase
```

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

