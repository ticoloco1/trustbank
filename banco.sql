-- ============================================================
-- TRUSTBANK — Complete Database Setup
-- Run in Supabase SQL Editor
-- ============================================================

-- MINI SITES
create table if not exists mini_sites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  slug text unique not null,
  site_name text,
  bio text,
  avatar_url text,
  banner_url text,
  bg_image_url text,
  theme text default 'midnight',
  accent_color text default '#818cf8',
  font_size text default 'md',
  photo_shape text default 'round',
  published boolean default false,
  show_cv boolean default false,
  cv_content text,
  cv_headline text,
  cv_location text,
  cv_skills text[] default '{}',
  cv_experience jsonb default '[]',
  cv_education jsonb default '[]',
  contact_email text,
  contact_phone text,
  contact_price numeric default 20,
  module_order text[] default array['links','videos','cv'],
  template_id text default 'blank',
  text_color text,
  video_cols int default 2,
  photo_size text default 'md',
  font_style text default 'sans',
  cv_locked boolean default true,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- MINI SITE LINKS
create table if not exists mini_site_links (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references mini_sites on delete cascade not null,
  user_id uuid references auth.users,
  title text not null,
  url text not null,
  icon text default 'link',
  sort_order int default 0,
  created_at timestamptz default now()
);

-- MINI SITE VIDEOS
create table if not exists mini_site_videos (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references mini_sites on delete cascade not null,
  title text,
  youtube_video_id text not null,
  paywall_enabled boolean default false,
  paywall_price numeric default 0.15,
  nft_enabled boolean default false,
  nft_price numeric default 0,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- FEED POSTS
create table if not exists feed_posts (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references mini_sites on delete cascade,
  user_id uuid references auth.users not null,
  text text not null,
  image_url text,
  pinned boolean default false,
  pinned_until timestamptz,
  expires_at timestamptz default (now() + interval '7 days'),
  created_at timestamptz default now()
);

-- SLUG REGISTRATIONS
create table if not exists slug_registrations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  slug text not null unique,
  status text default 'active',
  registration_fee numeric default 12,
  renewal_fee numeric default 12,
  expires_at timestamptz default (now() + interval '1 year'),
  created_at timestamptz default now()
);

-- PREMIUM SLUGS
create table if not exists premium_slugs (
  id uuid default gen_random_uuid() primary key,
  slug text unique,
  keyword text,
  price numeric not null,
  active boolean default true,
  sold_to uuid references auth.users,
  sold_at timestamptz,
  created_at timestamptz default now()
);

-- SUBSCRIPTIONS
create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  plan text not null,
  price numeric not null,
  status text default 'active',
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- CLASSIFIED LISTINGS
create table if not exists classified_listings (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references mini_sites,
  user_id uuid references auth.users not null,
  type text not null,
  title text not null,
  description text,
  price numeric,
  images jsonb default '[]',
  extra jsonb default '{}',
  location text,
  status text default 'active',
  created_at timestamptz default now()
);

-- USER ROLES
create table if not exists user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  role text not null default 'user',
  created_at timestamptz default now(),
  unique(user_id, role)
);

-- PLATFORM SETTINGS
create table if not exists platform_settings (
  id int primary key default 1,
  site_name text default 'TrustBank',
  site_logo_url text,
  commission_paywall numeric default 40,
  commission_cv_unlock numeric default 40,
  annual_plan_price numeric default 239.90,
  monthly_plan_price numeric default 29.90,
  updated_at timestamptz default now()
);
insert into platform_settings (id) values (1) on conflict (id) do nothing;

-- PAYWALL UNLOCKS
create table if not exists paywall_unlocks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  video_id uuid references mini_site_videos on delete cascade,
  amount_paid numeric,
  expires_at timestamptz default (now() + interval '12 hours'),
  created_at timestamptz default now()
);

-- NOTIFICATIONS
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text not null,
  title text,
  message text,
  read boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- RLS
-- ============================================================

alter table mini_sites enable row level security;
alter table mini_site_links enable row level security;
alter table mini_site_videos enable row level security;
alter table feed_posts enable row level security;
alter table slug_registrations enable row level security;
alter table premium_slugs enable row level security;
alter table subscriptions enable row level security;
alter table classified_listings enable row level security;
alter table user_roles enable row level security;
alter table paywall_unlocks enable row level security;
alter table notifications enable row level security;

