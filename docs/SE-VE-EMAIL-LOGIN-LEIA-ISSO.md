# Se no hashpo.com aparece "ENTRAR COM E-MAIL" ou não reconhece Governance

O **hashpo.com** deve ter **login só por wallet** (sem e-mail) e reconhecer **Governance** para wallets admin. Se está pedindo e-mail ou não mostra Governance, siga este checklist.

---

## 1. Vercel — projeto certo para hashpo.com

1. Acesse **https://vercel.com** e entre no projeto que está ligado ao domínio **hashpo.com**.
2. Em **Settings → General** confira:
   - **Project Name** (ex.: hashpo ou hashpo.com).
   - **Framework Preset**: Next.js.
   - **Root Directory**: vazio (ou a pasta raiz do repositório).

3. Em **Settings → Git**:
   - O repositório conectado deve ser o que contém o código do hashpo **com login por wallet** (ex.: `ticoloco1/hashpo.com` ou o repo onde está o royal-fintech-hub).
   - Se o repo estiver errado, desconecte e conecte o repo correto. Depois faça **Redeploy**.

---

## 2. Vercel — variáveis de ambiente (hashpo.com)

Em **Settings → Environment Variables** do projeto **hashpo.com**:

| Nome | Valor | Ambiente |
|------|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kainqpgegvpjuaakwgkz.supabase.co` (ou a URL do seu projeto Supabase) | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave **anon public** do Supabase (Project Settings → API) | Production, Preview |

Para **hashpo.com** **não** use `NEXT_PUBLIC_USE_PRISMA=true` — essa variável é só para TrustBank. No hashpo o app usa Supabase.

- Se existir `NEXT_PUBLIC_USE_PRISMA`, apague ou deixe em branco / `false` para o projeto do hashpo.com.
- Clique em **Save** e depois faça **Redeploy** (Deployments → ⋮ no último deploy → Redeploy).

---

## 3. Supabase — Redirect URLs e admin

1. Abra o projeto no **Supabase**: https://supabase.com/dashboard/project/kainqpgegvpjuaakwgkz (ou o seu).
2. **Authentication → URL Configuration → Redirect URLs**  
   Adicione e salve:
   - `https://hashpo.com/auth`
   - `https://hashpo.com`
   - `http://localhost:3000/auth` (para testar local)
3. **SQL Editor** — rode para garantir que sua wallet é admin (troque o endereço se for outro):

```sql
INSERT INTO public.admin_wallet_addresses (wallet_address, note)
VALUES ('0xf841d9F5ba7eac3802e9A476a85775e23d084BBe', 'principal')
ON CONFLICT (wallet_address) DO NOTHING;
```

Assim o backend reconhece essa wallet como admin e o **Governance** pode aparecer.

---

## 4. Edge Functions no Supabase (auth por wallet)

Para o login por wallet funcionar, a **Edge Function** de auth com wallet precisa estar publicada no Supabase (ex.: `auth-wallet`).  
Se você tiver um doc **DEPLOY-FUNCOES-SEM-DOCKER.md** ou similar, use-o para criar/atualizar essa função. O fluxo típico é: front chama a função com o endereço da wallet → Supabase cria/atualiza sessão → o app usa essa sessão e consulta `admin_wallet_addresses` para mostrar Governance.

---

## 5. Redeploy e teste

1. Na Vercel: **Deployments** → no último deploy → **⋮** → **Redeploy** (Production).
2. Espere terminar e abra **https://hashpo.com**.
3. Conecte a **wallet** (não use e-mail).
4. Se a wallet estiver em `admin_wallet_addresses`, o **Governance** deve aparecer.

---

## Resumo rápido

| Onde | O quê |
|------|--------|
| Vercel (projeto hashpo.com) | Repo correto; NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY; **sem** NEXT_PUBLIC_USE_PRISMA |
| Supabase | Redirect URLs com `https://hashpo.com/auth`; sua wallet em `admin_wallet_addresses` |
| Vercel | Redeploy após mudar env ou repo |

Se depois disso ainda pedir e-mail ou não mostrar Governance, confira no navegador (F12 → Console/Network) se há erros ao conectar a wallet ou ao chamar a API/ Supabase.
