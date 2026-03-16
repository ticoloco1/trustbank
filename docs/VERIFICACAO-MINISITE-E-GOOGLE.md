# Verificação: Mini site, mensalidade US$ 29,90 e login Google

## Fluxo de criação de mini site e pagamento da mensalidade

### 1. Criar o mini site
- **Slug primeiro**: o usuário precisa **pagar pelo slug** em `/slugs` (claim) ou já ter um slug pago.
- **Dashboard**: em `/dashboard`, "Criar mini site" ou acessar um slug já pago e criar o mini site com esse slug.
- **POST /api/mini-sites**: exige que o slug tenha pagamento `SLUG_CLAIM` (carteira ou e-mail). Ao criar, o mini site já recebe:
  - `subscription_plan: "monthly"`
  - `monthly_price_usdc: "29.90"` (padrão em `src/lib/payment-config.ts`).

### 2. Pagar a mensalidade (US$ 29,90/mês)
- **Obter valor e destino**:  
  `GET /api/payments/config?type=MINISITE_SUBSCRIPTION&reference_id=<id_do_mini_site>`  
  Retorna `amount_usdc: "29.90"`, `destination_wallet` e `label`.
- **Pagamento em USDC (blockchain)**:
  1. Usuário envia 29,90 USDC para `destination_wallet` (Polygon ou Ethereum).
  2. Chama `POST /api/payments/verify` com `type=MINISITE_SUBSCRIPTION`, `reference_id=<id>`, `tx_hash=0x...`.
  3. O sistema verifica a tx, grava o pagamento e atualiza `next_billing_at` (+1 mês).
- **Pagamento com cartão (Stripe)**:
  1. Chama `POST /api/payments/create-checkout` com `type=MINISITE_SUBSCRIPTION`, `reference_id=<id>`.
  2. Usuário paga no Stripe Checkout.
  3. O webhook Stripe processa e atualiza `next_billing_at` e registra o pagamento.

### 3. Ajustes feitos na verificação
- **Novos mini sites**: ao criar, já saem com `monthly_price_usdc: "29.90"` e `subscription_plan: "monthly"`.
- **Mini sites antigos sem preço**: em config, verify, create-checkout e webhook Stripe, se `monthly_price_usdc` for vazio, usa-se o padrão **29,90** (MINISITE_MONTHLY_USD).
- Assim, tanto criação quanto primeira mensalidade e renovações funcionam com US$ 29,90/mês.

---

## Login Google (OAuth)

### Onde está
- **Entrada**: header global ("Entrar com Google"), `/auth`, `/site/edit`, `/dashboard`.
- **Rota**: `GET /api/auth/google` → redireciona para o Google.
- **Callback**: `GET /api/auth/google/callback?code=...` → troca `code` por tokens, grava cookie `tb_google_token`, redireciona para `/dashboard` ou `state` (ex.: `/site/edit`).
- **Sessão**: `GET /api/auth/google/session` → retorna `{ user: { id, email } }` se houver cookie válido.
- **Logout**: `DELETE /api/auth/google/session` → remove o cookie.

### O que precisa estar configurado
1. **Google Cloud Console**: OAuth 2.0 Client ID (tipo "Aplicativo da Web") com:
   - URIs de redirecionamento:  
     `https://SEU_DOMINIO/api/auth/google/callback`  
     `http://localhost:3000/api/auth/google/callback`
2. **Variáveis de ambiente** (ou painel admin):
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
3. **Opcional (YouTube/vídeos)**: `YOUTUBE_API_KEY` ou `GOOGLE_API_KEY` para API de dados do YouTube.

Se as chaves não estiverem definidas, `GET /api/auth/google` retorna 503 com a mensagem "Google OAuth não configurado".

---

## Resumo rápido
| Item | Status |
|------|--------|
| Criar mini site (com slug pago) | ✅ |
| Novo mini site com plano 29,90/mês | ✅ (default ao criar) |
| Config mensalidade (valor/destino) | ✅ (usa 29,90 se vazio) |
| Verify mensalidade (USDC) | ✅ |
| Stripe checkout + webhook mensalidade | ✅ |
| Login Google (OAuth) | ✅ (depende das chaves no env/admin) |
