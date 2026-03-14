# TrustBank.xyz → Prisma Postgres – Setup

## 1. Variáveis no Vercel (projeto trustbank.xyz)

No projeto da Vercel:

- **DATABASE_URL** = connection string do Postgres (Storage → prisma-postgres-chestnut-chair).
- **NEXT_PUBLIC_USE_PRISMA** = `true` (para o app usar settings via API/Prisma).
- Manter **NEXT_PUBLIC_SUPABASE_URL** e **NEXT_PUBLIC_SUPABASE_ANON_KEY** para auth (login por wallet).

## 2. Criar tabelas no Postgres

Opção A – Prisma (recomendado):

```bash
# Com DATABASE_URL no .env apontando para o Postgres da Vercel
npx prisma db push
```

Opção B – SQL manual no console do banco:

Execute no SQL Editor do Postgres (Vercel/Neon):

```sql
-- Tabela mínima para platform_settings (trustbank)
CREATE TABLE IF NOT EXISTS platform_settings (
  id integer PRIMARY KEY DEFAULT 1,
  platform_name text,
  logo_url text,
  hero_text text,
  grid_columns integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Inserir registro padrão
INSERT INTO platform_settings (id, platform_name, grid_columns, updated_at)
VALUES (1, 'TrustBank', 4, now())
ON CONFLICT (id) DO NOTHING;
```

## 3. Comportamento do app

- Com **NEXT_PUBLIC_USE_PRISMA=true**: settings vêm de `/api/settings` (Prisma → Postgres).
- Sem essa variável: settings vêm do Supabase (comportamento atual HASHPO).
- Header e Admin usam `useSettings()` e `useUpdateSettings()`; no trustbank o branding (nome, logo) vem do Prisma.

## 4. Deploy

Após configurar as variáveis e criar as tabelas, faça redeploy do projeto na Vercel.
