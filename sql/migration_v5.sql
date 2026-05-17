-- PostFlow AI v5 — Phase 4: Premium AI Features migration
-- Run after migration_v4.sql in Supabase SQL Editor

-- =========================================
-- Competitor analysis logs
-- =========================================
create table if not exists competitor_analyses (
  id uuid primary key default uuid_generate_v4(),
  source_url text,
  source_text text,
  analysis jsonb not null,
  generated_post text,
  created_at timestamptz default now()
);

-- =========================================
-- Crisis detection logs
-- =========================================
create table if not exists crisis_checks (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade,
  caption_text text not null,
  risk_level text check (risk_level in ('none', 'low', 'medium', 'high')),
  issues jsonb default '[]'::jsonb,
  reframed_text text,
  action_taken text check (action_taken in ('edited', 'overridden', 'pending')),
  checked_at timestamptz default now()
);

create index if not exists idx_crisis_checks_post on crisis_checks (post_id);

-- =========================================
-- Voice transcription logs
-- =========================================
create table if not exists voice_transcriptions (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete set null,
  raw_transcript text not null,
  polished_text text,
  duration_seconds numeric,
  created_at timestamptz default now()
);

-- =========================================
-- Competitor tracking for advanced analytics
-- =========================================
create table if not exists competitor_accounts (
  id uuid primary key default uuid_generate_v4(),
  platform text not null,
  handle text not null,
  display_name text,
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(platform, handle)
);

create table if not exists competitor_metrics (
  id uuid primary key default uuid_generate_v4(),
  competitor_id uuid not null references competitor_accounts(id) on delete cascade,
  followers integer default 0,
  engagement_rate numeric(5,2) default 0,
  posts_count integer default 0,
  avg_likes integer default 0,
  avg_comments integer default 0,
  recorded_at timestamptz default now()
);

create index if not exists idx_competitor_metrics_competitor on competitor_metrics (competitor_id);

-- =========================================
-- RLS policies for new tables
-- =========================================
alter table competitor_analyses enable row level security;
alter table crisis_checks enable row level security;
alter table voice_transcriptions enable row level security;
alter table competitor_accounts enable row level security;
alter table competitor_metrics enable row level security;

create policy "Service role full access on competitor_analyses"
  on competitor_analyses for all using (true) with check (true);

create policy "Service role full access on crisis_checks"
  on crisis_checks for all using (true) with check (true);

create policy "Service role full access on voice_transcriptions"
  on voice_transcriptions for all using (true) with check (true);

create policy "Service role full access on competitor_accounts"
  on competitor_accounts for all using (true) with check (true);

create policy "Service role full access on competitor_metrics"
  on competitor_metrics for all using (true) with check (true);
