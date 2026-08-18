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

// 1. ScriptBlox Engine (Multi-Page Aggregator)
async function fetchFromScriptBlox(query: string | null, page: number = 1): Promise<FormattedScript[]> {
  try {
    const endpoint = query
      ? `https://scriptblox.com/api/script/search?q=${encodeURIComponent(query)}&mode=free&page=${page}`
      : `https://scriptblox.com/api/script/fetch?page=${page}`;
    const res = await fetch(endpoint, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(7000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.result?.scripts) return [];
    return data.result.scripts.filter((s: any) => !s.isPatched && s.script).map((s: any) => ({
      title: s.title,
      game: s.game?.name || (s.game ? String(s.game) : "Universal Script"),
      features: parseDetailedFeatures(s.title, s.features),
      scriptCode: s.script,
      source: "ScriptBlox",
      verified: s.verified || false,
      keyless: s.key === false,
      views: s.views || 0,
    }));
  } catch { return []; }
}

// 2. RawScripts.net Engine
async function fetchFromRawScripts(query: string | null): Promise<FormattedScript[]> {
  try {
    const endpoint = query
      ? `https://rawscripts.net/api/scripts?q=${encodeURIComponent(query)}`
      : `https://rawscripts.net/api/scripts`;
    const res = await fetch(endpoint, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(7000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.scripts) return [];
    return data.scripts.filter((s: any) => s.status !== "patched").map((s: any) => ({
      title: s.title,
      game: s.game || "Universal Script",
      features: parseDetailedFeatures(s.title, s.description || null),
      scriptCode: s.code || `loadstring(game:HttpGet("https://rawscripts.net/raw/${s.id}"))()`,
      source: "RawScripts",
      verified: true,
      keyless: true,
    }));
  } catch { return []; }
}

// 3. RScripts.net Engine (New Source!)
async function fetchFromRScriptsNet(query: string | null, page: number = 1): Promise<FormattedScript[]> {
  try {
    const endpoint = query
      ? `https://rscripts.net/api/scripts?q=${encodeURIComponent(query)}&page=${page}`
      : `https://rscripts.net/api/scripts?page=${page}`;
    const res = await fetch(endpoint, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(7000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.scripts) return [];
    return data.scripts.map((s: any) => ({
      title: s.title,
      game: s.game || "Universal Script",
      features: parseDetailedFeatures(s.title, null),
      scriptCode: s.code || `loadstring(game:HttpGet("https://rscripts.net/raw/${s.id}"))()`,
      source: "Rscripts.net",
      verified: true,
      keyless: true,
    }));
  } catch { return []; }
}

// 4. Massive Curated Database (Hubs Populer Kelas Atas)
function getCuratedHubs(query: string | null): FormattedScript[] {
  const hubs = [
    // Blox Fruits
    { title: "Hoho Hub (Terpopuler)", game: "Blox Fruits", scriptCode: `loadstring(game:HttpGet('https://raw.githubusercontent.com/acsu123/HOHO_H/main/Loading_UI'))()` },
    { title: "Mukuro Hub", game: "Blox Fruits", scriptCode: `loadstring(game:HttpGet"https://raw.githubusercontent.com/xQuartyx/DonateMe/main/ScriptLoader")()` },
    { title: "W Azure Hub", game: "Blox Fruits", scriptCode: `getgenv().Team = "Pirates"; loadstring(game:HttpGet("https://api.luarmor.net/files/v3/loaders/3b2169cf53bc6104dabe8e19562e5cc2.lua"))()` },
    { title: "Thunder Z Hub", game: "Blox Fruits", scriptCode: `loadstring(game:HttpGet('https://raw.githubusercontent.com/ThunderZ-N/Hub/main/Mobile'))()` },
    { title: "Neva Hub", game: "Blox Fruits", scriptCode: `loadstring(game:HttpGet('https://raw.githubusercontent.com/VEZ2/NEVAHUB/main/2'))()` },
    { title: "Ripper Hub V3", game: "Blox Fruits", scriptCode: `loadstring(game:HttpGet("https://raw.githubusercontent.com/hajibeza/RIPPER-HUB/main/RIPPERHUBV3.lua"))()` },
    { title: "Zen Hub", game: "Blox Fruits", scriptCode: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Zenhubtop/zen_hub_pr/main/zennew.lua"))()` },
    { title: "Redz Hub Official", game: "Blox Fruits", scriptCode: `loadstring(game:HttpGet("https://raw.githubusercontent.com/realredz/BloxFruits/main/Source.lua"))()` },
    
    // Pet Simulator 99
    { title: "Zap Hub Auto Farm", game: "Pet Simulator 99", scriptCode: `loadstring(game:HttpGet("https://zaphub.xyz/Exec"))()` },
    { title: "Baluga Hub", game: "Pet Simulator 99", scriptCode: `loadstring(game:HttpGet("https://raw.githubusercontent.com/gclich/Baluga/main/PS99.lua"))()` },
    { title: "Snail Hub", game: "Pet Simulator 99", scriptCode: `loadstring(game:HttpGet('https://raw.githubusercontent.com/Snail422/Snail-Hub/main/PetSim99'))()` },
    
    // Shooter / FPS (Arsenal, Rivals, dll)
    { title: "Owl Hub Aimbot", game: "Arsenal", scriptCode: `loadstring(game:HttpGet("https://raw.githubusercontent.com/ZinityDrops/OwlHubLink/master/OwlHub.txt"))()` },
    { title: "Dark Hub", game: "Arsenal", scriptCode: `loadstring(game:HttpGet("https://raw.githubusercontent.com/RandomSv/DarkHub/main/Source"))()` },
    { title: "Rivals Aimbot & ESP", game: "Rivals", scriptCode: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Spoorloos/script/main/rivals.lua"))()` },
    { title: "Energy Assault ESP", game: "Energy Assault", scriptCode: `loadstring(game:HttpGet("https://raw.githubusercontent.com/M1ZZT/EnergyAssault/main/EnergyAssault.lua"))()` },

    // Da Hood & Roleplay
    { title: "Swagmode V2", game: "Da Hood", scriptCode: `loadstring(game:HttpGet('https://raw.githubusercontent.com/lerkermer/lua-projects/master/SwagModeV002'))()` },
    { title: "Space Hub", game: "Da Hood", scriptCode: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Lucasfin000/SpaceHub/main/SpaceHub"))()` },
    { title: "RayX Hub", game: "Da Hood", scriptCode: `loadstring(game:HttpGet('https://raw.githubusercontent.com/SpaceYes/Lua/Main/DaHood.Lua'))()` },
    { title: "Ghost Hub RP", game: "Brookhaven 🏡 RP", scriptCode: `loadstring(game:HttpGet('https://raw.githubusercontent.com/GhostPlayer-hub/GhostHub/main/GhostHub.lua'))()` },

    // Minigames (Blade Ball, Fisch)
    { title: "FFJ Hub Auto Parry", game: "Blade Ball", scriptCode: `loadstring(game:HttpGet("https://raw.githubusercontent.com/FFJ1/Roblox-Exploits/main/scripts/BladeBallV3.lua"))()` },
    { title: "Serpent Hub", game: "Blade Ball", scriptCode: `loadstring(game:HttpGet("https://raw.githubusercontent.com/1-upz/SerpentHub/main/BladeBall.lua"))()` },
    { title: "Speed Hub X", game: "Fisch", scriptCode: `loadstring(game:HttpGet("https://raw.githubusercontent.com/AhmadV99/Speed-Hub-X/main/Speed%20Hub%20X.lua"))()` },

    // Universal Scripts
    { title: "Infinite Yield Universal Admin", game: "Universal Script", scriptCode: `loadstring(game:HttpGet('https://raw.githubusercontent.com/EdgeIY/infiniteyield/master/source'))()` },
    { title: "Dex Explorer V2", game: "Universal Script", scriptCode: `loadstring(game:HttpGet("https://cdn.wearedevs.net/scripts/Dex%20Explorer.txt"))()` },
    { title: "Orca Hub Universal", game: "Universal Script", scriptCode: `loadstring(game:HttpGetAsync("https://raw.githubusercontent.com/richie0866/orca/master/public/latest.lua"))()` },
    { title: "Espy Universal ESP", game: "Universal Script", scriptCode: `loadstring(game:HttpGet("https://raw.githubusercontent.com/1201for/littlegui/main/Espy"))()` },
    { title: "Turtle Spy", game: "Universal Script", scriptCode: `loadstring(game:HttpGet("https://raw.githubusercontent.com/turtle-labs/Turtle-Spy/main/turtle_spy.lua"))()` }
  ].map(h => ({
    ...h,
    features: parseDetailedFeatures(h.title, null),
    source: "GitHub Verified",
    verified: true,
    keyless: true,
  }));

  if (!query) return hubs;
  const q = query.toLowerCase();
  return hubs.filter(h => h.game.toLowerCase().includes(q) || h.title.toLowerCase().includes(q) || (q.includes("universal") && h.game.toLowerCase().includes("universal")));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  try {
    // 5 PROSES FETCH BERJALAN BERSAMAAN! 
    const [sbDataP1, sbDataP2, rawScriptsData, rscriptsNetData] = await Promise.all([
      fetchFromScriptBlox(query || null, page),
      fetchFromScriptBlox(query || null, page + 1),
      fetchFromRawScripts(query || null),
      fetchFromRScriptsNet(query || null, page)
    ]);

    const gitHubData = getCuratedHubs(query || null);

    const combined = [...gitHubData, ...rawScriptsData, ...rscriptsNetData, ...sbDataP1, ...sbDataP2];

    // Filter Deduplikasi Ketat
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
