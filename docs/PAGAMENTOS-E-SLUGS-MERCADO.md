# Pagamentos (paywall + blockchain) e mercado de slugs

## Estado atual

### 1. Paywall de vídeos — **não cobra de verdade**

- O botão "Desbloquear por X USDC" chama `POST /api/paywall/unlock` com `video_id` e `viewer_wallet`.
- O backend **não verifica** nenhum pagamento em blockchain: apenas grava o desbloqueio.
- Ou seja: hoje qualquer um pode desbloquear sem pagar. Para produção é **obrigatório**:
  - Exigir `tx_hash` e validar na chain que a carteira do usuário enviou o valor em USDC para a carteira da plataforma (ou contrato).
  - Só depois de validar a tx, registrar o `VideoUnlock` e liberar o vídeo.

### 2. Pagamentos aos criadores (paywall) — **parcial**

- Foi adicionado o campo `payout_wallet` no modelo `Creator` (carteira para receber a parte do criador).
- Ainda **não existe** o processo automático que, ao confirmar um pagamento de paywall, envia USDC ao criador. É preciso um job/cron ou processo manual que: leia `VideoUnlock` com `tx_hash` preenchido, calcule a parte do criador (ex.: 90%) e envie USDC para `Creator.payout_wallet`, registrando o repasse.

### 3. Compra e venda de slugs — **não existia**

- Foi adicionado: listagem de mini site (slug) à venda, compra com pagamento em USDC, transferência do slug ao comprador e repasse de 90% ao vendedor (10% fica com a plataforma).
- Ver modelos `SlugListing` e `SlugPurchase` e APIs em `/api/slugs/*`.

---

## Fluxo desejado

### Paywall (vídeos)

1. Usuário clica "Desbloquear por X USDC".
2. Front inicia pagamento USDC (carteira do usuário → carteira/contrato da plataforma) e obtém `tx_hash`.
3. Front chama `POST /api/paywall/unlock` com `video_id`, `viewer_wallet`, `tx_hash`, `amount_usdc`.
4. Backend **valida** a tx na chain (valor, destino, token USDC). Se inválida, retorna erro.
5. Se válida: grava `VideoUnlock` e (futuro) agenda repasse ao criador.

### Mercado de slugs

1. Vendedor coloca o mini site (slug) à venda: preço em USDC, carteira para receber.
2. Comprador paga USDC para a carteira da plataforma (e envia `tx_hash`).
3. Backend valida a tx; se ok: debita listing, cria `SlugPurchase`, atualiza `MiniSite.user_id` para o comprador, registra que 90% deve ir ao vendedor e 10% fica com a plataforma.
4. Processo automático ou manual envia 90% em USDC ao vendedor (e 10% fica na plataforma).

---

## Sistema unificado de pagamentos (implementado)

- **GET /api/payments/config?type=...&reference_id=...** — Retorna `destination_wallet`, `amount_usdc` e `label` para o tipo (VIDEO_UNLOCK, SLUG_PURCHASE, MINISITE_SUBSCRIPTION). O usuário envia USDC para essa carteira.
- **POST /api/payments/verify** — Body: `{ type, tx_hash, reference_id?, payer_wallet? }`. Verifica a tx na chain (viem + RPC) e:
  - **VIDEO_UNLOCK**: cria `Payment` e `VideoUnlock` (vídeo liberado).
  - **SLUG_PURCHASE**: cria `Payment`, marca listing como vendido, transfere `MiniSite.user_id` para o comprador, cria `SlugPurchase` (90% vendedor / 10% plataforma).
  - **MINISITE_SUBSCRIPTION**: cria `Payment` e atualiza `MiniSite.next_billing_at` (+1 mês).
  - **OTHER**: apenas cria `Payment`.
- **GET /api/payments?wallet=0x...&type=...&limit=50** — Lista pagamentos (por carteira ou tipo).
- **Mensalidade**: em `MiniSite` foram adicionados `subscription_plan`, `monthly_price_usdc`, `next_billing_at`. No dashboard (editar mini site) é possível definir o preço mensal em USDC; o pagamento é feito via config + verify (MINISITE_SUBSCRIPTION).

## Variáveis de ambiente

- `PLATFORM_WALLET` — carteira que recebe todos os pagamentos.
- `CHAIN_RPC_URL` — RPC para verificação de tx (ex.: Polygon).
- `CHAIN_ID` — opcional; 137 para Polygon, 1 para Ethereum.
- `USDC_CONTRACT_ADDRESS` — opcional; filtra logs por contrato USDC.
- `REQUIRE_PAYWALL_TX` — se `true`, o endpoint antigo `/api/paywall/unlock` exige `tx_hash`.

## APIs do mercado de slugs

- **GET /api/slugs** — lista slugs à venda. Query `?slug=xxx` para buscar por slug do mini site.
- **POST /api/slugs** (body: `mini_site_id`, `seller_wallet`, `price_usdc`) — coloca mini site à venda. Só o dono (`user_id` = `seller_wallet`) pode listar.
- **POST /api/slugs/buy** (body: `listing_id`, `buyer_wallet`, `tx_hash?`) — compra o slug: transfere o mini site para o comprador (atualiza `user_id`), marca listing como vendido, cria registro em `SlugPurchase` com 10% plataforma e 90% para o vendedor. O envio efetivo de USDC ao vendedor (90%) deve ser feito por processo externo (cron ou manual) usando `seller_payout_tx_hash` e `status: payout_done`.
