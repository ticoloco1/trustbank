# Pre-render + llms.txt — 4 passos (TrustBank)

## O que foi implementado

### Passo 1 — Middleware
- **Arquivo:** `middleware.ts` (raiz do projeto)
- Detecta User-Agent de crawlers (Googlebot, Bingbot, ChatGPT-User, PerplexityBot, ClaudeBot, etc.).
- Se for bot e a URL estiver no cache (Vercel KV / Upstash Redis), devolve o HTML cacheado.
- Caso contrário, segue para o Next.js (SSR normal).
- **Testar no Postman:**  
  - GET `https://seu-dominio.vercel.app/s/meu-slug`  
  - Header: `User-Agent: Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)`  
  - Se o cache estiver preenchido, você recebe o HTML; senão, recebe a resposta SSR.

### Passo 2 — Renderer
- **Pacotes:** `@sparticuz/chromium` + `puppeteer-core` (Chromium leve &lt; 50MB para Vercel).
- **Rota:** `GET /api/prerender?url=https://trustbank.xyz/s/meu-slug`
- Renderiza a URL em headless Chromium e grava o HTML no KV (TTL 24h).
- Só aceita URLs do próprio domínio. Protegido por `CRON_SECRET` (header `Authorization: Bearer <secret>` ou query `?secret=`).

### Passo 3 — Vercel KV (cache)
- **Pacote:** `@vercel/kv`
- **Nota:** A Vercel descontinuou o KV; no dashboard use **Storage → Redis** (Upstash). O `@vercel/kv` pode seguir funcionando se o projeto já tiver KV; para projetos novos, adicione “Upstash Redis” no Marketplace da Vercel e use as variáveis que a Vercel injeta.
- O middleware e o `/api/prerender` usam o mesmo store (key `prerender:<pathname>`).
- **Preencher o cache:** chamar o prewarm ou o prerender manualmente (veja abaixo).

### Passo 4 — llms.txt
- **Rota:** `GET /llms.txt`
- Conteúdo em markdown: título, descrição (blockquote), links anotados para home, slugs, market, dashboard, mini sites e domínios.
- Pensado para crawlers de LLMs (ChatGPT, Perplexity, Claude) entenderem e citarem o TrustBank.
- Diferencial: integrado aos mini sites; nenhum concorrente brasileiro faz isso de forma nativa.

---

## Ordem certa no Cursor / deploy

1. **Middleware** — já em `middleware.ts`; funciona mesmo sem KV (só não entrega cache).
2. **Renderer** — instalar `@sparticuz/chromium` e `puppeteer-core`; rota `/api/prerender`.
3. **KV/Redis** — ativar no dashboard da Vercel (Storage → Redis / Upstash) e garantir `KV_REST_API_URL` e `KV_REST_API_TOKEN` (ou o que a integração injetar).
4. **llms.txt** — rota `/llms.txt` já criada; não precisa de config extra.

---

## Variáveis de ambiente

| Variável | Uso |
|----------|-----|
| `CRON_SECRET` | Protege `/api/prerender` e `/api/cron/prewarm`. Defina um valor secreto. |
| `NEXT_PUBLIC_APP_URL` | Domínio base (ex.: `https://trustbank.xyz`). |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Injetadas pela Vercel ao ativar Redis/KV. |

---

## Prewarm (encher o cache)

- **Rota:** `GET /api/cron/prewarm` (com `Authorization: Bearer <CRON_SECRET>` ou `?secret=<CRON_SECRET>`).
- Lê as URLs do `sitemap.xml` e chama `/api/prerender?url=...` para cada uma (até 30).
- No Vercel: **Cron Jobs** — adicione um job com URL `https://trustbank.xyz/api/cron/prewarm` e o header `Authorization: Bearer <CRON_SECRET>`, por exemplo a cada hora.

---

## Teste rápido no Postman

1. **Sem cache (SSR):**  
   GET `https://trustbank.xyz/s/meu-slug`  
   Header: `User-Agent: Googlebot`  
   → Resposta normal do Next (SSR).

2. **Encher cache:**  
   GET `https://trustbank.xyz/api/prerender?url=https://trustbank.xyz/s/meu-slug`  
   Header: `Authorization: Bearer SEU_CRON_SECRET`  
   → `{ "ok": true, "pathname": "/s/meu-slug", "cached": true }`.

3. **Com cache (middleware):**  
   Repetir o passo 1 → deve vir o mesmo HTML, agora servido pelo middleware a partir do KV.

4. **llms.txt:**  
   GET `https://trustbank.xyz/llms.txt`  
   → Markdown com título, descrição e links do TrustBank.
