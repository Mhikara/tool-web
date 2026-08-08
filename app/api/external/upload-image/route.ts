import { NextRequest, NextResponse } from "next/server";
import { isStorageReady, uploadToStorage } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 20;

const MAX_BYTES = 10 * 1024 * 1024; // 10MB untuk gambar

export async function POST(req: NextRequest) {
  try {
    if (!isStorageReady()) {
      return NextResponse.json(
        { error: "Fitur upload belum aktif — Supabase Storage belum dikonfigurasi." },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "File wajib diupload" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: "Gambar terlalu besar (maks 10MB)" },
        { status: 413 }
      );
    }

    const result = await uploadToStorage(
      buffer,
      file.name || "image.jpg",
      file.type || "image/jpeg"
    );

    if ("error" in result) {
      return NextResponse.json({ error: "Gagal upload: " + result.error }, { status: 500 });
    }

    return NextResponse.json({ url: result.url, path: result.path });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memproses upload" }, { status: 500 });
  }
}
