# Templates premium (estilo banco), imagens e mais que o X.com

## 1. Template premium “estilo banco”

### Visual
- **Cores**: azul escuro / dourado / branco (confiança, instituição); ou verde escuro + dourado (fintech).
- **Tipografia**: títulos em serif ou sans forte (ex: DM Serif Display, Plus Jakarta Sans); corpo legível.
- **Hero**: fundo gradiente ou imagem de capa, logo/nome em destaque, frase de valor, CTA.
- **Blocos**: seções bem definidas (Serviços, Números, Depoimentos, CTA), bordas sutis, sombras leves.
- **Ícones**: ícones de segurança, certificação, suporte (cadeado, escudo, gráfico).
- **Detalhes**: cantos levemente arredondados, espaçamento generoso, hierarquia clara.

### Onde colocar imagens (hoje + sugerido)
| Lugar | Hoje | Sugerido |
|-------|------|----------|
| Capa (banner atrás do perfil) | `banner_url` (URL) | Upload ou URL |
| Avatar / logo no perfil | `feed_image_1` (URL) | Upload ou URL + crop |
| Fotos do feed (até 4) | `feed_image_1..4` (URL) | Upload ou URL |
| Galeria | `gallery_images[]` (URLs) | Upload ou URL |
| Posts (ideias) | `idea.image_url` (URL) | Upload ou URL |
| Páginas extras (artigos) | Rich text com img URL | Upload no editor |
| Logo do site (header) | — | Novo: `logo_url` |
| Favicon | — | Novo: `favicon_url` (opcional) |
| Fundo de seção (hero) | — | Novo: `hero_image_url` (template premium) |

### Funcionalidades a mais que o X.com
- Múltiplos temas e templates (não só um layout).
- Páginas extras com rich text e fundos customizáveis.
- Galeria de imagens dedicada.
- Bloco de cotações (BTC, ETH, etc.) no template investidor.
- Catálogo de domínios (domain investor) com páginas indexáveis.
- Paywall por vídeo e por mini site.
- Carrinho + pagamento (crypto + cartão).
- Analytics (views, visitantes, referrers, cliques).
- Slug/domínio customizável e marketplace de slugs.

---

## 2. Servidor de imagens (barato)

### Opções recomendadas

| Serviço | Custo | Uso no projeto |
|---------|--------|-----------------|
| **Vercel Blob** | ~$0,15/GB; free tier limitado | Upload via API Next.js, URL pública; integra direto no deploy. |
| **Cloudinary** | Free tier ~25 créditos/mês | Upload por API ou widget; transformações (crop, resize) na URL. |
| **Uploadthing** | Free tier 2GB, 5000 uploads/mês | SDK simples, upload no client ou server. |
| **Supabase Storage** | 1 GB free | Bom se já usar Supabase; API REST. |

### Recomendação para “mais barato e bonito”
- **Vercel Blob**: se o app já está na Vercel, zero config extra de domínio; URLs estáveis; dá para gerar thumbnails depois.
- **Cloudinary**: se quiser resize/crop automático por URL (ex: `?w=400&h=300&crop=fill`) sem processar no servidor.

Implementação inicial sugerida: **Vercel Blob** (uma rota `POST /api/upload` que recebe o arquivo e devolve a URL), e no dashboard botão “Enviar imagem” que chama essa API e preenche o campo (banner, feed, galeria, etc.).

---

## 3. Onde permitir upload no dashboard

1. **Banner (capa)** – botão “Enviar” ao lado do campo URL (ou substituir por upload).
2. **Fotos do feed (1–4)** – mesmo: upload ou URL; foto 1 = avatar.
3. **Galeria** – “Enviar imagem” por item (ou múltiplos).
4. **Posts (ideias)** – upload de imagem no formulário do post.
5. **Páginas extras** – no editor rich text: botão “Inserir imagem” com upload (além de URL).
6. **Template premium** – logo do site e imagem do hero (quando existirem os campos).

---

## 4. Implementado

- **Tema “Banco” e “Fintech”** em `src/lib/minisite-themes.ts`: azul escuro + dourado e verde + dourado.
- **Template “Premium (estilo banco)”** em `app/s/[slug]/PremiumTemplate.tsx`: hero com gradiente, faixa de confiança, grid de fotos, domínios, posts e galeria.
- **API `POST /api/upload`** com Vercel Blob: multipart/form-data, campo `file`; query `?prefix=...`; retorna `{ url }`. Limite 4 MB; tipos JPEG, PNG, GIF, WebP. Requer variável **`BLOB_READ_WRITE_TOKEN`** (Vercel: Storage > Blob).
- **Componente `ImageUpload`** em `src/components/ImageUpload.tsx`: botão que envia arquivo para `/api/upload` e chama `onUpload(url)`.
- **Dashboard**: botões “Enviar imagem” ao lado do banner, de cada uma das 4 fotos do feed e “+ Enviar e adicionar à galeria”.

Se `BLOB_READ_WRITE_TOKEN` não estiver configurado, a API retorna 503 e o usuário pode continuar usando apenas URLs de imagem.
