# Instalação: banco e env juntos

O sistema foi ajustado para que **o banco e o código fiquem sempre alinhados** no deploy.

---

## Como funciona agora

1. **Você configura no Vercel** (uma vez):
   - **Settings → Environment Variables** → `DATABASE_URL` = connection string do Postgres (ex.: do Prisma Postgres / Vercel Storage).

2. **A cada deploy**, o Vercel roda:
   - `prisma generate` → gera o cliente Prisma
   - `prisma db push` → **atualiza o banco de produção** para ficar igual ao `schema.prisma` (cria tabelas/colunas que faltam)
   - `next build` → gera o build do Next.js

Ou seja: **quem “instala” o banco no deploy é o próprio `prisma db push`**. Não precisa rodar SQL à mão em produção, desde que a `DATABASE_URL` esteja certa no Vercel.

---

## Ordem lógica

- **Primeiro:** criar o banco (Vercel Storage → Create Database → Prisma Postgres).
- **Depois:** no projeto no Vercel, colocar **DATABASE_URL** (e outras env que o app precise).
- **A partir daí:** a cada **git push** (ou deploy manual), o build roda `prisma db push` e o banco fica alinhado ao código. O .env você “coloca depois” só no sentido de configurar no painel do Vercel; o app em si usa essa env no build e em runtime.

---

## Se o banco já existia desatualizado

- **Opção A:** Fazer um novo deploy (com a `DATABASE_URL` já configurada). O `prisma db push` no build deve criar/ajustar tabelas e colunas.
- **Opção B:** Se por algum motivo o push falhar ou você quiser corrigir à mão uma vez, use o script **`docs/ATUALIZAR_BANCO_PRODUCAO.sql`** no Postgres (como antes). Depois disso, os próximos deploys continuam usando só `prisma db push`.

---

## Resumo

- **Instalação do sistema** = deploy no Vercel com `DATABASE_URL` configurada.
- **O banco “opera junto”** porque o build executa `prisma db push` antes do `next build`, usando essa mesma `DATABASE_URL`.
