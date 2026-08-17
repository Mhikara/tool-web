import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Masukkan link yang ingin di-bypass." }, { status: 400 });
  }

  try {
    // Menggunakan EthosBypass API (Sangat cepat & Tanpa Captcha)
    const res = await fetch(`https://api.ethosservices.xyz/bypass?url=${encodeURIComponent(targetUrl)}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      // Set timeout jika API ngelag
      signal: AbortSignal.timeout(15000)
    });
    
    const data = await res.json();

    if (data.status === "success" || data.result) {
      return NextResponse.json({ 
        success: true, 
        result: data.result || data.bypassed_link || "Bypass berhasil." 
      });
    } else {
      return NextResponse.json({ error: "Gagal mem-bypass link ini. Mungkin tidak didukung." }, { status: 400 });
    }

  } catch (error: any) {
    // Fallback ke API cadangan jika Ethos mati
    try {
      const fallbackRes = await fetch(`https://bypass.pm/bypass2?url=${encodeURIComponent(targetUrl)}`);
      const fallbackData = await fallbackRes.json();
      
      if (fallbackData.success) {
        return NextResponse.json({ success: true, result: fallbackData.destination });
      }
      throw new Error();
    } catch {
      return NextResponse.json({ error: "Server Bypasser sedang sibuk atau link tidak valid." }, { status: 502 });
    }
  }
}
