-- ============================================================
-- TRUSTBANK — Credits + Jackpot Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Credit wallets (every user has a balance in credits)
-- 1 credit = $0.01 USDC
create table if not exists credit_wallets (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users unique not null,
  balance    bigint default 0,  -- in credits (cents of USDC)
  total_purchased bigint default 0,
  total_spent    bigint default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Credit transactions log
create table if not exists credit_transactions (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users not null,
  type        text not null, -- 'purchase' | 'spend' | 'refund' | 'jackpot_win'
  amount      bigint not null,    -- positive = credit, negative = debit
  usdc_amount numeric,            -- USDC equivalent
  description text,
  ref_id      text,               -- payment tx hash or boost id
  created_at  timestamptz default now()
);

-- 3. Jackpot pool
create table if not exists jackpot_pool (
  id            uuid default gen_random_uuid() primary key,
  balance_usdc  numeric default 0,     -- accumulated USDC
  total_entries bigint default 0,      -- total boost entries (tickets)
  enabled       boolean default true,
  draw_triggered_at timestamptz,
  last_draw_at  timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Ensure single row
insert into jackpot_pool (id) values ('00000000-0000-0000-0000-000000000001') on conflict do nothing;

-- 4. Jackpot entries (each boost gives entries proportional to amount)
create table if not exists jackpot_entries (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users not null,
  boost_id    uuid references boosts,
  tickets     bigint not null,   -- 1 ticket per $0.50 boost (20% of boost goes to jackpot)
  draw_id     uuid,              -- null = active pool, uuid = historical draw
  created_at  timestamptz default now()
);

-- 5. Jackpot draws history
create table if not exists jackpot_draws (
  id            uuid default gen_random_uuid() primary key,
  total_prize_usdc numeric not null,
  total_entries bigint not null,
  winners       jsonb not null default '[]',
  -- winners format: [{user_id, place, prize_usdc, tickets}]
  triggered_by  uuid references auth.users, -- admin who triggered
  seed          text,  -- random seed used (for transparency)
  created_at    timestamptz default now()
);

-- 6. RLS
alter table credit_wallets      enable row level security;
alter table credit_transactions  enable row level security;
alter table jackpot_pool         enable row level security;
alter table jackpot_entries      enable row level security;
alter table jackpot_draws        enable row level security;

create policy "own_wallet"    on credit_wallets      for all    using (auth.uid() = user_id);
create policy "own_txns"      on credit_transactions for all    using (auth.uid() = user_id);
create policy "read_jackpot"  on jackpot_pool        for select using (true);
create policy "admin_jackpot" on jackpot_pool        for all    using (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));
create policy "read_entries"  on jackpot_entries     for select using (auth.uid() = user_id);
create policy "insert_entry" on jackpot_entries for insert with check (
  auth.uid() = user_id AND
  exists (
    select 1 from mini_sites
    where user_id = auth.uid() and published = true
  )
);
create policy "read_draws"    on jackpot_draws       for select using (true);
create policy "admin_draws"   on jackpot_draws       for all    using (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));

-- 7. Add jackpot settings to platform_settings
insert into platform_settings (key, value) values
  ('jackpot_enabled', 'true'),
  ('jackpot_boost_percent', '20'),    -- 20% of each boost goes to jackpot
  ('jackpot_platform_cut', '15'),     -- 15% of jackpot to platform before distribution
  ('jackpot_min_draw', '100'),        -- minimum $100 USDC to allow draw
  ('jackpot_max_winners', '20'),
  ('jackpot_first_prize_percent', '50') -- 1st place gets 50% of prize pool
on conflict (key) do nothing;

