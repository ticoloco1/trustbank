# Site no ar mas nada funciona — o que fazer

O site está no ar com banco novo, mas login, busca de slugs e dashboard vazios. Motivos e como corrigir:

---

## 1. Variáveis obrigatórias na Vercel

No projeto na Vercel → **Settings** → **Environment Variables**, confira:

| Variável | Para que serve |
|----------|----------------|
| **DATABASE_URL** | Conexão com o Postgres (já deve estar se o health mostra prisma: true). |
| **SESSION_SECRET** | Login por email/senha (cookie). Se faltar, "Entrar" não mantém sessão. |
| **ADMIN_WALLET** | Sua wallet (ex.: `0x123...`) para acessar o painel admin. O seed usa isso no deploy. |

Se **SESSION_SECRET** ou **ADMIN_WALLET** estiverem faltando, adicione e faça **Redeploy**.

---

## 2. Login (Entrar) — precisa ter conta antes

- O banco novo começa **sem usuários**.
- Use primeiro **"Criar conta"** (email + senha com 6+ caracteres).
- Depois use **"Entrar"** com o mesmo email e senha.
- Se **SESSION_SECRET** não estiver configurado na Vercel, o cookie de sessão não vale e o login “não funciona” mesmo com senha certa.

---

## 3. Busca de slugs — deve funcionar após o deploy

- A busca chama `/api/slugs/check` e usa o banco (mini_sites, slug_listings, platform_settings).
- No build passamos a rodar **seed** (configuração da plataforma + admin). Depois do próximo deploy, a busca deve responder.
- Se ainda falhar: abra **https://trustbank.xyz/api/slugs/check?slug=teste&type=company** e veja se retorna JSON (available, message, etc.). Se der 503, o Prisma não está conectado; se der 200, o front está conseguindo usar a API.

---

## 4. Dashboard vazio (wallet conectada mas “não tem nada”)

- Com banco novo, **ninguém tem mini-sites nem slugs** ainda.
- Conectou a wallet e entrou no Mini Site: a lista fica vazia até você **criar ou comprar um slug** e associar um mini-site.
- Fluxo: **Criar conta** ou conectar wallet → **Buscar slug** na home → comprar/claim → no **Mini Site** criar/editar o site daquele slug.

---

## 5. Redeploy após mudar variáveis

Sempre que alterar **SESSION_SECRET**, **ADMIN_WALLET** ou **DATABASE_URL**:

- **Deployments** → **⋯** no último deploy → **Redeploy**.

O build agora roda **prisma db push** e **prisma db seed**: tabelas e dados iniciais (platform_settings + admin) são criados/atualizados nesse deploy.

---

## Resumo

1. **Vercel:** DATABASE_URL + **SESSION_SECRET** + **ADMIN_WALLET**.
2. **Redeploy** depois de salvar as variáveis.
3. **Criar conta** (Criar conta) → depois **Entrar** (login).
4. **Buscar slug** na home → comprar/claim → **Mini Site** para criar o site.
5. Dashboard só mostra algo depois de ter pelo menos um slug/mini-site.
