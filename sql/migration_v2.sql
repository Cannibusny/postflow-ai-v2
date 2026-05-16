-- PostFlow AI Pro — Phase 1 Migration
-- Run this in the Supabase SQL Editor for project: peggccsshifakrfuyowi
-- This adds multi-platform support, queue system, and enhanced fields

-- =========================================
-- Add new columns to posts table
-- =========================================
alter table posts add column if not exists platforms jsonb default '["instagram"]'::jsonb;
alter table posts add column if not exists media_urls jsonb default '[]'::jsonb;
alter table posts add column if not exists hashtags text[] default '{}';
alter table posts add column if not exists first_comment text;
alter table posts add column if not exists queue_position integer;
alter table posts add column if not exists campaign text;
alter table posts add column if not exists platform_customizations jsonb default '{}'::jsonb;

-- Remove the week_number NOT NULL constraint (make optional for new flow)
alter table posts alter column week_number drop not null;
alter table posts alter column week_number set default null;

-- Index for queue ordering
create index if not exists idx_posts_queue_position
  on posts (queue_position)
  where queue_position is not null and status = 'scheduled';

-- =========================================
-- Queue settings table
-- =========================================
create table if not exists queue_settings (
  id uuid primary key default uuid_generate_v4(),
  platform text not null,
  day_of_week integer not null check (day_of_week between 0 and 6),
  time_slot time not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(platform, day_of_week, time_slot)
);

alter table queue_settings enable row level security;
create policy "Service role full access on queue_settings"
  on queue_settings for all using (true) with check (true);

-- =========================================
-- Update the selected_variant constraint to allow more variants
-- =========================================
alter table posts drop constraint if exists posts_selected_variant_check;
alter table posts add constraint posts_selected_variant_check check (selected_variant between 0 and 9);

-- Update caption_variants to allow more label types
alter table caption_variants drop constraint if exists caption_variants_variant_label_check;
alter table caption_variants add constraint caption_variants_variant_label_check
  check (variant_label in ('Direct', 'Storytelling', 'Challenge', 'Enthusiastic', 'Educational', 'Conversational'));
