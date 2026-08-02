import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL wajib diisi" }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ToolWebBot/1.0)" },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Gagal mengambil halaman (status ${res.status})` }, { status: 500 });
    }

    const html = await res.text();
    return NextResponse.json({ html });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memproses URL" }, { status: 500 });
  }
}
