# Setup — faça nessa ordem

**Quer recriar tudo do zero no mesmo repo (sem perder tempo):** leia **docs/RECRIAR-DO-ZERO.md** — um único guia com banco, env e deploy desde o início.

**Repositório no GitHub:** o único repo é **https://github.com/ticoloco1/hashpo.com**. O código deste projeto (royal-fintech-hub) é o que deve estar nesse repo para o **hashpo.com**. No Vercel, conecte o projeto ao repo ticoloco1/hashpo.com.

**Login:** só com wallet. Não há cadastro nem login por e-mail. Se o site pedir e-mail ou “cadastro”, o deploy está errado.

**Se no hashpo.com ainda aparece "ENTRAR COM E-MAIL":** leia **docs/SE-VE-EMAIL-LOGIN-LEIA-ISSO.md** (Redeploy no Vercel + admin pela wallet).

**Como enviar o código para o hashpo.com:** abra o Terminal e rode:

```bash
cd /Users/arycorreiafilho/Desktop/hashpo-next/royal-fintech-hub
git remote -v
```

Se `origin` apontar para outro repositório, troque para o hashpo.com:

```bash
git remote set-url origin https://github.com/ticoloco1/hashpo.com.git
```

Depois envie as alterações:

```bash
git add .
git commit -m "Atualizações hashpo.com"
git push -u origin main
```

Se o GitHub pedir senha, use um **Personal Access Token** (GitHub → Settings → Developer settings → Personal access tokens). Após o push, o Vercel faz o deploy automático se o projeto estiver ligado ao repo.

---

**trustbank.xyz igual ao Lovable (não muda ao dar push):** leia **docs/DOMINIO-VERCEL-NAO-LOVABLE.md** — apontar o domínio para o Vercel, não para o Lovable.

**Site não funciona no host (não entra, pesquisa, mini-site):** leia **docs/SITE-NAO-FUNCIONA-VERCEL.md** — checklist (DATABASE_URL, /api/health, build, domínio).

**Inventário e checklist (últimos 5 dias):** leia **docs/TRABALHO-5-DIAS-INVENTARIO-E-CHECKLIST.md** — tudo que foi criado/alterado e o que conferir no deploy.

**TrustBank 100% Prisma (só terminal, sem Supabase):** leia **docs/SO-TERMINAL-TRUSTBANK-PRISMA.md** — passo a passo só no terminal.

**Se o trustbank.xyz não mostra as mudanças ou não salva o mini site:** leia **docs/TRUSTBANK-XYZ-ESTE-PROJETO.md** (Vercel Root Directory, Redeploy e Supabase).

**Se o login não funciona ou não entra no Admin:** leia **docs/LOGIN-E-ADMIN-HASHPO.md** — tem o checklist (auth-wallet, Redirect URLs, variáveis do Vercel, tabela profiles) e como colocar sua wallet como admin.

## Terminal

```bash
cd /Users/arycorreiafilho/Desktop/hashpo-next/royal-fintech-hub
bash rodar-setup.sh
```

Senha do banco quando pedir = Supabase → Project Settings → Database → Database password.  
Se perguntar "push migrations?" → **Y** + Enter.

**Se o script avisar "Docker não está rodando"** → as 3 funções você sobe pelo Dashboard. Abra **docs/DEPLOY-FUNCOES-SEM-DOCKER.md**: tem o link do Supabase e o código das 3 funções para copiar e colar em Edge Functions.

---

## Supabase — https://supabase.com/dashboard/project/kainqpgegvpjuaakwgkz

**Se o Docker não rodou:** em Edge Functions crie as 3 funções (auth-wallet, apply-boost-after-usdc, verify-youtube-channel) colando o código de **docs/DEPLOY-FUNCOES-SEM-DOCKER.md**.

| Onde | O quê |
|------|--------|
| Authentication → URL Configuration → Redirect URLs | Adicionar `https://hashpo.com/auth`, `https://trustbank.xyz/auth` e `http://localhost:3000/auth` → Save |
| Edge Functions → apply-boost-after-usdc → Secrets | Nome: `PLATFORM_TREASURY_ADDRESS` / Valor: `0xf841d9F5ba7eac3802e9A476a85775e23d084BBe` |
| SQL Editor → New query | Colar o SQL abaixo → Run |

```sql
INSERT INTO public.admin_wallet_addresses (wallet_address, note)
VALUES ('0xf841d9F5ba7eac3802e9A476a85775e23d084BBe', 'principal');
```

---

## Vercel — Settings → Environment Variables

| Nome | Valor |
|------|--------|
| NEXT_PUBLIC_SUPABASE_URL | https://kainqpgegvpjuaakwgkz.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | (copiar do Supabase → Project Settings → API → anon public) |

Save → Redeploy.
