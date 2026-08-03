import { NextRequest, NextResponse } from "next/server";
import { isStorageReady, mirrorUrlToStorage } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    if (!isStorageReady()) {
      return NextResponse.json(
        { error: "Storage belum aktif. Cek Environment Variables di Vercel." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const url = body?.url;
    const filename = body?.filename || "file.bin";

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url wajib diisi" }, { status: 400 });
    }

    const result = await mirrorUrlToStorage(url, filename);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      url: result.url,
      path: result.path,
      message: "File tersimpan di external storage",
    });
  } catch (err: any) {
    console.error("[storage/mirror]", err);
    return NextResponse.json(
      { error: err?.message || "Gagal menyimpan ke storage" },
      { status: 500 }
    );
  }
}
