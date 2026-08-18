import { NextResponse } from "next/server";

// FLAG: Matikan baca chapter dari FullManhwa karena server cloud mereka sering HTTP 500
const FM_READ_ENABLED = false;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "home";
  const id = searchParams.get("id");
  const chapterId = searchParams.get("chapter");

  try {
    // ---------------------------------------------------------
    // ACTION: HOME / SEARCH / KATALOG (AGGREGATOR)
    // ---------------------------------------------------------
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
            title: manga.attributes.title?.en || manga.attributes.title?.id || manga.attributes.title?.["ja-ro"] || "Judul Tidak Diketahui",
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

    // ---------------------------------------------------------
    // ACTION: DETAIL KOMIK (PERBAIKAN JUDUL & COVER BLANK)
    // ---------------------------------------------------------
    if (action === "detail" && id) {
      const realId = id.replace(/^(md:|fm:|omega:|komiku:)/, "");
      
      if (id.startsWith("md:")) {
        // 1. Ambil Detail Meta Komik (Judul, Cover, Deskripsi)
        const mangaUrl = `https://api.mangadex.org/manga/${realId}?includes[]=cover_art`;
        
        // 2. Ambil Feed Chapter Bilingual (ID & EN)
        const feedUrl = `https://api.mangadex.org/manga/${realId}/feed?translatedLanguage[]=id&translatedLanguage[]=en&order[chapter]=desc&limit=200`;
        
        // Fetch keduanya secara paralel agar lebih cepat
        const [mangaRes, feedRes] = await Promise.all([
          fetch(mangaUrl, { signal: AbortSignal.timeout(8000) }).catch(() => null),
          fetch(feedUrl, { signal: AbortSignal.timeout(8000) }).catch(() => null)
        ]);

        let title = "Judul Tidak Diketahui";
        let coverUrl = "";
        let description = "Tidak ada sinopsis tersedia.";
        
        // Ekstrak Meta Komik
        if (mangaRes && mangaRes.ok) {
          const mangaData = await mangaRes.json();
          if (mangaData && mangaData.data) {
            const m = mangaData.data;
            title = m.attributes?.title?.en || m.attributes?.title?.id || m.attributes?.title?.["ja-ro"] || title;
            description = m.attributes?.description?.id || m.attributes?.description?.en || description;
            
            const coverRel = m.relationships?.find((r: any) => r.type === "cover_art");
            if (coverRel?.attributes?.fileName) {
              coverUrl = `https://uploads.mangadex.org/covers/${realId}/${coverRel.attributes.fileName}.512.jpg`;
            }
          }
        }

        // Ekstrak Chapter
        let chapters = [];
        if (feedRes && feedRes.ok) {
          const feedData = await feedRes.json();
          chapters = feedData.data?.map((ch: any) => ({
            chapterId: ch.id,
            title: `Ch. ${ch.attributes.chapter || '?'} ${ch.attributes.title ? `- ${ch.attributes.title}` : ''} [${ch.attributes.translatedLanguage?.toUpperCase()}]`,
            lang: ch.attributes.translatedLanguage,
          })) || [];
        }
        
        // Return JSON utuh agar Frontend bisa merender Judul, Cover, dan Chapter
        return NextResponse.json({ 
          success: true, 
          title,
          cover: coverUrl,
          description,
          chapters,
          // Redundansi object data untuk kompatibilitas UI
          data: { title, cover: coverUrl, description, chapters } 
        });
      }
    }

    // ---------------------------------------------------------
    // ACTION: READ (BACA CHAPTER)
    // ---------------------------------------------------------
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
