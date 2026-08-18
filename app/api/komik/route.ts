import { NextResponse } from "next/server";

const FM_READ_ENABLED = false;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "home";
  const id = searchParams.get("id");
  const chapterId = searchParams.get("chapter");

  try {
    if (action === "home" || action === "search" || action === "katalog") {
      const query = searchParams.get("q") || "";
      const page = Number(searchParams.get("page") || "1");
      const offset = (page - 1) * 24;

      const fetchMangaDex = async () => {
        let mdUrl = `https://api.mangadex.org/manga?includes[]=cover_art&limit=20&offset=${offset}&contentRating[]=safe&contentRating[]=suggestive`;
        if (query) mdUrl += `&title=${encodeURIComponent(query)}`;
        else mdUrl += `&order[updatedAt]=desc`;
        
        const res = await fetch(mdUrl, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return [];
        
        const data = await res.json();
        return data.data?.map((manga: any) => {
          const cover = manga.relationships?.find((r: any) => r.type === "cover_art");
          const coverFile = cover?.attributes?.fileName;
          return {
            id: `md:${manga.id}`,
            title: manga.attributes.title.en || manga.attributes.title.id || manga.attributes.title["ja-ro"] || "Judul Tidak Diketahui",
            cover: coverFile ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFile}.512.jpg` : "",
            type: manga.attributes.originalLanguage === "ko" ? "Manhwa" : manga.attributes.originalLanguage === "zh" ? "Manhua" : "Manga",
            source: "MangaDex"
          };
        }) || [];
      };

      const fetchLokal = async () => { return []; };

      const [mdResult, lokalResult] = await Promise.allSettled([
        fetchMangaDex(),
        fetchLokal()
      ]);

      let combined: any[] = [];
      if (mdResult.status === "fulfilled") combined.push(...mdResult.value);
      if (lokalResult.status === "fulfilled") combined.push(...lokalResult.value);

      return NextResponse.json({ success: true, data: combined });
    }

    if (action === "detail" && id) {
      const realId = id.replace(/^(md:|fm:|omega:|komiku:)/, "");
      if (id.startsWith("md:")) {
        const feedUrl = `https://api.mangadex.org/manga/${realId}/feed?translatedLanguage[]=id&translatedLanguage[]=en&order[chapter]=desc&limit=200`;
        const feedRes = await fetch(feedUrl, { signal: AbortSignal.timeout(8000) });
        const feedData = await feedRes.json();
        
        const chapters = feedData.data?.map((ch: any) => ({
          chapterId: ch.id,
          title: `Ch. ${ch.attributes.chapter || '?'} ${ch.attributes.title ? `- ${ch.attributes.title}` : ''} [${ch.attributes.translatedLanguage.toUpperCase()}]`,
          lang: ch.attributes.translatedLanguage,
        })) || [];
        
        return NextResponse.json({ success: true, chapters });
      }
    }

    if (action === "read" && id) {
      if (id.startsWith("fm:") && !FM_READ_ENABLED) {
        return NextResponse.json({ 
          error: "FullManhwa sedang tidak stabil (Cloud 500). Silakan baca komik ini melalui sumber MangaDex, Omega, atau Komiku." 
        }, { status: 403 });
      }

      if (id.startsWith("md:") && chapterId) {
        const mdHost = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`, { signal: AbortSignal.timeout(10000) });
        if (!mdHost.ok) throw new Error(`Gagal menghubungi server gambar MangaDex. Status: ${mdHost.status}`);
        
        const hostData = await mdHost.json();
        if (hostData.result !== "ok" || !hostData.chapter) throw new Error("Sistem MangaDex menolak permintaan gambar (Rate limit atau Chapter dihapus).");

        const baseUrl = hostData.baseUrl;
        const hash = hostData.chapter.hash;
        const chapterImages = hostData.chapter.data?.length > 0 ? hostData.chapter.data : hostData.chapter.dataSaver || [];

        if (chapterImages.length === 0) throw new Error("Tidak ada halaman gambar yang ditemukan di dalam chapter ini.");

        const images = chapterImages.map((file: string) => `${baseUrl}/data/${hash}/${file}`);
        return NextResponse.json({ success: true, images });
      }
      
      return NextResponse.json({ success: true, images: [] });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali atau parameter kurang lengkap" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan internal pada server backend" }, { status: 500 });
  }
}
