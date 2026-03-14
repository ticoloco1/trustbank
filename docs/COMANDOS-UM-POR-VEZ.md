# TrustBank Prisma — um comando por vez

Rode **só o comando da etapa em que você está**. Não digite nada antes nem depois do comando.

---

## Etapa 1 — Link

**Copie e cole no terminal só isto (nada mais):**
```bash
vercel link
```
Dê **Enter**. Quando o terminal perguntar, use as **setas** para escolher **prime-fin-dash** e dê **Enter** de novo. Não escreva "escolher" nem "prime-fin-dash" no comando.

---

## Etapa 2 — Colocar a URL do banco
```bash
vercel env add DATABASE_URL production
```
Quando pedir o valor, **cole** a connection string do Prisma (a que você copiou no Storage) e dê Enter.

---

## Etapa 3 — Ligar o modo Prisma
```bash
vercel env add NEXT_PUBLIC_USE_PRISMA production
```
Quando pedir o valor, digite: **true** e Enter.

---

## Etapa 4 — Baixar variáveis
```bash
vercel env pull .env.local
```

---

## Etapa 5 — Criar tabelas
```bash
npx prisma generate
```
Depois:
```bash
npx prisma db push
```

---

## Etapa 6 — Colocar sua wallet como admin
Troque `0xSUA_WALLET` pelo endereço da sua carteira.
```bash
ADMIN_WALLET=0xSUA_WALLET node prisma/seed.js
```

---

## Etapa 7 — Publicar
```bash
vercel --prod
```

---

## Etapa 8 — Testar
Abra **https://trustbank.xyz** no navegador.

---

**Em qual etapa você está?** Rode só aquele comando e depois o próximo.
