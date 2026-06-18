# AgentReady API

## Health

`GET /api/health`

Returns runtime setup state, seed counts, and scoring engine version without
exposing secrets.

## Public leaderboard

`GET /api/leaderboard`

Optional exact category filter:

```text
/api/leaderboard?category=Payments
```

The response contains summary fields only. Raw per-check results are available
through individual company reports.

## Public company report

`GET /api/company/{slug}`

Returns one visible company score, or `404` when the report is not public.

## Start a score

`POST /api/score`

```json
{
  "url": "https://docs.example.com"
}
```

Known public documentation URLs return their existing report slug. New scans
return an opaque job ID and remain hidden from the public leaderboard.

## Poll a score

`GET /api/score/{jobId}`

Returns `running`, `complete`, or `error`. The route is always uncached so
polling can observe the latest job state. Completed private jobs include the
full report and expire after 24 hours.

## Contact request

`POST /api/contact`

```json
{
  "email": "you@company.com",
  "docsUrl": "https://docs.company.com"
}
```

Requests are validated, rate limited, protected with a honeypot field, and
stored in `contact_requests` or the private storage fallback.

## Maintenance

`GET /api/maintenance/cleanup`

This route is called by the daily Vercel cron. It requires
`Authorization: Bearer <CRON_SECRET>` and removes expired private data and
request-limit records.

## Agent-readable content

- `GET /llms.txt`
- `GET /llms-full.txt`
- `GET /index.md`
- `GET /companies/{slug}.md`
- Send `Accept: text/markdown` to `/` or a public company page.

Unknown company HTML and Markdown routes return HTTP `404`.
