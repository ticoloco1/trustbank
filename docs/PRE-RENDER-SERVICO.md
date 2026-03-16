# Pre-render estilo PreRender.io — TrustBank

## O que você quer

1. **Dentro do TrustBank**  
   Rodar pre-render no sistema para os **mini sites** (e demais páginas), para que buscadores e crawlers sempre recebam HTML completo e o SEO dos mini sites seja forte.

2. **Serviço para fora**  
   Oferecer pre-render como **serviço para terceiros**, com **domínios de fora**: o cliente usa o próprio domínio e o TrustBank entrega/serve a versão pre-renderizada (como o PreRender.io faz).

---

## Situação atual do TrustBank

- **Mini sites** (`/s/[slug]`, `/d/[slug]`, etc.) já são **renderizados no servidor** (Next.js App Router, `async` server components).  
  Ou seja: o HTML completo já é gerado no servidor; Google e outros crawlers **não dependem** de JavaScript no cliente para ver o conteúdo.
- **Sitemap** dinâmico já existe (`app/sitemap.ts`): lista home, /slugs, /market, todos os `/s/[slug]` e `/d/[slug]`.
- Ou seja: para os mini sites do próprio TrustBank, o “pre-render” no sentido “evitar SPA vazia para o Google” **já está resolvido** pela arquitetura atual.

O que ainda pode ser útil **internamente**:
- **Pre-warm / cache**: chamar as URLs do sitemap (ex.: por cron) para “aquecer” o cache do Vercel e deixar a primeira visita mais rápida (opcional).

---

## Parte 1: Pre-render no sistema para mini sites (TrustBank)

### Já temos
- SSR dos mini sites → crawlers recebem HTML completo.
- Sitemap com todas as URLs importantes.
- Metadados (title, description, Open Graph) por página.

### Opcional: pre-warm do cache
- **Cron job** (ex.: Vercel Cron ou externo) que, de tempos em tempos, faz `GET` em todas as URLs do sitemap.
- Objetivo: popular cache da edge/servidor para a primeira visita real ser mais rápida.
- Implementação: uma rota API `GET /api/cron/prewarm` (protegida por secret) que lê o sitemap e faz `fetch` em cada URL.

---

## Parte 2: Serviço para fora (domínios de fora)

Aqui sim entra o “PreRender.io no TrustBank”: **serviço de pre-render para outros sites/domínios**.

### Modelo de uso
- Cliente tem um site SPA (ou qualquer site) no **domínio dele** (ex.: `https://app.cliente.com`).
- Para crawlers (Google, etc.), em vez de servir a SPA “vazia”, o cliente quer servir **HTML já renderizado**.
- O TrustBank oferece:
  - **Opção A — API**: cliente chama uma API do TrustBank passando a URL; o TrustBank devolve o HTML renderizado (headless browser). O cliente usa isso no próprio servidor (ex.: proxy para User-Agent de bot).
  - **Opção B — Proxy por domínio**: cliente aponta um subdomínio (ex.: `prerender.cliente.com`) para o TrustBank; o TrustBank faz fetch na URL real do cliente, renderiza com headless e devolve o HTML ao crawler.

### Peças técnicas necessárias (serviço externo)
1. **Headless browser** no servidor (Puppeteer, Playwright ou serviço terceirizado) para abrir a URL do cliente e capturar o HTML após o JS rodar.
2. **Fila e cache**:
   - Fila de jobs (uma URL por vez ou por domínio) para não sobrecarregar.
   - Cache do HTML renderizado por URL (ex.: TTL 1h ou 24h) para não re-renderizar a cada request.
3. **API** (ex.: `POST /api/pre-render` ou `GET /api/pre-render?url=...`) com autenticação (API key por cliente).
4. **Limites e plano**: rate limit, domínios permitidos por cliente, preço por número de páginas/requests (modelo PreRender.io).

### Onde rodar
- Headless consome bastante recurso (CPU/memória). Em Vercel (serverless) há limite de tempo e de tamanho; para muitas requisições, o ideal é um **worker dedicado** (VPS, Railway, Render, ou serviço como Browserless, ScrapingBee) que só faça o pre-render e exponha uma API que o TrustBank chama.

---

## Resumo

| Parte | O que é | Status / Próximo passo |
|-------|--------|-------------------------|
| **Mini sites TrustBank** | SEO e HTML completo para crawlers | ✅ Já feito (SSR + sitemap). Opcional: cron de pre-warm. |
| **Serviço externo (domínios de fora)** | Pre-render como produto para outros sites | 📋 Desenho: API + headless + fila + cache; rodar em worker dedicado. |

Se quiser, o próximo passo pode ser:
1. Implementar o **cron de pre-warm** das URLs do sitemap (rota + instrução de config no Vercel), e/ou  
2. Especificar a **API e o fluxo** do serviço externo (endpoints, auth, formato de resposta) para depois implementar o worker com headless.
