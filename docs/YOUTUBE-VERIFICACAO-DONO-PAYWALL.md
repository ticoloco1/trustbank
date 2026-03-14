# Verificação YouTube: só dono do vídeo pode usar paywall

## Regra obrigatória

**Só quem provar que é dono do vídeo no YouTube pode colocar paywall e ver o vídeo no painel.**  
Caso contrário, qualquer um poderia “adicionar” um vídeo alheio e cobrar por ele na plataforma → prejuízo enorme e risco jurídico.

---

## O que a plataforma deve fazer

| Situação | O que acontece |
|----------|-----------------|
| Usuário **não** tem Google OAuth ligado ao YouTube | Não pode usar paywall. Vídeos com paywall **não aparecem** no painel dele. |
| Usuário tem Google OAuth **mas não provou** ser dono daquele vídeo | Aquele vídeo **não aparece** no painel para configurar paywall. |
| Usuário tem Google OAuth **e a plataforma confirmou** que ele é dono do vídeo/canal | O vídeo **aparece** no painel e ele **pode** ativar paywall. |

Ou seja: **só Google OAuth ligado ao YouTube + confirmação de que é dono do vídeo** → libera paywall. Sem isso, o vídeo não entra no painel (ou entra só como “não elegível para paywall”).

---

## Como provar que é dono do vídeo

1. **Login com Google** usando escopo que inclua **YouTube** (ex.: `youtube.readonly` ou o necessário para listar canais/vídeos).
2. **Backend chama a YouTube Data API v3**:
   - Para o **vídeo** que o usuário quer adicionar: obter `channelId` (ou `snippet.channelId`) daquele vídeo.
   - Para o **usuário logado**: obter o canal vinculado à conta Google (ex.: `channels.list` com `mine=true` usando o token do usuário).
3. **Comparar**: se o `channelId` do vídeo for o **mesmo** do canal do usuário → ele é dono daquele vídeo → pode usar paywall. Caso contrário → **não** mostrar no painel para paywall / não permitir ativar paywall.

Resumo: **só liberar paywall após verificação via YouTube API de que o canal do vídeo é o canal do usuário autenticado.**

---

## Fluxo recomendado no painel

1. Usuário entra com **Google OAuth** (com escopo YouTube).
2. Clica em “Adicionar vídeo” e cola a URL do YouTube.
3. **Backend**:
   - Busca o vídeo na YouTube API (ou por URL) e pega o `channelId`.
   - Com o token do usuário, chama a API para saber o canal dele (`channels.list`, `mine=true`).
   - Se `channelId` do vídeo **≠** canal do usuário → retorna “Você não é o dono deste vídeo. Só o dono pode usar paywall.” e **não** adiciona o vídeo ao painel (ou adiciona como “somente exibição”, sem opção de paywall).
   - Se for o mesmo canal → grava o vídeo no banco, associa ao usuário e **permite** ativar paywall; o vídeo **aparece** no painel com opção de paywall.
4. Qualquer vídeo que ainda **não** passou por essa verificação **não** deve aparecer no painel com opção de paywall (ou não aparece no painel até ser verificado).

---

## Por que isso protege a plataforma

- Quem **não** tem Google OAuth ligado ao YouTube **não** consegue nem tentar usar paywall.
- Quem tem OAuth mas **não** é dono do vídeo **não** vê aquele vídeo no painel para paywall (ou vê como “não autorizado”), então não pode cobrar por conteúdo alheio.
- Só quem a **API do YouTube** confirmar como dono do canal do vídeo pode ativar paywall → evita prejuízo e uso indevido da plataforma.

Implementar essa verificação é **obrigatório** antes de liberar paywall para qualquer criador.
