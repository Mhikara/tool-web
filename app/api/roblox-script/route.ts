import { NextResponse } from "next/server";

// Helper untuk mengekstrak dan menormalisasi fitur-fitur skrip
function extractFeatures(text: string, rawFeatures: any): string[] {
  const featureSet = new Set<string>();

  if (Array.isArray(rawFeatures)) {
    rawFeatures.forEach((f) => {
      if (typeof f === "string" && f.trim()) featureSet.add(f.trim());
    });
  } else if (typeof rawFeatures === "string" && rawFeatures.trim()) {
    rawFeatures.split(/,|\n|;/).forEach((f) => {
      if (f.trim()) featureSet.add(f.trim());
    });
  }

  const lower = (text || "").toLowerCase();
  const keywordMap = [
    { key: "auto farm", label: "Auto Farm" },
    { key: "farm", label: "Auto Farm" },
    { key: "esp", label: "ESP / Wallhack" },
    { key: "teleport", label: "Teleport" },
    { key: "tp", label: "Teleport" },
    { key: "kill aura", label: "Kill Aura" },
    { key: "god mode", label: "God Mode" },
    { key: "fly", label: "Fly Script" },
    { key: "bring mob", label: "Bring Mobs" },
    { key: "auto quest", label: "Auto Quest" },
    { key: "speed", label: "Speed Hack" },
    { key: "infinite yield", label: "Infinite Yield" },
    { key: "auto stats", label: "Auto Stats" },
    { key: "auto raid", label: "Auto Raid" },
    { key: "aimbot", label: "Aimbot" },
  ];

  keywordMap.forEach((kw) => {
    if (lower.includes(kw.key)) {
      featureSet.add(kw.label);
    }
  });

  const list = Array.from(featureSet);
  if (list.length === 0) {
    list.push("Main Script Features", "Auto Execute Ready");
  }

  return list.slice(0, 6); // Ambil maksimal 6 fitur teratas
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || searchParams.get("search") || "";
  const page = searchParams.get("page") || "1";
  const mode = searchParams.get("mode") || "";
  const key = searchParams.get("key") || ""; // 0 (No Key) / 1 (Has Key)
  const universal = searchParams.get("universal") || "";

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
      signal: AbortSignal.timeout(8500),
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

    const DEFAULT_ROBLOX_LOGO = "https://images.rbxcdn.com/7b3240e10408542b292e3422894d0c7d.png";

    const scripts = rawScripts.map((s: any) => {
      let imageUrl = s.game?.imageUrl || s.gameImage || "";
      if (imageUrl && !imageUrl.startsWith("http")) {
        imageUrl = `https://scriptblox.com${imageUrl}`;
      }
      if (!imageUrl) {
        imageUrl = DEFAULT_ROBLOX_LOGO;
      }

      const title = s.title || "Roblox Script";
      const gameName = s.game?.name || "Universal Roblox Game";
      const rawScriptCode = s.script || s.rawScript || `loadstring(game:HttpGet('https://raw.githubusercontent.com/ScriptBlox/scripts/main/${s.slug}'))()`;
      const description = s.description || s.details || "";

      // Ekstraksi fitur
      const features = extractFeatures(`${title} ${gameName} ${description} ${rawScriptCode}`, s.features);

      return {
        id: s._id || s.slug || String(Math.random()),
        title: title,
        gameName: gameName,
        gameImage: imageUrl,
        script: rawScriptCode,
        scriptType: s.scriptType || "free",
        verified: Boolean(s.verified),
        key: Boolean(s.key), // false = No Key (Free Key)
        isPatched: Boolean(s.isPatched),
        isUniversal: Boolean(s.isUniversal),
        views: s.views || 0,
        slug: s.slug || "",
        features: features,
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
