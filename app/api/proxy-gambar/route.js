import { NextResponse } from "next/server";

// ==========================================
// API ROUTE: PROXY IMAGE BYPASS
// Fungsi: Mengelabui server komik agar seolah-olah diakses oleh browser manusia
// ==========================================

export async function GET(request) {
  try {
    // 1. Ambil URL target dari parameter ?url=
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return new NextResponse(
        JSON.stringify({ error: "Parameter 'url' gambar tidak ditemukan." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Siapkan Header Palsu untuk Bypass Hotlinking (Wajib)
    const headers = new Headers();
    // Gunakan User-Agent Chrome Windows biasa agar tidak dicurigai sebagai bot scraper
    headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    
    // Referer diubah agar sesuai dengan domain asal tempat gambar berada (contoh: https://fullmanhwa.com)
    const targetDomain = new URL(targetUrl).origin;
    headers.set("Referer", targetDomain);
    headers.set("Accept", "image/webp,image/apng,image/*,*/*;q=0.8");

    // 3. Tembak server asal target (Fetch data)
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`Akses ditolak atau file tidak ada. HTTP Status: ${response.status}`);
    }

    // 4. Siapkan Header Balasan untuk Web Vercel/Client
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const resHeaders = new Headers();
    
    resHeaders.set("Content-Type", contentType);
    
    // Penting: Instruksikan Vercel CDN Cache menyimpan gambar ini selama 1 hari 
    // agar bandwidth dan proses server tidak jebol karena harus proxy berulang kali
    resHeaders.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=43200");
    
    // Izinkan akses jika dipanggil dari domain lain (CORS)
    resHeaders.set("Access-Control-Allow-Origin", "*");

    // 5. Kembalikan respons berupa data streaming gambar
    return new NextResponse(response.body, {
      status: 200,
      headers: resHeaders,
    });

  } catch (error) {
    console.error("[PROXY_ERROR]", error.message);
    
    // Jika gambar gagal dimuat (misal karena Cloudflare), kirim response error json
    return new NextResponse(
      JSON.stringify({ error: "Gagal memproses bypass gambar.", detail: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
