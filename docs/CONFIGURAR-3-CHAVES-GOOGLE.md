# Configurar as 3 chaves (Google + YouTube) — sem subir nada no GitHub

**Importante:** essas chaves são **secretas**. Configure **apenas** na Vercel (Environment Variables), no `.env.local` no seu PC, ou **pelo painel admin** (recomendado). O `.gitignore` já impede que `.env` e `.env.local` sejam enviados ao GitHub; **nunca** commite um arquivo com valores reais.

**Painel admin:** Conecte uma carteira de admin em **Dashboard** e use a seção **"API keys (admin)"** para colar as 3 chaves. Elas ficam salvas no banco e têm prioridade sobre as variáveis de ambiente.

---

## As 3 variáveis

| Variável | Onde pegar | Uso no projeto |
|----------|------------|----------------|
| **GOOGLE_CLIENT_ID** | Google Cloud Console → Credenciais → OAuth 2.0 Client ID | Login Google (OAuth) |
| **GOOGLE_CLIENT_SECRET** | Mesmo OAuth Client ID → baixar JSON ou copiar "Segredo do cliente" | Login Google (OAuth) |
| **YOUTUBE_API_KEY** | Google Cloud Console → Credenciais → Chave de API | YouTube Data API v3 (ver dono do vídeo, título, thumbnail) |

---

## Passo a passo no Google Cloud Console

### 1. Acessar e ativar APIs

1. Acesse [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um projeto ou selecione um existente.
3. Vá em **APIs e Serviços → Biblioteca**.
4. Pesquise **YouTube Data API v3** e clique em **Ativar**.

### 2. Criar a Chave de API (YOUTUBE_API_KEY)

1. **APIs e Serviços → Credenciais**.
2. **+ Criar credenciais** → **Chave de API**.
3. Copie a chave gerada → use como valor de **YOUTUBE_API_KEY** na Vercel (e no `.env.local` se testar local).

### 3. Criar o OAuth 2.0 Client ID (GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET)

1. Em **Credenciais**, **+ Criar credenciais** → **ID do cliente OAuth**.
2. Tipo de aplicativo: **Aplicativo da Web**.
3. Nome: ex. "TrustBank" ou "Prime Fin Dash".
4. Em **URIs de redirecionamento autorizados**, adicione:
   - Produção: `https://SEU-DOMINIO.vercel.app/api/auth/google/callback`
   - Local: `http://localhost:3000/api/auth/google/callback`
5. Salve. Na tela da credencial você vê:
   - **ID do cliente** → use como **GOOGLE_CLIENT_ID**.
   - Clique em **Download JSON** ou em cima do client para ver **Segredo do cliente** → use como **GOOGLE_CLIENT_SECRET**.

### 4. Tela de consentimento OAuth (se pedir)

1. **APIs e Serviços → Tela de consentimento OAuth**.
2. Se ainda não configurou, adicione escopo que inclua **YouTube Data API v3** (leitura), para poder usar `channels.list(mine=true)` e verificar dono do canal.

---

## Onde configurar (não subir no GitHub)

### Na Vercel (produção)

1. Projeto → **Settings → Environment Variables**.
2. Adicione para **Production** (e Preview se quiser):
   - **GOOGLE_CLIENT_ID** = (valor do ID do cliente OAuth)
   - **GOOGLE_CLIENT_SECRET** = (valor do segredo do cliente)
   - **YOUTUBE_API_KEY** = (valor da chave de API)
3. Salve e faça **Redeploy** para as variáveis valerem.

### No PC (desenvolvimento)

Crie na raiz do projeto um arquivo **`.env.local`** (ele já está no `.gitignore` e **não** será enviado ao GitHub):

```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
YOUTUBE_API_KEY=xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Nunca faça `git add .env.local` nem commite esse arquivo.

---

## Conferir se está correto

- **Login Google:** ao acessar uma rota que usa OAuth (ex. link “Entrar com Google” no dashboard), você deve ser redirecionado para o Google e depois de volta para o callback do seu domínio.
- **Vídeos / paywall:** o dashboard carrega vídeos do canal do usuário e permite ativar paywall; isso usa `YOUTUBE_API_KEY` e o OAuth (canais do usuário).

Se algo falhar, confira: (1) URIs de redirecionamento exatamente iguais (com/sem barra final); (2) YouTube Data API v3 ativada; (3) variáveis salvas na Vercel e redeploy feito.