-- mini_sites: owner full access, public can read published
drop policy if exists "own_sites" on mini_sites;
drop policy if exists "read_published" on mini_sites;
drop policy if exists "insert_own" on mini_sites;
drop policy if exists "update_own" on mini_sites;
drop policy if exists "delete_own" on mini_sites;

create policy "insert_own" on mini_sites for insert with check (auth.uid() = user_id);
create policy "update_own" on mini_sites for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own" on mini_sites for delete using (auth.uid() = user_id);
create policy "read_own_or_published" on mini_sites for select using (auth.uid() = user_id or published = true);

-- links
drop policy if exists "own_links" on mini_site_links;
drop policy if exists "read_links" on mini_site_links;
create policy "own_links" on mini_site_links for all using (auth.uid() = (select user_id from mini_sites where id = site_id));
create policy "read_links" on mini_site_links for select using (true);

-- videos
drop policy if exists "own_videos" on mini_site_videos;
drop policy if exists "read_videos" on mini_site_videos;
create policy "own_videos" on mini_site_videos for all using (auth.uid() = (select user_id from mini_sites where id = site_id));
create policy "read_videos" on mini_site_videos for select using (true);

-- feed
drop policy if exists "own_posts" on feed_posts;
drop policy if exists "read_posts" on feed_posts;
create policy "own_posts" on feed_posts for all using (auth.uid() = user_id);
create policy "read_posts" on feed_posts for select using (true);

-- slugs
drop policy if exists "own_regs" on slug_registrations;
drop policy if exists "read_regs" on slug_registrations;
create policy "own_regs" on slug_registrations for all using (auth.uid() = user_id);
create policy "read_regs" on slug_registrations for select using (true);

drop policy if exists "read_premium" on premium_slugs;
create policy "read_premium" on premium_slugs for select using (active = true);
create policy "admin_premium" on premium_slugs for all using (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));

-- subscriptions
drop policy if exists "own_sub" on subscriptions;
create policy "own_sub" on subscriptions for all using (auth.uid() = user_id);

-- classified
drop policy if exists "own_cl" on classified_listings;
drop policy if exists "read_cl" on classified_listings;
create policy "own_cl" on classified_listings for all using (auth.uid() = user_id);
create policy "read_cl" on classified_listings for select using (status = 'active');

-- roles
drop policy if exists "own_role" on user_roles;
create policy "own_role" on user_roles for select using (auth.uid() = user_id);
create policy "admin_roles" on user_roles for all using (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));

-- notifications
drop policy if exists "own_notifs" on notifications;
create policy "own_notifs" on notifications for all using (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('platform-assets', 'platform-assets', true)
on conflict (id) do nothing;

drop policy if exists "upload_auth" on storage.objects;
drop policy if exists "read_public" on storage.objects;
create policy "upload_auth" on storage.objects for insert with check (bucket_id = 'platform-assets' and auth.role() = 'authenticated');
create policy "read_public" on storage.objects for select using (bucket_id = 'platform-assets');
create policy "delete_own" on storage.objects for delete using (auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_mini_sites_user on mini_sites(user_id);
create index if not exists idx_mini_sites_slug on mini_sites(slug);
create index if not exists idx_mini_sites_updated on mini_sites(updated_at desc);
create index if not exists idx_links_site on mini_site_links(site_id);
create index if not exists idx_videos_site on mini_site_videos(site_id);
create index if not exists idx_cl_type on classified_listings(type, status);
create index if not exists idx_slug_reg on slug_registrations(slug, status);
create index if not exists idx_feed_site on feed_posts(site_id, created_at desc);

-- ============================================================
-- TRIGGER: auto create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  -- Auto-create a mini site for new users
  insert into public.mini_sites (user_id, slug, site_name, published)
  values (
    new.id,
    regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]', '', 'g') || substr(new.id::text, 1, 6),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    false
  )
  on conflict (slug) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ADD YOURSELF AS ADMIN (replace with your email)
-- ============================================================
-- insert into user_roles (user_id, role)
-- select id, 'admin' from auth.users where email = 'your@email.com'
-- on conflict (user_id, role) do nothing;
