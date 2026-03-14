# Por que o prime-fin-dash “aponta” para o Prisma mas os dados estavam no outro DB?

## O que você está vendo

- No projeto **prime-fin-dash** (trustbank.xyz), quando você clica em **Storage**, aparece o banco **prisma-postgres-chestnut-chair**.
- Ou seja: o **projeto** está ligado ao Prisma; o banco existe e está “direcionado” para o trustbank.

## O que estava acontecendo

Ter o Prisma no Storage **só significa** que:

1. O banco Prisma existe e está conectado ao projeto.
2. A Vercel pode ter colocado variáveis (por exemplo `POSTGRES_URL` ou `DATABASE_URL`) nas variáveis de ambiente do projeto.

**Mas** o **código** do site (Next.js) não usava esse banco enquanto não fossem cumpridas **duas** coisas:

1. **Variável `NEXT_PUBLIC_USE_PRISMA = true`**  
   Sem isso, o app continua usando **Supabase** (o “outro db” da conta Hashpo) para nome, logo, admin, etc. Ou seja: “aponta” para o Prisma no Storage, mas o app ainda “entra” no outro db (Supabase).

2. **Tabelas criadas no Prisma**  
   Se você não rodou `npx prisma db push` (ou o SQL) no banco Prisma, as tabelas (`platform_settings`, `admin_wallet_addresses`, etc.) não existem lá. Aí mesmo com a variável, o app não teria onde ler/escrever.

Resumindo: **sim, estava no outro db (Supabase)**. O Prisma estava só “disponível” e ligado ao projeto; o app ainda não estava configurado para usar só o Prisma.

## O que fazer para o TrustBank “entrar” de fato no Prisma

Para o trustbank.xyz **parar** de usar o Supabase e **passar a usar só o Prisma**:

1. **Variáveis do projeto (prime-fin-dash)**  
   - Ter **DATABASE_URL** (ou POSTGRES_URL) = connection string do **prisma-postgres-chestnut-chair** (a mesma que aparece no Storage).  
   - Ter **NEXT_PUBLIC_USE_PRISMA** = **true**.

2. **Criar as tabelas no Prisma**  
   - No seu Mac, na pasta do projeto, com essa mesma URL no `.env.local`:  
     `npx prisma db push`

3. **Colocar dados iniciais (nome TrustBank + seu admin)**  
   - Rodar o seed:  
     `ADMIN_WALLET=0xSuaWallet node prisma/seed.js`

4. **Redeploy**  
   - Dar **Redeploy** no projeto (ou `vercel --prod` pelo terminal).

Depois disso, o app passa a “entrar” no Prisma: nome, logo e admin vêm do banco **prisma-postgres-chestnut-chair**, e não mais do “outro db” (Supabase).

## Resumo em uma frase

- **Storage → Prisma** = o projeto está **direcionado** ao Prisma (o banco existe e está ligado).
- **“Não entrou nele e está no outro db”** = o app ainda estava configurado para usar o Supabase; faltava `NEXT_PUBLIC_USE_PRISMA=true`, tabelas no Prisma e redeploy.
- Siga o **docs/PASSO-A-PASSO-TRUSTBANK-PRISMA-FINAL.md** para fazer o TrustBank usar de fato só o Prisma.
