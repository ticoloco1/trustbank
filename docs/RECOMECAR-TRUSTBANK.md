# TrustBank — Guia

Um projeto, um nome, um deploy.

---

## 1. O que é

- **Produto:** TrustBank (trustbank.xyz)
- **Este repositório:** código do TrustBank.
- **Deploy:** um projeto na Vercel conectado a este repositório, servindo trustbank.xyz.

---

## 2. Passo a passo (recomeço limpo)

### No seu PC

1. **Repositório**
   - Use este repositório como o único do TrustBank.
   - Se quiser um repo “novo” no GitHub: crie um repo vazio (ex.: `ticoloco1/trustbank`), adicione como remote e faça push deste código:
   ```bash
   git remote add trustbank https://github.com/ticoloco1/trustbank.git
   git push -u trustbank main
   ```

2. **Variáveis de ambiente (`.env.local`)**
   - `DATABASE_URL` — Postgres (ex.: Vercel Postgres ou Neon).
   - `SESSION_SECRET` — string aleatória longa (login próprio).
   - Opcional: `ADMIN_WALLET`, `NEXT_PUBLIC_APP_URL` (ex.: https://trustbank.xyz).

3. **Banco**
   - Com `DATABASE_URL` no `.env.local`:
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   ```

4. **Rodar local**
   ```bash
   npm run dev
   ```
   - Abra http://localhost:3000 (ou a porta que aparecer). Deve carregar o TrustBank.

### Na Vercel

5. **Um projeto só para TrustBank**
   - Conecte o repositório do TrustBank (este código).
   - Domínio: trustbank.xyz (ou o que você usar).

6. **Environment Variables (Production)**
   - `DATABASE_URL` — mesmo Postgres de produção.
   - `SESSION_SECRET` — mesma ideia do .env.local.
   - Opcional: `ADMIN_WALLET`, `NEXT_PUBLIC_APP_URL` = https://trustbank.xyz.

7. **Build**
   - Build Command: `npm run build` (ou `prisma generate && next build` se não tiver no script).
   - Root Directory: `/` (raiz do repo).
   - Não use “Override” em produção a menos que saiba o que está fazendo.

8. **Depois do primeiro deploy**
   - Se o banco de produção ainda não tiver as tabelas: rode `npx prisma db push` uma vez da sua máquina com `DATABASE_URL` de produção no `.env.local`, ou use o mesmo Postgres no Prisma Studio.

---

## 3. O que este código já tem (TrustBank)

- Login próprio (e-mail/senha) + wallet
- Mini sites em **/@slug** (ex.: trustbank.xyz/@meu-site)
- Dashboard (criar/editar mini site, vídeos, páginas extras, paywall, doação)
- Templates (default, profile, Netflix, CV Pro, etc.)
- Marketplace de slugs, páginas extras com fundos, cores, módulos

---

## 4. Regra

- Tudo que for “site oficial” do TrustBank sai **só** deste repositório.
- Na Vercel: **um** projeto = TrustBank = trustbank.xyz.

