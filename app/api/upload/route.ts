import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

const MAX_SIZE_MB = 4;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/**
 * POST /api/upload — upload de imagem para Vercel Blob.
 * Body: multipart/form-data com campo "file".
 * Query: ?prefix=minisite-abc (opcional) para organizar no path.
 * Retorna { url } com a URL pública da imagem.
 * Requer BLOB_READ_WRITE_TOKEN no Vercel (Storage > Blob).
 */
export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Upload not configured. Set BLOB_READ_WRITE_TOKEN (Vercel Blob) or use image URLs." },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing or invalid file" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid type. Allowed: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File too large. Max ${MAX_SIZE_MB} MB` },
        { status: 400 }
      );
    }

    const prefix = (request.nextUrl.searchParams.get("prefix") || "uploads").replace(/[^a-z0-9_-]/gi, "");
    const safeName = file.name.replace(/[^a-z0-9._-]/gi, "_").slice(0, 80) || "image";
    const pathname = `${prefix}/${Date.now()}-${safeName}`;

    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
