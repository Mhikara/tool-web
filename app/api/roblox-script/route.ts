import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || searchParams.get("search") || "";
  const page = searchParams.get("page") || "1";
  const mode = searchParams.get("mode") || ""; // free / paid
  const key = searchParams.get("key") || ""; // 0 or 1
  const universal = searchParams.get("universal") || ""; // 0 or 1

  try {
    let targetUrl = "";
    if (query.trim().length > 0) {
      targetUrl = `https://scriptblox.com/api/script/search?q=${encodeURIComponent(query.trim())}&page=${page}&max=20`;
    } else {
      targetUrl = `https://scriptblox.com/api/script/fetch?page=${page}&max=20`;
    }

    if (mode) targetUrl += `&mode=${mode}`;
    if (key !== "") targetUrl += `&key=${key}`;
    if (universal !== "") targetUrl += `&universal=${universal}`;

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Gagal mengambil data script Roblox (Status ${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const result = data.result || {};
    const rawScripts = result.scripts || result.data || [];

    const scripts = rawScripts.map((s: any) => {
      let imageUrl = s.game?.imageUrl || "";
      if (imageUrl && !imageUrl.startsWith("http")) {
        imageUrl = `https://scriptblox.com${imageUrl}`;
      }

      return {
        id: s._id || s.slug || String(Math.random()),
        title: s.title || "Roblox Script",
        gameName: s.game?.name || "Universal Roblox Game",
        gameImage: imageUrl,
        script: s.script || s.rawScript || `loadstring(game:HttpGet('https://raw.githubusercontent.com/ScriptBlox/scripts/main/${s.slug}'))()`,
        scriptType: s.scriptType || "free",
        verified: Boolean(s.verified),
        key: Boolean(s.key),
        isPatched: Boolean(s.isPatched),
        isUniversal: Boolean(s.isUniversal),
        views: s.views || 0,
        slug: s.slug || "",
        createdAt: s.createdAt || "",
      };
    });

    return NextResponse.json({
      success: true,
      totalPages: result.totalPages || 1,
      page: Number(page),
      scripts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Terjadi kesalahan koneksi server" },
      { status: 500 }
    );
  }
}
