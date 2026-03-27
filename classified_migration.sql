-- ============================================================
-- TRUSTBANK — Classified + Feed Toggle Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add region/country fields to classified_listings
alter table classified_listings
  add column if not exists region       text,   -- continent: Americas, Europe, Asia, etc
  add column if not exists country      text,   -- BR, US, PT, etc
  add column if not exists state_city   text,   -- "São Paulo, SP" or "New York, NY"
  add column if not exists currency     text    default 'BRL',
  add column if not exists subscription_status text default 'pending', -- pending | active | expired
  add column if not exists subscription_expires_at timestamptz,
  add column if not exists boost_score  numeric default 0,
  add column if not exists boost_expires_at timestamptz;

-- 2. Add feed toggle to mini_sites
alter table mini_sites
  add column if not exists show_feed    boolean default true,
  add column if not exists feed_enabled_global boolean default true; -- overridden by admin

-- 3. Platform settings table (admin controls)
create table if not exists platform_settings (
  key   text primary key,
  value text,
  updated_at timestamptz default now()
);

insert into platform_settings (key, value) values
  ('feed_enabled_global', 'true'),
  ('classified_monthly_fee', '1.00'),
  ('cv_directory_monthly_fee', '199.00'),
  ('cv_directory_included_unlocks', '20'),
  ('boost_price_per_position', '0.50'),
  ('boost_top_daily_fee', '50.00'),
  ('boost_drop_after_days', '7'),
  ('boost_drop_positions', '150')
on conflict (key) do nothing;

-- 4. CV directory subscriptions (companies)
create table if not exists cv_directory_subscriptions (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users not null,
  plan          text default 'business',      -- business | enterprise
  monthly_fee   numeric default 199,
  unlocks_included int default 20,
  unlocks_used  int default 0,
  status        text default 'active',         -- active | cancelled | expired
  expires_at    timestamptz,
  created_at    timestamptz default now()
);

-- 5. CV unlock log (tracks which company unlocked which CV)
create table if not exists cv_unlocks (
  id            uuid default gen_random_uuid() primary key,
  unlocker_id   uuid references auth.users not null,   -- company/recruiter
  site_id       uuid references mini_sites on delete cascade,
  amount_paid   numeric default 0,
  source        text default 'direct',                 -- direct | directory
  created_at    timestamptz default now()
);

-- 6. Boost table (for mini_sites, videos, classifieds)
create table if not exists boosts (
  id            uuid default gen_random_uuid() primary key,
  target_type   text not null,  -- site | video | classified
  target_id     uuid not null,
  booster_id    uuid references auth.users,
  amount        numeric not null,
  positions_gained int default 0,
  created_at    timestamptz default now()
);

-- 7. RLS
alter table platform_settings         enable row level security;
alter table cv_directory_subscriptions enable row level security;
alter table cv_unlocks                 enable row level security;
alter table boosts                     enable row level security;

create policy "read_settings"    on platform_settings for select using (true);
create policy "admin_settings"   on platform_settings for all   using (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));
create policy "own_cv_sub"       on cv_directory_subscriptions for all using (auth.uid() = user_id);
create policy "own_cv_unlocks"   on cv_unlocks for all using (auth.uid() = unlocker_id);
create policy "read_cv_unlocks"  on cv_unlocks for select using (exists (select 1 from mini_sites where id = site_id and user_id = auth.uid()));
create policy "insert_boost"     on boosts for insert with check (auth.uid() = booster_id);
create policy "read_boosts"      on boosts for select using (true);

-- 8. Indexes
create index if not exists idx_cl_region   on classified_listings(region, type, status);
create index if not exists idx_cl_country  on classified_listings(country, type, status);
create index if not exists idx_cl_boost    on classified_listings(boost_score desc, status);
create index if not exists idx_boosts_target on boosts(target_type, target_id);
