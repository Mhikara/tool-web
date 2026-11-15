import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

async function tryPublicApis(url: string) {
  const apis = [
    `https://terabox-dl.qtcloud.workers.dev/api?url=${encodeURIComponent(url)}`,
    `https://api.terabox.ps/api?url=${encodeURIComponent(url)}`,
  ];

  for (const api of apis) {
    try {
      const res = await fetch(api, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(12000),
        cache: "no-store",
      });

      if (!res.ok) continue;
      const data = await res.json();

      const item = data?.list?.[0] || data?.data || data;
      const direct =
        item?.downloadLink ||
        item?.download_link ||
        item?.direct_link ||
        data?.downloadLink ||
        data?.download_link ||
        data?.direct_link ||
        null;

      const name =
        item?.file_name ||
        item?.filename ||
        data?.file_name ||
        data?.filename ||
        "terabox-file";

      const size = item?.size || data?.size || null;
      const thumb =
        item?.thumbnail ||
        item?.thumbs?.url3 ||
        data?.thumbnail ||
        null;

      if (typeof direct === "string") {
        let parsed: URL;
        try {
          parsed = new URL(direct);
        } catch {
          continue;
        }
        if (parsed.protocol !== "https:") continue;
        return { direct: parsed.toString(), name, size, thumb };
      }
    } catch {
      // Coba endpoint berikutnya.
    }
  }

  return null;
}

function validShareUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 4096) return false;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return [
      "terabox.com",
      "1024tera.com",
      "1024terabox.com",
      "nephobox.com",
      "4funbox.com",
      "teraboxapp.com",
    ].some((domain) => host === domain || host.endsWith("." + domain));
  } catch {
    return false;
  }
}

function safeFilename(value: unknown) {
  const name = String(value || "terabox-file")
    .replace(/[^\w.\- ]+/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 100);
  return name || "terabox-file";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body?.url;
    const action = body?.action || "download";

    if (!validShareUrl(url)) {
      return NextResponse.json(
        { error: "Masukkan link HTTPS Terabox yang valid." },
        { status: 400 }
      );
    }

    if (action !== "info" && action !== "download") {
      return NextResponse.json({ error: "Aksi tidak valid." }, { status: 400 });
    }

    const parsed = await tryPublicApis(url.trim());

    if (!parsed) {
      return NextResponse.json(
        { error: "Gagal mengambil data Terabox. Coba link publik lain atau coba lagi nanti." },
        { status: 502 }
      );
    }

    if (action === "info") {
      return NextResponse.json({
        name: parsed.name,
        size: parsed.size,
        thumbnail: parsed.thumb,
        downloadReady: true,
      });
    }

    const fileRes = await fetch(parsed.direct, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(55000),
      redirect: "follow",
    });

    if (!fileRes.ok || !fileRes.body) {
      return NextResponse.json(
        {
          error: "Link file ditemukan, tetapi sumber gagal mengirim file. Coba lagi nanti.",
        },
        { status: 502 }
      );
    }

    const headers = new Headers({
      "Content-Type":
        fileRes.headers.get("content-type") || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeFilename(parsed.name)}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });

    const length = fileRes.headers.get("content-length");
    if (length) headers.set("Content-Length", length);

    return new NextResponse(fileRes.body, {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    console.error("[terabox]", err);
    return NextResponse.json(
      { error: "Gagal memproses link Terabox." },
      { status: 500 }
    );
  }
}
