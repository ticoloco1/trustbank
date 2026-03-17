# Verificação da implementação — TrustBank

Checklist do que foi implementado e onde está. Use para validar antes de deploy.

---

## 1. Schema (Prisma)

| Campo / modelo | Arquivo | Status |
|----------------|---------|--------|
| `MiniSite.text_color` | prisma/schema.prisma | ✅ |
| `MiniSite.heading_color` | prisma/schema.prisma | ✅ |
| `MiniSite.font_size_base` | prisma/schema.prisma | ✅ |
| `MiniSite.avatar_size` | prisma/schema.prisma | ✅ |
| `MiniSite.badge_type` | prisma/schema.prisma | ✅ |
| `MiniSitePage.background` | já existia; aceita todos os valores de BACKGROUND_OPTIONS | ✅ |

**Após alterações no schema:** rodar `npx prisma generate` e no deploy o `prisma db push` (via build) cria/atualiza as colunas.

---

## 2. API

| Endpoint | O que verifica |
|----------|----------------|
| **PATCH /api/mini-sites/[id]** | Aceita e persiste `text_color`, `heading_color`, `font_size_base` (small \| medium \| large), `avatar_size` (P \| M \| G \| GG), `badge_type` (blue \| gold). Validação: apenas esses valores; inválido vira `null`. |
| **POST /api/mini-sites/[id]/pages** | Limite de 5 páginas por mini site (`MAX_EXTRA_PAGES = 5`). `background` deve estar em `BACKGROUND_VALUES` (article-page). |
| **PATCH /api/mini-sites/[id]/pages/[pageId]** | `background` aceito = `BACKGROUND_VALUES`. |

---

## 3. Dashboard (edição do mini site)

| Recurso | Onde | Status |
|---------|------|--------|
| Menu lateral (admin) | app/dashboard/page.tsx | ✅ Sidebar com Mini sites, Listar slug, API Keys, Preços/Slugs, Vídeos. |
| Cor do texto | app/dashboard/[id]/page.tsx — seção Theme & colors | ✅ Input type="color" + merge no estado. |
| Cor dos títulos | Idem | ✅ |
| Tamanho da fonte (Pequeno / Médio / Grande) | Idem | ✅ Botões small, medium, large. |
| Tamanho da foto de perfil (P, M, G, GG) | Idem | ✅ |
| Selo (Nenhum / Azul / Dourado) | Idem | ✅ |
| Páginas extras até 5 | Idem — seção "Páginas extras" | ✅ Mensagem quando já tem 5; formulário de nova página escondido. |
| Fundos das páginas | Idem — BACKGROUND_OPTIONS | ✅ Inclui branco, amarelo, cinza, claro, escuro, mapa pirata, etc. |
| Save | updateMutation envia payload com todos os campos (incl. os novos) | ✅ |

---

## 4. Páginas extras (público)

| Recurso | Onde | Status |
|---------|------|--------|
| Lista de fundos | src/lib/article-page.ts | ✅ BACKGROUND_OPTIONS + BACKGROUND_VALUES. |
| Estilos CSS | articleBackgroundStyles | ✅ Inclui .article-bg-pirate-map, .article-bg-light, .article-bg-dark e demais. |
| Página pública | app/s/[slug]/p/[pageSlug]/page.tsx | ✅ Usa getArticleBackgroundClass(page.background) e articleBackgroundStyles. |

---

## 5. Templates (página pública do mini site)

| Template | Campos usados | Onde |
|----------|----------------|------|
| **Profile** | text_color, heading_color, font_size_base, avatar_size, badge_type | app/s/[slug]/ProfileTemplate.tsx — estilos inline e selo ao lado do nome. |
| **CV Pro** | Idem | app/s/[slug]/CVProTemplate.tsx — idem. |
| **Default** (layout com banner) | avatar_size, badge_type, heading_color, text_color | app/s/[slug]/page.tsx — header com avatar, nome + selo, bio. |

Valores padrão:
- `avatar_size`: fallback M → 96px (P=64, M=96, G=128, GG=160).
- `font_size_base`: fallback "medium" → 1rem (small=0.875rem, large=1.125rem).
- `heading_color` / `text_color`: fallback primary ou cor padrão do tema.
- `badge_type`: "blue" = ✓ azul, "gold" = ★ dourado.

---

## 6. Fluxo de dados (resumo)

1. **Dashboard** carrega mini site com GET /api/mini-sites/[id] (Prisma retorna todas as colunas, inclusive as novas após db push).
2. Usuário altera cor do texto, tamanho do avatar, selo, etc. → estado local (edit/formData).
3. **Save** → PATCH /api/mini-sites/[id] com payload completo (incl. text_color, heading_color, font_size_base, avatar_size, badge_type).
4. **Página pública** /s/[slug] carrega o mesmo mini site (findFirst com include). Os templates recebem esses campos e aplicam nos estilos e no selo.

---

## 7. O que rodar antes de considerar “tudo certo”

1. **Local (com DATABASE_URL no .env):**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run dev
   ```
2. **Testes manuais:**
   - Dashboard → Editar um mini site com template **Profile** ou **CV Pro** (ou default).
   - Alterar cor do texto, cor do título, tamanho da fonte, tamanho do avatar (P/M/G/GG), selo (Azul ou Dourado).
   - Clicar em **Save**.
   - Abrir /s/[slug] e confirmar: avatar no tamanho certo, cores aplicadas, selo ao lado do nome.
   - Páginas extras: criar até 5 páginas, escolher fundos diferentes (ex.: mapa pirata, escuro). Abrir /s/[slug]/p/[pageSlug] e ver o fundo correto.
3. **Deploy (Vercel):** o script de build já inclui `prisma db push`, então as colunas novas são criadas no banco de produção no próximo deploy.

---

## 8. Referência rápida de arquivos

| Tema | Arquivos |
|------|----------|
| Schema | prisma/schema.prisma |
| API mini-site | app/api/mini-sites/[id]/route.ts |
| API páginas extras | app/api/mini-sites/[id]/pages/route.ts, .../pages/[pageId]/route.ts |
| Fundos de artigo | src/lib/article-page.ts |
| Dashboard edição | app/dashboard/[id]/page.tsx |
| Dashboard lista (menu lateral) | app/dashboard/page.tsx |
| Página pública mini site | app/s/[slug]/page.tsx |
| Template Profile | app/s/[slug]/ProfileTemplate.tsx |
| Template CV Pro | app/s/[slug]/CVProTemplate.tsx |
| Página de artigo | app/s/[slug]/p/[pageSlug]/page.tsx |

Tudo que está marcado como ✅ acima está implementado e consistente entre schema, API, dashboard e templates.
