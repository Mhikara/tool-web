import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) return new NextResponse(JSON.stringify({ error: "URL kosong" }), { status: 400 });

  const encodedUrl = encodeURIComponent(targetUrl);
  
  // Daftar 3 jalur yang akan dicoba berurutan
  const proxies = [
    { name: "direct", url: targetUrl },
    { name: "wsrv", url: `https://wsrv.nl/?url=${encodedUrl}` },
    { name: "allorigins", url: `https://api.allorigins.win/raw?url=${encodedUrl}` }
  ];

  for (const proxy of proxies) {
    try {
      // KUNCI PENTING: Batasi waktu maksimal 4 detik. 
      // Jika nyangkut lebih dari itu, langsung batalkan agar tidak error 502!
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const options = { method: "GET", signal: controller.signal };
      
      // Jika pakai jalur direct, samarkan dengan header FullManhwa
      if (proxy.name === "direct") {
        options.headers = {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Referer": "https://fullmanhwa.com/",
          "Origin": "https://fullmanhwa.com"
        };
      }

      const response = await fetch(proxy.url, options);
      clearTimeout(timeoutId);

      if (response.ok) {
        const contentType = response.headers.get("content-type") || "image/jpeg";
        const resHeaders = new Headers();
        resHeaders.set("Content-Type", contentType);
        resHeaders.set("Cache-Control", "public, s-maxage=86400");
        resHeaders.set("Access-Control-Allow-Origin", "*");
        
        return new NextResponse(response.body, { status: 200, headers: resHeaders });
      }
    } catch (e) {
      console.warn(`[PROXY] ${proxy.name} digantung/gagal, pindah jalur...`);
    }
  }

  // Jika semua API gagal, lemparkan browser langsung ke Public CDN
  return NextResponse.redirect(`https://wsrv.nl/?url=${encodedUrl}`, 302);
}
