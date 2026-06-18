create table if not exists public.score_jobs (
  job_id uuid primary key,
  slug text not null,
  docs_url text not null,
  status text not null check (status in ('running', 'complete', 'error')),
  state jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.score_jobs
  add column if not exists docs_url text;

delete from public.score_jobs
where docs_url is null;

alter table public.score_jobs
  alter column docs_url set not null;

create index if not exists score_jobs_expires_at_idx
  on public.score_jobs (expires_at);

create index if not exists score_jobs_active_docs_url_idx
  on public.score_jobs (docs_url, updated_at desc)
  where status = 'running';

drop trigger if exists score_jobs_set_updated_at on public.score_jobs;

create trigger score_jobs_set_updated_at
before update on public.score_jobs
for each row
execute function public.set_updated_at();

alter table public.score_jobs enable row level security;

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  work_email text not null,
  docs_url text not null,
  source text not null default 'website_audit_request',
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contact_requests_created_at_idx
  on public.contact_requests (created_at desc);

create index if not exists contact_requests_status_idx
  on public.contact_requests (status, created_at desc);

drop trigger if exists contact_requests_set_updated_at on public.contact_requests;

create trigger contact_requests_set_updated_at
before update on public.contact_requests
for each row
execute function public.set_updated_at();

alter table public.contact_requests enable row level security;

create table if not exists public.request_limits (
  key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

create index if not exists request_limits_updated_at_idx
  on public.request_limits (updated_at);

alter table public.request_limits enable row level security;

create or replace function public.consume_request_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.request_limits%rowtype;
begin
  if p_limit <= 0 or p_window_seconds <= 0 then
    raise exception 'Rate limit and window must be positive';
  end if;

  insert into public.request_limits as limits (
    key,
    window_started_at,
    request_count,
    updated_at
  )
  values (p_key, now(), 1, now())
  on conflict (key) do update
  set
    window_started_at = case
      when limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
        then now()
      else limits.window_started_at
    end,
    request_count = case
      when limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
        then 1
      else limits.request_count + 1
    end,
    updated_at = now()
  returning * into current_row;

  return query
  select
    current_row.request_count <= p_limit,
    greatest(p_limit - current_row.request_count, 0),
    current_row.window_started_at + make_interval(secs => p_window_seconds);
end;
$$;

revoke all on function public.consume_request_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_request_limit(text, integer, integer)
  to service_role;
