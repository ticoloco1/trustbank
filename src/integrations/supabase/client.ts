/**
 * Stub Supabase: sem dependência de @supabase/supabase-js (build Next.js na Vercel).
 * Auth usa Prisma/API (NEXT_PUBLIC_USE_PRISMA ou sem NEXT_PUBLIC_SUPABASE_URL).
 * Para usar Supabase de verdade, instale @supabase/supabase-js e troque por createClient(...).
 */
type Session = {
  user: { id: string; email?: string | null; user_metadata?: { wallet_address?: string } };
} | null;

export const supabase = {
  auth: {
    getSession: async (): Promise<{ data: { session: Session } }> => ({ data: { session: null } }),
    onAuthStateChange: (_cb: () => void): { data: { subscription: { unsubscribe: () => void } } } => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  },
  from: (_table: string) => ({
    select: (_cols: string) => ({
      eq: (_col: string, _val: string | number) => ({
        maybeSingle: async (): Promise<{ data: unknown; error: null }> => ({ data: null, error: null }),
      }),
    }),
    update: (_payload: unknown) => ({
      eq: (_col: string, _val: number): Promise<{ error: null }> => Promise.resolve({ error: null }),
    }),
  }),
};
