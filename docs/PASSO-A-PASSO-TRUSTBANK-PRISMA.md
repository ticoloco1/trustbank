# TrustBank.xyz com banco separado — Passo a passo

---

## Antes de tudo: o que é isso?

- **Problema:** O trustbank.xyz e o hashpo.com usavam o **mesmo banco** (Supabase). No trustbank aparecia nome "HASHPO" e os dados eram misturados.
- **Solução:** O trustbank.xyz passa a usar um **banco só dele** (Postgres na Vercel). O login (carteira) continua no Supabase; só nome, logo e configurações vêm do banco novo.
- **O que você vai fazer:** Configurar 3 coisas na Vercel (variáveis + criar tabela) e dar um Redeploy. Não precisa mexer no código.

---

## Em poucas linhas

1. Na **Vercel**, no projeto do trustbank: colocar a senha do banco (**DATABASE_URL**) e ligar o modo Prisma (**NEXT_PUBLIC_USE_PRISMA = true**).
2. No **banco** desse projeto: criar uma tabela chamada `platform_settings` (pode ser com um comando no seu computador ou colando um SQL na Vercel).
3. Clicar em **Redeploy** no projeto na Vercel.
4. Abrir o **trustbank.xyz** e ver se o nome "TrustBank" aparece no topo.

---

## Quero fazer pelo Terminal

Dá para fazer quase tudo pelo Terminal. Só a **connection string** do banco você pega uma vez no site da Vercel (Storage → abrir o banco → copiar a URL).

### 1. Instalar a Vercel CLI (uma vez)

```bash
npm install -g vercel
```

Se pedir login: `vercel login` e siga o passo a passo no navegador.

### 2. Ligar o projeto ao projeto certo na Vercel

```bash
cd /Users/arycorreiafilho/Desktop/hashpo-next/royal-fintech-hub
vercel link
```

Quando perguntar, escolha o time (account) e o projeto **prime-fin-dash** (ou o nome que publica o trustbank.xyz).

### 3. Onde pegar a connection string (no site da Vercel)

1. Abra no navegador: **https://vercel.com** e faça login.
2. No dashboard, clique no projeto **prime-fin-dash** (é o que publica o trustbank.xyz).
3. No menu da **esquerda** do projeto, clique em **Storage** (ou "Data Storage" / "Stores").
4. Na lista de bancos, clique no nome **prisma-postgres-chestnut-chair** (ou no Postgres que você criou para o trustbank).
5. Dentro da página do banco você verá abas ou seções. Procure por:
   - **Variables**, ou  
   - **.env**, ou  
   - **Connection** / **Connection string**
6. Copie o valor que aparece como **POSTGRES_URL** ou **DATABASE_URL** — é um texto longo que começa com `postgres://` e termina com algo como `?sslmode=require`.
7. Esse texto é a **connection string**. Use ela no comando `vercel env add DATABASE_URL production` (cole quando o terminal pedir o valor).

### 4. Colocar as variáveis pelo Terminal

**DATABASE_URL** (o terminal vai pedir o valor; cole a connection string que você copiou):

```bash
vercel env add DATABASE_URL production
```

Quando aparecer *“What’s the value of DATABASE_URL?”*, **cole** a URL do banco e dê Enter.

**NEXT_PUBLIC_USE_PRISMA**:

```bash
vercel env add NEXT_PUBLIC_USE_PRISMA production
```

Quando pedir o valor, digite: `true` e Enter.

### 5. Baixar as variáveis para o seu Mac (para o Prisma usar)

```bash
vercel env pull .env.local
```

Isso cria/atualiza o `.env.local` na pasta do projeto com as variáveis que estão na Vercel (incluindo `DATABASE_URL`).

### 6. Criar a tabela no banco (pelo Terminal)

```bash
npx prisma db push
```

Se der certo, a tabela `platform_settings` é criada no Postgres da Vercel.

### 7. Fazer o deploy (pelo Terminal)

```bash
vercel --prod
```

Espera terminar. Depois abra **https://trustbank.xyz** e confira se aparece **TrustBank** no topo.

---

**Resumo em comandos (depois de ter a connection string e o `vercel link` feito):**

```bash
cd /Users/arycorreiafilho/Desktop/hashpo-next/royal-fintech-hub
vercel env add DATABASE_URL production          # colar a URL quando pedir
vercel env add NEXT_PUBLIC_USE_PRISMA production # valor: true
vercel env pull .env.local
npx prisma db push
vercel --prod
```

---

## Passo 1 — Abrir o projeto na Vercel

1. Entre em **vercel.com** e faça login.
2. Clique no **projeto** que publica o trustbank.xyz (o nome pode ser algo como "prime-fin-dash" ou o que você deu).
3. Deixe essa aba aberta; você vai usar nas próximas etapas.

---

## Passo 2 — Pegar a “senha” do banco (connection string)

