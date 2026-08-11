import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return new NextResponse(
        JSON.stringify({ error: "Parameter 'url' gambar tidak ditemukan." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const headers = new Headers();
    headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    
    const targetDomain = new URL(targetUrl).origin;
    headers.set("Referer", targetDomain);
    headers.set("Accept", "image/webp,image/apng,image/*,*/*;q=0.8");

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`Server target mengembalikan status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const resHeaders = new Headers();
    
    resHeaders.set("Content-Type", contentType);
    resHeaders.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=43200");
    resHeaders.set("Access-Control-Allow-Origin", "*");

    return new NextResponse(response.body, {
      status: 200,
      headers: resHeaders,
    });

  } catch (error) {
    console.error("[PROXY_ERROR]", error.message);
    return new NextResponse(
      JSON.stringify({ error: "Gagal memproses gambar target.", detail: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