-- 8. Function: auto-create credit wallet on new user
create or replace function public.create_credit_wallet()
returns trigger language plpgsql security definer as $$
begin
  insert into public.credit_wallets (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_credit_wallet on auth.users;
create trigger on_auth_user_credit_wallet
  after insert on auth.users
  for each row execute procedure public.create_credit_wallet();

-- 9. Indexes
create index if not exists idx_credit_txns_user on credit_transactions(user_id, created_at desc);
create index if not exists idx_jackpot_entries_draw on jackpot_entries(draw_id, user_id);
create index if not exists idx_jackpot_entries_user on jackpot_entries(user_id);

-- ============================================================
-- JACKPOT DRAW FUNCTION (run by admin via service role)
-- ============================================================
create or replace function public.run_jackpot_draw(admin_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  pool_rec       record;
  platform_cut   numeric;
  prize_pool     numeric;
  first_prize    numeric;
  entries_agg    jsonb;
  winners        jsonb := '[]';
  total_tickets  bigint;
  draw_id        uuid := gen_random_uuid();
  seed           text := md5(random()::text || now()::text);
  winner_slots   int[] := ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
  pct_table      numeric[] := ARRAY[50,20,12,4,3,2.5,2,1.5,1,0.8,0.7,0.6,0.5,0.5,0.4,0.4,0.3,0.3,0.2,0.2];
  i              int;
  running_ticket bigint;
  rand_ticket    bigint;
  winner_id      uuid;
  prize_for_place numeric;
  already_won    uuid[];
begin
  -- Get pool
  select * into pool_rec from jackpot_pool limit 1;
  if not found or pool_rec.balance_usdc < 100 then
    raise exception 'Pool too small or not found';
  end if;

  -- Calculate prizes
  platform_cut := pool_rec.balance_usdc * 0.15;
  prize_pool   := pool_rec.balance_usdc - platform_cut;
  total_tickets := pool_rec.total_entries;

  if total_tickets = 0 then
    raise exception 'No entries';
  end if;

  -- For each prize slot, pick a random winner (weighted by tickets)
  for i in 1..20 loop
    prize_for_place := prize_pool * (pct_table[i] / 100.0);
    if prize_for_place < 0.01 then continue; end if;

    -- Pick random ticket number
    rand_ticket := floor(random() * total_tickets)::bigint + 1;
    running_ticket := 0;
    winner_id := null;

    -- Walk entries to find owner of that ticket (weighted random)
    select je.user_id into winner_id
    from (
      select user_id, sum(tickets) over (order by created_at) as cumulative
      from jackpot_entries
      where draw_id is null
      order by created_at
    ) je
    where je.cumulative >= rand_ticket
    limit 1;

    -- Skip if already won or no published site
    if winner_id is null then continue; end if;
    if winner_id = any(already_won) then continue; end if;
    if not exists (select 1 from mini_sites where user_id = winner_id and published = true) then continue; end if;

    already_won := array_append(already_won, winner_id);
    winners := winners || jsonb_build_object(
      'user_id', winner_id,
      'place', i,
      'prize_usdc', prize_for_place
    );
  end loop;

  -- Record draw
  insert into jackpot_draws (id, total_prize_usdc, total_entries, winners, triggered_by, seed)
  values (draw_id, prize_pool, total_tickets, winners, admin_id, seed);

  -- Mark entries as used
  update jackpot_entries set draw_id = draw_id where draw_id is null;

  -- Reset pool
  update jackpot_pool set balance_usdc = 0, total_entries = 0, last_draw_at = now();

  return jsonb_build_object(
    'draw_id', draw_id,
    'prize_pool', prize_pool,
    'platform_cut', platform_cut,
    'winners', winners,
    'seed', seed
  );
end;
$$;

-- ============================================================
-- VIDEO VIEWS TABLE (referenced in video-token API)
-- ============================================================
create table if not exists video_views (
  id         uuid default gen_random_uuid() primary key,
  video_id   uuid references mini_site_videos on delete cascade,
  user_id    uuid references auth.users,
  site_slug  text,
  created_at timestamptz default now()
);
alter table video_views enable row level security;
create policy "own_views" on video_views for select using (auth.uid() = user_id);
create index if not exists idx_video_views on video_views(video_id, created_at desc);

-- ============================================================
-- ADD_TO_JACKPOT FUNCTION (called by webhook)
-- ============================================================
create or replace function public.add_to_jackpot(usdc_amount numeric, ticket_count bigint)
returns void language plpgsql security definer as $$
begin
  update jackpot_pool
  set balance_usdc  = balance_usdc + usdc_amount,
      total_entries = total_entries + ticket_count,
      updated_at    = now()
  where id = '00000000-0000-0000-0000-000000000001';
end;
$$;

-- ============================================================
-- INCREMENT_BOOST_SCORE FUNCTION (for classifieds)
-- ============================================================
create or replace function public.increment_boost_score(listing_id uuid, amount numeric)
returns void language plpgsql security definer as $$
begin
  update classified_listings
  set boost_score = boost_score + amount,
      boost_expires_at = greatest(coalesce(boost_expires_at, now()), now()) + interval '7 days'
  where id = listing_id;
end;
$$;
