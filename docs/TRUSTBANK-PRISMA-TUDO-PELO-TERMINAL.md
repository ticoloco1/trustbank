# TrustBank 100% Prisma — tudo pelo terminal

Dá para fazer a configuração toda pelo terminal. Só a **connection string** você pega uma vez no site da Vercel (Storage → banco → Show secret → copiar).

---

## 1. Vercel CLI e link do projeto

```bash
npm install -g vercel
cd /Users/arycorreiafilho/Desktop/hashpo-next/royal-fintech-hub
vercel link
```

Quando perguntar, escolha o time e o projeto **prime-fin-dash**.

---

## 2. Variáveis no projeto (pelo terminal)

**DATABASE_URL** — quando pedir o valor, cole a connection string do Postgres (a que você copiou no Storage do trustbank):

```bash
vercel env add DATABASE_URL production
```

**NEXT_PUBLIC_USE_PRISMA** — quando pedir o valor, digite: `true`

```bash
vercel env add NEXT_PUBLIC_USE_PRISMA production
```

(Opcional) Remover variáveis do Supabase do projeto trustbank (se existirem):

```bash
vercel env rm NEXT_PUBLIC_SUPABASE_URL production
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

---

## 3. Baixar variáveis para o seu Mac

```bash
vercel env pull .env.local
```

Assim o Prisma e o seed usam a mesma `DATABASE_URL` que está na Vercel.

---

## 4. Criar tabelas no banco

```bash
npx prisma generate
npx prisma db push
```

---

## 5. Inserir TrustBank + primeiro admin (seed)

**Opção A — Usando o seed (recomendado)**

Coloque no **package.json** do projeto, dentro de `"scripts"` ou no root, a chave **"prisma"**:

```json
"prisma": {
  "seed": "node prisma/seed.js"
}
```

Depois rode (troque pela **sua** wallet se quiser):

```bash
ADMIN_WALLET=0xSuaWalletAqui npx prisma db seed
```

Se não passar `ADMIN_WALLET`, o script usa o endereço padrão do doc (`0xf841d9F5ba7eac3802e9A476a85775e23d084BBe`). O seed cria também o registro em `platform_settings` (TrustBank, 4 colunas).

**Opção B — Sem editar package.json**

Depois de `vercel env pull .env.local`, rode o seed. O script tenta carregar `.env.local` (se tiver o pacote `dotenv`). Caso contrário, defina `DATABASE_URL` antes:

```bash
node prisma/seed.js
```

Se der erro de `DATABASE_URL` não definida:

```bash
npm install dotenv --save-dev
node prisma/seed.js
```

Para usar **outra wallet** como admin:

```bash
ADMIN_WALLET=0xSuaCarteira node prisma/seed.js
```

---

## 6. Deploy

```bash
vercel --prod
```

---

## Resumo em ordem (copiar e colar)

Depois de ter a connection string e o `vercel link` feito:

```bash
cd /Users/arycorreiafilho/Desktop/hashpo-next/royal-fintech-hub
vercel env add DATABASE_URL production          # colar a URL quando pedir
vercel env add NEXT_PUBLIC_USE_PRISMA production # valor: true
vercel env pull .env.local
npx prisma generate
npx prisma db push
ADMIN_WALLET=0xSuaWallet node prisma/seed.js   # troque pela sua wallet
vercel --prod
```

(Troque `0xSuaWallet` pelo endereço da sua carteira.)

Pronto: TrustBank 100% Prisma, configurado pelo terminal.
