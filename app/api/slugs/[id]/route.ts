import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/** GET /api/slugs/[id] — single listing with bids */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  const { id } = await params;
  const listing = await prisma.slugListing.findUnique({
    where: { id },
    include: {
      mini_site: {
        select: { id: true, site_name: true, slug: true, primary_color: true, accent_color: true, bg_color: true },
      },
      bids: { orderBy: [{ amount_usdc: "desc" }, { created_at: "desc" }] },
    },
  });
  if (!listing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const display_slug = listing.mini_site?.slug ?? listing.slug_value ?? "";
  const highest_bid = listing.bids?.[0] ?? null;
  const is_ended = listing.listing_type === "auction" && listing.end_at && new Date(listing.end_at) <= new Date();

  return NextResponse.json({
    ...listing,
    display_slug,
    highest_bid,
    is_auction_ended: is_ended,
  });
}

/**
 * POST /api/slugs/[id]/bid — place a bid (auction only).
 * Body: { bidder_wallet: string, amount_usdc: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  const { id } = await params;
  const listing = await prisma.slugListing.findUnique({
    where: { id },
    include: { bids: { orderBy: { amount_usdc: "desc" }, take: 1 } },
  });

  if (!listing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (listing.status !== "active") {
    return NextResponse.json({ error: "listing_not_active", message: "Listing is not active." }, { status: 400 });
  }
  if (listing.listing_type !== "auction") {
    return NextResponse.json({ error: "not_auction", message: "Only auctions accept bids." }, { status: 400 });
  }
  if (listing.end_at && new Date(listing.end_at) <= new Date()) {
    return NextResponse.json({ error: "auction_ended", message: "Auction has ended." }, { status: 400 });
  }

  const body = (await request.json()) as { bidder_wallet?: string; amount_usdc?: string };
  const bidder_wallet = body.bidder_wallet?.toLowerCase();
  const amount_usdc = body.amount_usdc;
  if (!bidder_wallet || !amount_usdc) {
    return NextResponse.json(
      { error: "missing_params", message: "bidder_wallet and amount_usdc are required." },
      { status: 400 }
    );
  }
  if (listing.seller_wallet === bidder_wallet) {
    return NextResponse.json({ error: "cannot_bid_own", message: "You cannot bid on your own listing." }, { status: 400 });
  }

  const amount = parseFloat(amount_usdc);
  const minBid = parseFloat(listing.min_bid_usdc || "1");
  const currentBest = listing.bids?.[0] ? parseFloat(listing.bids[0].amount_usdc) : parseFloat(listing.price_usdc);
  if (amount < currentBest + minBid) {
    return NextResponse.json(
      {
        error: "bid_too_low",
        message: `Minimum bid is ${(currentBest + minBid).toFixed(2)} USDC (current best + min increment).`,
      },
      { status: 400 }
    );
  }

  const [bid] = await prisma.$transaction([
    prisma.slugBid.create({
      data: { listing_id: id, bidder_wallet, amount_usdc: amount.toFixed(2) },
    }),
    prisma.slugListing.update({
      where: { id },
      data: { current_bid_usdc: amount.toFixed(2), updated_at: new Date() },
    }),
  ]);

  return NextResponse.json({ success: true, bid, current_bid_usdc: amount.toFixed(2) });
}
