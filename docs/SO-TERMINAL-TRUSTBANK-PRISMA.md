# TrustBank — tudo pelo terminal (só Prisma, sem Supabase)

Você **não precisa** do Supabase. Só do **Prisma**.  
Só **uma vez** você abre o site da Vercel para **copiar** a URL do banco; todo o resto é no **terminal**.

---

## Única coisa no site (uma vez)

1. Abra: **https://vercel.com** → projeto **prime-fin-dash** → menu **Storage** → banco **prisma-postgres-chestnut-chair**.
2. Clique em **Show secret** ao lado de **POSTGRES_URL** (ou **PRISMA_DATABASE_URL**).
3. **Copie** o texto todo (começa com `postgres://` e termina com `?sslmode=require`).
4. Guarde; você vai **colar** quando o terminal pedir no Passo 2 abaixo.

---

## Tudo no terminal (na ordem)

Abra o **Terminal** e rode **um comando por vez**, na ordem.

**Passo 1 — Entrar na pasta e ligar o projeto**

Rode **só** estes comandos (não digite nada depois de `vercel link`):

```bash
cd /Users/arycorreiafilho/Desktop/hashpo-next/royal-fintech-hub
npm install -g vercel
vercel link
```

Depois de `vercel link`, o terminal vai perguntar: **Set up “…”?** e **Which scope?** e **Link to existing project?**. Responda e escolha o projeto **prime-fin-dash** na lista (use setas e Enter). Não escreva “prime-fin-dash” no mesmo comando.

---

**Passo 2 — Colocar a URL do banco**

```bash
vercel env add DATABASE_URL production
```

Quando aparecer *"What's the value of DATABASE_URL?"*, **cole** a URL que você copiou no site e dê **Enter**.

---

**Passo 3 — Dizer ao app para usar Prisma**

```bash
vercel env add NEXT_PUBLIC_USE_PRISMA production
```

Quando pedir o valor, digite: **true** e **Enter**.

---

**Passo 4 — Baixar as variáveis para o seu Mac**

```bash
vercel env pull .env.local
```

---

**Passo 5 — Criar as tabelas no banco Prisma**

```bash
npx prisma generate
npx prisma db push
```

---

**Passo 6 — Colocar "TrustBank" e sua wallet como admin**

Troque **0xSuaWallet** pelo endereço da sua carteira (ex.: `0xf841d9F5ba7eac3802e9A476a85775e23d084BBe`):

```bash
ADMIN_WALLET=0xSuaWallet node prisma/seed.js
```

Se der erro de **DATABASE_URL**, rode antes `npm install dotenv --save-dev` e repita o comando acima.

---

**Passo 7 — Publicar (deploy)**

```bash
vercel --prod
```

Espere terminar.

---

**Passo 8 — Testar**

Abra **https://trustbank.xyz**: o nome no topo deve ser **TrustBank**; conecte a carteira e o **Governance** deve aparecer.

---

## Resumo (só números)

| # | Onde | Comando / ação |
|---|------|----------------|
| 0 | Site (uma vez) | Vercel → Storage → banco → Show secret → copiar URL |
| 1 | Terminal | `cd` pasta → `vercel link` (só isso; quando perguntar, escolher prime-fin-dash na lista) |
| 2 | Terminal | `vercel env add DATABASE_URL production` → **colar** a URL |
| 3 | Terminal | `vercel env add NEXT_PUBLIC_USE_PRISMA production` → **true** |
| 4 | Terminal | `vercel env pull .env.local` |
| 5 | Terminal | `npx prisma generate` e `npx prisma db push` |
| 6 | Terminal | `ADMIN_WALLET=0xSuaWallet node prisma/seed.js` |
| 7 | Terminal | `vercel --prod` |
| 8 | Navegador | Abrir trustbank.xyz e testar |

Nada disso usa Supabase. Só Prisma e terminal (e uma cópia da URL no site).
