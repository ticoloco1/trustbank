# Setup do banco — caminho sem problema

Sugestão: **banco novo** na Vercel, sem reaproveitar o antigo. Assim você evita dados quebrados, schema antigo e config antiga.

---

## Passo a passo (tudo na Vercel)

### 1. Criar o banco (Postgres da Vercel)

1. Abra o projeto no [Vercel](https://vercel.com).
2. Vá na aba **Storage**.
3. **Create Database** → escolha **Postgres**.
4. Dê um nome (ex.: `trustbank-db`) e crie.
5. No banco criado, abra **.env** ou **Connection String** e copie a variável **`DATABASE_URL`** (ou a URL completa).

### 2. Variáveis de ambiente

1. **Settings** → **Environment Variables**.
2. Adicione:
   - **`DATABASE_URL`** → cole a URL que você copiou do Storage (Postgres).
   - **`SESSION_SECRET`** → crie uma string longa e aleatória (ex.: [randomkeygen.com](https://randomkeygen.com), “CodeIgniter Encryption Keys”).
3. Marque **Production** (e **Preview** se quiser).
4. **Save**.

### 3. Deploy

1. **Deployments** → no último deploy, **⋯** → **Redeploy**.
2. O build já roda `prisma db push`: as tabelas são criadas/atualizadas nesse banco novo no primeiro deploy. Não precisa rodar nada no seu PC.

### 4. Conferir

- Abra: **https://trustbank.xyz/api/health**  
  Deve retornar: `"prisma": true`.
- O banner “Site sem banco de dados” some.

---

## Por que esse caminho?

- **Banco novo** = sem herdar problema de design, slugs ou Google do banco antigo.
- **Postgres na Vercel** = mesmo lugar do deploy, conexão e variáveis já integradas.
- **`prisma db push` no build** = tabelas criadas no deploy; você não precisa rodar comando no computador.

Depois você configura Google, slugs e o que mais precisar em cima desse ambiente limpo.
