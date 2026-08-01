import { NextRequest, NextResponse } from "next/server";

async function getSpotifyToken() {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token as string;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      return NextResponse.json(
        { unavailable: true, error: "Fitur pencarian Spotify belum aktif." },
        { status: 503 }
      );
    }

    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: "Kata kunci pencarian wajib diisi" }, { status: 400 });
    }

    const token = await getSpotifyToken();
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=6`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();

    const tracks = (data.tracks?.items || []).map((t: any) => ({
      name: t.name,
      artist: t.artists.map((a: any) => a.name).join(", "),
      cover: t.album.images?.[2]?.url || t.album.images?.[0]?.url,
      previewUrl: t.preview_url,
      spotifyUrl: t.external_urls.spotify,
    }));

    return NextResponse.json({ tracks });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal mencari lagu di Spotify" }, { status: 500 });
  }
}
