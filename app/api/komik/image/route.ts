import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new NextResponse("Missing URL parameter", { status: 400 });
  }

  // Anti-Double Proxy: Ekstrak URL asli jika terbungkus berulang
  while (imageUrl.includes("/api/komik/image?url=")) {
    const split = imageUrl.split("/api/komik/image?url=");
    imageUrl = decodeURIComponent(split[split.length - 1]);
  }

  try {
    let referer = "https://mangadex.org/";
    if (imageUrl.includes("komiku.id") || imageUrl.includes("komiku.co.id")) {
      referer = "https://komiku.id/";
    } else if (imageUrl.includes("fullmanhwa")) {
      referer = "https://fullmanhwa.com/";
    }

    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": referer,
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return new NextResponse(`Failed to fetch image: ${res.status}`, { status: res.status });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse("Error fetching external image", { status: 500 });
  }
}
