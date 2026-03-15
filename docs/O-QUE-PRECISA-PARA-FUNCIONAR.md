# O que precisa para funcionar (templates, colunas, mini sites)

Para os **templates** (temas de cor), **colunas** (1, 2 ou 3) e o **mini site público** funcionarem, tudo abaixo precisa estar certo.

---

## 1. Variáveis de ambiente

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | **Sim** | Connection string do Postgres (ex.: Vercel Storage). Sem isso o Prisma não conecta e **nada é salvo** (mini sites, layout, temas). |
| `NEXT_PUBLIC_USE_PRISMA` | **Sim** (para TrustBank) | Valor: `true`. Faz o front usar auth/API com Prisma e libera o dashboard. |

**Local:** crie `.env.local` com:

```
DATABASE_URL="postgres://usuario:senha@host...?sslmode=require"
NEXT_PUBLIC_USE_PRISMA=true
```

**Vercel:** em Settings → Environment Variables, adicione as duas para Production (e Preview se quiser).

---

## 2. Banco de dados (tabelas)

As tabelas precisam existir no Postgres. Na pasta do projeto:

```bash
npm run db:push
```

(ou `npx prisma db push`). Isso cria/atualiza as tabelas a partir do `prisma/schema.prisma`.

---

## 3. Admin (para acessar o dashboard)

O dashboard exige que sua **carteira** esteja cadastrada como admin. Duas formas:

**Opção A – Seed (recomendado na primeira vez):**

```bash
# Com DATABASE_URL no .env.local
ADMIN_WALLET=0xSuaCarteira node prisma/seed.js
```

Isso cria o registro em `admin_wallet_addresses` e, se existir, em `platform_settings`.

**Opção B – Manual:** no Postgres, insira uma linha na tabela `admin_wallet_addresses`:

- `wallet_address` = sua carteira (ex.: `0xf841d9F5ba7eac3802e9A476a85775e23d084BBe`)
- `note` = ex.: `admin`

---

## 4. Conectar carteira no site

1. Abra o site (ex.: `http://localhost:3000` ou a URL da Vercel).
2. Vá em **Dashboard** (ou `/dashboard`).
3. Conecte a **carteira** (MetaMask etc.) que você cadastrou como admin.
4. O dashboard só mostra criação/edição de mini sites se `user` ou `isAdmin` estiverem ok (carteira admin + Prisma).

---

## 5. Criar um mini site (para templates e colunas “entrarem”)

1. No dashboard, preencha:
   - **Site name** e **Slug** (ex.: `meu-site` → URL será `/s/meu-site`).
   - **Layout (colunas):** escolha 1, 2 ou 3.
   - **Cores e temas:** clique em um dos botões (Alumínio anodizado, Azul, Vermelho, etc.) para aplicar o tema (e salvar `theme` + cores).
2. Clique em **Create mini site**.

Isso chama `POST /api/mini-sites` e grava no banco: `layout_columns`, `theme`, `primary_color`, `accent_color`, `bg_color`, etc.

---

## 6. Ver o mini site público

- URL: **`/s/[slug]`** (ex.: `/s/meu-site`).
- A página lê o mini site pelo `slug`, usa `layout_columns` para o grid (1, 2 ou 3 colunas) e as cores salvas. Os estilos de grid estão em `app/globals.css` (`.minisite-layout-1`, `.minisite-layout-2`, `.minisite-layout-3`).

Se aparecer 404:

- Confirme que o mini site foi criado (lista no dashboard).
- Confirme que o **slug** está preenchido e que você está acessando exatamente `/s/esse-slug`.

---

## 7. Editar um mini site (mudar colunas/tema)

1. No dashboard, na lista de mini sites, clique em **Edit** do mini site.
2. Altere **Layout (columns)** (1, 2 ou 3) e/ou **Theme & colors** (botões de tema).
3. Clique em **Save**.

Isso chama `PATCH /api/mini-sites/[id]` e atualiza `layout_columns`, `theme` e cores no banco.

---

## Checklist rápido

- [ ] `DATABASE_URL` definida (local e/ou Vercel)
- [ ] `NEXT_PUBLIC_USE_PRISMA=true`
- [ ] `npm run db:push` já executado
- [ ] Carteira admin cadastrada (seed ou tabela `admin_wallet_addresses`)
- [ ] Carteira conectada no site ao acessar o dashboard
- [ ] Mini site criado com **slug**, **layout (1/2/3 colunas)** e **tema** escolhido
- [ ] Acesso a `/s/[slug]` para ver o resultado

Se algo não “entrar” (templates, colunas), confira: (1) se o banco está conectado (`DATABASE_URL`), (2) se você está como admin e (3) se está criando/editando o mini site com layout e tema e salvando (Create / Save).
