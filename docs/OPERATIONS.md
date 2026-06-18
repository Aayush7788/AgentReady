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

## Contact Requests

Review the newest stored audit-call requests:

```bash
npm run contacts:list
```

Limit the output to the newest 20 rows:

```bash
npm run contacts:list -- 20
```

## Data Retention

Vercel calls the authenticated cleanup route once per day. You can run the same
cleanup locally:

```bash
npm run data:cleanup
```

The cleanup removes expired score jobs, private user scans older than 30 days,
contact requests older than 180 days, and obsolete request-limit records.
