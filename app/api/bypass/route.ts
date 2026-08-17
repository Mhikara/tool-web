import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Masukkan link yang ingin di-bypass." }, { status: 400 });
  }

  // Daftar API Bypasser Terbaik (Multi-Provider Engine)
  const bypassProviders = [
    `https://api.bypass.vip/bypass?url=${encodeURIComponent(targetUrl)}`,
    `https://bypass.pm/bypass2?url=${encodeURIComponent(targetUrl)}`,
    `https://api.ethosservices.xyz/bypass?url=${encodeURIComponent(targetUrl)}`,
    `https://ethos-api.vercel.app/api/bypass?url=${encodeURIComponent(targetUrl)}`,
    `https://api.bypass.city/bypass?url=${encodeURIComponent(targetUrl)}`
  ];

  // Mencoba API satu per satu secara berurutan
  for (const apiUrl of bypassProviders) {
    try {
      const res = await fetch(apiUrl, {
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "application/json"
        },
        // Jangan biarkan Vercel hang, maksimal nunggu 7 detik per API
        signal: AbortSignal.timeout(7000) 
      });

      if (!res.ok) continue; // Jika API down/error, langsung loncat ke API berikutnya

      const data = await res.json();

      // Tiap API beda format respon, kita tangkap semua kemungkinan key-nya:
      const resultUrl = data.result || data.destination || data.bypassed_link || data.bypassed || data.url;

      // Validasi apakah hasilnya benar-benar link (bukan tulisan error)
      if (resultUrl && resultUrl.startsWith("http")) {
        return NextResponse.json({ success: true, result: resultUrl });
      }
    } catch (e) {
      // Jika terjadi timeout atau error network di API ini, abaikan dan lanjut coba API lain
      continue;
    }
  }

  // Jika SEMUA API di atas gagal memecahkan link (Skenario terburuk)
  return NextResponse.json({ 
    error: "Semua server Bypasser gagal menembus keamanan link ini (Lootlabs/Linkvertise sedang kuat). Coba lagi beberapa saat." 
  }, { status: 502 });
}
