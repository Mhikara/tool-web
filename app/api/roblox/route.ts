import { NextResponse } from "next/server";

// Fungsi Pintar untuk membuat deskripsi fitur SANGAT DETAIL dengan format bullet points
function getSmartFeatures(title: string, originalFeat: string | null) {
  const t = title.toLowerCase();
  const feats: string[] = [];
  
  // Penjabaran ekstensif Auto Farm
  if (t.includes("auto") || t.includes("farm") || t.includes("spawn") || t.includes("collect") || t.includes("upgrade")) {
    feats.push("🤖 Sistem Auto Farm Lanjutan (AFK Grinding) — Modul otomatisasi tingkat tinggi yang memungkinkan karakter Anda bergerak, menyerang, dan berinteraksi secara mandiri. Script ini akan mengambil alih rutinitas melelahkan seperti menyelesaikan misi (questing), membunuh monster/bos (mob grinding), serta mengumpulkan harta karun (chest/loot) tanpa henti. Dirancang khusus untuk memaksimalkan level dan akumulasi mata uang in-game bahkan saat Anda sedang tidur (AFK).");
  }
  
  // Penjabaran ekstensif ESP
  if (t.includes("esp") || t.includes("wallhack") || t.includes("chams") || t.includes("trace")) {
    feats.push("👁️ Extra Sensory Perception (ESP) / Wallhack — Kemampuan melihat menembus rintangan fisik (dinding/terrain). Fitur ini menampilkan informasi vital secara visual di layar Anda (HUD overlay). Termasuk Box ESP (kotak pembatas target), Name ESP (nama pemain/item), Health ESP (sisa darah target), dan Distance/Tracer ESP (garis penunjuk jarak). Memberikan keunggulan taktis absolut dalam mengetahui posisi kawan, lawan, maupun item langka yang tersembunyi.");
  }
  
  // Penjabaran ekstensif Aimbot
  if (t.includes("aimbot") || t.includes("aim") || t.includes("silent aim") || t.includes("hitbox")) {
    feats.push("🎯 Precision Aimbot & Combat Assist — Sistem bantuan bidik mekanis yang sangat akurat. Modul ini memaksa arah pandangan (camera lock) atau lintasan proyektil senjata Anda (Silent Aim) untuk selalu mengenai area mematikan (seperti hitbox kepala musuh). Sangat mematikan di mode PvP atau melawan bos lincah, memastikan rasio akurasi serangan mencapai 100% tanpa perlu refleks fisik.");
  }
  
  // Penjabaran ekstensif Admin/Troll
  if (t.includes("admin") || t.includes("troll") || t.includes("fling") || t.includes("kick") || t.includes("btools")) {
    feats.push("👑 Admin Commands & Trolling Exploits — Memberikan Anda otoritas buatan layaknya kreator game (Developer Privileges). Membuka akses perintah (commands) untuk memanipulasi fisika server, mengubah cuaca, menghancurkan map (Btools), membunuh/melemparkan pemain lain secara instan (Fling/Kill), hingga kebal dari sistem moderasi standar. Sangat cocok untuk mengacaukan gameplay (trolling).");
  }
  
  // Penjabaran ekstensif God Mode/Heal
  if (t.includes("heal") || t.includes("god") || t.includes("immortal") || t.includes("anti damage")) {
    feats.push("💖 Absolute God Mode & Auto-Heal — Bypass pada sistem perhitungan damage game. Karakter Anda dijamin mencapai keabadian (immortality). Bar darah (Health Points) akan terisi ulang dalam hitungan milidetik saat menerima serangan, atau bahkan kebal sepenuhnya dari tembakan, jatuh dari ketinggian ekstrem, hingga zona beracun. Menjamin kelangsungan hidup tanpa batas.");
  }
  
  // Penjabaran ekstensif Movement
  if (t.includes("speed") || t.includes("walkspeed") || t.includes("fly") || t.includes("noclip") || t.includes("jump")) {
    feats.push("⚡ Manipulasi Fisika Pergerakan (Movement Mod) — Kebebasan mutlak dari batasan gravitasi dan ruang. Termasuk WalkSpeed Hack (berlari lebih cepat dari kendaraan), Infinite Jump (melompat terus-menerus ke atmosfer), Fly Bypass (terbang menyusuri map seperti burung), dan Noclip (kemampuan tubuh menembus benda padat/tembok layaknya hantu). Sangat ideal untuk menyelesaikan Obby atau melarikan diri.");
  }
  
  // Penjabaran ekstensif Teleport
  if (t.includes("teleport") || t.includes("tween") || t.includes("tp") || t.includes("waypoint")) {
    feats.push("🚀 Instant/Tween Teleportation — Perpindahan koordinat absolut (CFrame manipulation). Mengizinkan Anda melintasi ujung peta ke ujung lainnya dalam hitungan kedipan mata (Instant TP) atau meluncur mulus dengan kecepatan sangat tinggi melewati rintangan (Tween TP). Anda bisa melompat langsung ke lokasi bos, area rahasia VIP, atau tempat pemain lain berada tanpa harus berjalan kaki.");
  }
  
  // Penjabaran ekstensif GUI
  if (t.includes("hub") || t.includes("gui") || t.includes("panel") || t.includes("menu") || t.includes("creator")) {
    feats.push("🎛️ Modul GUI Interaktif Terpusat (Hub Panel) — Script tidak berjalan secara tersembunyi, melainkan memunculkan sebuah jendela antarmuka visual (Graphical User Interface) yang modern di layar. Anda bebas menyalakan/mematikan puluhan fitur cheat melalui tombol sakelar (toggle), menyesuaikan tingkat kecepatan lewat slider, dan mengatur konfigurasi secara langsung (real-time) tanpa perlu repot mengetik kode manual.");
  }

  // Jika ada fitur bawaan dari API, tampilkan sebagai fitur sekunder
  if (originalFeat && originalFeat.trim().length > 3 && originalFeat !== "Tidak ada deskripsi") {
    const cleanFeat = originalFeat.replace(/<[^>]*>?/gm, '');
    const items = cleanFeat.split(/[,|]/).slice(0, 2); 
    items.forEach(item => {
      if (item.trim().length > 3 && !t.includes(item.trim().toLowerCase())) {
         feats.push(`✨ Fitur Tambahan Spesifik: Mengandung modul khusus '${item.trim()}' yang didesain secara eksklusif oleh sang kreator untuk mengeksploitasi celah (vulnerability) tertentu pada game ini.`);
      }
    });
  }

  // Fallback jika sama sekali tidak terdeteksi
  if (feats.length === 0) {
    feats.push(`✨ Universal Exploit Modules — Berisi kumpulan algoritma eksploitasi standar yang dioptimalkan secara dinamis untuk menembus dan beradaptasi dengan mekanisme internal server Roblox.`);
  }

  // Jaminan No Key dengan deskripsi super detail
  feats.push("🔓 Status Eksklusif: Fully Keyless (Anti-Linkvertise) — Script premium ini sudah sepenuhnya di-crack atau sengaja dibagikan gratis oleh pembuatnya. Anda tidak perlu membuang waktu melewati sistem verifikasi Key yang menyebalkan, tidak ada tugas klik iklan (Linkvertise bypass), dan tidak ada risiko malware pihak ketiga. Cukup Copy script ini, Paste ke executor Anda (Arceus X, Delta, Fluxus, dll), lalu tekan Execute!");

  return feats;
}

// Logika pengambilan data ScriptBlox
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
        features: getSmartFeatures(sc.title, sc.features), 
        scriptCode: sc.script,
        source: query ? "ScriptBlox" : "Live Update"
      }));
  } catch {
    return [];
  }
}

// Logika pengambilan data Rscripts
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
        .slice(0, 8); // Tampilkan 8 agar tidak terlalu panjang karena teksnya sekarang sangat padat
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
