-- ============================================================
-- TRUSTBANK — Slug System Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add for_sale fields to slug_registrations
alter table slug_registrations
  add column if not exists for_sale    boolean  default false,
  add column if not exists sale_price  numeric  default 0,
  add column if not exists renewal_fee numeric  default 12;

-- 2. Slug auctions table
create table if not exists slug_auctions (
  id            uuid default gen_random_uuid() primary key,
  slug          text not null unique,
  owner_id      uuid references auth.users,
  min_bid       numeric not null default 10,
  current_bid   numeric,
  current_bidder uuid references auth.users,
  min_increment numeric default 5,
  bid_count     int default 0,
  status        text default 'active', -- active | ended | cancelled
  ends_at       timestamptz not null,
  created_at    timestamptz default now()
);

-- 3. Bid history
create table if not exists slug_bids (
  id         uuid default gen_random_uuid() primary key,
  auction_id uuid references slug_auctions on delete cascade,
  bidder_id  uuid references auth.users,
  amount     numeric not null,
  created_at timestamptz default now()
);

-- 4. RLS
alter table slug_auctions enable row level security;
alter table slug_bids     enable row level security;

create policy "read_auctions"  on slug_auctions for select using (true);
create policy "own_auctions"   on slug_auctions for all   using (auth.uid() = owner_id);
create policy "read_bids"      on slug_bids     for select using (true);
create policy "insert_bid"     on slug_bids     for insert with check (auth.uid() = bidder_id);

-- 5. Indexes
create index if not exists idx_auctions_status  on slug_auctions(status, ends_at);
create index if not exists idx_slug_forsale      on slug_registrations(for_sale, status);

-- 6. BULK INSERT helper for admin
-- To register many slugs at once, run:
-- insert into premium_slugs (slug, price) values
--   ('ceo', 5000), ('dev', 3000), ('art', 3000), ('fit', 3000),
--   ('pro', 3000), ('vip', 3000), ('boss', 1500), ('king', 1500),
--   ('guru', 1500), ('star', 1500), ('tech', 500), ('shop', 500),
--   ('foto', 500), ('casa', 500), ('cars', 500)
-- on conflict (slug) do nothing;
