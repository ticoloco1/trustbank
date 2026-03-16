-- Execute este SQL no Postgres de PRODUÇÃO (Vercel Postgres, Supabase, etc.)
-- para que o schema fique igual ao Prisma e os erros 500 parem.
-- Cole no SQL Editor e rode em sequência.

-- ========== 1. platform_settings: colunas que faltam ==========
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_settings' AND column_name='google_client_id') THEN
    ALTER TABLE platform_settings ADD COLUMN google_client_id TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_settings' AND column_name='google_client_secret') THEN
    ALTER TABLE platform_settings ADD COLUMN google_client_secret TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_settings' AND column_name='youtube_api_key') THEN
    ALTER TABLE platform_settings ADD COLUMN youtube_api_key TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_settings' AND column_name='slug_claim_default_usd') THEN
    ALTER TABLE platform_settings ADD COLUMN slug_claim_default_usd TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_settings' AND column_name='slug_claim_premium_usd') THEN
    ALTER TABLE platform_settings ADD COLUMN slug_claim_premium_usd TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_settings' AND column_name='slug_claim_letter_usd') THEN
    ALTER TABLE platform_settings ADD COLUMN slug_claim_letter_usd TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_settings' AND column_name='slug_allowed_override') THEN
    ALTER TABLE platform_settings ADD COLUMN slug_allowed_override JSONB;
  END IF;
END $$;

-- ========== 2. mini_sites: colunas que faltam ==========
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='mini_sites' AND column_name='template') THEN
    ALTER TABLE mini_sites ADD COLUMN template TEXT DEFAULT 'default';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='mini_sites' AND column_name='ticker_bar_color') THEN
    ALTER TABLE mini_sites ADD COLUMN ticker_bar_color TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='mini_sites' AND column_name='content_order') THEN
    ALTER TABLE mini_sites ADD COLUMN content_order TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='mini_sites' AND column_name='banner_url') THEN
    ALTER TABLE mini_sites ADD COLUMN banner_url TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='mini_sites' AND column_name='feed_image_1') THEN
    ALTER TABLE mini_sites ADD COLUMN feed_image_1 TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='mini_sites' AND column_name='feed_image_2') THEN
    ALTER TABLE mini_sites ADD COLUMN feed_image_2 TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='mini_sites' AND column_name='feed_image_3') THEN
    ALTER TABLE mini_sites ADD COLUMN feed_image_3 TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='mini_sites' AND column_name='feed_image_4') THEN
    ALTER TABLE mini_sites ADD COLUMN feed_image_4 TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='mini_sites' AND column_name='gallery_images') THEN
    ALTER TABLE mini_sites ADD COLUMN gallery_images JSONB;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='mini_sites' AND column_name='club_nft_contract') THEN
    ALTER TABLE mini_sites ADD COLUMN club_nft_contract TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='mini_sites' AND column_name='club_nft_name') THEN
    ALTER TABLE mini_sites ADD COLUMN club_nft_name TEXT;
  END IF;
END $$;

-- ========== 3. Tabela credit_balances (se não existir) ==========
CREATE TABLE IF NOT EXISTS credit_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL UNIQUE,
  balance_usdc TEXT NOT NULL DEFAULT '0',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== 4. Tabela credit_transactions (se não existir) ==========
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL,
  type TEXT NOT NULL,
  amount_usdc TEXT NOT NULL,
  balance_after TEXT,
  reference_type TEXT,
  reference_id TEXT,
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_wallet ON credit_transactions(wallet);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_wallet_created ON credit_transactions(wallet, created_at);
