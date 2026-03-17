# Deixar new-trust igual ao Lovable (sem misturar com outro repo)

O repositório **new-trust** no GitHub deve espelhar **só** o que está no Lovable. Esta pasta (royal-fintech-hub) é outro projeto e **não** deve ser enviada para o new-trust.

## Passo 1: No Lovable — Sync para o GitHub

1. Abra o seu projeto no **Lovable**.
2. Conecte ao GitHub: ícone GitHub no canto superior direito → **Connect GitHub** (ou em Settings → Connectors → GitHub).
3. Escolha o repositório **ticoloco1/new-trust** (crie se não existir e vincule a este projeto).
4. Clique em **Sync** / **Push** para enviar o código do Lovable para o new-trust.

Isso **sobrescreve** o conteúdo do new-trust no GitHub com o código atual do Lovable. Depois disso, new-trust fica igual ao Lovable.

## Passo 2: Aplicar só os fixes para o build na Vercel

O código que o Lovable envia pode falhar no build na Vercel (módulo Supabase, erros de tipo). Para corrigir **sem** misturar com outro repositório:

Na **raiz deste projeto** (royal-fintech-hub), rode:

```bash
node scripts/apply-lovable-build-fixes.js
```

O script vai:

- Clonar **new-trust** em uma pasta temporária
- Aplicar **apenas** estes 3 ajustes para o build passar:
  - `src/integrations/supabase/client.ts` → stub (sem dependência de `@supabase/supabase-js`)
  - `app/api/mini-sites/[id]/route.ts` → correção de tipo `string | null`
  - `src/components/GlobalHeader.tsx` → tipo de `NAV_LINKS` com `query` opcional
- Fazer commit e **push** para **new-trust**

Assim o new-trust continua igual ao Lovable, só que com os fixes mínimos para o deploy na Vercel.

## Resumo

| Onde       | O que fazer |
|-----------|-------------|
| **Lovable** | Conectar ao repo **new-trust** e dar **Sync** |
| **Aqui**    | Depois rodar: `node scripts/apply-lovable-build-fixes.js` |

Não use esta pasta para dar push no new-trust. O remote **new-trust** foi removido desta pasta para evitar mistura.
