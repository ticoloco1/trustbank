"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useAccount } from "wagmi";
import { useAuthPrisma } from "@/hooks/useAuthPrisma";

// TrustBank / royal-fintech: auth por carteira (Prisma). Use Prisma se explicitamente ativado, ou se for site trustbank, ou se Supabase não estiver configurado.
const USE_PRISMA =
  typeof window !== "undefined" &&
  (process.env.NEXT_PUBLIC_USE_PRISMA === "true" ||
    process.env.NEXT_PUBLIC_SITE === "trustbank" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL);

export type User = { id: string; email?: string | null };

type AuthContextValue = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  refetch: () => void;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAdmin: false,
  loading: true,
  refetch: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [supabaseAdmin, setSupabaseAdmin] = useState(false);
  const [supabaseLoading, setSupabaseLoading] = useState(true);

  const { address, isConnected } = useAccount();
  const prismaAuth = useAuthPrisma();

  // Modo Prisma (TrustBank): só wallet + API
  if (USE_PRISMA) {
    return (
      <AuthContext.Provider
        value={{
          user: prismaAuth.user,
          isAdmin: prismaAuth.isAdmin,
          loading: prismaAuth.loading,
          refetch: prismaAuth.refetch,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  // Modo Supabase (Hashpo): sessão + admin_wallet_addresses
  useEffect(() => {
    let mounted = true;
    let sub: { unsubscribe: () => void } | undefined;
    (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      async function init() {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!mounted) return;
          if (session?.user) {
            setSupabaseUser({ id: session.user.id, email: session.user.email ?? null });
            const wallet = (session.user as any).user_metadata?.wallet_address?.toLowerCase();
            if (wallet) {
              const { data } = await supabase.from("admin_wallet_addresses").select("wallet_address").eq("wallet_address", wallet).maybeSingle();
              setSupabaseAdmin(!!data);
            } else setSupabaseAdmin(false);
          } else {
            setSupabaseUser(null);
            setSupabaseAdmin(false);
          }
        } catch {
          if (mounted) setSupabaseUser(null);
        } finally {
          if (mounted) setSupabaseLoading(false);
        }
      }
      await init();
      if (mounted) {
        const { data } = supabase.auth.onAuthStateChange(init);
        sub = data.subscription;
      }
    })();
    return () => {
      mounted = false;
      sub?.unsubscribe();
    };
  }, [address, isConnected]);

  const refetch = useCallback(async () => {
    if (USE_PRISMA) return;
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setSupabaseUser({ id: session.user.id, email: session.user.email ?? null });
      const wallet = (session.user as any).user_metadata?.wallet_address?.toLowerCase();
      if (wallet) {
        const { data } = await supabase.from("admin_wallet_addresses").select("wallet_address").eq("wallet_address", wallet).maybeSingle();
        setSupabaseAdmin(!!data);
      }
    } else {
      setSupabaseUser(null);
      setSupabaseAdmin(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: supabaseUser,
        isAdmin: supabaseAdmin,
        loading: supabaseLoading,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
