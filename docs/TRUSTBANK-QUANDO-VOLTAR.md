# TrustBank — quando voltar ao projeto

Checklist rápido para deixar o TrustBank (trustbank.xyz / prime-fin-dash) funcionando de novo.

---

## 1. Variáveis no .env.local

Na raiz do projeto deve existir `.env.local` com:

- `NEXT_PUBLIC_USE_PRISMA=true`
- `DATABASE_URL` = URL do Postgres (Vercel Storage → banco → Show secret da POSTGRES_URL)

Se faltar, rode no terminal (uma vez):

```bash
cd /Users/arycorreiafilho/Desktop/hashpo-next/royal-fintech-hub
vercel env pull .env.local
```

---

## 2. Banco e seed (Prisma)

Schema inclui: **platform_settings**, **mini_sites** (com cotação: `cotacao_symbol`, `cotacao_label`), **ideas** (ideias por mini site), **admin_wallet_addresses**. Sempre use **Prisma 5** (não use `npx prisma` sozinho se tiver Prisma 7 global).

```bash
cd /Users/arycorreiafilho/Desktop/hashpo-next/royal-fintech-hub
npm run db:push
npm run db:seed
```

Ou manualmente (carregando o .env.local):

```bash
export $(grep -v '^#' .env.local | xargs) && npx prisma@5 db push
ADMIN_WALLET=0xf841d9F5ba7eac3802e9A476a85775e23d084BBe node prisma/seed.js
```

---

## 3. Vercel (produção)

- Projeto: **prime-fin-dash** (ou o que estiver ligado ao trustbank.xyz).
- **Environment Variables** em Production:
  - `DATABASE_URL` = mesma URL do banco.
  - `NEXT_PUBLIC_USE_PRISMA` = `true`.
- Depois: **Redeploy** (Deployments → ⋮ → Redeploy).

---

## 4. Deploy pelo terminal

```bash
cd /Users/arycorreiafilho/Desktop/hashpo-next/royal-fintech-hub
vercel --prod
```

---

## 5. Testar

Abrir **https://trustbank.xyz**: nome "TrustBank" no topo; conectar a carteira; Governance deve aparecer para a wallet admin.

---

## Resumo (ordem)

| # | O quê |
|---|--------|
| 1 | `.env.local` com NEXT_PUBLIC_USE_PRISMA=true e DATABASE_URL (ou `vercel env pull .env.local`) |
| 2 | `npm run db:push` e `npm run db:seed` |
| 3 | Na Vercel: DATABASE_URL e NEXT_PUBLIC_USE_PRISMA=true em Production → Redeploy |
| 4 | `vercel --prod` (ou deploy pelo Git se o repo estiver conectado) |
| 5 | Testar em trustbank.xyz |
