import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_URL_LENGTH = 2048;
const MAX_REDIRECTS = 8;

const ALLOWED_HOSTS = new Set([
  "bit.ly",
  "tinyurl.com",
  "www.tinyurl.com",
  "is.gd",
  "v.gd",
  "rebrand.ly"
]);

function validateUrl(value: string): URL {
  const url = new URL(value);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Hanya URL HTTP dan HTTPS yang didukung.");
  }

  if (url.username || url.password) {
    throw new Error("URL dengan kredensial tidak diizinkan.");
  }

  if (url.port && !["80", "443"].includes(url.port)) {
    throw new Error("Port URL tidak diizinkan.");
  }

  return url;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get("url");

    if (!input) {
      return NextResponse.json(
        { success: false, error: "URL wajib diisi." },
        { status: 400 }
      );
    }

    if (input.length > MAX_URL_LENGTH) {
      return NextResponse.json(
        { success: false, error: "URL terlalu panjang." },
        { status: 400 }
      );
    }

    let currentUrl = validateUrl(input.trim());

    if (!ALLOWED_HOSTS.has(currentUrl.hostname.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: "Domain belum didukung oleh resolver."
        },
        { status: 400 }
      );
    }

    const visited = new Set<string>();
    let hops = 0;

    while (hops < MAX_REDIRECTS) {
      const current = currentUrl.toString();

      if (visited.has(current)) {
        throw new Error("Redirect berulang terdeteksi.");
      }

      visited.add(current);

      const response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; EonBypass/1.0)",
          "Accept": "text/html,application/xhtml+xml,*/*"
        }
      });

      const location = response.headers.get("location");

      if (![301, 302, 303, 307, 308].includes(response.status)) {
        await response.body?.cancel();

        return NextResponse.json(
          {
            success: false,
            error: "Redirect langsung tidak ditemukan. Layanan mungkin memerlukan proses tambahan."
          },
          { status: 422 }
        );
      }

      if (!location) {
        await response.body?.cancel();
        throw new Error("Alamat tujuan redirect tidak ditemukan.");
      }

      await response.body?.cancel();

      const nextUrl = validateUrl(
        new URL(location, currentUrl).toString()
      );

      hops += 1;

      if (!ALLOWED_HOSTS.has(nextUrl.hostname.toLowerCase())) {
        return NextResponse.json(
          {
            success: true,
            data: {
              originalUrl: input.trim(),
              destinationUrl: nextUrl.toString(),
              redirects: hops,
              resolved: true
            }
          },
          { headers: { "Cache-Control": "no-store" } }
        );
      }

      currentUrl = nextUrl;
    }

    throw new Error("Batas jumlah redirect tercapai.");
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Gagal menyelesaikan tautan."
      },
      {
        status: 400,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }
}
