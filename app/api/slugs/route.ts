import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/** GET /api/slugs — list active slug listings (sale + auction). Query: ?slug=xxx (minisite slug), ?type=sale|auction, ?slug_type=minisite|company|handle */
export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  const slug = request.nextUrl.searchParams.get("slug");
  const type = request.nextUrl.searchParams.get("type"); // sale | auction
  const slugType = request.nextUrl.searchParams.get("slug_type"); // minisite | company | handle

  const where: { status: string; listing_type?: string; slug_type?: string } = { status: "active" };
  if (type === "sale" || type === "auction") where.listing_type = type;
  if (slugType) where.slug_type = slugType;

  const listings = await prisma.slugListing.findMany({
    where,
    include: {
      mini_site: {
        select: { id: true, site_name: true, slug: true, primary_color: true, accent_color: true, bg_color: true },
      },
      bids: { orderBy: { amount_usdc: "desc" }, take: 1 },
    },
    orderBy: { updated_at: "desc" },
  });

  const list = listings.map((l) => ({
    ...l,
    display_slug: l.mini_site?.slug ?? l.slug_value ?? "",
    highest_bid: l.bids?.[0] ?? null,
  }));

  if (slug) {
    const one = list.find(
      (l) => l.mini_site?.slug === slug || (l.slug_value && (l.slug_value === slug || l.slug_value === `@${slug}`))
    );
    return NextResponse.json(one ?? null);
  }
  return NextResponse.json(list);
}

/**
 * POST /api/slugs — create listing.
 * Body (minisite): { mini_site_id, seller_wallet, price_usdc, listing_type?: "sale"|"auction", end_at?, min_bid_usdc? }
 * Body (standalone): { slug_value, slug_type: "company"|"handle", seller_wallet, price_usdc, listing_type?, end_at?, min_bid_usdc? }
 */
export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  try {
    const body = (await request.json()) as {
      mini_site_id?: string;
      slug_value?: string;
      slug_type?: string;
      seller_wallet?: string;
      price_usdc?: string;
      listing_type?: string;
      end_at?: string;
      min_bid_usdc?: string;
    };
    const {
      mini_site_id,
      slug_value,
      slug_type = "minisite",
      seller_wallet,
      price_usdc,
      listing_type = "sale",
      end_at,
      min_bid_usdc,
    } = body;

    if (!seller_wallet || !price_usdc) {
      return NextResponse.json(
        { error: "missing_params", message: "seller_wallet and price_usdc are required." },
        { status: 400 }
      );
    }

    const wallet = seller_wallet.toLowerCase();
    let slugDisplay = "";
    let mini_site_id_final: string | null = null;

    if (mini_site_id) {
      const miniSite = await prisma.miniSite.findUnique({
        where: { id: mini_site_id },
        select: { id: true, user_id: true, slug: true },
      });
      if (!miniSite) {
        return NextResponse.json({ error: "mini_site_not_found", message: "Mini site not found." }, { status: 404 });
      }
      if (miniSite.user_id.toLowerCase() !== wallet) {
        return NextResponse.json(
          { error: "not_owner", message: "Only the mini site owner can list it for sale." },
          { status: 403 }
        );
      }
      if (!miniSite.slug) {
        return NextResponse.json({ error: "no_slug", message: "Mini site must have a slug set." }, { status: 400 });
      }
      mini_site_id_final = miniSite.id;
      slugDisplay = miniSite.slug;
    } else if (slug_value && slug_value.trim()) {
      const st = slug_type === "handle" || slug_type === "company" ? slug_type : "company";
      const val = slug_value.trim().replace(/^@/, "");
      if (!val) {
        return NextResponse.json({ error: "invalid_slug_value", message: "slug_value cannot be empty." }, { status: 400 });
      }
      const existingMinisite = await prisma.miniSite.findUnique({ where: { slug: st === "handle" ? `@${val}` : val } });
      if (existingMinisite) {
        return NextResponse.json(
          { error: "slug_taken", message: "This slug is already in use by a mini site." },
          { status: 400 }
        );
      }
      const existingListing = await prisma.slugListing.findFirst({
        where: { status: "active", slug_value: st === "handle" ? `@${val}` : val, slug_type: st },
      });
      if (existingListing) {
        return NextResponse.json(
          { error: "already_listed", message: "This slug is already listed." },
          { status: 400 }
        );
      }
      slugDisplay = st === "handle" ? `@${val}` : val;
    } else {
      return NextResponse.json(
        { error: "missing_params", message: "Provide mini_site_id or slug_value (+ slug_type)." },
        { status: 400 }
      );
    }

    const isAuction = listing_type === "auction";
    const endAt = isAuction && end_at ? new Date(end_at) : null;
    if (isAuction && endAt && endAt <= new Date()) {
      return NextResponse.json(
        { error: "invalid_end_at", message: "Auction end_at must be in the future." },
        { status: 400 }
      );
    }

    const existing = mini_site_id_final
      ? await prisma.slugListing.findUnique({ where: { mini_site_id: mini_site_id_final } })
      : await prisma.slugListing.findFirst({
          where: { slug_value: slugDisplay, slug_type: slug_type === "handle" ? "handle" : "company", status: "active" },
        });

    if (existing && existing.status === "active") {
      return NextResponse.json(
        { error: "already_listed", message: "This item is already listed." },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, unknown> = {
      seller_wallet: wallet,
      listing_type: isAuction ? "auction" : "sale",
      price_usdc,
      min_bid_usdc: isAuction ? (min_bid_usdc || "1") : null,
      current_bid_usdc: null,
      end_at: endAt,
      status: "active",
    };
    if (!mini_site_id_final) {
      updatePayload.slug_value = slugDisplay;
      updatePayload.slug_type = slug_type === "handle" ? "handle" : "company";
    }

    if (existing) {
      const updated = await prisma.slugListing.update({
        where: { id: existing.id },
        data: {
          seller_wallet: wallet,
          listing_type: isAuction ? "auction" : "sale",
          price_usdc,
          min_bid_usdc: isAuction ? (min_bid_usdc || "1") : null,
          current_bid_usdc: null,
          end_at: endAt,
          status: "active",
          ...(updatePayload.slug_value && { slug_value: updatePayload.slug_value as string, slug_type: updatePayload.slug_type as string }),
        },
        include: { mini_site: { select: { site_name: true, slug: true } } },
      });
      return NextResponse.json(updated);
    }

    const createData = {
      mini_site_id: mini_site_id_final,
      slug_value: mini_site_id_final ? undefined : slugDisplay,
      slug_type: mini_site_id_final ? "minisite" : (slug_type === "handle" ? "handle" : "company"),
      seller_wallet: wallet,
      listing_type: isAuction ? "auction" : "sale",
      price_usdc,
      min_bid_usdc: isAuction ? (min_bid_usdc || "1") : undefined,
      end_at: endAt,
      status: "active",
    };
    const listing = await prisma.slugListing.create({
      data: createData,
      include: { mini_site: { select: { site_name: true, slug: true } } },
    });
    return NextResponse.json(listing);
  } catch (e) {
    console.error("[api/slugs]", e);
    return NextResponse.json(
      { error: "server_error", message: "Failed to create listing." },
      { status: 500 }
    );
  }
}
