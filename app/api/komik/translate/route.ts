import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// cache sederhana di memory instance
const cache = new Map<string, string>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = String(body?.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "text wajib" }, { status: 400 });
    }
    if (text.length > 4500) {
      return NextResponse.json(
        { error: "Teks terlalu panjang (max \~4500)" },
        { status: 400 }
      );
    }

    const key = text.slice(0, 200);
    if (cache.has(key)) {
      return NextResponse.json({ translated: cache.get(key), cached: true });
    }

    // potong per chunk \~400 kata agar stabil
    const chunks: string[] = [];
    let rest = text;
    while (rest.length > 0) {
      if (rest.length <= 400) {
        chunks.push(rest);
        break;
      }
      let cut = rest.lastIndexOf(" ", 400);
      if (cut < 100) cut = 400;
      chunks.push(rest.slice(0, cut));
      rest = rest.slice(cut).trim();
    }

    const out: string[] = [];
    for (const c of chunks) {
      const url =
        "https://api.mymemory.translated.net/get?q=" +
        encodeURIComponent(c) +
        "&langpair=en|id";
      const res = await fetch(url, {
        headers: { "User-Agent": "BacaKomik/1.0" },
        next: { revalidate: 86400 },
      });
      const j = await res.json();
      const t =
        j?.responseData?.translatedText ||
        j?.matches?.[0]?.translation ||
        c;
      out.push(t);
    }

    const translated = out.join(" ").trim();
    cache.set(key, translated);
    return NextResponse.json({ translated, lang: "id" });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Gagal translate" },
      { status: 500 }
    );
  }
}
