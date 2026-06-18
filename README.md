# AgentReady

AgentReady scores how usable public documentation is for AI agents. The first leaderboard is seeded with Indian companies and developer platforms that publish public docs.

## Stack

- Next.js App Router
- React and TypeScript production frontend
- Tailwind CSS with an AgentReady design system in `frontend/styles/site.css`
- AFDocs for documentation scoring
- Supabase for scores, durable scan jobs, request limits, and contact requests
- Vitest for deterministic helper tests

## Setup

Install dependencies:

```bash
npm install
```

Create local environment values:

```bash
copy .env.example .env.local
```

Set:

```text
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

Create the Supabase table using:

```text
supabase/schema.sql
```

Existing projects can apply:

```text
supabase/migrations/20260618_production_frontend.sql
```

## Development

Run the app:

```bash
npm run dev
```

Run checks:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Run the production smoke suite after starting the built app:

```bash
npm run build
npm run start
npm run smoke:production
```

## Frontend

Production frontend code lives in:

```text
frontend/components
frontend/lib
frontend/styles
```

The homepage is server-rendered and falls back to
`data/leaderboard-snapshot.json` if live leaderboard storage is temporarily
unavailable. Interactive JavaScript is limited to scan submission, scan
polling, leaderboard row navigation, and contact submission.

Public reports use:

```text
/companies/[slug]
```

Private scan results use opaque job URLs:

```text
/scans/[jobId]
```

Agent-readable content is available through `/llms.txt`, `/llms-full.txt`,
`.md` page URLs, and `Accept: text/markdown` content negotiation.

## Scoring

Score one docs site:

```bash
npm run score:single -- https://docs.example.com "Example" example "Developer Tools"
```

Score all seeded companies:

```bash
npm run score:all
```

Check Supabase connectivity:

```bash
npm run check:supabase
```

Review contact requests and clean expired private data:

```bash
npm run contacts:list
npm run data:cleanup
```

## Seed Data

Leaderboard seed companies live in:

```text
data/companies.json
```

Every seed entry must have a public docs URL, a unique slug, and one of the known categories in `lib/categorize.ts`.
