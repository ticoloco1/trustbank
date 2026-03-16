/**
 * TrustBank 100% Prisma: auth por wallet + API (sem Supabase).
 * Use este hook quando NEXT_PUBLIC_USE_PRISMA === "true".
 * Retorna { user, isAdmin, loading } baseado em /api/auth/me?wallet=0x...
 */
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";

const USE_PRISMA =
  typeof window !== "undefined" &&
  (process.env.NEXT_PUBLIC_USE_PRISMA === "true" ||
    process.env.NEXT_PUBLIC_SITE === "trustbank" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL);

export type AuthUser = { id: string; email?: string | null };

async function fetchAuthMe(wallet: string): Promise<{ user: AuthUser | null; isAdmin: boolean }> {
  const base = typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/auth/me?wallet=${encodeURIComponent(wallet)}`);
  if (!res.ok) return { user: null, isAdmin: false };
  return res.json();
}

export function useAuthPrisma(): {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  refetch: () => void;
} {
  const { address, isConnected } = useAccount();
  const wallet = address?.toLowerCase() ?? null;
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["auth-me-prisma", wallet],
    queryFn: () => fetchAuthMe(wallet!),
    enabled: USE_PRISMA && !!wallet && isConnected,
  });
  if (!USE_PRISMA) {
    return { user: null, isAdmin: false, loading: false, refetch: () => {} };
  }
  return {
    user: isConnected && wallet && data?.user ? data.user : null,
    isAdmin: !!(isConnected && wallet && data?.isAdmin),
    loading: isLoading,
    refetch,
  };
}