1. No menu do projeto (lado esquerdo), clique em **Storage** (ou "Data Storage").
2. Você deve ver um banco tipo **prisma-postgres-chestnut-chair**. Clique nele.
3. Dentro do banco, procure **Variables** ou **Connection** ou **.env**.
4. Copie o valor que aparece como **POSTGRES_URL** ou **DATABASE_URL** (um texto longo que começa com `postgres://...`).  
   — Esse texto é a “senha de conexão” do banco. Você vai colar na próxima etapa.

---

## Passo 3 — Colocar as variáveis no projeto

1. No mesmo projeto na Vercel, clique em **Settings** (Configurações).
2. No menu da esquerda, clique em **Environment Variables** (Variáveis de ambiente).
3. Clique em **Add** (ou “Add New”) e crie **duas** variáveis:

   **Variável 1**
   - Name: `DATABASE_URL`  
   - Value: **cole** aquele texto que você copiou no Passo 2 (a connection string do banco)  
   - Environment: marque **Production** (e se quiser Preview também)

   **Variável 2**
   - Name: `NEXT_PUBLIC_USE_PRISMA`  
   - Value: `true`  
   - Environment: **Production** (e se quiser Preview)

4. **Não apague** as variáveis que já existem do Supabase:  
   `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.  
   Elas são usadas para o login com carteira.

5. Clique em **Save** para salvar.

---

## Passo 4 — Criar a tabela no banco

O site precisa de uma tabela chamada `platform_settings` no banco. Você pode fazer de um destes jeitos:

### Jeito A — Pelo seu computador (se você tem o projeto aberto no Mac)

1. Abra o **Terminal**.
2. Vá na pasta do projeto:
   ```bash
   cd /Users/arycorreiafilho/Desktop/hashpo-next/royal-fintech-hub
   ```
3. Crie (ou edite) o arquivo **.env.local** na raiz dessa pasta e coloque uma linha assim (trocando pela sua connection string de verdade):
   ```
   DATABASE_URL="postgres://usuario:senha@host...?sslmode=require"
   ```
4. No Terminal, rode:
   ```bash
   npx prisma db push
   ```
5. Se der certo, a tabela foi criada.

### Jeito B — Pelo site da Vercel (sem Terminal)

1. Na Vercel, vá em **Storage** e abra o banco **prisma-postgres-chestnut-chair**.
2. Procure **Query** ou **SQL Editor** ou **Run SQL**.
3. **Apague** tudo que estiver na caixa de texto e **cole** exatamente isto:

```sql
CREATE TABLE IF NOT EXISTS platform_settings (
  id integer PRIMARY KEY DEFAULT 1,
  platform_name text,
  logo_url text,
  hero_text text,
  grid_columns integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO platform_settings (id, platform_name, grid_columns, updated_at)
VALUES (1, 'TrustBank', 4, now())
ON CONFLICT (id) DO NOTHING;

-- Tabela de admins (TrustBank 100% Prisma)
CREATE TABLE IF NOT EXISTS admin_wallet_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL UNIQUE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Inserir seu wallet como admin (troque 0xSUA_WALLET pelo seu endereço)
INSERT INTO admin_wallet_addresses (wallet_address, note)
VALUES ('0xSUA_WALLET', 'admin principal')
ON CONFLICT (wallet_address) DO NOTHING;
```

4. Clique em **Run** (ou Execute).
5. Se não aparecer erro, a tabela foi criada e o nome padrão "TrustBank" já está lá.

---

## Passo 5 — Fazer o site atualizar (Redeploy)

1. Na Vercel, no seu projeto, clique na aba **Deployments** (Implantações).
2. No último deploy da lista, clique nos **três pontinhos** ao lado.
3. Clique em **Redeploy**.
4. Confirme e espere terminar (alguns minutos).

---

## Passo 6 — Testar

1. Abra no navegador: **https://trustbank.xyz** (ou o endereço que você usa).
2. O **nome no topo** da página deve ser **TrustBank** (e não HASHPO).
3. Teste o login com **carteira**; deve continuar funcionando.

---

## Resumo rápido

| O que | Onde |
|-------|------|
| **hashpo.com** | Continua usando só o Supabase. Não mexe. |
| **trustbank.xyz** | Nome e logo vêm do banco novo (Vercel Postgres). Login com carteira continua pelo Supabase. |

---

## Se der problema

- **Ainda aparece HASHPO no trustbank**  
  Confira se a variável **NEXT_PUBLIC_USE_PRISMA** está como `true` e se você fez **Redeploy** depois de salvar.

- **Site dá erro ou não abre**  
  Confira se **DATABASE_URL** está certa (igual à do Storage) e se você criou a tabela no Passo 4.

- **Login com carteira não funciona**  
  Isso usa o Supabase. Não apague **NEXT_PUBLIC_SUPABASE_URL** e **NEXT_PUBLIC_SUPABASE_ANON_KEY**. No Supabase, veja se o domínio do trustbank está nas Redirect URLs.

- **Não acho Storage / Variables**  
  No projeto na Vercel, o menu fica na lateral. “Storage” é onde ficam os bancos; “Settings” → “Environment Variables” é onde ficam DATABASE_URL e NEXT_PUBLIC_USE_PRISMA.
