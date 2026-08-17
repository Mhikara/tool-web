import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Masukkan link yang ingin di-bypass." }, { status: 400 });
  }

  const bypassProviders = [
    `https://api.bypass.city/bypass?url=${encodeURIComponent(targetUrl)}`,
    `https://api.bypass.vip/bypass?url=${encodeURIComponent(targetUrl)}`,
    `https://api.ethosservices.xyz/bypass?url=${encodeURIComponent(targetUrl)}`
  ];

  for (const apiUrl of bypassProviders) {
    try {
      // Header disamarkan layaknya browser Chrome asli agar tidak diblokir
      const res = await fetch(apiUrl, {
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://google.com/"
        },
        // Waktu tunggu ditambah jadi 15 detik (karena Lootlabs butuh waktu lama)
        signal: AbortSignal.timeout(15000) 
      });

      if (!res.ok) continue;

      const data = await res.json();
      const resultUrl = data.result || data.destination || data.bypassed_link || data.bypassed || data.url;

      if (resultUrl && resultUrl.startsWith("http")) {
        return NextResponse.json({ success: true, result: resultUrl, provider: apiUrl.split('/')[2] });
      }
    } catch (e) {
      continue;
    }
  }

  return NextResponse.json({ error: "Server Vercel gagal/diblokir." }, { status: 502 });
}
