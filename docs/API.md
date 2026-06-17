# AgentReady API

## Health

```http
GET /api/health
```

Returns runtime setup state, seed counts, and scoring engine version. It does not
return secrets.

## Leaderboard

```http
GET /api/leaderboard
GET /api/leaderboard?category=Payments
```

Returns public, non-hidden score rows from Supabase. If Supabase is not
configured, the route returns:

```json
{
  "error": "setup_required",
  "message": "Missing Supabase configuration: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.",
  "missing": ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
}
```

## Company Score

```http
GET /api/company/{slug}
```

Returns one public company score, or `404` when no visible score exists.

## Score Job

```http
POST /api/score
Content-Type: application/json

{
  "url": "https://docs.example.com",
  "name": "Example",
  "slug": "example",
  "category": "Developer Tools"
}
```

Creates a background score job and returns:

```json
{
  "jobId": "...",
  "slug": "example"
}
```

Poll the job:

```http
GET /api/score/{jobId}?slug=example
```

