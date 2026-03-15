# Preços e taxas — pagamentos em blockchain

Os pagamentos em USDC (blockchain) são enviados ao **contrato de pagamentos** (Remix). O contrato faz a distribuição. Os repasses (criador, vendedor) são calculados conforme abaixo.

## Contrato e carteira

- **Contrato (Remix) — destino dos pagamentos**: `0x578ac1c44E41f3ecfBaf3bEb86363FD3dd857011`  
  Pagamentos e distribuição: usuários enviam USDC para este contrato.
- **Treasury / admin**: `0xf841d9F5ba7eac3802e9A476a85775e23d084BBe`  
  (ex.: seed admin, outros usos fora do fluxo de pagamento.)
- No backend, o destino usado é `getPlatformWallet()`: por padrão o contrato acima. Para usar outra carteira/contrato, defina `PLATFORM_WALLET` no `.env`.

---

## Mini site — mensalidade

- **Valor**: **29,90 US$** / mês (default).
- Configurável por mini site em `monthly_price_usdc`; o dashboard sugere 29,90.
- 100% vai para a plataforma (cobrança de assinatura).

---

## Slug avulso (company / @handle) — sem mini site

- **Compra inicial**: **12,90 US$** (one-time). Comprador ganha um mini site com aquele slug.
- **Após 1 ano**: **12,90 US$** / ano (renovação). Campos no mini site: `slug_annual_renewal_usdc`, `next_slug_renewal_at`.

---

## Leilão e venda de slugs (mini site ou slug avulso)

- **Taxa plataforma**: **10%**.
- **Vendedor**: 90%.
- Constante: `SLUG_SALE_PLATFORM_FEE_PERCENT` (default 10). Env opcional: `SLUG_PLATFORM_FEE_PERCENT`.

---

## Paywall de vídeo

- **Split**: **60% criador** / **40% plataforma**.
- Constantes: `VIDEO_PAYWALL_CREATOR_PERCENT`, `VIDEO_PAYWALL_PLATFORM_PERCENT`.
- Em cada `Payment` (VIDEO_UNLOCK) são gravados `creator_share_usdc` e `platform_share_usdc` para repasse.

---

## Paywall de mini site (inteiro ou parte)

- **Split**: **70% criador** / **30% plataforma**.
- Constantes: `MINISITE_PAYWALL_CREATOR_PERCENT`, `MINISITE_PAYWALL_PLATFORM_PERCENT`.
- (Uso quando houver produto de paywall de acesso ao mini site.)

---

## NFTs

- **Lançamento (launch)**: **300 US$** one-time para lançar coleção.
- **Vendas**: **10%** taxa da plataforma em cada venda.
- Constantes: `NFT_LAUNCH_FEE_USD`, `NFT_SALE_PLATFORM_FEE_PERCENT`.
- (Fluxo completo de NFT — coleção, mint, vendas — a implementar.)

---

## Resumo

| Produto                    | Valor / regra              | Split / taxa                    |
|---------------------------|----------------------------|---------------------------------|
| Mensalidade mini site     | 29,90 US$/mês              | 100% plataforma                 |
| Slug avulso (compra)      | 12,90 US$                  | 100% plataforma                 |
| Slug avulso (renovação/ano)| 12,90 US$/ano             | 100% plataforma                 |
| Venda/leilão de slug      | Preço do listing           | 10% plataforma, 90% vendedor   |
| Paywall vídeo             | Preço do vídeo             | 60% criador, 40% plataforma     |
| Paywall mini site         | Preço definido             | 70% criador, 30% plataforma     |
| NFT launch                | 300 US$                    | 100% plataforma                 |
| NFT vendas                | Preço da venda             | 10% plataforma, 90% vendedor    |

---

## Valores registrados no código (payment-config.ts)

| Constante | Valor | Uso |
|-----------|--------|-----|
| `PAYMENT_CONTRACT_ADDRESS` | `0x578ac1c44E41f3ecfBaf3bEb86363FD3dd857011` | Contrato Remix: destino dos pagamentos USDC e distribuição |
| `DEFAULT_TREASURY_WALLET` | `0xf841d9F5ba7eac3802e9A476a85775e23d084BBe` | Treasury/admin (seed, etc.) |
| `MINISITE_MONTHLY_USD` | 29.90 | Mensalidade padrão do mini site |
| `STANDALONE_SLUG_PRICE_USD` | 12.90 | Compra inicial do slug avulso (company/@) |
| `STANDALONE_SLUG_ANNUAL_USD` | 12.90 | Renovação anual do slug avulso (após 1 ano) |
| `SLUG_SALE_PLATFORM_FEE_PERCENT` | 10 | Taxa plataforma em venda/leilão de slug (%) |
| `VIDEO_PAYWALL_CREATOR_PERCENT` | 60 | Parte do criador no paywall de vídeo (%) |
| `VIDEO_PAYWALL_PLATFORM_PERCENT` | 40 | Parte da plataforma no paywall de vídeo (%) |
| `MINISITE_PAYWALL_CREATOR_PERCENT` | 70 | Parte do criador no paywall do mini site (%) |
| `MINISITE_PAYWALL_PLATFORM_PERCENT` | 30 | Parte da plataforma no paywall do mini site (%) |
| `NFT_LAUNCH_FEE_USD` | 300 | Taxa para lançar coleção NFT (US$) |
| `NFT_SALE_PLATFORM_FEE_PERCENT` | 10 | Taxa plataforma em vendas de NFT (%) |

Config central: `src/lib/payment-config.ts`. Endpoint de referência: `GET /api/payments/prices`.
