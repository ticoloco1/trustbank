import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/** Máscara para exibir se está preenchido sem mostrar o valor. */
function mask(value: string | null): string {
  if (!value || !value.trim()) return "";
  if (value.length <= 8) return "••••••••";
  return value.slice(0, 4) + "••••••••" + value.slice(-4);
}

/**
 * GET /api/admin/keys — status das 3 chaves (só para admin).
 * Query: ?wallet=0x... (carteira conectada; deve estar em admin_wallet_addresses).
 * Retorna se cada chave está configurada (mascarada), sem revelar o valor.
 */
export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  const wallet = request.nextUrl.searchParams.get("wallet")?.toLowerCase();
  if (!wallet?.startsWith("0x")) {
    return NextResponse.json({ error: "Missing or invalid wallet" }, { status: 400 });
  }

  const isAdmin = await prisma.adminWalletAddress.findUnique({
    where: { wallet_address: wallet },
  });
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const row = await prisma.platformSetting.findUnique({
    where: { id: 1 },
    select: { google_client_id: true, google_client_secret: true, youtube_api_key: true },
  });

  return NextResponse.json({
    google_client_id: row?.google_client_id ? mask(row.google_client_id) : "",
    google_client_secret: row?.google_client_secret ? mask(row.google_client_secret) : "",
    youtube_api_key: row?.youtube_api_key ? mask(row.youtube_api_key) : "",
    google_client_id_set: !!(row?.google_client_id?.trim()),
    google_client_secret_set: !!(row?.google_client_secret?.trim()),
    youtube_api_key_set: !!(row?.youtube_api_key?.trim()),
  });
}

/**
 * PATCH /api/admin/keys — gravar as 3 chaves (só admin).
 * Body: { admin_wallet: "0x...", google_client_id?, google_client_secret?, youtube_api_key? }
 * Campos omitidos não são alterados; string vazia remove o valor.
 */
export async function PATCH(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  const body = (await request.json()) as {
    admin_wallet?: string;
    google_client_id?: string;
    google_client_secret?: string;
    youtube_api_key?: string;
  };
  const wallet = body.admin_wallet?.toLowerCase();
  if (!wallet?.startsWith("0x")) {
    return NextResponse.json({ error: "Missing or invalid admin_wallet" }, { status: 400 });
  }

  const isAdmin = await prisma.adminWalletAddress.findUnique({
    where: { wallet_address: wallet },
  });
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: { google_client_id?: string | null; google_client_secret?: string | null; youtube_api_key?: string | null } = {};
  if (body.google_client_id !== undefined) data.google_client_id = body.google_client_id.trim() || null;
  if (body.google_client_secret !== undefined) data.google_client_secret = body.google_client_secret.trim() || null;
  if (body.youtube_api_key !== undefined) data.youtube_api_key = body.youtube_api_key.trim() || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const current = await prisma.platformSetting.findUnique({ where: { id: 1 } });
  if (current) {
    await prisma.platformSetting.update({
      where: { id: 1 },
      data,
    });
  } else {
    await prisma.platformSetting.create({
      data: {
        id: 1,
        platform_name: "TrustBank",
        google_client_id: data.google_client_id ?? null,
        google_client_secret: data.google_client_secret ?? null,
        youtube_api_key: data.youtube_api_key ?? null,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
