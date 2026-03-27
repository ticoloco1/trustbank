-- ============================================================
-- TRUSTBANK — CV Fields Migration
-- Run in Supabase SQL Editor AFTER banco.sql
-- ============================================================

-- Add missing CV fields to mini_sites
alter table mini_sites
  add column if not exists cv_projects    jsonb    default '[]',
  add column if not exists cv_languages   jsonb    default '[]',
  add column if not exists cv_certificates jsonb   default '[]',
  add column if not exists cv_contact_whatsapp text,
  add column if not exists cv_hire_price  numeric  default 0,
  add column if not exists cv_hire_currency text   default 'BRL',
  add column if not exists cv_hire_type   text     default 'hora',
  add column if not exists cv_free        boolean  default true,
  add column if not exists cv_price       numeric  default 0,
  add column if not exists wallet_address text;

-- cv_free = true  → CV is visible for free
-- cv_free = false → CV is paywalled at cv_price (USDC)
-- cv_locked is kept for backwards compatibility (true = locked/paywalled)
-- Going forward use cv_free as the source of truth

comment on column mini_sites.cv_projects     is 'Array of {title, url, desc, year}';
comment on column mini_sites.cv_languages    is 'Array of {lang, level}';
comment on column mini_sites.cv_certificates is 'Array of {name, issuer, year, url}';
comment on column mini_sites.cv_free         is 'If true, CV is public. If false, requires payment.';
comment on column mini_sites.cv_price        is 'Price in USDC to unlock CV when cv_free = false';
comment on column mini_sites.cv_hire_price   is 'Rate the professional charges (displayed publicly)';
