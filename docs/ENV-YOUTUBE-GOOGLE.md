# Variáveis de ambiente — Google / YouTube (paywall + verificação de dono)

Para a verificação de dono do vídeo e as APIs de vídeo funcionarem, configure no `.env.local` e na Vercel:

| Variável | Uso |
|----------|-----|
| `GOOGLE_CLIENT_ID` | OAuth Google (Console Cloud) |
| `GOOGLE_CLIENT_SECRET` | OAuth Google |
| `YOUTUBE_API_KEY` ou `GOOGLE_API_KEY` | YouTube Data API v3 — buscar dados do vídeo (channelId, título, thumbnail) |
| `NEXT_PUBLIC_APP_URL` | URL do app (ex.: `https://trustbank.xyz`) para o redirect do OAuth |

## Google Cloud Console

1. Criar projeto (ou usar existente).
2. **APIs e Serviços → Ativar**: YouTube Data API v3.
3. **Credenciais**:
   - **API Key** → usar como `YOUTUBE_API_KEY` (ou `GOOGLE_API_KEY`) para `videos.list` (dados públicos do vídeo).
   - **OAuth 2.0 Client ID** (tipo “Aplicativo da Web”) → usar como `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`. Em “URIs de redirecionamento autorizados” incluir: `https://trustbank.xyz/api/auth/google/callback` e `http://localhost:3000/api/auth/google/callback`.
4. Na tela de consentimento OAuth, adicionar escopo **YouTube Data API v3** (leitura) para poder chamar `channels.list(mine=true)` e provar que o usuário é dono do canal.

Com isso, a lib `@/lib/youtube` e as rotas `/api/youtube/verify-owner` e `/api/videos` conseguem verificar o dono e gravar só vídeos verificados.
