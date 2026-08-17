import { NextResponse } from "next/server";

// 1. Sumber Pertama: ScriptBlox (Kode Lama yang Dipertahankan)
async function fetchScriptBlox(query: string) {
  try {
    const res = await fetch(`https://scriptblox.com/api/script/search?q=${encodeURIComponent(query)}&mode=free&page=1`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 0 }
    });
    const data = await res.json();
    if (!data.result || !data.result.scripts) return [];
    
    return data.result.scripts
      .filter((sc: any) => sc.key === false && !sc.isPatched)
      .map((sc: any) => ({
        title: sc.title,
        game: sc.game.name,
        features: sc.features || "Tidak ada deskripsi",
        scriptCode: sc.script,
        source: "ScriptBlox"
      }));
  } catch {
    return [];
  }
}

// 2. Sumber Kedua: Rscripts (Sumber Tambahan Baru)
async function fetchRscripts(query: string) {
  try {
    const res = await fetch(`https://rscripts.net/api/scripts?q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 0 }
    });
    const data = await res.json();
    if (!data || !data.scripts) return [];

    return data.scripts
      .filter((sc: any) => sc.status === "working") // Ambil yang masih works
      .map((sc: any) => ({
        title: sc.title,
        game: sc.game,
        features: "Verified by Rscripts",
        scriptCode: sc.code || `loadstring(game:HttpGet("https://rscripts.net/raw/${sc.id}"))()`,
        source: "Rscripts"
      }));
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Masukkan keyword, contoh: ?q=bloxfruits" }, { status: 400 });
  }

  try {
    // Menjalankan pencarian ke semua sumber secara bersamaan (Real-Time & Cepat)
    const [scriptbloxResults, rscriptsResults] = await Promise.all([
      fetchScriptBlox(query),
      fetchRscripts(query)
    ]);

    // Menggabungkan hasil
    const combinedResults = [...scriptbloxResults, ...rscriptsResults];

    return NextResponse.json({
      query,
      note: "Data real-time dari multi-sumber (No Key & Working)",
      total: combinedResults.length,
      results: combinedResults
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 502 });
  }
}
