# trustbank.xyz — Deploy com X vermelho (Production Failed)

O código completo (menu lateral, home nova, personalização, selos, etc.) foi enviado para **github.com/ticoloco1/trustbank**.  
Se no GitHub aparece **Deployments → 1 Production** com **X vermelho**, o deploy na Vercel falhou. Siga abaixo.

---

## 1. Conferir na Vercel

1. Acesse [vercel.com](https://vercel.com) → seu projeto (o que está ligado ao repo **ticoloco1/trustbank**).
2. Abra **Deployments**. Deve ter um deploy novo (após o push). Clique nele.
3. Se estiver **Failed** (vermelho), abra **Building** ou **Logs** e veja a mensagem de erro.

---

## 2. Erro mais comum: DATABASE_URL

O build roda `prisma generate && next build` (o `db push` foi removido do build para não falhar na Vercel).  
**Sincronizar o banco:** depois do deploy, rode **uma vez** no seu PC (com `DATABASE_URL` no `.env.local`): `npm run db:push`. Assim as colunas novas (template, text_color, avatar_size, etc.) são criadas no Postgres da Vercel.

**O que fazer:**
- **Settings** → **Environment Variables**
- Adicione **DATABASE_URL** com a connection string do Postgres (ex.: Vercel Postgres, Neon, Supabase).
- Marque para **Production**, **Preview** e **Development**.
- Salve e faça **Redeploy**: Deployments → ⋮ no último deploy → **Redeploy**.

---

## 3. Outros erros de build

- **"Module not found"** → no terminal local: `npm install` e novo commit/push se precisar.
- **"Prisma schema" / "Column does not exist"** → o `prisma db push` no build atualiza o banco; precisa de **DATABASE_URL** válida.
- **TypeScript/ESLint** → o build pode falhar se houver erro de tipo; confira o log completo.

---

## 4. Depois do deploy em verde (Ready)

- Abra **https://trustbank.xyz** → deve aparecer a home nova (“One keyword. Infinite authority.”, menu com How It Works, Marketplace, Jobs, Slugs, etc.).
- Abra **https://trustbank.xyz/api/health** → deve retornar `{ "ok": true, "prisma": true }` se o banco estiver conectado.

Se o domínio trustbank.xyz não estiver no projeto, em **Settings → Domains** adicione **trustbank.xyz**.

---

## Resumo

| Problema | Solução |
|----------|---------|
| X vermelho em Production | Ver log do deploy na Vercel; na maioria das vezes é falta de **DATABASE_URL**. |
| Build falha em `prisma db push` | Configurar **DATABASE_URL** nas variáveis de ambiente e redeploy. |
| Site em branco ou 500 | Conferir **DATABASE_URL** e redeploy; testar `/api/health`. |
| Domínio não abre | Em Vercel → Settings → Domains, conferir se **trustbank.xyz** está no projeto certo. |
