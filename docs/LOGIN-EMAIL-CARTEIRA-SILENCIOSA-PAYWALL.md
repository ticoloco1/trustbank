# Login com email + carteira silenciosa + paywall (TrustBank)

## O que você quer

1. **Entrar com email** (ex.: Google) – usuário não precisa “conectar carteira” nem entender blockchain.
2. **Carteira silenciosa** – em background cada usuário tem uma wallet; pagamentos (USDC) acontecem por ela sem o usuário ver MetaMask.
3. **Paywall de vídeos** – desbloquear vídeo quando o pagamento USDC for confirmado.
4. **Governance** – continua para quem for admin (pode ser por wallet ou por email/role no futuro).

---

## Por que a wallet “entrou” mas não deu Governance

Hoje no TrustBank (modo Prisma) o **Governance** só abre para endereços que estão na tabela **admin_wallet_addresses**. Se você conectou uma carteira que **não** está nessa tabela, o sistema não te considera admin – por isso não entrou no Governance. O “entrar com email” que você usou provavelmente é outro fluxo (ex.: outro projeto ou Supabase) que não está ligado a esse admin por wallet.

---

## Melhor caminho: Google OAuth + carteira silenciosa + USDC

### 1. Login com email (Google OAuth)

- **Sim, Google OAuth é uma boa opção** para “Entrar com Google” / “entrar com email”.
- O usuário clica em “Entrar com Google”, autoriza, e o backend cria/identifica a conta por email (ou `sub` do Google).
- Não precisa mostrar “Conecte carteira” para uso normal do site.

### 2. Carteira silenciosa (para pagamentos USDC)

- **Não é o Google que paga** – o Google só identifica o usuário.
- Cada conta (após login) pode ter uma **carteira associada em background**:
  - **Custodial**: o backend (ou parceiro) guarda a chave e assina transações USDC em nome do usuário; o usuário não vê nem instala nada.
  - **Ou** “smart wallet” / conta abstrata (ex.: ERC-4337) onde o usuário “aprova” uma vez ou o backend paga por ele.
- Pagamentos de **paywall** seriam em **USDC** usando essa carteira (ou um fluxo de checkout que termina em USDC).

### 3. O que “libera” os vídeos não é o Google – é o pagamento

- **Google OAuth** → só faz: “quem é esse usuário?” e “está logado?”.
- **Liberar vídeo** → quando o **pagamento USDC** (ou a regra que você definir) for confirmado:
  1. Usuário logado (Google) vê o vídeo bloqueado.
  2. Clica “Desbloquear” / “Comprar acesso”.
  3. Pagamento em USDC (carteira silenciosa ou outro fluxo).
  4. Backend (ou webhook) confirma o pagamento.
  5. Backend grava: “user X desbloqueou vídeo Y”.
  6. Na próxima vez que o usuário abrir o vídeo, o app vê que ele já pagou e libera (paywall aberto).

Ou seja: **Google já “libera” o login**; **pagamento USDC libera o vídeo** para aquele usuário.

---

## Regra obrigatória: verificação YouTube antes de paywall

**Só quem provar (via YouTube) que é dono do vídeo pode usar paywall.** Sem isso, o vídeo **não** deve aparecer no painel para configurar paywall — senão alguém poderia monetizar vídeo alheio e dar prejuízo à plataforma.

- Login com **Google OAuth** que inclua **escopo YouTube**.
- Ao “adicionar vídeo”, o **backend** usa a YouTube Data API para comparar: o canal do vídeo é o canal da conta Google do usuário?
- **Se sim** → vídeo aparece no painel e pode ativar paywall. **Se não** → não aparece (ou aparece como “não autorizado para paywall”).

Detalhes: **docs/YOUTUBE-VERIFICACAO-DONO-PAYWALL.md**.

---

## O que implementar no TrustBank (resumo)

| Parte | O quê |
|-------|--------|
| **Auth** | Google OAuth **com escopo YouTube** (ex.: NextAuth ou Supabase) → sessão por email/user_id + token para YouTube API. |
| **Verificação dono do vídeo** | Antes de mostrar vídeo no painel com opção paywall: YouTube API → `channelId` do vídeo = canal do usuário? Só então liberar. Ver **YOUTUBE-VERIFICACAO-DONO-PAYWALL.md**. |
| **Usuário** | Tabela de usuários (email, google_id, youtube_channel_id, etc.) + opcionalmente `wallet_address` (carteira silenciosa). |
| **Governance** | Manter admin por wallet **ou** aceitar admin por email/role. |
| **Carteira silenciosa** | Ao criar conta (ou no primeiro uso), backend gera/associa uma wallet ao user; pagamentos USDC do paywall usam essa wallet. |
| **Paywall** | Tabela “quem desbloqueou o quê” (user_id, video_id, paid_at, tx_hash); só vídeos com **dono verificado** podem ter paywall. |

Assim o usuário **entra com email (Google)**, só quem **prova ser dono no YouTube** usa paywall, e os **pagamentos são em USDC**; os vídeos só são liberados para quem pagou após confirmação.
