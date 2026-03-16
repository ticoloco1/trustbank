# Monetização por shares (cotas) — vídeos TrustBank

## Visão geral

O vídeo tem um **valor** (ex.: $150.000). Parte das **cotas (shares)** é vendida a investidores; a **receita** (YouTube ads + TrustBank) é **dividida mensalmente** entre os detentores de cotas. Quem tem cotas pode **revender no mercado** (corretora tipo Binance).

## Regras

- **20%** das cotas fica sempre com o **sistema** (configurável na cotação).
- **50% a 80%** é **vendível** a investidores (configurável).
- **Preço por share** na oferta inicial = `valuation_usdc / total_shares` (calculado na hora).
- **Rateio mensal**: quando há receita (ex.: $3.000 em ads), o valor é dividido:
  - Sistema recebe: `(system_shares / total_active_shares) * amount`
  - Cada investidor recebe: `(suas_cotas / total_active_shares) * amount`

## Schema (Prisma)

- **CreditBalance**: saldo de créditos por carteira (`wallet`, `balance_usdc`). 1 crédito = 1 USDC.
- **CreditTransaction**: histórico (`wallet`, `type`: deposit | withdrawal | share_buy | share_sell, `amount_usdc`, `reference_type`, `reference_id`, `tx_hash`).
- **VideoQuotation**: `total_shares`, `system_percent` (20), `sellable_percent` (50–80), `valuation_usdc`, `ticker_symbol`, `revenue_usdc`
- **VideoShareHolding**: quem tem quantas cotas (`video_id`, `owner_wallet`, `shares`)
- **VideoShareOrder**: ordens de venda/compra (`order_type: sell | buy`, `amount_shares`, `price_per_share_usdc`, `status: active | filled | cancelled`)
- **VideoRevenueEvent**: receita do período (`period_start`, `period_end`, `amount_usdc`, `source: youtube_ads | platform`)
- **VideoRevenueDistribution**: rateio por holder (`revenue_event_id`, `holder_wallet`, `shares_at_time`, `revenue_amount_usdc`)

## Como lançar um vídeo com shares

1. **Confirmar canal no YouTube**: em **Videos & paywall** (`/site/edit`), faça login com Google (conta do canal). Adicione o vídeo pela URL; o sistema verifica se você é dono.
2. **Vincular ao mini site** (opcional): no **Dashboard** → editar mini site → seção “Vídeos do negócio” → informe o ID do vídeo e clique em Adicionar.
3. **Abrir shares (só admin)**: no mesmo Dashboard, em “Vídeos do negócio”, clique em **Cotação** no vídeo. Defina total de shares (ex.: 1.000.000), valor (ex.: 150000), sistema 20%, vendível 50–80%, ticker. Clique em **Salvar (só admin)**. Só quem é admin (carteira em `ADMIN_WALLET` ou tabela `admin_wallet_addresses`) pode salvar.

## Créditos TrustBank (1 crédito = 1 USDC)

Para **não caracterizar como corretora**, compra e venda de shares usam **créditos** em vez de USDC direto:

- O usuário **deposita USDC** (envia para a carteira da plataforma) e recebe **créditos 1:1** (via `POST /api/credits/deposit` com `tx_hash`).
- **Comprar shares** (pool ou oferta): debita **créditos** do comprador.
- **Vender shares**: quando alguém preenche a oferta, o comprador paga em créditos e o **vendedor recebe créditos**.
- **Retirada**: o usuário solicita conversão de créditos em USDC (`POST /api/credits/withdraw`); o saldo é debitado e o USDC é enviado à carteira (processo manual ou automatizado depois).

Assim, a negociação é em “créditos”; a troca créditos ↔ USDC (depósito/retirada) fica em evidência no rodapé e na página **Créditos** (`/credits`).

- **Rodapé**: com carteira conectada, mostra saldo, total depositado, total retirado, quantidade de vídeos em que tem cotas, e link para Créditos.
- **Página Créditos** (`/credits`): saldo, depositar (tx hash), retirar, histórico de transações, minhas cotas (shares por vídeo).

## Vídeo removido do ar (delisted) e “seguro”

Se o **criador tirar o vídeo do ar** (ex.: apagar do YouTube), investidores que compraram cotas ficam expostos. O sistema hoje trata assim:

