# Roadmap completo — TrustBank (royal-fintech-hub)

Tudo que deve estar no sistema: o que já existe e o que falta. Referência para não esquecer nada.

---

## 1. Pagamentos e identidade

| Item | Status | Onde / Notas |
|------|--------|--------------|
| **Stripe** (cartão) | ✅ Parcial | `STRIPE_SECRET_KEY`, webhook `/api/webhooks/stripe`, `Payment` com `stripe_payment_id`. Checkout em `/cart`. |
| **Wallet** (carteira) | ✅ | wagmi, Connect Wallet no header. Admin por wallet; pagamentos USDC. |
| **Blockchain / contrato** | ✅ Parcial | Pagamentos USDC (verify tx), créditos (CreditBalance, deposit/withdraw). Contrato NFT/clube opcional. |
| **Paywall** (vídeo) | ✅ | VideoUnlock, paywall_price_usdc, desbloqueio por USDC ou cartão. Verificação dono YouTube. |

---

## 2. CV e mini site

| Item | Status | Onde / Notas |
|------|--------|--------------|
| **CV (template CV Pro)** | ✅ | Template `cv_pro`, contato bloqueado (email, phone, whatsapp), desbloqueio pago. |
| **Bio, links, galeria** | ✅ | MiniSite: bio, banner, feed_image_1–4, gallery_images. |
| **Páginas extras (até 5)** | ✅ | Limite 5 no POST; BACKGROUND_OPTIONS com light, dark, pirate-map; UI no dashboard "Até 5 páginas". |
| **Editor de texto com fundo** | ✅ | article-page: branco, amarelo notepad, cinza, claro, escuro, mapa pirata, etc. API aceita BACKGROUND_VALUES. |

---

## 3. Classificados premium (imóveis, carros, aviões)

| Item | Status | Onde / Notas |
|------|--------|--------------|
| **10 espaços (listings)** | ❌ A fazer | Novo modelo: ex. `PremiumListing` (mini_site_id, type: imovel \| carro \| aviao, title, description, price, ...). Até 10 por mini site. |
| **10 fotos por item + carrossel** | ❌ A fazer | Campo `images` (JSON array de URLs) por listing; componente carrossel no template. |
| **Muitos detalhes (imóvel/carro/avião)** | ❌ A fazer | Campos: área, quartos, banheiros, ano, marca, modelo, etc. (configurável por type). |
| **Mercado premium** | ❌ A fazer | Diretório “Classificados premium” listando esses itens; filtros por tipo e preço. |

---

## 4. Selos e diretórios

| Item | Status | Onde / Notas |
|------|--------|--------------|
| **Selo azul** (mini sites) | ❌ A fazer | Badge “verificado” para mini site: campo `verified_badge` ou `badge_type: 'blue'`; exibir no card e no perfil. |
| **Selo dourado** (empresas) | ❌ A fazer | Badge para empresas: `badge_type: 'gold'` ou slug tipo company com flag. |
| **Diretório de mini sites** | 🔶 Parcial | `/slugs` e listagens; falta página dedicada “Diretório” com filtros e selos. |
| **Diretório de CV** | ❌ A fazer | Página listando mini sites com template `cv_pro` (ou tag “cv”). |
| **Diretório de vídeos (paywall)** | ❌ A fazer | Página listando vídeos com paywall ativo; filtros e busca. |
| **Classificados premium** | ❌ A fazer | Diretório dos listings premium (imóveis, carros, aviões). |

---

## 5. Personalização do mini site

| Item | Status | Onde / Notas |
|------|--------|--------------|
| **Cores (fundo, destaque)** | ✅ | primary_color, accent_color, bg_color, theme (MINISITE_THEMES). |
| **Cores das letras** | ✅ | text_color, heading_color no MiniSite; API e dashboard. Falta: aplicar nos templates. |
| **Tamanhos das letras** | ✅ | font_size_base: small \| medium \| large no schema e dashboard. Falta: aplicar nos templates. |
| **Tamanho da foto de perfil** | ✅ | avatar_size: P \| M \| G \| GG no schema e dashboard. Falta: aplicar nos templates. |
| **Bio** | ✅ | Campo bio no MiniSite. |
| **Ticker para ads / slugs** | 🔶 Parcial | InvestorTemplate tem ticker (cotação). Falta: ticker configurável para “venda de espaço” ou “slugs à venda” no mini site. |
| **Bloco de slugs para negociar** | ❌ A fazer | Seção no mini site: dono coloca slugs à venda; visitante vê lista com cores, preços; opcional mapa (embed). |

---

## 6. Slugs e marketplace

| Item | Status | Onde / Notas |
|------|--------|--------------|
| **Formato trustbank.xyz/@slugs** | ✅ | Slug listing com slug_type company \| handle. |
| **Comprar/vender slugs** | ✅ | SlugListing, SlugPurchase, /market, /cart. |
| **Preços e manutenção ($7.99)** | 🔶 | PlatformSetting slug_claim_*; texto/custo de compra e manutenção anual na UI. |
| **Bloco no mini site: “meus slugs à venda”** | ❌ A fazer | Ver “Bloco de slugs para negociar” acima; cores e preços customizáveis. |
| **Mapas (embeds)** | 🔶 | Pode colocar em página extra ou em seção; sem componente dedicado de “mapa de slugs”. |

---

## 7. IA (DeepSeek) como assessor

| Item | Status | Onde / Notas |
|------|--------|--------------|
| **IA no mini site (assessor)** | ❌ A fazer | Integração DeepSeek (ou similar): chat/assistente no mini site para visitantes (ex.: “dúvidas sobre o perfil”, “sugestões”). API server-side para não expor key. |

---

## 8. Resumo “igual ao outro + mais”

- **Já temos:** Stripe (parcial), wallet, paywall vídeo, CV Pro, bio/ticker/cores básicas, páginas extras com fundo, ListedDomain (catálogo), slugs compra/venda, créditos, vídeo shares (backend).
- **Fazer para ficar igual e melhor:**
  1. Páginas extras: limite 5; fundos completos (branco, amarelo notepad, cinza, claro, escuro, mapa pirata).
  2. Classificados premium: 10 itens × 10 fotos, carrossel, detalhes (imóvel/carro/avião).
  3. Selos azul/dourado e diretórios (mini sites, CV, vídeos paywall, classificados).
  4. Mini site: cor/tamanho de letra, tamanho avatar P/M/G/GG, ticker para ads/slugs, bloco “slugs à venda” com cores/preços.
  5. IA DeepSeek como assessor no mini site.

Ordem sugerida de implementação: (1) páginas extras + fundos, (2) personalização (cores letras, avatar size), (3) selos + diretórios, (4) classificados premium, (5) bloco slugs no mini site, (6) IA.
