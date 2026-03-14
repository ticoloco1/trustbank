# TrustBank vs Hashpo — O que cada projeto usa

## Resumo

| Projeto (Vercel) | Domínio      | Banco de DADOS (nome, logo, config) | Login (auth) |
|------------------|-------------|--------------------------------------|--------------|
| **prime-fin-dash** | trustbank.xyz | **Prisma** (Postgres da Vercel)     | **Supabase** |
| **hashpo**       | hashpo.com   | **Supabase**                         | **Supabase** |

Não precisa “jogar” o Hashpo para o Prisma. Só o **TrustBank** usa Prisma para **dados**; o **login com carteira** no TrustBank continua pelo **Supabase**.

---

## O que fazer no prime-fin-dash (trustbank.xyz)

No projeto **prime-fin-dash**, em **Settings → Environment Variables**, você deve ter **as duas coisas**:

### 1. Prisma (já está aí)

- `DATABASE_URL` (ou `POSTGRES_URL` / `PRISMA_DATABASE_URL`) = connection string do Postgres (Prisma).
- O app usa isso para **nome, logo e configurações** do TrustBank quando existe também a variável abaixo.

### 2. Adicione esta variável (se ainda não tiver)

- **Name:** `NEXT_PUBLIC_USE_PRISMA`  
- **Value:** `true`  
- **Environment:** Production (e Preview se quiser)

Assim o site do TrustBank passa a ler/escrever **dados** no Prisma (e não no Supabase).

### 3. Supabase no TrustBank (não remova)

Para o **login com carteira** no trustbank.xyz continuar funcionando, o **prime-fin-dash** também precisa das variáveis do Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Pode ser o mesmo projeto Supabase** que o Hashpo usa (só auth). Em **Redirect URLs** do Supabase, inclua `https://trustbank.xyz/auth`.

Se no prime-fin-dash **não** tiver essas duas do Supabase, **adicione** (copie os valores do projeto Hashpo). Sem elas, o login no trustbank.xyz não funciona.

---

## O que fazer no projeto Hashpo (hashpo.com)

**Nada.** Deixe como está:

- Só variáveis do **Supabase** (dados + auth).
- **Não** coloque `DATABASE_URL` do Prisma nem `NEXT_PUBLIC_USE_PRISMA` no projeto Hashpo.

---

## Resposta direta à sua dúvida

- **“Separar o Supabase e jogar para o Prisma”** — você **não** precisa tirar o Supabase do TrustBank. Só precisa:
  - **Manter** Prisma no prime-fin-dash para **dados** (já está).
  - **Garantir** `NEXT_PUBLIC_USE_PRISMA = true` no prime-fin-dash.
  - **Manter** (ou adicionar) as variáveis do **Supabase** no prime-fin-dash para **login**.

- **Hashpo** continua 100% Supabase; não use Prisma no projeto Hashpo.

---

## Checklist rápido — prime-fin-dash (trustbank.xyz)

- [ ] `DATABASE_URL` (ou POSTGRES_URL) = connection string do Prisma ✅ (você já tem)
- [ ] `NEXT_PUBLIC_USE_PRISMA` = `true`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = URL do seu projeto Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key do Supabase
- [ ] Tabela `platform_settings` criada no banco Prisma (`npx prisma db push` ou SQL)
- [ ] Redeploy do prime-fin-dash depois de alterar variáveis

Depois disso, trustbank.xyz usa **Prisma** para nome/logo e **Supabase** para login; hashpo.com continua só com Supabase.