- **Campo `Video.delisted_at`**: quando preenchido, o vídeo está marcado como “removido do ar”. O admin pode marcar via `PATCH /api/videos/[id]` com `{ "admin_wallet": "0x...", "delisted_at": true }` (ou `false` para desmarcar).
- **Receita**: não é permitido registrar nova receita para vídeo com `delisted_at` preenchido. O rateio fica **congelado** a partir daí (distribuições já geradas continuam válidas para pagamento).
- **Ideias para um “seguro”** (a implementar conforme política):
  1. **Contratual**: nos ToS, o criador se compromete a não remover o vídeo ou a indenizar; em caso de remoção, processo/arbitragem.
  2. **Escrow**: parte da receita fica em custódia até X meses; se o vídeo for removido, esse valor é rateado entre os holders como compensação.
  3. **Seguro terceirizado**: produto de seguro que cobre perda de receita em caso de remoção.
  4. **Exibir aviso**: na página do vídeo e na corretora, mostrar “Vídeo removido do ar – rateios congelados” quando `delisted_at` estiver preenchido.

## APIs

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/videos/[id]/quotation` | Ler cotação (público) |
| PATCH | `/api/videos/[id]/quotation` | **Só admin.** Criar/editar cotação. Body: `admin_wallet`, `total_shares?`, `system_percent?`, `sellable_percent?`, `valuation_usdc?`, `ticker_symbol?`, `revenue_usdc?` |
| PATCH | `/api/videos/[id]` | **Só admin.** Marcar vídeo removido do ar. Body: `admin_wallet`, `delisted_at: true \| false` |
| GET | `/api/credits/balance?wallet=0x` | Saldo de créditos |
| GET | `/api/credits/summary?wallet=0x` | Saldo, total depositado/retirado, lista de cotas por vídeo |
| GET | `/api/credits/transactions?wallet=0x` | Histórico de transações de créditos |
| GET | `/api/credits/deposit-address` | Carteira para enviar USDC (depósito) |
| POST | `/api/credits/deposit` | Creditar após depósito; body: `wallet`, `tx_hash` (verifica tx USDC → plataforma) |
| POST | `/api/credits/withdraw` | Debitar e solicitar retirada USDC; body: `wallet`, `amount_usdc` |
| GET | `/api/videos/[id]/shares?wallet=0x...` | Book, cotação, pool disponível, minhas cotas e ordens |
| POST | `/api/videos/[id]/shares/buy` | Comprar do pool (IPO) **com créditos**; body: `wallet`, `amount_shares` |
| POST | `/api/videos/[id]/shares/orders` | Criar ordem de venda ou compra |
| POST | `/api/videos/[id]/shares/orders/[orderId]/fill` | Preencher ordem: comprador paga em **créditos**, vendedor recebe **créditos** |
| PATCH | `/api/videos/[id]/shares/orders/[orderId]?wallet=0x` | Cancelar ordem |
| GET | `/api/videos/[id]/revenue` | Listar eventos de receita e distribuições |
| POST | `/api/videos/[id]/revenue` | (Admin/cron) Registrar receita do período e gerar rateio. **Recusado se vídeo estiver delisted.** |

## Fluxo

1. **Criar vídeo** (YouTube + embed no sistema).
2. **Configurar cotação** no dashboard: total de shares, 20% sistema, 50–80% vendível, valuation (ex. $150.000), ticker.
3. **Investidores compram** do pool (IPO) ou de ofertas de venda no book.
4. **Mensalmente**: admin/cron chama `POST /api/videos/[id]/revenue` com `period_start`, `period_end`, `amount_usdc` (ex. receita YouTube + plataforma). O sistema calcula e grava as distribuições.
5. **Pagamento do rateio**: as linhas em `VideoRevenueDistribution` indicam quanto cada holder deve receber; o envio em USDC pode ser manual ou automatizado depois.

## Corretora (UI)

- **VideoShareBroker**: book (vendas / compras), valuation, receita acum., preço/share, pool disponível, “Minhas cotas”.
- **Comprar do pool**: input de qtd + botão “Comprar” (holding é criado; pagamento USDC pode ser verificado em fluxo futuro).
- **Vender**: input qtd + preço/share + “Colocar à venda”; na lista de vendas, outro usuário pode clicar “Comprar” para preencher a ordem (transferência de cotas).

## Próximos passos (sugestão)

- **Gráfico**: preço/share ao longo do tempo, volume.
- **CPM / visualizações**: integrar dados do YouTube (views, receita) para exibir no mini site.
- **Pagamento na compra do pool**: vincular compra a um pagamento USDC e só criar holding após confirmação da tx.
- **Payout automático**: job que envia USDC aos holders conforme `VideoRevenueDistribution` (campo `paid_at`).
