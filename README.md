# AgentReady

AgentReady scores how usable public documentation is for AI agents. The first leaderboard is seeded with Indian companies and developer platforms that publish public docs.

## Stack

- Next.js App Router
- AFDocs for documentation scoring
- Supabase for score storage
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
```

Create the Supabase table using:

```text
supabase/schema.sql
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
npm run build
```

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

## Seed Data

Leaderboard seed companies live in:

```text
data/companies.json
```

Every seed entry must have a public docs URL, a unique slug, and one of the known categories in `lib/categorize.ts`.

