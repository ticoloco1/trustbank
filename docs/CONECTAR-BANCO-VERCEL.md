# Conectar o banco de dados na Vercel

Para o site sair do aviso "Site sem banco de dados" e passar a usar pesquisa, login e mini-sites, configure o PostgreSQL na Vercel.

## 1. Ter um banco PostgreSQL

Se ainda não tiver um banco, use um destes (todos têm plano gratuito):

- **Vercel Postgres** (mais simples, já integrado): no projeto na Vercel → aba **Storage** → **Create Database** → **Postgres**.
- **Neon**: [neon.tech](https://neon.tech) → criar projeto → copiar a connection string.
- **Supabase**: [supabase.com](https://supabase.com) → criar projeto → **Settings → Database** → copiar **Connection string (URI)**.

A URL costuma vir neste formato:

```txt
postgresql://usuario:senha@host:5432/nome_do_banco?sslmode=require
```

## 2. Configurar na Vercel

1. Abra o projeto no [Vercel](https://vercel.com) (o que está em **trustbank.xyz**).
2. Vá em **Settings** → **Environment Variables**.
3. Adicione:

   | Nome            | Valor                                                                 | Ambiente   |
   |-----------------|----------------------------------------------------------------------|------------|
   | `DATABASE_URL`  | A URL do PostgreSQL (ex.: `postgresql://...?sslmode=require`)       | Production (e Preview se quiser) |
   | `SESSION_SECRET`| Uma string longa e aleatória (ex.: gerada em [randomkeygen.com](https://randomkeygen.com)) | Production |

4. Salve (**Save**).

## 3. Criar as tabelas no banco (primeira vez)

Se o banco for novo, é preciso rodar as migrações do Prisma para criar as tabelas.

**No seu computador** (com o repositório clonado e Node instalado):

1. Crie um arquivo `.env.local` na raiz do projeto com a mesma `DATABASE_URL` (e `SESSION_SECRET` se quiser testar login).
2. No terminal, na raiz do projeto:

```bash
npm install
npx prisma db push
```

Isso cria/atualiza as tabelas no banco. Se preferir usar migrações:

```bash
npx prisma migrate deploy
```

(Se não existir pasta `prisma/migrations`, use `npx prisma db push`.)

## 4. Redeploy

1. Na Vercel, vá em **Deployments**.
2. No último deploy, abra o menu (três pontinhos) → **Redeploy**.
3. Aguarde o deploy terminar.

## 5. Conferir

- Abra: **https://trustbank.xyz/api/health**  
  Deve retornar algo como: `{"ok":true,"prisma":true,"message":"DB conectado. Pesquisa e mini-sites devem funcionar."}`

- Recarregue a home: o banner vermelho "Site sem banco de dados" deve sumir.

---

**Resumo:** `DATABASE_URL` no Environment Variables da Vercel + tabelas criadas com `prisma db push` (ou `migrate deploy`) + redeploy.
