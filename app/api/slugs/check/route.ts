import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getSlugClaimTier } from "@/lib/slug-reserved";
import { getSlugOverridesFromDb } from "@/lib/slug-settings";

/**
 * GET /api/slugs/check?slug=xxx&type=handle|company
 * Verifica se o slug está livre para claim. type=handle → @slug, type=company → /s/slug.
 */
export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  const slug = request.nextUrl.searchParams.get("slug")?.trim().toLowerCase().replace(/^\@/, "");
  const type = (request.nextUrl.searchParams.get("type") || "company").toLowerCase() as string;
  const isHandle = type === "handle";

  if (!slug) {
    return NextResponse.json({ available: false, error: "Missing slug" }, { status: 400 });
  }
  if (!/^[a-z0-9_-]+$/i.test(slug)) {
    return NextResponse.json({
      available: false,
      error: "Slug can only contain letters, numbers, hyphens and underscores.",
    }, { status: 400 });
  }

  const overrides = await getSlugOverridesFromDb();
  const tier = getSlugClaimTier(slug, overrides);
  if (tier.tier === "blocked") {
    return NextResponse.json({
      available: false,
      slug,
      full_url: isHandle ? `trustbank.xyz/@${slug}` : `trustbank.xyz/s/${slug}`,
      message: tier.message || "This slug cannot be registered.",
    });
  }

  const slugValue = isHandle ? `@${slug}` : slug;
  const existingSite = await prisma.miniSite.findFirst({
    where: { OR: [{ slug }, { slug: `@${slug}` }] },
  });
  if (existingSite) {
    return NextResponse.json({
      available: false,
      slug,
      full_url: isHandle ? `trustbank.xyz/@${slug}` : `trustbank.xyz/s/${slug}`,
      message: "This slug is already taken.",
    });
  }

  const activeListing = await prisma.slugListing.findFirst({
    where: {
      status: "active",
      OR: [{ slug_value: slug }, { slug_value: `@${slug}` }],
    },
  });
  if (activeListing) {
    return NextResponse.json({
      available: false,
      slug,
      full_url: isHandle ? `trustbank.xyz/@${slug}` : `trustbank.xyz/s/${slug}`,
      message: "This slug is listed for sale. Buy it from the marketplace.",
      listing_id: activeListing.id,
    });
  }

  return NextResponse.json({
    available: true,
    slug,
    slug_type: isHandle ? "handle" : "company",
    full_url: isHandle ? `trustbank.xyz/@${slug}` : `trustbank.xyz/s/${slug}`,
    message: "Slug is available. Pay to claim and create your page.",
    amount_usdc: tier.amount_usdc,
    tier: tier.tier,
  });
}
