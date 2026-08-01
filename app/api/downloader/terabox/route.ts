import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "Link Terabox wajib diisi" }, { status: 400 });
    }

    const res = await fetch(url, { redirect: "follow" });
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("text/html")) {
      return NextResponse.json(
        {
          error:
            "Link Terabox ini butuh sesi/cookie khusus untuk diekstrak (belum didukung penuh). Coba gunakan link direct-download dari Terabox jika ada.",
        },
        { status: 501 }
      );
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Content-Disposition": "attachment",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memproses link Terabox" }, { status: 500 });
  }
}
