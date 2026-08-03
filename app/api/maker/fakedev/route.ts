import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "Developer";
  const bio = searchParams.get("bio") || "Full Stack Developer";
  const image = searchParams.get("image");

  try {
    const params = new URLSearchParams({ name, bio });
    if (image) params.set("image", image);

    // Pakai API yang masih aktif
    const apiUrl = `https://api.azbry.com/api/maker/fakedev?${params.toString()}`;

    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ToolWeb/1.0)",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `API error: ${res.status}` },
        { status: 502 }
      );
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("[fakedev]", err);
    return NextResponse.json(
      { error: err.message || "Gagal generate FakeDev" },
      { status: 500 }
    );
  }
}
