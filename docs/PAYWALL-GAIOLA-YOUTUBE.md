# Paywall — Gaiola do player e YouTube “fantasma”

## 1. Implementação técnica: “gaiola” no TrustBank

O **ProtectedPlayer** (`src/components/ProtectedPlayer.tsx`) cria uma camada invisível que:

- **Camada 1:** Bloqueia cliques na parte superior do player (título e link “Assistir no YouTube”).
- **Camada 2:** Bloqueia clique com botão direito em todo o player (`onContextMenu` → `preventDefault`).
- **Domínio:** Usa `youtube-nocookie.com` para não deixar rastros de cookie no navegador.
- **Parâmetros do embed:** `rel=0`, `modestbranding=1`, `iv_load_policy=3`, `controls=1`, `disablekb=1`.
- **Marca d’água:** “Conteúdo Protegido — TrustBank” no canto inferior direito.

O ID do vídeo pode ser ofuscado: no backend/banco guarde o ID **invertido**; no front use `SecurityHelper.revealId(obfuscatedId)` e passe `obfuscated={true}` para o `ProtectedPlayer`.

---

## 2. O que o dono do vídeo deve fazer (YouTube Studio)

Para o vídeo funcionar como “fantasma” e só aparecer via paywall:

1. **Visibilidade:** **Não listado (Unlisted)**  
   - Não aparece em busca, na página do canal nem em recomendações. Só quem tem o link (ou o código de paywall) acessa.

2. **Configurações avançadas (licença e distribuição):**
   - **Desmarcar** “Publicar no feed de inscrições e enviar notificações”  
     Assim os inscritos não recebem o vídeo de graça.
   - **Manter ativo** “Permitir incorporação”  
     Se desativar, o vídeo não roda no site.

3. **Restrição de idade (opcional):**  
   Se o conteúdo for sensível, ativar restrição dificulta extração por bots simples.

---

## 3. Ofuscação do ID no código

Em `src/lib/security-helper.ts`:

- **revealId(secret):** desinverte o ID na hora de montar a URL do iframe.
- **obfuscateId(id):** inverte o ID para armazenar (ex.: no banco ou na resposta da API).

Exemplo: ID real `dQw4w9WgXcQ` → armazenar como `QXcXgW9w4Wd`. Na resposta da API, envie o ID já invertido; no front use `revealId` e passe `obfuscated={true}` para o `ProtectedPlayer`.

---

## Resumo da proteção

| Camada              | Função                                                                 |
|---------------------|------------------------------------------------------------------------|
| Cursor / front      | Impede cliques nos links nativos do YouTube (título / compartilhar).  |
| Domínio no-cookie   | `youtube-nocookie.com` reduz rastreamento no navegador.                |
| Vídeo não listado  | Vídeo invisível na plataforma; só acessível via link/paywall.          |
| Ofuscação do ID     | ID invertido no backend; revelado só na hora de injetar no iframe.      |
