-- PostFlow AI — Supabase Schema
-- Run this in the Supabase SQL Editor for project: peggccsshifakrfuyowi

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =========================================
-- Posts table
-- =========================================
create table if not exists posts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  week_number integer not null check (week_number between 1 and 52),
  image_url text,
  image_emoji text default '📸',
  scheduled_date timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'posted', 'failed')),
  selected_variant integer default 0 check (selected_variant between 0 and 2),
  engagement_prediction integer default 50 check (engagement_prediction between 0 and 100),
  actual_engagement jsonb,
  instagram_post_id text,
  retry_count integer default 0,
  last_error text,
  created_at timestamptz default now(),
  posted_at timestamptz
);

-- Index for the scheduler to quickly find due posts
create index if not exists idx_posts_scheduled
  on posts (scheduled_date)
  where status = 'scheduled';

-- =========================================
-- Caption variants table
-- =========================================
create table if not exists caption_variants (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id) on delete cascade,
  variant_label text not null
    check (variant_label in ('Direct', 'Storytelling', 'Challenge')),
  caption_text text not null,
  created_at timestamptz default now()
);

create index if not exists idx_caption_variants_post
  on caption_variants (post_id);

-- =========================================
-- Analytics table
-- =========================================
create table if not exists analytics (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id) on delete cascade,
  instagram_post_id text,
  reach integer default 0,
  impressions integer default 0,
  saves integer default 0,
  shares integer default 0,
  comments integer default 0,
  likes integer default 0,
  fetched_at timestamptz default now()
);

create index if not exists idx_analytics_post
  on analytics (post_id);

-- =========================================
-- Posting log (for audit trail)
-- =========================================
create table if not exists posting_log (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id) on delete cascade,
  action text not null,
  status text not null,
  details jsonb,
  created_at timestamptz default now()
);

-- =========================================
-- Row Level Security (disable for service role usage)
-- =========================================
alter table posts enable row level security;
alter table caption_variants enable row level security;
alter table analytics enable row level security;
alter table posting_log enable row level security;

-- Allow full access for service role
create policy "Service role full access on posts"
  on posts for all using (true) with check (true);

create policy "Service role full access on caption_variants"
  on caption_variants for all using (true) with check (true);

create policy "Service role full access on analytics"
  on analytics for all using (true) with check (true);

create policy "Service role full access on posting_log"
  on posting_log for all using (true) with check (true);
