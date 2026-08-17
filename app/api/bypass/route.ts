import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Masukkan link yang ingin di-bypass." }, { status: 400 });
  }

  // Daftar API dari yang paling kuat (KeyBypass jadi prioritas pertama)
  const providers = [
    `https://api.keybypass.net/bypass?url=${encodeURIComponent(targetUrl)}&hwid=`,
    `https://api.bypass.vip/bypass?url=${encodeURIComponent(targetUrl)}`,
    `https://api.bypass.city/bypass?url=${encodeURIComponent(targetUrl)}`,
    `https://api.ethosservices.xyz/bypass?url=${encodeURIComponent(targetUrl)}`
  ];

  for (const apiUrl of providers) {
    try {
      const res = await fetch(apiUrl, {
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
          "Accept": "application/json"
        },
        signal: AbortSignal.timeout(12000) // Maksimal nunggu 12 detik per API
      });

      if (!res.ok) continue;

      const data = await res.json();
      
      // Menangkap format output dari berbagai API (Keybypass pakai 'destination')
      const resultUrl = data.destination || data.result || data.bypassed_link || data.url;

      if (resultUrl && resultUrl.startsWith("http")) {
        return NextResponse.json({ success: true, result: resultUrl });
      }
    } catch (e) {
      continue; // Lanjut ke API berikutnya jika gagal/timeout
    }
  }

  return NextResponse.json({ error: "Semua server bypass gagal atau sedang down. Coba lagi nanti." }, { status: 502 });
}
