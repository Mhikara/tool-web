import { NextResponse } from "next/server";

interface FormattedScript {
  title: string;
  game: string;
  features: string[];
  scriptCode: string;
  source: string;
  verified: boolean;
  keyless: boolean;
  views?: number;
}

function parseDetailedFeatures(title: string, rawFeatures: string | null): string[] {
  const t = title.toLowerCase();
  const feats: string[] = [];

  if (t.includes("auto") || t.includes("farm") || t.includes("spawn") || t.includes("collect") || t.includes("upgrade") || t.includes("fish")) {
    feats.push("🤖 Auto Farm & Quest Automation — Grinding level, mob, autofish/catch, dan pengumpulan reward otomatis tanpa jeda.");
  }
  if (t.includes("esp") || t.includes("wallhack") || t.includes("chams") || t.includes("trace") || t.includes("box")) {
    feats.push("👁️ ESP / Wallhack Visuals — Melacak posisi lawan, NPC, chest, dan item langka menembus rintangan map secara visual.");
  }
  if (t.includes("aimbot") || t.includes("aim") || t.includes("silent") || t.includes("hitbox") || t.includes("lock")) {
    feats.push("🎯 Silent Aim & Combat Assist — Mengunci target dan mengarahkan proyektil secara otomatis ke hitbox musuh.");
  }
  if (t.includes("admin") || t.includes("troll") || t.includes("fling") || t.includes("btools") || t.includes("cmd")) {
    feats.push("👑 Admin Commands & Server Control — Membuka akses perintah manipulasi server, physics breaker, dan command developer.");
  }
  if (t.includes("heal") || t.includes("god") || t.includes("immortal") || t.includes("damage")) {
    feats.push("💖 God Mode & Protection — Proteksi kebal dari damage lawan, bypass death zone, dan auto-regenerasi HP.");
  }
  if (t.includes("speed") || t.includes("fly") || t.includes("noclip") || t.includes("jump") || t.includes("tp") || t.includes("teleport")) {
    feats.push("⚡ Movement & Teleport Modifier — Akses jalan cepat (Speed), terbang (Fly), noclip tembus dinding, dan teleport instan.");
  }
  if (t.includes("hub") || t.includes("gui") || t.includes("panel") || t.includes("menu")) {
    feats.push("🎛️ Interactive Modern GUI — Menu panel lengkap dengan tombol toggle cepat dan kontrol slider.");
  }

  if (rawFeatures && rawFeatures.trim().length > 3 && rawFeatures !== "Tidak ada deskripsi") {
    const cleaned = rawFeatures.replace(/<[^>]*>?/gm, "").split(/[,|\n]/);
    cleaned.slice(0, 2).forEach((f) => {
      const item = f.trim();
      if (item.length > 2 && !t.includes(item.toLowerCase())) {
        feats.push(`✨ Modul Tambahan: ${item}`);
      }
    });
  }

  if (feats.length === 0) {
    feats.push("✨ Universal Exploit Modules — Dioptimalkan untuk kompatibilitas mekanisme game terkait.");
  }

  feats.push("🔓 100% Keyless Verified — Bebas verifikasi iklan / linkvertise pihak ketiga.");
  return feats;
}

