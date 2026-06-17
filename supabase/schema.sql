create extension if not exists pgcrypto;

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null default 'Other',
  docs_url text not null,
  score integer not null check (score >= 0 and score <= 100),
  grade text not null check (grade in ('A+', 'A', 'B', 'C', 'D', 'F')),
  scored_at timestamptz not null,
  checks_total integer not null default 0,
  checks_pass integer not null default 0,
  checks_warn integer not null default 0,
  checks_fail integer not null default 0,
  checks_skip integer not null default 0,
  checks_error integer not null default 0,
  results jsonb,
  category_scores jsonb,
  afdocs_version text,
  hidden boolean not null default false,
  docs_provider text,
  platform_detected text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scores_visible_score_idx
  on public.scores (hidden, score desc, scored_at desc);

create index if not exists scores_category_score_idx
  on public.scores (category, score desc);

create index if not exists scores_docs_url_idx
  on public.scores (docs_url);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists scores_set_updated_at on public.scores;

create trigger scores_set_updated_at
before update on public.scores
for each row
execute function public.set_updated_at();

alter table public.scores enable row level security;

drop policy if exists "Visible scores are readable" on public.scores;

create policy "Visible scores are readable"
on public.scores
for select
using (hidden = false);

