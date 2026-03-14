/**
 * Stub para build quando o app roda em modo Prisma (TrustBank).
 * Em modo Hashpo/Supabase, substitua por um client Supabase real.
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
