import { NextResponse } from "next/server";

// Fungsi Pintar untuk merapikan fitur menjadi list array
function getSmartFeatures(title: string, originalFeat: string | null) {
  const t = title.toLowerCase();
  const feats: string[] = [];
  
  // Tebak fitur dari judul
  if (t.includes("auto") || t.includes("farm") || t.includes("spawn") || t.includes("collect") || t.includes("upgrade")) {
    feats.push("🤖 Auto Farm — Farming/kumpulkan item otomatis");
  }
  if (t.includes("esp") || t.includes("wallhack") || t.includes("chams")) {
    feats.push("👁️ ESP — Melihat musuh/item tembus pandang");
  }
  if (t.includes("aimbot") || t.includes("aim")) {
    feats.push("🎯 Aimbot — Otomatis mengunci target");
  }
  if (t.includes("admin")) {
    feats.push("👑 Admin Commands — Akses perintah admin");
  }
  if (t.includes("heal") || t.includes("god")) {
    feats.push("💖 God Mode — Auto heal atau kebal damage");
  }
  if (t.includes("speed") || t.includes("walkspeed")) {
    feats.push("⚡ Speed Hack — Jalan/lari sangat cepat");
  }
  if (t.includes("teleport") || t.includes("tween")) {
    feats.push("🚀 Teleport — Pindah tempat instan");
  }
  if (t.includes("hub") || t.includes("gui") || t.includes("panel") || t.includes("menu")) {
    feats.push("🎛️ GUI Menu — Panel dengan multi-fitur lengkap");
  }

  // Ekstrak deskripsi asli dari kreator jika ada
  if (originalFeat && originalFeat.trim().length > 3 && originalFeat !== "Tidak ada deskripsi") {
    // Bersihkan HTML tags jika ada, dan batasi
    const cleanFeat = originalFeat.replace(/<[^>]*>?/gm, '');
    const items = cleanFeat.split(/[,|]/).slice(0, 3); // Ambil maks 3 fitur asli
    items.forEach(item => {
      if (item.trim().length > 2 && !t.includes(item.trim().toLowerCase())) {
         feats.push(`✨ ${item.trim()}`);
      }
    });
  }

  // Jika tetap kosong
  if (feats.length === 0) {
    feats.push(`✨ Mendukung fungsi spesifik untuk game ini`);
  }

  // Tambahkan jaminan No Key di akhir (seperti di gambar)
  feats.push("🔓 Keyless / No Key");

  return feats;
}

async function fetchScriptBlox(query: string | null) {
  try {
    const url = query 
      ? `https://scriptblox.com/api/script/search?q=${encodeURIComponent(query)}&mode=free&page=1`
      : `https://scriptblox.com/api/script/fetch?page=1`; 

    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 0 } });
    const data = await res.json();
    if (!data.result || !data.result.scripts) return [];
    
    return data.result.scripts
      .filter((sc: any) => sc.key === false && !sc.isPatched)
      .map((sc: any) => ({
        title: sc.title,
        game: sc.game.name || "Universal Script",
        features: getSmartFeatures(sc.title, sc.features), // Sekarang berbentuk Array List
        scriptCode: sc.script,
        source: query ? "ScriptBlox" : "Live Update"
      }));
  } catch {
    return [];
  }
}

async function fetchRscripts(query: string | null) {
  try {
    const url = query
      ? `https://rscripts.net/api/scripts?q=${encodeURIComponent(query)}`
      : `https://rscripts.net/api/scripts`;

    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 0 } });
    const data = await res.json();
    if (!data || !data.scripts) return [];

    return data.scripts
      .filter((sc: any) => sc.status === "working")
      .map((sc: any) => ({
        title: sc.title,
        game: sc.game || "Universal Script",
        features: getSmartFeatures(sc.title, null),
        scriptCode: sc.code || `loadstring(game:HttpGet("https://rscripts.net/raw/${sc.id}"))()`,
        source: query ? "Rscripts" : "Live Update"
      }));
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  try {
    const [scriptbloxResults, rscriptsResults] = await Promise.all([
      fetchScriptBlox(query),
      fetchRscripts(query)
    ]);

    let combinedResults = [...scriptbloxResults, ...rscriptsResults];

    if (!query) {
      combinedResults = combinedResults
        .sort(() => Math.random() - 0.5)
        .slice(0, 12);
    }

    return NextResponse.json({
      query: query || "live-upload",
      total: combinedResults.length,
      results: combinedResults
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 502 });
  }
}
