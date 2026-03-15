/**
 * Central payment config: prices, fee splits, payment contract / wallet.
 * Blockchain payments are sent to the payment contract (Remix); it handles distribution.
 */

/** Contract Remix: pagamentos e distribuição (recebe USDC e faz os repasses). */
export const PAYMENT_CONTRACT_ADDRESS = "0x578ac1c44E41f3ecfBaf3bEb86363FD3dd857011" as const;

/** Wallet treasury/admin (fallback se não usar contrato). */
export const DEFAULT_TREASURY_WALLET = "0xf841d9F5ba7eac3802e9A476a85775e23d084BBe" as const;

/**
 * Destination for USDC payments (contract or wallet).
 * Use PLATFORM_WALLET in .env to override; otherwise uses the Remix contract.
 */
export function getPlatformWallet(): string {
  const env = process.env.PLATFORM_WALLET?.trim();
  if (env) return env.toLowerCase();
  return PAYMENT_CONTRACT_ADDRESS.toLowerCase();
}

// --- Mini site subscription ---
/** Default monthly price for mini site subscription (USD/USDC). */
export const MINISITE_MONTHLY_USD = "29.90";

// --- Standalone slug (company / @handle) ---
/** One-time purchase price for a standalone slug (no existing mini site). */
export const STANDALONE_SLUG_PRICE_USD = "12.90";
/** Annual renewal for standalone slug after first year (USD/USDC). */
export const STANDALONE_SLUG_ANNUAL_USD = "12.90";

// --- Slug sales & auctions ---
/** Platform fee on slug sales and auctions (%). Seller receives the rest. */
export const SLUG_SALE_PLATFORM_FEE_PERCENT = 10;

// --- Video paywall ---
/** Creator share of video paywall revenue (%). Platform gets the rest. */
export const VIDEO_PAYWALL_CREATOR_PERCENT = 60;
export const VIDEO_PAYWALL_PLATFORM_PERCENT = 40;

// --- Mini site paywall (whole or partial access) ---
/** Creator share when paywalling whole or part of mini site (%). */
export const MINISITE_PAYWALL_CREATOR_PERCENT = 70;
export const MINISITE_PAYWALL_PLATFORM_PERCENT = 30;

// --- NFTs ---
/** One-time fee to launch an NFT collection (USD/USDC). */
export const NFT_LAUNCH_FEE_USD = "300";
/** Platform fee on NFT secondary sales (%). */
export const NFT_SALE_PLATFORM_FEE_PERCENT = 10;

export function getPlatformFeePercentSlug(): number {
  return Number(process.env.SLUG_PLATFORM_FEE_PERCENT) || SLUG_SALE_PLATFORM_FEE_PERCENT;
}

export function getVideoPaywallCreatorPercent(): number {
  return Number(process.env.VIDEO_PAYWALL_CREATOR_PERCENT) || VIDEO_PAYWALL_CREATOR_PERCENT;
}

export function getVideoPaywallPlatformPercent(): number {
  return Number(process.env.VIDEO_PAYWALL_PLATFORM_PERCENT) || VIDEO_PAYWALL_PLATFORM_PERCENT;
}

export function getMinisitePaywallCreatorPercent(): number {
  return Number(process.env.MINISITE_PAYWALL_CREATOR_PERCENT) || MINISITE_PAYWALL_CREATOR_PERCENT;
}

export function getMinisitePaywallPlatformPercent(): number {
  return Number(process.env.MINISITE_PAYWALL_PLATFORM_PERCENT) || MINISITE_PAYWALL_PLATFORM_PERCENT;
}

/** Compute creator and platform amounts for video paywall (60/40). */
export function splitVideoPaywall(amountUsdc: number): { creator_usdc: string; platform_usdc: string } {
  const c = getVideoPaywallCreatorPercent() / 100;
  const p = getVideoPaywallPlatformPercent() / 100;
  return {
    creator_usdc: (amountUsdc * c).toFixed(2),
    platform_usdc: (amountUsdc * p).toFixed(2),
  };
}

/** Compute creator and platform amounts for mini site paywall (70/30). */
export function splitMinisitePaywall(amountUsdc: number): { creator_usdc: string; platform_usdc: string } {
  const c = getMinisitePaywallCreatorPercent() / 100;
  const p = getMinisitePaywallPlatformPercent() / 100;
  return {
    creator_usdc: (amountUsdc * c).toFixed(2),
    platform_usdc: (amountUsdc * p).toFixed(2),
  };
}

/** Compute platform fee and seller amount for slug sale (10% platform). */
export function splitSlugSale(amountUsdc: number): {
  platform_fee_usdc: string;
  seller_receives_usdc: string;
} {
  const feePct = getPlatformFeePercentSlug() / 100;
  const platform = amountUsdc * feePct;
  const seller = amountUsdc - platform;
  return {
    platform_fee_usdc: platform.toFixed(2),
    seller_receives_usdc: seller.toFixed(2),
  };
}
