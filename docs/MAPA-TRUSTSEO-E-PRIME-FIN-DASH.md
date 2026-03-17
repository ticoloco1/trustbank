# Mapa: TrustSEO, prime-fin-dash e royal-fintech-hub

Este doc explica **onde está cada coisa** e **qual projeto usar** para não se perder entre as pastas.

---

## Projeto principal (use este)

| Projeto | O que é | Onde está |
|--------|---------|-----------|
| **royal-fintech-hub** | App Next.js do TrustBank em produção. Mini sites (`/s/[slug]`), vídeos com paywall (`/v/[id]`), marketplace de slugs (`/market`), dashboard, auth por wallet, Prisma, templates (Profile, Netflix, CV Pro), llms.txt, prerender para bots. | Este repositório (ex.: `hashpo.com` no GitHub). Deploy no Vercel. |

**Sempre que for desenvolver ou corrigir o site TrustBank/hashpo, use o royal-fintech-hub.**

---

## TrustSEO (microserviço separado)

| O que é | Serviço **Express** (não Next.js) que roda em outra URL/porta. Faz: (1) render de páginas para bots (Puppeteer + Redis), (2) llms.txt dinâmico por projeto, (3) billing por API key (Stripe + crypto), (4) admin de clientes e cache. |
|---------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Onde está | Pasta separada (ex.: `trustseo 2` no Downloads). **Não** está dentro do royal-fintech-hub. |
| Banco | Prisma próprio: `Client`, `Domain`, `RenderLog`, `Billing`. **Não** usa o mesmo banco do TrustBank. |
| Quando usar | Quando você quiser **oferecer render SEO como serviço** para outros sites (trustbank.xyz, jobinlink.com, etc.) via API: eles chamam `GET/POST /render?url=...` com API key e recebem HTML renderizado. Ou quando quiser centralizar **billing por plano** (FREE/STARTER/PRO/AGENCY) para esse serviço. |
| No app (royal-fintech-hub) | O app **já tem** llms.txt (`GET /llms.txt`) e prerender para bots (middleware + Vercel KV). Para o site TrustBank em si **não é obrigatório** rodar o TrustSEO; o middleware + KV resolvem. Use TrustSEO se quiser um serviço de render **externo** para vários domínios/projetos. |

---

## prime-fin-dash-main-3 (referência / snapshot)

| O que é | Outra versão do app Next.js (TrustBank): home, `/s/[slug]`, `/v/[id]`, `/market`. Menos templates e menos features que o royal-fintech-hub. |
|---------|---------------------------------------------------------------------------------------------------------------------------------------------|
| Onde está | Pasta separada (ex.: `prime-fin-dash-main-3` no Downloads). **Não** é o repositório principal. |
| Relação com royal-fintech-hub | O **royal-fintech-hub** é a evolução: tem os mesmos fluxos (mini site, vídeo, market) **e** mais (templates Profile, Netflix, CV Pro, créditos, documentação, etc.). Use prime-fin-dash-main-3 só como **referência** de código ou para comparar; o código de verdade é o royal-fintech-hub. |

---

## Onde está cada coisa (resumo)

| Recurso | Onde fica |
|---------|-----------|
| Mini sites (`/s/[slug]`) | royal-fintech-hub — `app/s/[slug]/page.tsx` e templates (Profile, Netflix, CV Pro, Investor, etc.) |
| Vídeo com paywall (`/v/[id]`) | royal-fintech-hub — `app/v/[id]/page.tsx` |
| Marketplace de slugs (`/market`) | royal-fintech-hub — `app/market/page.tsx` e `app/market/[id]/page.tsx` |
| llms.txt para crawlers de IA | royal-fintech-hub — `app/llms.txt/route.ts` (usa Prisma: mini sites + domínios) |
| Prerender para bots (cache HTML) | royal-fintech-hub — `middleware.ts` + Vercel KV |
| Render SEO como **serviço** (API externa) | TrustSEO — microserviço Express (`/render`, Redis, Puppeteer) |
| Billing por API key (planos render/mês) | TrustSEO — rotas `/billing`, `/admin` |
| Auth (wallet + admin) | royal-fintech-hub — `src/hooks/useAuth.tsx`, `useAuthPrisma.ts`, `/api/auth/me` |
| Banco principal (mini sites, vídeos, slugs) | royal-fintech-hub — Prisma no mesmo projeto |

---

## Recomendações

1. **Desenvolvimento do site TrustBank:** trabalhe só no **royal-fintech-hub**. Não misture com prime-fin-dash-main-3.
2. **llms.txt e bots:** o app já cobre. Só rode o **TrustSEO** se for oferecer render como produto para outros domínios.
3. **Dúvida “onde estava X?”:** consulte este doc; se for feature de mini site, vídeo, market ou auth, está no royal-fintech-hub.
