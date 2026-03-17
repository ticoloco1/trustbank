# Atualizar o banco de produção (parar os 500)

Os erros **"column does not exist"** e **"table does not exist"** acontecem porque o Postgres em produção está com schema antigo. O código (Prisma) espera colunas e tabelas que ainda não existem no banco.

**Desde que o script de build foi ajustado,** a cada deploy o Vercel roda `prisma db push` e o banco é atualizado sozinho. Ou seja: o “instala” que deixa o banco e o código juntos é o próprio deploy (desde que `DATABASE_URL` esteja configurada). Veja **docs/INSTALACAO-BANCO-E-ENV.md**.

## O que fazer

1. **Abrir o Postgres de produção**
   - **Vercel:** projeto → **Storage** → seu banco Postgres → aba **Query** (ou **.env** para pegar a connection string e abrir em outro cliente).
   - **Supabase / outro:** abra o **SQL Editor** conectado ao mesmo banco que a variável `DATABASE_URL` do Vercel usa.

2. **Rodar o script SQL**
   - Abra o arquivo **`docs/ATUALIZAR_BANCO_PRODUCAO.sql`** deste repositório.
   - Copie **todo** o conteúdo.
   - Cole no editor SQL do banco de produção e **execute**.

3. **Redeploy (opcional)**
   - No Vercel, **Deployments** → ⋮ no último deploy → **Redeploy** (só para garantir que não há cache).

Depois disso, as rotas que estavam dando 500 por coluna/tabela faltando (ex.: `/api/auth/google`, `/api/slugs/check`, `/api/credits/summary`, `/s/[slug]`, `/api/mini-sites`) devem passar a responder normalmente.

## Se ainda der erro de coluna/tabela

Se aparecer outro erro do tipo **"column X does not exist"** ou **"table Y does not exist"**, envie a mensagem completa. Aí dá para montar um novo trecho de SQL para rodar no mesmo banco.

## Alternativa: `prisma db push` com a URL de produção

Se você tiver a **DATABASE_URL de produção** no `.env` (ou em outro arquivo que não vai para o Git) e quiser alinhar o schema de uma vez:

```bash
# Cuidado: isso altera o BANCO DE PRODUÇÃO.
DATABASE_URL="postgresql://..." npx prisma db push
```

Só use se tiver certeza de que a URL é a do banco de produção e que não há dados que possam ser afetados. Para a maioria dos casos, rodar o **ATUALIZAR_BANCO_PRODUCAO.sql** no painel do banco é mais seguro.
