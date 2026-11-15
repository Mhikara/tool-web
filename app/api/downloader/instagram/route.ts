import { NextResponse } from "next/server";

const ENGINE_URL = (
  process.env.INSTAGRAM_ENGINE_URL || "http://127.0.0.1:8765"
).replace(/\/+$/, "");

function cleanInstagramUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== "string" || rawUrl.length > 2048) {
    throw new Error("Link Instagram tidak valid.");
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error("Format link Instagram tidak valid.");
  }

  if (
    !["instagram.com", "www.instagram.com", "instagr.am", "www.instagr.am"]
      .includes(parsed.hostname.toLowerCase()) ||
    !["http:", "https:"].includes(parsed.protocol)
  ) {
    throw new Error("Domain Instagram tidak valid.");
  }

  const match = parsed.pathname.match(
    /^\/(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i
  );
  if (!match) throw new Error("Link Reel, Post, atau IGTV tidak dikenali.");

  const type = match[1].toLowerCase() === "reels"
    ? "reel"
    : match[1].toLowerCase();

  return `https://www.instagram.com/${type}/${match[2]}/`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function engineInfo(url: string) {
  const response = await fetch(
    `${ENGINE_URL}/api/instagram/info?url=${encodeURIComponent(url)}`,
    { cache: "no-store", signal: AbortSignal.timeout(90000) }
  );

  if (!response.ok) throw new Error("Engine gagal mengambil informasi media.");

  const data: unknown = await response.json();
  if (!isRecord(data) || data.success !== true || !Array.isArray(data.formats)) {
    throw new Error("Respons engine tidak valid.");
  }

  return data;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");

  if (file !== null) {
    if (!/^instagram-[a-f0-9]{32}\.mp4$/.test(file)) {
      return NextResponse.json({ error: "Nama file tidak valid." }, { status: 400 });
    }

    try {
      const upstream = await fetch(
        `${ENGINE_URL}/api/instagram/file/${encodeURIComponent(file)}`,
        { cache: "no-store", signal: AbortSignal.timeout(120000) }
      );

      if (!upstream.ok || !upstream.body) {
        return NextResponse.json({ error: "File tidak ditemukan." }, { status: upstream.status || 404 });
      }

      return new Response(upstream.body, {
        status: 200,
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": `attachment; filename="${file}"`,
          "Cache-Control": "no-store",
        },
      });
    } catch {
      return NextResponse.json(
        { error: "Engine download tidak dapat dijangkau." },
        { status: 502 }
      );
    }
  }

  const rawUrl = searchParams.get("url");
  let cleanUrl: string;

  try {
    cleanUrl = cleanInstagramUrl(rawUrl);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Link tidak valid." },
      { status: 400 }
    );
  }

  try {
    const data = await engineInfo(cleanUrl);
    const formats = (data.formats as unknown[]).filter(
      (item): item is Record<string, unknown> =>
        isRecord(item) &&
        typeof item.format_id === "string" &&
        typeof item.url === "string" &&
        typeof item.height === "number"
    );

    if (!formats.length) {
      return NextResponse.json({ error: "Video tidak ditemukan." }, { status: 404 });
    }

    const media = formats.map((item) => ({
      type: "video" as const,
      hdUrl: item.url as string,
      sdUrl: item.url as string,
      thumbnail: typeof data.thumbnail === "string" ? data.thumbnail : undefined,
      formatId: item.format_id as string,
      width: item.width,
      height: item.height,
    }));

    return NextResponse.json({
      success: true,
      title: typeof data.title === "string" ? data.title : "Instagram Video",
      media,
      cleanUrl,
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal mengambil media. Pastikan postingan publik dan engine aktif." },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
    }

    const cleanUrl = cleanInstagramUrl(body.url);
    let formatId = body.format_id;

    if (formatId !== undefined && (
      typeof formatId !== "string" ||
      !/^[A-Za-z0-9_-]{1,80}$/.test(formatId)
    )) {
      return NextResponse.json({ error: "Format video tidak valid." }, { status: 400 });
    }

    if (formatId === undefined) {
      const info = await engineInfo(cleanUrl);
      const formats = (info.formats as unknown[]).filter(
        (item): item is Record<string, unknown> =>
          isRecord(item) &&
          typeof item.format_id === "string" &&
          typeof item.height === "number"
      );

      formats.sort(
        (a, b) => Number(b.height) - Number(a.height)
      );
      formatId = formats[0]?.format_id;

      if (typeof formatId !== "string") {
        return NextResponse.json({ error: "Format video tidak ditemukan." }, { status: 404 });
      }
    }

    const upstream = await fetch(`${ENGINE_URL}/api/instagram/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: cleanUrl, format_id: formatId }),
      cache: "no-store",
      signal: AbortSignal.timeout(180000),
    });

    const result: unknown = await upstream.json();
    if (
      !upstream.ok ||
      !isRecord(result) ||
      result.success !== true ||
      typeof result.file !== "string" ||
      !/^instagram-[a-f0-9]{32}\.mp4$/.test(result.file)
    ) {
      return NextResponse.json(
        { error: isRecord(result) && typeof result.error === "string"
          ? result.error
          : "Download Instagram gagal." },
        { status: upstream.status || 502 }
      );
    }

    const downloadUrl = `/api/downloader/instagram?file=${encodeURIComponent(result.file)}`;

    return NextResponse.json({
      success: true,
      downloadVideo: downloadUrl,
      file: result.file,
      size: result.size,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal memproses download." },
      { status: 502 }
    );
  }
}
