-- PostFlow AI v4 — Phase 3: AI Superpowers migration
-- Run after migration_v3.sql in Supabase SQL Editor

-- =========================================
-- AI content generations log
-- =========================================
create table if not exists ai_generations (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete set null,
  generation_type text not null check (generation_type in ('content', 'image', 'hashtags')),
  prompt text not null,
  result jsonb not null,
  model text,
  tokens_used integer,
  created_at timestamptz default now()
);

create index if not exists idx_ai_generations_post on ai_generations (post_id);
create index if not exists idx_ai_generations_type on ai_generations (generation_type);

-- =========================================
-- Compliance check logs
-- =========================================
create table if not exists compliance_logs (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade,
  caption_text text not null,
  violations jsonb default '[]'::jsonb,
  risk_level text check (risk_level in ('none', 'low', 'medium', 'high')),
  action_taken text check (action_taken in ('fixed', 'overridden', 'pending')),
  checked_at timestamptz default now()
);

create index if not exists idx_compliance_logs_post on compliance_logs (post_id);

-- =========================================
-- Predictive scoring logs
-- =========================================
create table if not exists predictive_scores (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade,
  overall_score integer not null check (overall_score between 0 and 100),
  breakdown jsonb not null,
  suggestions jsonb default '[]'::jsonb,
  scored_at timestamptz default now()
);

create index if not exists idx_predictive_scores_post on predictive_scores (post_id);

-- =========================================
-- Add AI-related columns to posts
-- =========================================
alter table posts add column if not exists ai_generated boolean default false;
alter table posts add column if not exists compliance_checked boolean default false;
alter table posts add column if not exists compliance_status text default 'unchecked'
  check (compliance_status in ('unchecked', 'passed', 'flagged', 'overridden'));
alter table posts add column if not exists predicted_score integer;
alter table posts add column if not exists suggested_hashtags jsonb default '[]'::jsonb;

-- =========================================
-- RLS policies for new tables
-- =========================================
alter table ai_generations enable row level security;
alter table compliance_logs enable row level security;
alter table predictive_scores enable row level security;

create policy "Service role full access on ai_generations"
  on ai_generations for all using (true) with check (true);

create policy "Service role full access on compliance_logs"
  on compliance_logs for all using (true) with check (true);

create policy "Service role full access on predictive_scores"
  on predictive_scores for all using (true) with check (true);
