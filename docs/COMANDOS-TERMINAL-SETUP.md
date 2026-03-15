# Tudo pelo terminal — setup para funcionar

Ordem dos comandos. Rode na **pasta do projeto** (onde está o `package.json`).

---

## 1. Criar `.env.local` (variáveis de ambiente)

**No terminal** (substitua `SUA_DATABASE_URL` pela connection string real do Postgres):

```bash
echo 'DATABASE_URL="SUA_DATABASE_URL"
NEXT_PUBLIC_USE_PRISMA=true' > .env.local
```

Ou crie o arquivo na mão: abra `.env.local` no editor e coloque:

```
DATABASE_URL="postgres://usuario:senha@host...?sslmode=require"
NEXT_PUBLIC_USE_PRISMA=true
```

*(A URL você pega no Vercel → Storage → seu banco → "Connect" / "Show secret" da POSTGRES_URL.)*

---

## 2. Instalar dependências

```bash
npm install
```

---

## 3. Criar/atualizar tabelas no banco

```bash
npm run db:push
```

*(Ou: `npx prisma db push`.)*

---

## 4. Cadastrar sua carteira como admin (seed)

Troque `0xSuaCarteira` pelo endereço da sua wallet (ex.: `0xf841d9F5ba7eac3802e9A476a85775e23d084BBe`):

```bash
ADMIN_WALLET=0xSuaCarteira node prisma/seed.js
```

O script lê `DATABASE_URL` do `.env.local` (se tiver o pacote `dotenv`). Se der erro de conexão, instale e rode de novo:

```bash
npm install dotenv --save-dev
ADMIN_WALLET=0xSuaCarteira node prisma/seed.js
```

---

## 5. Subir o projeto (rodar em modo dev)

```bash
npm run dev
```

Depois abra no navegador: **http://localhost:3000** → Dashboard → conecte a carteira → crie/edite mini site (templates e colunas).

---

## Resumo (copiar e colar)

Depois de ter a `DATABASE_URL` no `.env.local`:

```bash
npm install
npm run db:push
ADMIN_WALLET=0xSuaCarteira node prisma/seed.js
npm run dev
```

Só não dá para fazer **pelo terminal**: (1) pegar a connection string do Postgres (isso é no painel da Vercel); (2) conectar a carteira e criar o mini site (isso é no navegador). O resto é terminal.
