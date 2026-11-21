import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    let id: string | null = null;

    if (host === "youtu.be") {
      id = parsed.pathname.split("/")[1] || null;
    } else if (
      ["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)
    ) {
      id =
        parsed.searchParams.get("v") ||
        parsed.pathname.match(/^\/(?:shorts|embed)\/([a-zA-Z0-9_-]{11})/)?.[1] ||
        null;
    }

    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    const action = body?.action || "info";
    const id = extractYoutubeId(url);

    if (!id) {
      return NextResponse.json(
        { error: "Link YouTube tidak valid." },
        { status: 400 }
      );
    }

    if (action === "download") {
      return NextResponse.json(
        {
          error:
            "Download langsung dari YouTube tidak tersedia. Gunakan sumber video milik sendiri atau yang memiliki izin download."
        },
        { status: 403 }
      );
    }

    if (action !== "info") {
      return NextResponse.json(
        { error: "Permintaan tidak valid." },
        { status: 400 }
      );
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    let result: {
      id: string;
      title: string;
      channel: string;
      duration: number;
      thumbnail: string;
      views: number | null;
      videoFormats: never[];
    };

    if (apiKey) {
      const endpoint = new URL(
        "https://www.googleapis.com/youtube/v3/videos"
      );
      endpoint.searchParams.set("part", "snippet,contentDetails,statistics");
      endpoint.searchParams.set("id", id);
      endpoint.searchParams.set("key", apiKey);

      const response = await fetch(endpoint, {
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      });

      if (!response.ok) {
        throw new Error("YouTube Data API gagal: HTTP " + response.status);
      }

      const data = await response.json();
      const video = data.items?.[0];

      if (!video) {
        return NextResponse.json(
          { error: "Video tidak ditemukan atau tidak tersedia." },
          { status: 404 }
        );
      }

      const snippet = video.snippet || {};
      const thumbnails = snippet.thumbnails || {};
      const thumbnail =
        thumbnails.maxres?.url ||
        thumbnails.standard?.url ||
        thumbnails.high?.url ||
        thumbnails.medium?.url ||
        `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

      const durationText = video.contentDetails?.duration || "";
      const match = durationText.match(
        /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/
      );
      const duration = match
        ? Number(match[1] || 0) * 3600 +
          Number(match[2] || 0) * 60 +
          Number(match[3] || 0)
        : 0;

      result = {
        id,
        title: snippet.title || "YouTube video",
        channel: snippet.channelTitle || "-",
        duration,
        thumbnail,
        views: video.statistics?.viewCount
          ? Number(video.statistics.viewCount)
          : null,
        videoFormats: [],
      };
    } else {
      const endpoint = new URL("https://www.youtube.com/oembed");
      endpoint.searchParams.set(
        "url",
        `https://www.youtube.com/watch?v=${id}`
      );
      endpoint.searchParams.set("format", "json");

      const response = await fetch(endpoint, {
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      });

      if (!response.ok) {
        throw new Error("Metadata YouTube tidak tersedia.");
      }

      const data = await response.json();

      result = {
        id,
        title: data.title || "YouTube video",
        channel: data.author_name || "-",
        duration: 0,
        thumbnail:
          data.thumbnail_url ||
          `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        views: null,
        videoFormats: [],
      };
    }

    return NextResponse.json({
      success: true,
      ...result,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    console.error("[youtube-info]", message);

    return NextResponse.json(
      { error: "Gagal mengambil info YouTube: " + message },
      { status: 502 }
    );
  }
}