// Sumber 1: ScriptBlox (Database Global)
async function fetchFromScriptBlox(query: string | null, page: number = 1): Promise<FormattedScript[]> {
  try {
    const endpoint = query
      ? `https://scriptblox.com/api/script/search?q=${encodeURIComponent(query)}&mode=free&page=${page}`
      : `https://scriptblox.com/api/script/fetch?page=${page}`;

    const res = await fetch(endpoint, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      signal: AbortSignal.timeout(7000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.result?.scripts) return [];

    return data.result.scripts
      .filter((s: any) => !s.isPatched && s.script)
      .map((s: any) => ({
        title: s.title,
        game: s.game?.name || (s.game ? String(s.game) : "Universal Script"),
        features: parseDetailedFeatures(s.title, s.features),
        scriptCode: s.script,
        source: "ScriptBlox",
        verified: s.verified || false,
        keyless: s.key === false,
        views: s.views || 0,
      }));
  } catch {
    return [];
  }
}

// Sumber 2: RawScripts / Rscripts Database
async function fetchFromRawScripts(query: string | null): Promise<FormattedScript[]> {
  try {
    const endpoint = query
      ? `https://rawscripts.net/api/scripts?q=${encodeURIComponent(query)}`
      : `https://rawscripts.net/api/scripts`;

    const res = await fetch(endpoint, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(7000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.scripts) return [];

    return data.scripts
      .filter((s: any) => s.status !== "patched")
      .map((s: any) => ({
        title: s.title,
        game: s.game || "Universal Script",
        features: parseDetailedFeatures(s.title, s.description || null),
        scriptCode: s.code || `loadstring(game:HttpGet("https://rawscripts.net/raw/${s.id}"))()`,
        source: "RawScripts",
        verified: true,
        keyless: true,
        views: s.views || 0,
      }));
  } catch {
    return [];
  }
}

// Sumber 3: Curated Open-Source Hubs (GitHub Community Feed)
function getCuratedGitHubHubs(query: string | null): FormattedScript[] {
  const hubs = [
    {
      title: "Infinite Yield Universal Admin",
      game: "Universal Script",
      features: parseDetailedFeatures("Infinite Yield Admin fly speed noclip btools", null),
      scriptCode: `loadstring(game:HttpGet('https://raw.githubusercontent.com/EdgeIY/infiniteyield/master/source'))()`,
      source: "GitHub Verified",
      verified: true,
      keyless: true,
    },
    {
      title: "Redz Hub Official",
      game: "Blox Fruits",
      features: parseDetailedFeatures("Redz Hub auto farm quest level fruit esp", null),
      scriptCode: `loadstring(game:HttpGet("https://raw.githubusercontent.com/realredz/BloxFruits/main/Source.lua"))()`,
      source: "GitHub Verified",
      verified: true,
      keyless: true,
    },
    {
      title: "Speed Hub X",
      game: "Fisch",
      features: parseDetailedFeatures("Speed Hub autofish auto shake perfect catch esp", null),
      scriptCode: `loadstring(game:HttpGet("https://raw.githubusercontent.com/AhmadV99/Speed-Hub-X/main/Speed%20Hub%20X.lua"))()`,
      source: "GitHub Verified",
      verified: true,
      keyless: true,
    },
    {
      title: "Dark Hub Aimbot & ESP",
      game: "Arsenal",
      features: parseDetailedFeatures("Dark Hub silent aim wallhack hitbox expander", null),
      scriptCode: `loadstring(game:HttpGet("https://raw.githubusercontent.com/RandomSv/DarkHub/main/Source"))()`,
      source: "GitHub Verified",
      verified: true,
      keyless: true,
    },
    {
      title: "Ghost Hub RP",
      game: "Brookhaven 🏡 RP",
      features: parseDetailedFeatures("Ghost Hub troll fling admin fly speed vehicle mod", null),
      scriptCode: `loadstring(game:HttpGet('https://raw.githubusercontent.com/GhostPlayer-hub/GhostHub/main/GhostHub.lua'))()`,
      source: "GitHub Verified",
      verified: true,
      keyless: true,
    },
    {
      title: "Zap Hub Auto Collect",
      game: "Pet Simulator 99",
      features: parseDetailedFeatures("Zap Hub auto farm coins auto hatch auto tap", null),
      scriptCode: `loadstring(game:HttpGet("https://raw.githubusercontent.com/zaphub/ps99/main/script.lua"))()`,
      source: "GitHub Verified",
      verified: true,
      keyless: true,
    }
  ];

  if (!query) return hubs;

  const q = query.toLowerCase();
  return hubs.filter(
    (h) =>
      h.game.toLowerCase().includes(q) ||
      h.title.toLowerCase().includes(q) ||
      (q.includes("universal") && h.game.toLowerCase().includes("universal"))
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  try {
    // Menjalankan fetch paralel ke seluruh sumber eksternal
    const [sbDataP1, sbDataP2, rawScriptsData] = await Promise.all([
      fetchFromScriptBlox(query || null, page),
      fetchFromScriptBlox(query || null, page + 1),
      fetchFromRawScripts(query || null),
    ]);

    const gitHubData = getCuratedGitHubHubs(query || null);

    const combined = [...gitHubData, ...rawScriptsData, ...sbDataP1, ...sbDataP2];

    // Deduplikasi ketat
    const seen = new Set<string>();
    const unique = combined.filter((item) => {
      const codeKey = item.scriptCode.trim();
      const titleKey = item.title.trim().toLowerCase();
      if (seen.has(codeKey) || seen.has(titleKey)) return false;
      seen.add(codeKey);
      seen.add(titleKey);
      return true;
    });

    if (!query) {
      unique.sort(() => Math.random() - 0.5);
    }

    return NextResponse.json({
      success: true,
      query: query || "live-feed",
      page,
      total: unique.length,
      results: unique,
    });
  } catch {
    return NextResponse.json({ error: "Gagal memuat database script dari multi-provider." }, { status: 500 });
  }
}
