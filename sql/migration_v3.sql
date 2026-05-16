-- PostFlow AI Pro — Phase 2 Migration
-- Run this in the Supabase SQL Editor for project: peggccsshifakrfuyowi
-- Adds approval workflows, team collaboration, social listening, reporting

-- =========================================
-- User roles & team members
-- =========================================
create table if not exists team_members (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  role text not null default 'creator' check (role in ('admin', 'creator', 'viewer')),
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table team_members enable row level security;
create policy "Service role full access on team_members"
  on team_members for all using (true) with check (true);

-- =========================================
-- Approval workflows
-- =========================================
-- Add approval fields to posts
alter table posts add column if not exists approval_status text default null
  check (approval_status in ('pending', 'approved', 'changes_requested', null));
alter table posts add column if not exists created_by uuid references team_members(id);
alter table posts add column if not exists approved_by uuid references team_members(id);
alter table posts add column if not exists approved_at timestamptz;
alter table posts add column if not exists assigned_to uuid references team_members(id);

-- Approval history / audit log
create table if not exists approval_log (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id) on delete cascade,
  actor_id uuid references team_members(id),
  action text not null check (action in ('created', 'submitted', 'approved', 'changes_requested', 'resubmitted', 'edited')),
  notes text,
  created_at timestamptz default now()
);

alter table approval_log enable row level security;
create policy "Service role full access on approval_log"
  on approval_log for all using (true) with check (true);

create index if not exists idx_approval_log_post on approval_log (post_id);

-- =========================================
-- Internal notes (team collaboration)
-- =========================================
create table if not exists post_notes (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid references team_members(id),
  content text not null,
  created_at timestamptz default now()
);

alter table post_notes enable row level security;
create policy "Service role full access on post_notes"
  on post_notes for all using (true) with check (true);

create index if not exists idx_post_notes_post on post_notes (post_id);

-- =========================================
-- Activity feed
-- =========================================
create table if not exists activity_feed (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references team_members(id),
  action text not null,
  entity_type text not null check (entity_type in ('post', 'note', 'approval', 'queue', 'report', 'mention')),
  entity_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table activity_feed enable row level security;
create policy "Service role full access on activity_feed"
  on activity_feed for all using (true) with check (true);

create index if not exists idx_activity_feed_created on activity_feed (created_at desc);

-- =========================================
-- Social listening / monitoring
-- =========================================
create table if not exists monitoring_keywords (
  id uuid primary key default uuid_generate_v4(),
  keyword text not null,
  type text not null default 'keyword' check (type in ('keyword', 'hashtag', 'brand', 'competitor')),
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table monitoring_keywords enable row level security;
create policy "Service role full access on monitoring_keywords"
  on monitoring_keywords for all using (true) with check (true);

create table if not exists mentions (
  id uuid primary key default uuid_generate_v4(),
  platform text not null,
  author_name text not null,
  author_handle text,
  author_avatar text,
  content text not null,
  source_url text,
  sentiment text default 'neutral' check (sentiment in ('positive', 'neutral', 'negative')),
  is_read boolean default false,
  is_archived boolean default false,
  assigned_to uuid references team_members(id),
  tags text[] default '{}',
  matched_keyword text,
  created_at timestamptz default now()
);

alter table mentions enable row level security;
create policy "Service role full access on mentions"
  on mentions for all using (true) with check (true);

create index if not exists idx_mentions_created on mentions (created_at desc);
create index if not exists idx_mentions_sentiment on mentions (sentiment);

-- =========================================
-- Reports
-- =========================================
create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  template text not null default 'executive' check (template in ('executive', 'detailed', 'comparison')),
  date_range_start date not null,
  date_range_end date not null,
  platforms jsonb default '["instagram"]'::jsonb,
  metrics jsonb default '["impressions","engagement","followers","clicks"]'::jsonb,
  white_label boolean default false,
  logo_url text,
  generated_url text,
  status text default 'draft' check (status in ('draft', 'generating', 'ready', 'failed')),
  created_at timestamptz default now()
);

alter table reports enable row level security;
create policy "Service role full access on reports"
  on reports for all using (true) with check (true);

-- =========================================
-- Scheduled reports
-- =========================================
create table if not exists scheduled_reports (
  id uuid primary key default uuid_generate_v4(),
  report_template text not null default 'executive',
  frequency text not null default 'weekly' check (frequency in ('daily', 'weekly', 'monthly')),
  day_of_week integer check (day_of_week between 0 and 6),
  time_of_day time not null default '09:00',
  recipients text[] not null default '{}',
  platforms jsonb default '["instagram"]'::jsonb,
  is_active boolean default true,
  last_run_at timestamptz,
  created_at timestamptz default now()
);

alter table scheduled_reports enable row level security;
create policy "Service role full access on scheduled_reports"
  on scheduled_reports for all using (true) with check (true);
