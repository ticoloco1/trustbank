# TrustBank 100% Prisma — independente do Hashpo

**Passo a passo (recomendado):** **docs/PASSO-A-PASSO-TRUSTBANK-PRISMA-FINAL.md** — ordem certa, quase tudo no terminal.

O TrustBank (trustbank.xyz) fica **totalmente** no Prisma: dados (nome, logo, config) e **admin por wallet**. Não usa mais o Supabase da conta Hashpo. Como ainda não tem contas de usuário, só admin, o fluxo é: conectar carteira → API verifica se o wallet está na tabela `admin_wallet_addresses` no Prisma → se estiver, é admin e “logado”.

---

## O que foi feito no código

1. **Prisma**
   - Schema com: `platform_settings`, `profiles`, `mini_sites`, **`admin_wallet_addresses`** (lista de wallets admin).
   - API **GET /api/auth/me?wallet=0x...** que consulta o Prisma e retorna `{ user, isAdmin }`.

2. **Auth**
   - **useAuth** e **AuthProvider**: quando `NEXT_PUBLIC_USE_PRISMA === "true"` (ou `NEXT_PUBLIC_SITE === "trustbank"`), não usam Supabase. Usam só a carteira (wagmi) + a API `/api/auth/me`. Se o wallet estiver em `admin_wallet_addresses`, `user` e `isAdmin` ficam preenchidos.

3. **Settings**
   - **useSettings** / **useUpdateSettings**: no modo Prisma já usam `/api/settings` (Prisma). Nada do Supabase.

---

## O que você precisa fazer

### 1. Variáveis no projeto **prime-fin-dash** (Vercel)

Só Prisma. **Não** use variáveis do Supabase do Hashpo no TrustBank.

| Nome | Valor |
|------|--------|
| **DATABASE_URL** | Connection string do Postgres (Storage → prisma-postgres-chestnut-chair → copiar POSTGRES_URL) |
| **NEXT_PUBLIC_USE_PRISMA** | `true` |

Pode **remover** do projeto prime-fin-dash (se estiverem):  
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.  
O TrustBank não usa mais Supabase.

### 2. Criar as tabelas no Postgres (Prisma)

Na pasta do projeto, com **DATABASE_URL** no `.env.local` (ou `vercel env pull .env.local`):

```bash
npx prisma db push
```

Isso cria no banco do TrustBank: `platform_settings`, `profiles`, `mini_sites`, `admin_wallet_addresses`.

### 3. Inserir o primeiro admin (sua wallet)

No **SQL Editor** do Postgres da Vercel (Storage → prisma-postgres-chestnut-chair → Query), rode (troque pelo seu endereço):

```sql
INSERT INTO admin_wallet_addresses (wallet_address, note)
VALUES ('0xSUA_WALLET_AQUI', 'admin principal')
ON CONFLICT (wallet_address) DO NOTHING;
```
(Substitua `0xSUA_WALLET_AQUI` pelo endereço da sua carteira.)

Ou, se preferir pelo Prisma Studio (após `npx prisma db push`):

```bash
npx prisma studio
```

Abra a tabela **admin_wallet_addresses** e adicione uma linha com `wallet_address` = sua wallet (ex.: `0xf841d9F5ba7eac3802e9A476a85775e23d084BBe`) e `note` = "admin".

### 4. Redeploy do prime-fin-dash

Depois de salvar as variáveis e criar as tabelas + admin, faça **Redeploy** do projeto na Vercel.

---

## Comportamento final

| Onde | Dados | Login / Admin |
|------|--------|-----------------|
| **trustbank.xyz** (prime-fin-dash) | 100% Prisma (Postgres Vercel) | Carteira + tabela `admin_wallet_addresses` no Prisma (API `/api/auth/me`). **Sem Supabase.** |
| **hashpo.com** | Supabase (conta Hashpo) | Supabase (auth + admin_wallet_addresses no Supabase) |

Assim o TrustBank fica independente: só Prisma e sua conta Vercel/Postgres. Nada ligado ao Supabase do Hashpo. Para vender o TrustBank, você entrega domínio + projeto Vercel + banco Prisma; o comprador não precisa do seu Hashpo.
