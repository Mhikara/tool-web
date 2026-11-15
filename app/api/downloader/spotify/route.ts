import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getSpotifyToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("SPOTIFY_NOT_CONFIGURED");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("SPOTIFY_AUTH_FAILED");
  }

  const data = await response.json();

  if (typeof data.access_token !== "string") {
    throw new Error("SPOTIFY_INVALID_TOKEN");
  }

  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const query =
      typeof body?.query === "string" ? body.query.trim() : "";

    if (!query) {
      return NextResponse.json(
        { error: "Masukkan judul lagu atau nama artis." },
        { status: 400 }
      );
    }

    if (query.length > 150) {
      return NextResponse.json(
        { error: "Kata kunci maksimal 150 karakter." },
        { status: 400 }
      );
    }

    const token = await getSpotifyToken();

    const searchUrl = new URL("https://api.spotify.com/v1/search");
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("type", "track");
    searchUrl.searchParams.set("limit", "10");

    const response = await fetch(searchUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        response.status === 429
          ? "SPOTIFY_RATE_LIMIT"
          : "SPOTIFY_SEARCH_FAILED"
      );
    }

    const data = await response.json();

    const tracks = (data.tracks?.items || []).map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: (track.artists || [])
        .map((artist: any) => artist.name)
        .join(", "),
      album: track.album?.name || "",
      cover:
        track.album?.images?.[1]?.url ||
        track.album?.images?.[0]?.url ||
        null,
      duration: track.duration_ms || 0,
      previewUrl: track.preview_url || null,
      spotifyUrl: track.external_urls?.spotify || null,
    }));

    return NextResponse.json({
      success: true,
      total: tracks.length,
      tracks,
    });
  } catch (error: any) {
    console.error("[spotify]", error?.message || "Unknown error");

    const message = error?.message;

    if (message === "SPOTIFY_NOT_CONFIGURED") {
      return NextResponse.json(
        {
          unavailable: true,
          error: "SPOTIFY_CLIENT_ID dan SPOTIFY_CLIENT_SECRET belum dikonfigurasi.",
        },
        { status: 503 }
      );
    }

    if (message === "SPOTIFY_RATE_LIMIT") {
      return NextResponse.json(
        { error: "Spotify sedang membatasi permintaan. Coba lagi sebentar." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Gagal mencari lagu di Spotify. Periksa konfigurasi API dan coba lagi." },
      { status: 502 }
    );
  }
}
