/**
 * Palavras reservadas e premium para slugs.
 * - blocked: não podem ser registrados (ex.: bank, termos sensíveis).
 * - premium: têm preço fixo maior (ex.: ceo, seo, investment, letras únicas).
 */

export const SLUG_CLAIM_DEFAULT_USD = "12.90";
export const SLUG_CLAIM_PREMIUM_USD = "99.00";   // palavras premium
export const SLUG_CLAIM_LETTER_USD = "299.00";   // letra única (a-z, 0-9)

/** Palavras bloqueadas: não podem ser usadas como slug (risco legal/confusão). */
const BLOCKED_WORDS = new Set([
  "bank", "banks", "banking", "trust", "trustbank", "trustbankxyz",
  "official", "admin", "support", "help", "api", "www", "mail", "ftp",
  "root", "system", "null", "undefined", "login", "oauth", "stripe",
]);

/** Palavras premium: preço fixo maior (SLUG_CLAIM_PREMIUM_USD). */
const PREMIUM_WORDS = new Set([
  "ceo", "seo", "cfo", "cto", "cio", "investment", "invest", "investor",
  "wealth", "finance", "fintech", "crypto", "bitcoin", "ethereum",
  "realestate", "real-estate", "lawyer", "doctor", "analyst", "consulting",
  "capital", "venture", "fund", "trading", "traders", "market", "markets",
  "insurance", "legal", "medical", "health", "tech", "digital", "media",
]);

export type SlugCheckTier = "default" | "premium" | "letter" | "blocked";

export interface SlugTierResult {
  tier: SlugCheckTier;
  amount_usdc: string;
  message?: string;
}

/** Overrides do painel admin (preços e lista de slugs liberados). */
export interface SlugTierOverrides {
  defaultUsd?: string;
  premiumUsd?: string;
  letterUsd?: string;
  /** Slugs liberados pelo admin (podem ser registrados mesmo na lista bloqueada). */
  allowedSlugs?: string[];
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/^@/, "");
}

/** Verifica se é letra única ou dígito (a-z, 0-9). */
export function isSingleLetterOrDigit(slug: string): boolean {
  const n = normalize(slug);
  return n.length === 1 && /^[a-z0-9]$/.test(n);
}

/** Verifica se a palavra está bloqueada. */
export function isBlocked(slug: string): boolean {
  const n = normalize(slug);
  return BLOCKED_WORDS.has(n);
}

/** Verifica se é palavra premium. */
export function isPremiumWord(slug: string): boolean {
  const n = normalize(slug);
  return PREMIUM_WORDS.has(n);
}

/** Slug em tier "default" pode ser usado gratuitamente ao criar um mini site (nome, sobrenome, palavras comuns). */
export function isFreeSlugTier(tier: SlugCheckTier): boolean {
  return tier === "default";
}

/** Retorna tier e valor em USDC para claim do slug. Overrides vêm do painel admin. */
export function getSlugClaimTier(slug: string, overrides?: SlugTierOverrides): SlugTierResult {
  const n = normalize(slug);
  const defaultUsd = overrides?.defaultUsd ?? SLUG_CLAIM_DEFAULT_USD;
  const premiumUsd = overrides?.premiumUsd ?? SLUG_CLAIM_PREMIUM_USD;
  const letterUsd = overrides?.letterUsd ?? SLUG_CLAIM_LETTER_USD;
  const allowed = overrides?.allowedSlugs?.map((s) => s.trim().toLowerCase().replace(/^@/, "")) ?? [];
  const isAllowed = allowed.includes(n);

  if (!/^[a-z0-9_-]+$/i.test(n)) {
    return { tier: "blocked", amount_usdc: "0", message: "Slug inválido." };
  }
  if (BLOCKED_WORDS.has(n)) {
    if (isAllowed) return { tier: "default", amount_usdc: defaultUsd, message: "Liberado pelo admin." };
    return { tier: "blocked", amount_usdc: "0", message: "Este slug está reservado e não pode ser registrado." };
  }
  if (isSingleLetterOrDigit(n)) {
    return { tier: "letter", amount_usdc: letterUsd, message: "Letra única: preço premium." };
  }
  if (PREMIUM_WORDS.has(n)) {
    return { tier: "premium", amount_usdc: premiumUsd, message: "Palavra premium: preço fixo." };
  }
  return { tier: "default", amount_usdc: defaultUsd };
}
