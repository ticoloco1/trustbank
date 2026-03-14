# Pagamento com cartão e repasse em USDC

## Fluxo

1. **Usuário paga com cartão** (Stripe Checkout) — valor cobrado em USD (1:1 com USDC).
2. **Webhook Stripe** confirma o pagamento → a plataforma registra o `Payment` (payment_method: card), libera o acesso (VideoUnlock, SlugPurchase, renovação de mensalidade) e marca o valor para **repasse em USDC** ao beneficiário (criador do vídeo, vendedor do slug, etc.).
3. **Repasse em USDC**: a plataforma converte o valor recebido em cartão e envia USDC para a carteira do criador/vendedor (processo manual ou automatizado, usando `usdc_settlement_tx` no `Payment` quando enviar).

## Configuração

- **STRIPE_SECRET_KEY** — chave secreta do Stripe (Dashboard → Developers → API keys).
- **STRIPE_WEBHOOK_SECRET** — assinatura do webhook (Dashboard → Developers → Webhooks → Add endpoint).
  - URL do endpoint: `https://seu-dominio.com/api/webhooks/stripe`
  - Evento: `checkout.session.completed`

## APIs

- **POST /api/payments/create-checkout**  
  Body: `{ type, reference_id, success_url?, cancel_url?, customer_email? }`  
  Retorna `{ url, session_id }`. Redirecione o usuário para `url` para pagar com cartão.

- **POST /api/webhooks/stripe**  
  Chamado pelo Stripe ao concluir o pagamento. Não requer autenticação do usuário; a assinatura é validada com `STRIPE_WEBHOOK_SECRET`.

## Vídeo (paywall)

- Na página do vídeo (/v/[id]) há o botão **"Pagar com cartão (repasse em USDC)"**.
- Se o usuário estiver logado com Google, o e-mail é enviado ao checkout (e usado no webhook para criar o unlock com `viewer_id: email:xxx`).
- Após o pagamento, o usuário volta para a página; se o mesmo e-mail estiver na sessão Google, o vídeo aparece liberado (hasAccess por email).

## Identificação por e-mail (cartão) vs carteira (crypto)

- **Crypto**: acesso por `viewer_id` = endereço da carteira.
- **Cartão**: acesso por `viewer_id` = `email:customer@x.com` (e-mail do Stripe).
- O GET /api/videos/[id] aceita `?wallet=0x...` ou `?email=user@x.com` para retornar `hasAccess` corretamente.
