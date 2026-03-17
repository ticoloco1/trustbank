# Recriar o sistema do zero (mesmo repo)

Um único guia para ter **tudo** que existia desde o início, no mesmo repositório **prime-fin-dash**, sem perder tempo.

---

## O que este projeto já tem (desde o início)

- **Home** — busca de slugs, carrinho, links (Dashboard, Slugs, Marketplace, Créditos)
- **Slugs** — buscar/comprar `/@` e `/s`, verificar pagamento, criar mini-site
- **Carrinho** — itens, checkout (USDC ou cartão)
- **Dashboard** — listar mini-sites, criar, editar (templates, fotos, vídeos, páginas extras)
- **Mini-sites** — `/s/[slug]` e `/@slug`, SEO, temas, colunas
- **Credits** — saldo, depósito, saque, histórico (1 crédito = 1 USDC)
- **Auth** — wallet (admin), Google OAuth (login)
- **APIs** — payments, verify, slugs/check, mini-sites, credits, auth, etc.
- **Prisma** — schema completo (platform_settings, mini_sites, credits, videos, payments, etc.)
- **Build** — no deploy roda `prisma generate` + `prisma db push` + `next build` (banco e código sempre juntos)

Ou seja: **não falta código**. Só precisa **banco + env + deploy** alinhados.

---

## Passo a passo para recriar (mesmo repo)

### 1. Repositório

- Repo: **https://github.com/ticoloco1/prime-fin-dash**
- Não apague nada. Use esse repo como está (ou clone de novo se quiser começar do zero no seu PC).

```bash
git clone https://github.com/ticoloco1/prime-fin-dash.git
cd prime-fin-dash
npm install
```

---

### 2. Banco de dados (Postgres)

- **Vercel:** Storage → Create Database → **Prisma Postgres** (ou use um existente).
- Copie a **connection string** (POSTGRES_URL ou PRISMA_DATABASE_URL).  
  Essa URL será a **DATABASE_URL**.

---

### 3. Variáveis de ambiente (Vercel)

No projeto no Vercel (**prime-fin-dash**): **Settings → Environment Variables**.

Use o arquivo **`.env.example`** na raiz do repo como lista. No mínimo:

| Variável | Obrigatória | Exemplo / Observação |
|----------|-------------|----------------------|
| **DATABASE_URL** | Sim | `postgresql://...` (connection string do passo 2) |
| **ADMIN_WALLET** | Sim (para admin) | `0x...` — sua wallet para acessar o painel |

Opcionais (o app tem padrões):  
`NEXT_PUBLIC_APP_URL`, `PLATFORM_WALLET`, `POLYGON_RPC_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `YOUTUBE_API_KEY`, etc. — veja **.env.example**.

---

### 4. Deploy

- Conecte o Vercel ao repo **ticoloco1/prime-fin-dash** (se ainda não estiver).
- **Root Directory:** vazio (raiz do repo).
- **Build Command:** já está certo no `package.json`:  
  `prisma generate && prisma db push && next build`
- Faça **deploy** (push para `main` ou “Redeploy” no Vercel).

No build, o Vercel usa a **DATABASE_URL** → roda **prisma db push** → cria/atualiza todas as tabelas no banco → depois faz o **next build**. Ou seja: **banco e código ficam alinhados no mesmo deploy**.

---

### 5. Domínio

- **Settings → Domains:** adicione **trustbank.xyz** (e www se quiser).
- No seu provedor de DNS, aponte **trustbank.xyz** para o Vercel (CNAME ou A conforme o Vercel indicar).  
  Assim o site “recriado” é acessado no mesmo endereço.

---

## Checklist “tudo desde o início”

- [ ] Repo **prime-fin-dash** clonado e `npm install` rodado
- [ ] Postgres criado (Vercel Storage ou outro) e connection string copiada
- [ ] **DATABASE_URL** e **ADMIN_WALLET** (e opcionais) configurados no Vercel
- [ ] Deploy feito (build com `prisma db push` roda sozinho)
- [ ] Domínio **trustbank.xyz** apontando para o projeto no Vercel
- [ ] Teste: home, pesquisa de slug, dashboard, mini-site, créditos (conforme configurado)

---

## Se algo der errado

- **500 / “column or table does not exist”:** o build não rodou `prisma db push` ou a **DATABASE_URL** está errada. Confira a URL e faça um novo deploy.
- **Site em branco / não carrega:** confira **docs/SITE-NAO-FUNCIONA-VERCEL.md** e **/api/health** (deve retornar `prisma: true`).
- **Admin não abre:** confira **ADMIN_WALLET** e **docs/LOGIN-ADMIN-CARTEIRA.md**.

---

## Resumo

- **Não precisa apagar o GitHub.** O mesmo repo tem tudo.
- **Recriar =** garantir **banco (Postgres) + DATABASE_URL + ADMIN_WALLET** no Vercel e **dar deploy**. O build já instala/sincroniza o banco com o código.
- Assim você recria o sistema “desde o início” **nos mesmos** (mesmo repo, mesmo projeto Vercel), sem perder o que já está no código.
