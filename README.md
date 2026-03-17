# TrustBank

trustbank.xyz — mini sites, paywall, marketplace de slugs.

## Começar

1. Clone o repositório e instale dependências:
   ```bash
   npm install
   ```

2. Configure `.env.local`:
   - `DATABASE_URL` — Postgres
   - `SESSION_SECRET` — string aleatória longa

3. Banco e app:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

Guia completo: **[docs/RECOMECAR-TRUSTBANK.md](docs/RECOMECAR-TRUSTBANK.md)**
