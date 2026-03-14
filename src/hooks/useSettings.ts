import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const USE_PRISMA =
  typeof window !== "undefined" && (process.env.NEXT_PUBLIC_USE_PRISMA === "true" || process.env.NEXT_PUBLIC_SITE === "trustbank");

export type Settings = {
  id?: number;
  platform_name?: string;
  logo_url?: string | null;
  hero_text?: string | null;
  grid_columns?: number;
  updated_at?: string;
  [key: string]: unknown;
};

async function fetchSettingsSupabase(): Promise<Settings | null> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data, error } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data as Settings | null;
}

async function fetchSettingsApi(): Promise<Settings> {
  const base = typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/settings`);
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export function useSettings() {
  return useQuery({
    queryKey: ["platform-settings", USE_PRISMA],
    queryFn: () => (USE_PRISMA ? fetchSettingsApi() : fetchSettingsSupabase().then((d) => d ?? { platform_name: "HASHPO", logo_url: null })),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Settings>) => {
      if (USE_PRISMA) {
        const base = typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const res = await fetch(`${base}/api/settings`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || "Update failed");
        }
        return;
      }
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase
        .from("platform_settings")
        .update(payload)
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-settings"] });
    },
  });
}
