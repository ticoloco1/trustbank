# Separar o TrustBank de uma vez (para poder vender)

## Sua dúvida

- **“Vai ficar ligado os 2 bancos?”** — Hoje o TrustBank usa **Prisma** (dados) e **Supabase** (login). São dois sistemas: um banco para dados, outro para autenticação.
- **“E se eu vender um, como fica?”** — Se você vender o **TrustBank** e ele ainda usar o **mesmo** Supabase do Hashpo, o comprador fica dependente do seu projeto Supabase (ou teria que migrar usuários). Ruim para venda.
- **“Não dá para separar de uma vez?”** — Dá. A separação total é: **TrustBank ter seu próprio Supabase só para login**, além do Prisma para dados. Aí você vende: domínio + projeto Vercel + Prisma Postgres + **projeto Supabase do TrustBank**. Zero ligação com o Hashpo.

---

## Como fica quando está 100% separado

| O quê | Hashpo (hashpo.com) | TrustBank (trustbank.xyz) |
|-------|---------------------|---------------------------|
| **Dados** (nome, logo, mini sites, etc.) | 1 projeto **Supabase** (só seu) | 1 **Prisma Postgres** (Vercel) |
| **Login** (carteira, sessão) | Mesmo Supabase do Hashpo | **Outro** projeto Supabase (só do TrustBank) |

Assim:
- **Hashpo** = 1 Supabase. Você controla. Ninguém mais.
- **TrustBank** = 1 Prisma (dados) + 1 Supabase (só auth). Quando vender, você entrega: Vercel (prime-fin-dash) + Prisma Postgres + **esse** projeto Supabase. O comprador fica dono de tudo do TrustBank; você fica só com o Hashpo.

---

## O que fazer para separar de uma vez

### 1. Criar um projeto Supabase **só** para o TrustBank

1. Acesse [supabase.com](https://supabase.com) e faça login.
2. Clique em **New Project**.
3. Escolha um nome (ex.: **trustbank-auth**) e uma senha do banco (guarde).
4. Crie o projeto e espere ficar pronto.

Esse projeto vai ser usado **só** para login (carteira) do trustbank.xyz. Você não precisa criar tabelas de dados nele; o app TrustBank já usa Prisma para dados.

### 2. Configurar o novo Supabase para login com carteira

No projeto **trustbank-auth** (ou o nome que você deu):

1. **Authentication → URL Configuration → Redirect URLs**  
   Adicione: `https://trustbank.xyz/auth` e `http://localhost:3000/auth` → Save.

2. **Edge Functions**  
   O login com carteira usa uma função (ex.: `auth-wallet`). Você tem duas opções:
   - **Opção A:** Se o código do app chama uma Edge Function no Supabase, crie a mesma função nesse novo projeto (copie o código da função do projeto do Hashpo para o projeto trustbank-auth). Assim o TrustBank usa só esse Supabase para auth.
   - **Opção B:** Se o app usar outro fluxo de auth (ex.: SIWE direto), configure nesse projeto conforme a documentação.

3. **Project Settings → API**  
   Copie:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public** (chave longa)

Você vai colar esses dois valores no projeto **prime-fin-dash** na Vercel.

### 3. Trocar as variáveis do TrustBank na Vercel

No projeto **prime-fin-dash** na Vercel → **Settings → Environment Variables**:

1. **NEXT_PUBLIC_SUPABASE_URL**  
   Troque para a **Project URL** do **novo** projeto Supabase (trustbank-auth). Não use mais a URL do Supabase do Hashpo.

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**  
   Troque para a chave **anon public** do **novo** projeto Supabase (trustbank-auth).

3. Mantenha como estão:
   - **DATABASE_URL** (ou POSTGRES_URL) = Prisma Postgres do TrustBank
   - **NEXT_PUBLIC_USE_PRISMA** = `true`

Depois salve e faça **Redeploy** do prime-fin-dash.

### 4. Resultado

- **TrustBank (trustbank.xyz):**  
  Dados = Prisma. Login = Supabase **trustbank-auth**. Nada aponta para o Hashpo.

- **Hashpo (hashpo.com):**  
  Continua usando só o Supabase do Hashpo. Nada do TrustBank.

Quando você vender o TrustBank, combine com o comprador a entrega de:
- Domínio trustbank.xyz
- Projeto Vercel (prime-fin-dash)
- Banco Prisma Postgres (prisma-postgres-chestnut-chair) — no Vercel já está ligado ao projeto
- Projeto Supabase **trustbank-auth** (transferência de projeto no Supabase ou troca de dono da conta/organization, conforme política do Supabase)

Assim os dois bancos (e os dois “mundos”) ficam separados de uma vez, e a venda do TrustBank fica limpa.
