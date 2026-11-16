import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_URL_LENGTH = 2048;

function isValidTarget(value: string) {
  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) return false;
    if (url.username || url.password) return false;

    const hostname = url.hostname.toLowerCase();

    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("169.254.") ||
      hostname.endsWith(".local")
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json(
      { success: false, error: "URL wajib diisi." },
      { status: 400 }
    );
  }

  if (
    targetUrl.length > MAX_URL_LENGTH ||
    !isValidTarget(targetUrl)
  ) {
    return NextResponse.json(
      { success: false, error: "Format URL tidak valid atau tidak diizinkan." },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: "Endpoint sedang dibatasi untuk pemeriksaan keamanan. Gunakan tautan tujuan yang dapat diakses secara langsung."
    },
    {
      status: 503,
      headers: { "Cache-Control": "no-store" }
    }
  );
}
