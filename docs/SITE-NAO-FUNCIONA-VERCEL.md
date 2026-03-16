# Site não funciona no host (Vercel) — checklist

Quando **nada funciona** (não entra, pesquisa não responde, mini-site não abre), confira na ordem abaixo.

---

## 1. Variáveis de ambiente no Vercel

- Vercel → seu projeto → **Settings** → **Environment Variables**
- **Obrigatória:** `DATABASE_URL` = connection string do Postgres (ex.: Vercel Postgres ou Supabase).
- Se `DATABASE_URL` estiver vazia ou errada, a pesquisa, o dashboard e os mini-sites não funcionam.
- Depois de alterar env: **Redeploy** (Deployments → ⋮ no último deploy → Redeploy).

---

## 2. Conferir se o banco está ativo

- Abra no navegador: **https://seu-dominio.vercel.app/api/health**
- Deve retornar algo como: `{ "ok": true, "prisma": true, "message": "DB conectado..." }`
- Se aparecer **`"prisma": false`**, o backend não está conectado ao banco. Corrija `DATABASE_URL` e faça redeploy.

---

## 3. Build e repositório

- **Deployments**: o último deploy está **Ready** (verde) ou falhou (vermelho)?
- Se o build falhou, abra o log e corrija o erro (geralmente dependência ou TypeScript).
- Confirme que o projeto no Vercel está ligado ao repositório certo (ex.: **ticoloco1/prime-fin-dash**) e à branch **main**.
- **Root Directory** deve estar **vazio** (raiz do repo). Se estiver preenchido com uma pasta, o Vercel pode estar buildando o projeto errado.

---

## 4. Domínio

- Se você usa **trustbank.xyz**, no Vercel em **Settings → Domains** o domínio deve apontar para este projeto.
- Caso contrário, você pode estar vendo outro deploy (outro projeto ou branch).

---

## 5. Tela em branco (nada carrega)

- Abra o **DevTools** (F12) → aba **Console**. Se aparecer erro em vermelho, anote a mensagem.
- Teste **diretamente** no navegador: `https://seu-dominio.vercel.app/api/health`  
  - Se essa URL não abrir ou der erro, o problema é deploy ou projeto errado.
- No Vercel, confirme que você está no **projeto certo** (o que está ligado ao repo **prime-fin-dash**). Se tiver mais de um projeto, o domínio pode estar apontando para outro.
- **Deployments**: o último deploy está verde (Ready)? Se estiver vermelho (Failed), o build falhou — abra o log e corrija o erro.

---

## 6. Resumo rápido

| Problema | O que fazer |
|----------|-------------|
| Página em branco ou erro 500 | Ver build (Deployments) e logs; conferir env. |
| Pesquisa / slugs não respondem | Configurar `DATABASE_URL` e redeploy; ver `/api/health`. |
| “Prisma not configured” na pesquisa | Mesmo: `DATABASE_URL` no Vercel + redeploy. |
| Mini-site 404 | Slug existe no banco? Conferir tabela `mini_sites` e `DATABASE_URL`. |
| Tela em branco | DevTools (F12) → Console para ver erro; testar /api/health; confirmar projeto e deploy no Vercel. |

Depois de corrigir a `DATABASE_URL` e fazer redeploy, teste de novo a home, a pesquisa e um mini-site.
