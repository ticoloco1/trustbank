# Pagamento e blockchain — conferir se está funcionando

## 1. Endpoint de status

Abra no navegador ou via `curl`:

```
GET /api/payments/status
```

Exemplo: `https://seu-site.vercel.app/api/payments/status`

A resposta indica:

| Campo | Significado |
|-------|-------------|
| `database_ok` | `true` se `DATABASE_URL` está definida e o Prisma conecta. |
| `destination_wallet_configured` | `true` se há destino para USDC (contrato ou `PLATFORM_WALLET`). |
| `destination` | Endereço que recebe USDC (ex.: contrato `0x578ac...`). |
| `blockchain_verification_available` | `true` se **pelo menos um** RPC está configurado (verificação de tx). |
| `chains.ethereum` | `true` se `ETH_RPC_URL` ou `CHAIN_RPC_URL` está definido. |
| `chains.polygon` | `true` se `POLYGON_RPC_URL` está definido. |
| `stripe_configured` | `true` se `STRIPE_SECRET_KEY` está definido (pagamento com cartão). |
| `ready` | `true` quando `database_ok` e `destination_wallet_configured`. |

Se `blockchain_verification_available` for `false`, o usuário até pode enviar USDC para o `destination`, mas o **Verify** (confirmação pela tx na chain) não vai funcionar até configurar um RPC.

---

## 2. Variáveis necessárias para pagamento + blockchain

### Obrigatórias para qualquer pagamento

- **`DATABASE_URL`** — Postgres. Sem isso, nada é salvo (Payment, VideoUnlock, etc.).
- **Destino USDC** — por padrão o código usa o contrato `0x578ac1c44E41f3ecfBaf3bEb86363FD3dd857011`. Para outro endereço, use **`PLATFORM_WALLET`**.

### Para verificação em blockchain (confirmar tx USDC)

É preciso **pelo menos uma** das seguintes:

- **`ETH_RPC_URL`** ou **`CHAIN_RPC_URL`** — RPC da Ethereum (ex.: Infura, Alchemy).
- **`POLYGON_RPC_URL`** — RPC da Polygon.

Sem nenhum RPC, a API `/api/payments/verify` responde com erro do tipo:  
*"Configure at least one of ETH_RPC_URL, CHAIN_RPC_URL or POLYGON_RPC_URL"*.

### Opcionais

- **`USDC_ETH_CONTRACT`** / **`USDC_CONTRACT_ADDRESS`** — contrato USDC na Ethereum (default: mainnet).
- **`USDC_POLYGON_CONTRACT`** — contrato USDC na Polygon (default: USDC nativo).
- **`STRIPE_SECRET_KEY`** e **`STRIPE_WEBHOOK_SECRET`** — para pagamento com cartão e webhook.

---

## 3. Fluxo de pagamento em USDC (blockchain)

1. **Front** chama `GET /api/payments/config?type=VIDEO_UNLOCK&reference_id=...` (ou outro tipo).
2. A API devolve `destination_wallet` (contrato ou wallet) e `amount_usdc`.
3. Usuário envia USDC para esse endereço na Ethereum ou na Polygon e obtém o `tx_hash`.
4. **Front** chama `POST /api/payments/verify` com `type`, `reference_id`, `tx_hash`, e opcionalmente `payer_wallet`.
5. O backend chama **`verifyUsdcPayment`** (viem + RPC): busca o receipt da tx em cada rede configurada até achar; confere se houve Transfer de USDC para o `destination_wallet` e se o valor é ≥ o mínimo.
6. Se estiver ok: cria/atualiza Payment, VideoUnlock (ou SlugPurchase, etc.) e responde sucesso.

Para esse fluxo funcionar de ponta a ponta:

- `DATABASE_URL` e destino (contrato ou `PLATFORM_WALLET`) precisam estar corretos.
- Pelo menos um RPC (Ethereum ou Polygon) precisa estar configurado; caso contrário a verificação em blockchain não funciona.

---

## 4. Conferência rápida no site

1. Abrir **`/api/payments/status`** e checar `ready`, `blockchain_verification_available` e `destination`.
2. Abrir uma página que usa pagamento (ex.: vídeo com paywall) e ver se aparece o endereço de destino e o valor em USDC (vem do **config**).
3. Fazer um pagamento de teste em USDC para esse endereço, copiar o `tx_hash` e clicar em “Verificar pagamento”.  
   - Se der erro de “Configure at least one of...”, falta configurar RPC.  
   - Se der “Transaction not found...”, a tx pode estar em outra rede ou o RPC estar errado/indisponível.

---

## 5. Resumo

- **Pagamento e blockchain “funcionando”** no site significa:  
  - banco ok (`database_ok`),  
  - destino USDC ok (`destination_wallet_configured` / `destination`),  
  - e, para **verificação** da tx em blockchain: pelo menos um de `ETH_RPC_URL`, `CHAIN_RPC_URL` ou `POLYGON_RPC_URL` configurado.
- Use **`GET /api/payments/status`** para verificar isso em qualquer ambiente (local ou deploy).
