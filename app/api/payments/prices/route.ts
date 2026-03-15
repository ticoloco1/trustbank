import { NextResponse } from "next/server";
import {
  getPlatformWallet,
  PAYMENT_CONTRACT_ADDRESS,
  DEFAULT_TREASURY_WALLET,
  MINISITE_MONTHLY_USD,
  STANDALONE_SLUG_PRICE_USD,
  STANDALONE_SLUG_ANNUAL_USD,
  SLUG_SALE_PLATFORM_FEE_PERCENT,
  VIDEO_PAYWALL_CREATOR_PERCENT,
  VIDEO_PAYWALL_PLATFORM_PERCENT,
  MINISITE_PAYWALL_CREATOR_PERCENT,
  MINISITE_PAYWALL_PLATFORM_PERCENT,
  NFT_LAUNCH_FEE_USD,
  NFT_SALE_PLATFORM_FEE_PERCENT,
} from "@/lib/payment-config";

/**
 * GET /api/payments/prices — platform default prices, fee splits and payment contract (for UI / docs).
 */
export async function GET() {
  return NextResponse.json({
    payment_destination: getPlatformWallet(),
    payment_contract: PAYMENT_CONTRACT_ADDRESS,
    treasury_wallet: DEFAULT_TREASURY_WALLET,
    minisite_monthly_usd: MINISITE_MONTHLY_USD,
    standalone_slug_price_usd: STANDALONE_SLUG_PRICE_USD,
    standalone_slug_annual_usd: STANDALONE_SLUG_ANNUAL_USD,
    slug_sale_platform_fee_percent: SLUG_SALE_PLATFORM_FEE_PERCENT,
    video_paywall_creator_percent: VIDEO_PAYWALL_CREATOR_PERCENT,
    video_paywall_platform_percent: VIDEO_PAYWALL_PLATFORM_PERCENT,
    minisite_paywall_creator_percent: MINISITE_PAYWALL_CREATOR_PERCENT,
    minisite_paywall_platform_percent: MINISITE_PAYWALL_PLATFORM_PERCENT,
    nft_launch_fee_usd: NFT_LAUNCH_FEE_USD,
    nft_sale_platform_fee_percent: NFT_SALE_PLATFORM_FEE_PERCENT,
  });
}
