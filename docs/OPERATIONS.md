# AgentReady Operations

## Daily Local Workflow

Use this when continuing work:

```bash
cd /d D:\projectx
npm test
npm run lint
npm run build
```

## Data Refresh

After Supabase is configured:

```bash
npm run data:audit
npm run score:all
```

The audit step catches seed URLs that stop looking like docs before the slower
scoring run starts.

## Visibility Control

User-submitted score jobs are hidden by default. Publish or hide a row by slug:

```bash
npm run score:visibility -- razorpay publish
npm run score:visibility -- razorpay hide
```

## Recompute Stored Results

When scoring logic changes but the stored check results are still valid, recompute
scores without rescanning every docs site:

```bash
npm run score:stored -- --dry-run
npm run score:stored
```

## Local One-Off Scoring

Use this before Supabase exists or when debugging one docs site:

```bash
npm run score:local -- https://docs.example.com "Example" example "Developer Tools"
```

Reports are written under `reports/local/`, which is intentionally ignored by git.

## Known Follow-Up

`npm audit --audit-level=high` currently reports advisories through the Next.js
dependency line. Do not run a forced major upgrade casually; treat the framework
upgrade as a separate compatibility task and re-run the full app checks after it.
