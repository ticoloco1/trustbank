import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { getSlugOverridesFromDb } from "@/lib/slug-settings";

async function isAdmin(wallet: string | null): Promise<boolean> {
  if (!wallet?.startsWith("0x")) return false;
  const prisma = getPrisma();
  if (!prisma) return false;
  const envAdmin = process.env.ADMIN_WALLET ?? process.env.ADMIN_WALLETS;
  if (envAdmin) {
    const list = envAdmin.split(",").map((w) => w.trim().toLowerCase());
    if (list.includes(wallet.toLowerCase())) return true;
  }
  const row = await prisma.adminWalletAddress.findUnique({
    where: { wallet_address: wallet.toLowerCase() },
  });
  return !!row;
}

/** GET — retorna preços e slugs liberados (admin). */
export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const wallet = request.nextUrl.searchParams.get("wallet")?.toLowerCase();
  if (!(await isAdmin(wallet ?? null))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const overrides = await getSlugOverridesFromDb();
  const row = await prisma.platformSetting.findUnique({
    where: { id: 1 },
    select: {
      slug_claim_default_usd: true,
      slug_claim_premium_usd: true,
      slug_claim_letter_usd: true,
      slug_allowed_override: true,
    },
  });
  const allowed = row?.slug_allowed_override;
  const allowedSlugs = Array.isArray(allowed) ? (allowed as string[]) : [];
  return NextResponse.json({
    slug_claim_default_usd: row?.slug_claim_default_usd ?? "12.90",
    slug_claim_premium_usd: row?.slug_claim_premium_usd ?? "99.00",
    slug_claim_letter_usd: row?.slug_claim_letter_usd ?? "299.00",
    slug_allowed_override: allowedSlugs,
    ...overrides,
  });
}

/** PATCH — atualiza preços e/ou slugs liberados (admin). */
export async function PATCH(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const body = (await request.json()) as {
    admin_wallet?: string;
    slug_claim_default_usd?: string;
    slug_claim_premium_usd?: string;
    slug_claim_letter_usd?: string;
    slug_allowed_override?: string[];
  };
  const wallet = body.admin_wallet?.toLowerCase();
  if (!(await isAdmin(wallet ?? null))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const data: Prisma.PlatformSettingUpdateInput = {};
  if (body.slug_claim_default_usd !== undefined) {
    const v = String(body.slug_claim_default_usd).trim();
    data.slug_claim_default_usd = v || null;
  }
  if (body.slug_claim_premium_usd !== undefined) {
    const v = String(body.slug_claim_premium_usd).trim();
    data.slug_claim_premium_usd = v || null;
  }
  if (body.slug_claim_letter_usd !== undefined) {
    const v = String(body.slug_claim_letter_usd).trim();
    data.slug_claim_letter_usd = v || null;
  }
  if (body.slug_allowed_override !== undefined) {
    data.slug_allowed_override = Array.isArray(body.slug_allowed_override)
      ? body.slug_allowed_override.filter((s) => typeof s === "string" && s.trim()).map((s) => s.trim().toLowerCase().replace(/^@/, ""))
      : Prisma.JsonNull;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }
  await prisma.platformSetting.upsert({
    where: { id: 1 },
    create: { id: 1, ...data } as Prisma.PlatformSettingCreateInput,
    update: data,
  });
  return NextResponse.json({ success: true, message: "Preços e slugs liberados atualizados." });
}
