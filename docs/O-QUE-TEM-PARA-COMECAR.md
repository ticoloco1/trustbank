# O que tem para começar × o que vem depois

Resumo do que **já está no sistema** para você começar e o que fica para depois (NFTs, video shares, etc.).

---

## Para começar (já tem)

### Mini-site completo
- **Links** — bio, site_name, e em cada template: links para redes, páginas extras, catálogo.
- **Vídeo + paywall** — vídeos no mini-site (`/s/[slug]`), player com paywall; desbloqueio por USDC ou cartão. Página de vídeo `/v/[id]`. Gestão em **Dashboard → Editar mini-site → Vídeos** e em **/site/edit** (com Google OAuth).
- **CV / perfil** — **bio** no mini-site + **páginas extras** (rich text): você cria uma página “Currículo” ou “Sobre” com o conteúdo que quiser. Dashboard → Editar mini-site → Páginas extras.
- **Mapas / catálogo** — **Listed domains** (catálogo de domínios): no dashboard, em “Domínios listados”, você adiciona itens (nome, preço, link). Eles aparecem nos templates (Investor, Premium, etc.). Para mapa (Google Maps etc.), dá para colar embed em uma **página extra** (rich text).
- **Templates** — default, investor, premium, premium_dark, premium_fintech, com temas de cor (minisite-themes).
- **Páginas extras** — artigos/páginas com rich text e fundos configuráveis (`/s/[slug]/p/[pageSlug]`).
- **Galeria** — fotos no feed (até 4), galeria e banner.

### Slugs: compra e venda
- **Buscar e comprar** — home e **/slugs**: busca por `/@` (handle) e `/s` (página). Verifica disponibilidade, preço (grátis ou pago), adiciona ao carrinho, paga (USDC ou cartão).
- **Venda / leilão** — no **Dashboard → Editar mini-site** há “Vender, leilão ou transferir”: listar o slug no marketplace. **/market** lista ofertas; **/market/[id]** é a página do listing.
- **Carrinho** — itens (slug, assinatura, vídeo, etc.) e checkout em **/cart**.

### O que mais já está pronto
- **Auth** — wallet (admin) e Google OAuth (login no site e para vídeos).
- **Credits** — saldo, depósito e saque (1 crédito = 1 USDC); opcional para começar.
- **APIs** — payments, verify, slugs/check, mini-sites, vídeos, paywall, etc.
- **Build** — no deploy roda `prisma db push`; banco e código ficam alinhados.

Com isso você já pode: criar mini-sites, colocar links, vídeos com paywall, “CV” em bio + página extra, catálogo (mapas de domínios) e comprar/vender slugs.

---

## Depois (vem em seguida)

- **NFTs** — taxa de lançamento, fee em vendas; integração quando for prioridade.
- **Vídeo para vender shares** — cotação do vídeo, ordem de compra/venda de cotas, rateio de receita (corretora de shares); já existe modelo e APIs, pode ser exposto/ajustado no UI quando quiser.

Ou seja: o **necessário para começar** (mini-site completo com links, vídeo paywall, CV, mapas/catálogo, slugs compra e venda) **já está no sistema**. NFTs e video shares podem vir em seguida.
