# Login próprio + Wallet + Vídeos por backlink

O TrustBank usa **login próprio** (e-mail + senha) e **wallet** (Connect Wallet). Vídeos são validados por **backlink** (link na descrição do vídeo no YouTube), sem depender do Google OAuth.

## Login

- **Entrar / Criar conta**: `/auth` — formulário com e-mail e senha.
- **Sessão**: cookie `tb_session` (assinado com `SESSION_SECRET`). Dura 30 dias.
- **Variável de ambiente**: defina `SESSION_SECRET` em produção (ex.: Vercel → Environment Variables). Em dev pode ficar em branco (usa valor padrão).

## Wallet

- **Connect Wallet**: no header, conecta carteira (wagmi). Usado para admin (se a wallet estiver em `admin_wallet_addresses` ou `ADMIN_WALLET`) e para pagamentos/paywall.
- É possível usar só login (e-mail) ou só wallet, ou os dois.

## Vídeos e backlink

- **Adicionar vídeo**: no Dashboard → Vídeos, informe a URL do YouTube. Não é mais necessário “Entrar com Google”.
- **Quem pode adicionar**: quem estiver logado (e-mail/senha) **ou** com carteira conectada.
- **Validação**: por **backlink**. Ao adicionar, o sistema gera um link (ex.: `https://trustbank.xyz/v/VIDEO_ID`). O criador deve colocar esse link na **descrição do vídeo no YouTube**. Isso valida a associação do vídeo ao criador.
- Metadados do vídeo (título, thumbnail) vêm da **YouTube Data API** (chave pública `YOUTUBE_API_KEY`), sem OAuth.

## APIs

| Rota | Descrição |
|------|-----------|
| `POST /api/auth/register` | Criar conta (email, password) |
| `POST /api/auth/login` | Login (email, password) |
| `GET /api/auth/session` | Retorna `{ user: { id, email } }` se houver cookie válido |
| `DELETE /api/auth/session` | Logout (remove cookie) |
| `POST /api/videos` | Adicionar vídeo (cookie de sessão ou `wallet` no body) |
| `GET /api/videos` | Listar vídeos (cookie ou `?wallet=0x...`) |

## Banco

- **User**: `email` (único), `password_hash`, `wallet` (opcional).
- **Creator**: pode ter `user_id` (nosso User) e/ou `payout_wallet`.
- **Video**: `backlink_url`, `backlink_verified` (para futura checagem automática do backlink).

Depois de alterar o schema, rode `npm run db:push` (com `DATABASE_URL` no `.env.local` ou no ambiente) para atualizar as tabelas.
