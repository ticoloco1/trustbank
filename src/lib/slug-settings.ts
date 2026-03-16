import { getPrisma } from "@/lib/prisma";
import type { SlugTierOverrides } from "@/lib/slug-reserved";

/** Carrega preços e lista de slugs liberados do painel admin (platform_settings). */
export async function getSlugOverridesFromDb(): Promise<SlugTierOverrides | undefined> {
  const prisma = getPrisma();
  if (!prisma) return undefined;
  const row = await prisma.platformSetting.findUnique({
    where: { id: 1 },
    select: {
      slug_claim_default_usd: true,
      slug_claim_premium_usd: true,
      slug_claim_letter_usd: true,
      slug_allowed_override: true,
    },
  });
  if (!row) return undefined;
  const allowed = row.slug_allowed_override;
  const allowedSlugs = Array.isArray(allowed)
    ? (allowed as string[]).filter((s) => typeof s === "string").map((s) => s.trim().toLowerCase().replace(/^@/, ""))
    : [];
  return {
    defaultUsd: row.slug_claim_default_usd?.trim() || undefined,
    premiumUsd: row.slug_claim_premium_usd?.trim() || undefined,
    letterUsd: row.slug_claim_letter_usd?.trim() || undefined,
    allowedSlugs: allowedSlugs.length > 0 ? allowedSlugs : undefined,
  };
}
