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

## 4. Domínio (trustbank.xyz igual ao Lovable?)

- Se **trustbank.xyz** está igual ao **prime-fin-dash.lovable.app**, o domínio ainda está ligado ao **Lovable**, não ao Vercel. O código do GitHub (Vercel) não aparece.
- Leia **docs/DOMINIO-VERCEL-NAO-LOVABLE.md**: como apontar trustbank.xyz para o **Vercel** em vez do Lovable.
- No Vercel, **Settings → Domains**: adicione trustbank.xyz ao projeto certo. No registro do domínio (onde você comprou), use o CNAME/A que o Vercel indicar.

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
