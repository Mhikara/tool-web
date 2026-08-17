import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const page = searchParams.get("page") || "1";

  // Validasi input
  if (!query) {
    return NextResponse.json(
      { error: "Masukkan kata kunci pencarian, contoh: ?q=bloxfruits" },
      { status: 400 }
    );
  }

  try {
    // Mengambil data real-time dari ScriptBlox API (mode=free)
    const apiUrl = `https://scriptblox.com/api/script/search?q=${encodeURIComponent(query)}&mode=free&page=${page}`;
    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      next: { revalidate: 0 } // Memastikan data tidak di-cache (real-time)
    });

    const data = await res.json();

    if (!data.result || !data.result.scripts) {
      return NextResponse.json({ query, total: 0, results: [] });
    }

    // Ekstraksi data dan ambil penjelasan fitur
    const scripts = data.result.scripts.map((sc: any) => ({
      title: sc.title,
      game: sc.game.name,
      isPatched: sc.isPatched,
      hasKey: sc.key,
      features: sc.features || "Penjelasan fitur tidak disediakan pembuat.",
      scriptCode: sc.script,
      image: sc.game.imageUrl ? `https://scriptblox.com${sc.game.imageUrl}` : null,
      updatedAt: sc.updatedAt || sc.createdAt
    }));

    // Filter otomatis: HANYA tampilkan yang TIDAK PATCHED dan NO KEY
    const filteredScripts = scripts.filter((sc: any) => sc.hasKey === false && !sc.isPatched);

    return NextResponse.json({
      query,
      note: "Menampilkan script No Key dan belum di-patch (Real-Time)",
      total: filteredScripts.length,
      results: filteredScripts
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Gagal mengambil data SC Roblox" },
      { status: 502 }
    );
  }
}
