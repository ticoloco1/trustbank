# Trabalho dos últimos 5 dias — Inventário e checklist

Documento para garantir que tudo que foi mudado e criado está no sistema e no deploy.

---

## 1. Páginas (app/)

| Rota | Descrição | Status |
|------|-----------|--------|
| `/` | Home + busca de slugs, carrinho | ✅ |
| `/auth` | Login Google OAuth | ✅ |
| `/cart` | Carrinho de compras | ✅ |
| `/credits` | TrustBank Credits (saldo, depósito, saque, histórico) | ✅ |
| `/dashboard` | Lista mini-sites, criar novo, links para editar | ✅ |
| `/dashboard/[id]` | Editar mini-site (templates, fotos, vídeos, shares, páginas extras) | ✅ |
| `/slugs` | Buscar/comprar slugs (/@ e /s), verificar pagamento | ✅ |
| `/s/[slug]` | Mini-site público (SEO dinâmico, sem header/footer global) | ✅ |
| `/s/[slug]/videos` | Página de vídeos do mini-site | ✅ |
| `/s/[slug]/p/[pageSlug]` | Páginas extras (artigos rich text) | ✅ |
| `/site/edit` | Gerenciar vídeos + paywall (Google OAuth) | ✅ |
| `/v/[id]` | Página pública de vídeo (paywall) | ✅ |
| `/market` | Marketplace | ✅ |
| `/market/[id]` | Detalhe listing | ✅ |
| `/mini-site`, `/minisite` | Landing / redirect mini-site | ✅ |
| `/governance` | Redirect para dashboard | ✅ |
| `/d/[slug]` | Domínio (se aplicável) | ✅ |

---

## 2. APIs (app/api/)

### Auth
- `auth/google` — inicia OAuth Google  
- `auth/google/callback` — callback OAuth  
- `auth/google/session` — GET/DELETE sessão  
- `auth/me` — usuário atual  

### Pagamentos e configuração
- `payments/config` — valores e destino por tipo (USDC, contrato Remix)  
- `payments/verify` — verificar pagamento on-chain e ativar (slug, vídeo, assinatura)  
- `payments/create-checkout` — Stripe (cartão → USDC)  
- `payments/status` — status de pagamento  
- `payments/prices` — preços  
- `payments` — listar  
- `webhooks/stripe` — webhook pós-pagamento  

### Slugs
- `slugs/check` — disponibilidade e tier (default, premium, letter, blocked)  
- `slugs` — listar/criar  
- `slugs/[id]` — detalhe  
- `slugs/buy` — compra  

### Mini-sites
- `mini-sites` — listar, criar (slug grátis ou pago)  
- `mini-sites/[id]` — GET/PATCH  
- `mini-sites/[id]/videos` — listar, adicionar vídeo  
- `mini-sites/[id]/videos/[videoId]` — remover vídeo  
- `mini-sites/[id]/pages` — páginas extras  
- `mini-sites/[id]/pages/[pageId]` — CRUD página  
- `mini-sites/[id]/domains` — domínios listados  
- `mini-sites/[id]/domains/[domainId]` — CRUD domínio  

### Vídeos e paywall
- `videos` — listar, criar  
- `videos/[id]` — GET/PATCH (admin: delisted_at)  
- `videos/[id]/access` — verificar acesso paywall  
- `videos/[id]/quotation` — cotação (admin: system_percent, sellable_percent)  
- `videos/[id]/shares` — book + holdings  
- `videos/[id]/shares/orders` — criar ordem compra/venda  
- `videos/[id]/shares/orders/[orderId]` — preencher/cancelar ordem  
- `videos/[id]/shares/buy` — comprar do pool inicial  
- `videos/[id]/revenue` — eventos e distribuição de receita  
- `paywall/unlock` — desbloquear vídeo  
- `youtube/verify-owner` — verificar dono do canal  

### Créditos (TrustBank Credits = 1:1 USDC)
- `credits/balance` — saldo  
- `credits/transactions` — histórico  
- `credits/summary` — saldo, depositado, sacado, shares  
- `credits/deposit` — creditar por tx_hash  
- `credits/sync-deposits` — descobrir depósitos on-chain e creditar  
- `credits/withdraw` — sacar (USDC automático)  
- `credits/deposit-address` — endereço para depósito  

### Admin e configuração
- `admin/keys` — chaves Google/YouTube no DB  
- `admin/slug-settings` — preços e override de slugs bloqueados  
- `settings` — configurações da plataforma  

