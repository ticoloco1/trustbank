# Login admin — só por carteira (sem email)

No TrustBank, o **acesso ao painel (admin)** é **só por carteira (wallet)**. Email não é usado para admin; Google OAuth é usado para vídeos e paywall, sem confirmação de email.

## Como entrar como admin

1. **Conecte sua carteira** no site (MetaMask ou outra). Você pode ir em **Dashboard** ou em **Auth** e clicar em "Ir ao Dashboard e conectar carteira".

2. **Registre sua carteira como admin** (uma das opções abaixo).

### Opção A: Variável de ambiente (mais rápido)

No **Vercel** (ou no servidor onde a app roda):

- **Settings** → **Environment Variables**
- Adicione (nome e valor):
  - **ADMIN_WALLET** = `0xSUA_CARTEIRA_AQUI` (o endereço completo, ex.: `0xf841d9F5ba7eac3802e9A476a85775e23d084BBe`)
- Marque **Production** (e Preview se quiser).
- Faça **Redeploy** do projeto.

Vários admins: use **ADMIN_WALLETS** com endereços separados por vírgula, ex.:  
`ADMIN_WALLETS=0xAAA...,0xBBB...`

### Opção B: Banco de dados

Adicione seu endereço na tabela `admin_wallet_addresses`:

- **Prisma Studio:** `npx prisma studio` → tabela `admin_wallet_addresses` → adicione uma linha com `wallet_address` = sua carteira.
- **SQL:**  
  `INSERT INTO admin_wallet_addresses (wallet_address, note) VALUES ('0xSUA_CARTEIRA', 'admin') ON CONFLICT (wallet_address) DO NOTHING;`

## Resumo

| O quê            | Como                    |
|------------------|-------------------------|
| **Admin / Dashboard** | Carteira (wallet) + ADMIN_WALLET no env ou na tabela `admin_wallet_addresses` |
| **Vídeos / Paywall**  | Google OAuth (sem confirmação de email) |
| **Email**             | Não usado para login admin; confirmação de email não é enviada nem exigida |

Se você tentou "cadastro com email" e pediu confirmação, isso não faz parte do TrustBank: o admin é só por carteira. Configure `ADMIN_WALLET` e conecte a carteira para começar.
