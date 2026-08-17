import { NextResponse } from "next/server";

// Fungsi Pintar untuk menebak fitur berdasarkan judul jika deskripsi kosong
function getSmartFeatures(title: string, originalFeat: string | null) {
  // Jika deskripsi asli ada dan cukup panjang, gunakan yang asli
  if (originalFeat && originalFeat.trim().length > 3 && originalFeat !== "Tidak ada deskripsi") {
    return originalFeat;
  }
  
  // Jika kosong, tebak dari kata kunci pada judul
  const t = title.toLowerCase();
  const feats = [];
  
  if (t.includes("auto") || t.includes("farm")) feats.push("✅ Auto Farm / Quest");
  if (t.includes("esp") || t.includes("wallhack") || t.includes("chams")) feats.push("👁️ ESP (Tembus Pandang)");
  if (t.includes("aimbot") || t.includes("aim")) feats.push("🎯 Aimbot (Auto Target)");
  if (t.includes("hub") || t.includes("gui") || t.includes("menu") || t.includes("panel") || t.includes("creator")) feats.push("🎛️ Menu Multi-Fitur Lengkap (GUI)");
  if (t.includes("admin")) feats.push("👑 Admin Commands");
  if (t.includes("heal") || t.includes("god")) feats.push("💖 God Mode / Auto Heal");
  if (t.includes("speed") || t.includes("walkspeed")) feats.push("⚡ Speed Hack");
  if (t.includes("teleport") || t.includes("tween")) feats.push("🚀 Teleportasi");
  
  // Jika berhasil menebak
  if (feats.length > 0) {
    return feats.join(" | ") + " & lainnya.";
  }
  
  // Jika tidak ada kata kunci yang cocok, jadikan judul sebagai penjelasan fungsinya
  return `Fungsi khusus: ${title}`; 
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
        game: sc.game.name || "Universal Script (Bisa di semua game)",
        features: getSmartFeatures(sc.title, sc.features),
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
        game: sc.game || "Universal Script (Bisa di semua game)",
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
        .slice(0, 12); // Menampilkan 12 script terbaru secara acak
    }

    return NextResponse.json({
      query: query || "live-upload",
      note: "Data real-time (No Key & Working)",
      total: combinedResults.length,
      results: combinedResults
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 502 });
  }
}
