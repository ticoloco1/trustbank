# Conversão do repositório new-trust (Vite → Next.js)

O repositório **https://github.com/ticoloco1/new-trust** já está em **Next.js** (App Router, `next.config.js`, etc.). O único trecho que ainda usava padrão de **Vite** era o cliente Supabase.

## O que foi ajustado

### 1. `src/integrations/supabase/client.ts`

- **Antes (Vite):** `import.meta.env.VITE_SUPABASE_URL` e `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`
- **Depois (Next.js):** `process.env.NEXT_PUBLIC_SUPABASE_URL` e `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **SSR:** uso de `localStorage` apenas no client (`typeof window !== 'undefined'`), para não quebrar no servidor.

### 2. Variáveis de ambiente

No `.env` / `.env.local` (e no Vercel), use:

- `NEXT_PUBLIC_SUPABASE_URL` (em vez de `VITE_SUPABASE_URL`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (em vez de `VITE_SUPABASE_PUBLISHABLE_KEY`)

## Como aplicar no repositório new-trust

1. Clone o repositório:  
   `git clone https://github.com/ticoloco1/new-trust.git`
2. Substitua o conteúdo de `src/integrations/supabase/client.ts` pela versão compatível com Next.js (abaixo).
3. Atualize o `.env.example` com as variáveis `NEXT_PUBLIC_SUPABASE_*` e faça commit + push.

### Código do client Supabase (Next.js)

```ts
// Cliente Supabase compatível com Next.js (variáveis process.env.NEXT_PUBLIC_* e SSR).
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const authOptions =
  typeof window !== 'undefined'
    ? {
        storage: window.localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    : { persistSession: false, autoRefreshToken: false };

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: authOptions,
});
```

Com isso, o projeto new-trust fica totalmente em Next.js, sem resquícios de Vite.
