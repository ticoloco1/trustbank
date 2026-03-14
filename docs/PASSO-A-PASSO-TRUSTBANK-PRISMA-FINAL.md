# Passo a passo — TrustBank 100% Prisma (pelo terminal)

**Quer só terminal, sem Supabase?** Use **docs/SO-TERMINAL-TRUSTBANK-PRISMA.md**.

Siga na ordem. Só o **Passo 1** é no site da Vercel; o resto é no terminal.

---

## Passo 1 — Pegar a connection string (uma vez, no site)

1. Abra **https://vercel.com** e entre no projeto **prime-fin-dash**.
2. No menu da esquerda, clique em **Storage**.
3. Clique no banco **prisma-postgres-chestnut-chair**.
4. Clique em **Show secret** ao lado de **POSTGRES_URL** (ou **PRISMA_DATABASE_URL**).
5. **Copie** todo o texto (começa com `postgres://` e termina com `?sslmode=require`).  
   Você vai colar no **Passo 3**.

---

## Passo 2 — Terminal: entrar na pasta e ligar o projeto

Abra o **Terminal** e rode:

```bash
cd /Users/arycorreiafilho/Desktop/hashpo-next/royal-fintech-hub
npm install -g vercel
vercel link
```

Quando o `vercel link` perguntar, escolha o **time** e o projeto **prime-fin-dash**.

---

## Passo 3 — Colocar as variáveis (terminal)

**3.1** Adicionar a URL do banco. Quando pedir o valor, **cole** a connection string que você copiou no Passo 1:

```bash
vercel env add DATABASE_URL production
```

**3.2** Adicionar o modo Prisma. Quando pedir o valor, digite: **true**

```bash
vercel env add NEXT_PUBLIC_USE_PRISMA production
```

---

## Passo 4 — Baixar as variáveis para o seu Mac

```bash
vercel env pull .env.local
```

Isso cria/atualiza o arquivo `.env.local` na pasta do projeto com a `DATABASE_URL` e outras variáveis.

---

## Passo 5 — Criar as tabelas no banco

```bash
npx prisma generate
npx prisma db push
```

Se der certo, as tabelas do TrustBank foram criadas no Postgres.

---

## Passo 6 — Inserir o nome "TrustBank" e seu wallet como admin

Rode (troque **0xSuaWallet** pelo endereço da sua carteira):

```bash
ADMIN_WALLET=0xSuaWallet node prisma/seed.js
```

Exemplo:

```bash
ADMIN_WALLET=0xf841d9F5ba7eac3802e9A476a85775e23d084BBe node prisma/seed.js
```

Se aparecer erro de **DATABASE_URL** não definida, rode antes:

```bash
npm install dotenv --save-dev
```

e depois o comando do seed de novo.

---

## Passo 7 — Fazer o deploy

```bash
vercel --prod
```

Espere terminar.

---

## Passo 8 — Testar

1. Abra **https://trustbank.xyz** no navegador.
2. O **nome no topo** deve ser **TrustBank**.
3. Conecte a **carteira** (a que você colocou no seed).
4. O link **Governance** deve aparecer e você deve conseguir entrar (admin).

---

## Resumo rápido (ordem dos comandos)

| # | O que fazer |
|---|-------------|
| 1 | Vercel → Storage → banco → Show secret → copiar connection string |
| 2 | `cd` na pasta do projeto → `vercel link` (escolher prime-fin-dash) |
| 3 | `vercel env add DATABASE_URL production` → colar a URL |
| 4 | `vercel env add NEXT_PUBLIC_USE_PRISMA production` → valor **true** |
| 5 | `vercel env pull .env.local` |
| 6 | `npx prisma generate` e `npx prisma db push` |
| 7 | `ADMIN_WALLET=0xSuaWallet node prisma/seed.js` (trocar pela sua wallet) |
| 8 | `vercel --prod` |
| 9 | Abrir trustbank.xyz e testar |

---

Se algo der errado, veja **docs/TRUSTBANK-100-PRISMA-INDEPENDENTE.md** (explicação) e **docs/TRUSTBANK-PRISMA-TUDO-PELO-TERMINAL.md** (mais detalhes dos comandos).
