import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 45;

async function tryPublicApis(url: string) {
  // Beberapa endpoint publik yang sering dipakai (gratis, no key)
  const apis = [
    `https://terabox-dl.qtcloud.workers.dev/api?url=${encodeURIComponent(url)}`,
    `https://api.terabox.ps/api?url=${encodeURIComponent(url)}`,
  ];

  for (const api of apis) {
    try {
      const res = await fetch(api, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) continue;
      const data = await res.json();

      // Normalisasi response
      const direct =
        data?.downloadLink ||
        data?.download_link ||
        data?.direct_link ||
        data?.data?.downloadLink ||
        data?.data?.download_link ||
        data?.list?.[0]?.downloadLink ||
        null;

      const name =
        data?.file_name ||
        data?.filename ||
        data?.data?.file_name ||
        data?.list?.[0]?.file_name ||
        "terabox-file";

      const size =
        data?.size || data?.data?.size || data?.list?.[0]?.size || null;

      const thumb =
        data?.thumbnail || data?.data?.thumbnail || data?.list?.[0]?.thumbs?.url3 || null;

      if (direct) {
        return { direct, name, size, thumb };
      }
    } catch {
      // coba API berikutnya
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Link Terabox wajib diisi" }, { status: 400 });
    }

    if (
      !url.includes("terabox") &&
      !url.includes("1024tera") &&
      !url.includes("nephobox") &&
      !url.includes("4funbox")
    ) {
      return NextResponse.json(
        { error: "Link harus dari Terabox / 1024tera" },
        { status: 400 }
      );
    }

    // Coba API publik
    const parsed = await tryPublicApis(url.trim());

    if (parsed?.direct) {
      // Stream file lewat proxy
      const fileRes = await fetch(parsed.direct, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (fileRes.ok) {
        const buffer = await fileRes.arrayBuffer();
        const contentType =
          fileRes.headers.get("content-type") || "application/octet-stream";
        const safeName = String(parsed.name).replace(/[^\w.\-]+/g, "_").slice(0, 80);

        return new NextResponse(buffer, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${safeName}"`,
          },
        });
      }

      // Kalau stream gagal, kembalikan info link saja
      return NextResponse.json({
        name: parsed.name,
        size: parsed.size,
        thumbnail: parsed.thumb,
        downloadUrl: parsed.direct,
        note: "Gunakan link langsung di bawah jika download otomatis gagal.",
      });
    }

    // Fallback: coba fetch langsung (hanya berhasil jika link sudah direct file)
    const directRes = await fetch(url, { redirect: "follow" });
    const ct = directRes.headers.get("content-type") || "";
    if (!ct.includes("text/html") && directRes.ok) {
      const buffer = await directRes.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": ct || "application/octet-stream",
          "Content-Disposition": "attachment; filename=\"terabox-file\"",
        },
      });
    }

    return NextResponse.json(
      {
        error:
          "Tidak bisa mengekstrak link Terabox ini. Coba link share yang lebih baru atau salin link langsung dari app.",
      },
      { status: 501 }
    );
  } catch (err: any) {
    console.error("[terabox]", err);
    return NextResponse.json(
      { error: err?.message || "Gagal memproses link Terabox" },
      { status: 500 }
    );
  }
}