### Outros
- `ideas` — ideias/posts  
- `ideas/[id]`  
- `analytics` — agregado  
- `analytics/track` — evento de analytics  
- `domains/[slug]`  
- `upload` — upload de imagem  
- `test-google` — testar APIs Google  
- `cron/prewarm` — pré-aquecimento  
- `prerender` — pré-render (SEO)  

---

## 3. Componentes e libs (src/)

### Componentes
- `AppShell` — esconde header/footer em `/s/[slug]`  
- `GlobalHeader` — nav, carrinho em destaque, “Entrar com Google”  
- `GlobalFooter` — créditos (saldo, depositado, sacado, shares) + link /credits  
- `CartContext` — carrinho global  
- `VideoFlipCard` — vídeo (frente) + cotação (verso)  
- `BrokerSection` — gate para corretora de shares  
- `VideoShareBroker` — ordem de compra/venda, book, holdings  
- `ProtectedPlayer` — player com gaiola/paywall  
- `RichTextEditor` — artigos (rich text, fundos)  
- `SectionOrderSortable` — ordem dos blocos (drag)  
- `ImageUpload` — upload de imagens  
- `Providers` — Wagmi, etc.  

### Libs
- `payment-config.ts` — preços, taxas, carteira plataforma, contrato Remix  
- `verify-payment.ts` — verificar USDC on-chain + findDepositsToPlatform  
- `send-usdc.ts` — enviar USDC da hot wallet (saque automático)  
- `credits.ts` — saldo, débito, crédito  
- `slug-reserved.ts` — tiers (default, premium, letter, blocked)  
- `slug-settings.ts` — preços e overrides no DB  
- `article-page.ts` — estilos de fundo para artigos  
- `minisite-themes.ts` — temas e cores  
- `google-keys.ts` — chaves Google (env ou DB)  
- `youtube.ts` — YouTube Data API  
- `prisma.ts` — getPrisma()  

---

## 4. Prisma (schema principal)

- **PlatformSetting** — nome, logo, chaves Google/YouTube, preços de slug, override  
- **MiniSite** — slug, tema, colunas, ticker_bar_color, content_order, banner, feed_image_1..4, gallery_images, assinatura, páginas extras, club_nft  
- **MiniSiteVideo**, **VideoQuotation** — vídeos no mini-site, cotação  
- **VideoShareHolding**, **VideoShareOrder**, **VideoRevenueEvent**, **VideoRevenueDistribution** — shares e receita  
- **CreditBalance**, **CreditTransaction** — créditos 1:1 USDC  
- **Idea**, **MiniSitePage**, **ListedDomain**, **Payment**, **SlugListing**, **MiniSiteAnalyticsEvent**, **Video**, etc.  

---

## 5. Checklist pós-deploy (Vercel)

- [ ] **Home** — carrega, busca de slug funciona, “Comprar” / “Carrinho” visíveis  
- [ ] **Carrinho** — itens, checkout (USDC ou Stripe)  
- [ ] **Slugs** — busca /@ e /s, preço (grátis ou pago), pagamento e registro  
- [ ] **Mini-site** — `/s/[slug]` com SEO (title, description, og:image), sem header/footer  
- [ ] **Dashboard** — listar e editar mini-sites, fotos não “vazam” entre sites  
- [ ] **Credits** — saldo, depósito (sync ou tx_hash), saque, histórico  
- [ ] **Google OAuth** — login em /auth e onde for necessário  
- [ ] **Admin** — chaves Google no painel, preços de slug, liberar slugs bloqueados  
- [ ] **Variáveis de ambiente** no Vercel: `DATABASE_URL`, Stripe, RPC, `ADMIN_WALLET`, `PLATFORM_WALLET_PRIVATE_KEY`, Google/YouTube (ou só no DB)  

---

## 6. O que NÃO está neste repositório

- **trustbank-import/** — backup do projeto Supabase (TrustBank antigo); já está em https://github.com/ticoloco1/trustbank (não é usado no build).  
- **.env.local** e **.env.backup.*** — nunca vão para o Git; recriar no host a partir do exemplo ou do backup.  

---

## 7. Comandos úteis

```bash
# Rodar local
npm install && npm run dev   # → http://localhost:3000

# Enviar para o host (GitHub → Vercel)
git add -A
git status
git commit -m "Descrição das mudanças"
git push origin main
```

Se algo da lista acima não estiver no repositório (arquivo ou rota), adicione e documente aqui; depois marque o item do checklist quando validar em produção.
