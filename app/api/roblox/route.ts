import { NextResponse } from "next/server";

async function fetchScriptBlox(query: string | null) {
  try {
    // Jika tidak ada query, panggil endpoint 'fetch' untuk mengambil live upload terbaru
    const url = query 
      ? `https://scriptblox.com/api/script/search?q=${encodeURIComponent(query)}&mode=free&page=1`
      : `https://scriptblox.com/api/script/fetch?page=1`; 

    const res = await fetch(url, {
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

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 0 }
    });
    const data = await res.json();
    if (!data || !data.scripts) return [];

    return data.scripts
      .filter((sc: any) => sc.status === "working")
      .map((sc: any) => ({
        title: sc.title,
        game: sc.game,
        features: "Verified by Rscripts",
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

    // Jika Mode Live Upload (tidak mencari sesuatu), acak datanya dan ambil 10 script terbaru
    if (!query) {
      combinedResults = combinedResults
        .sort(() => Math.random() - 0.5)
        .slice(0, 10);
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
