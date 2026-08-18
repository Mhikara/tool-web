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
    // ACTION: HOME / SEARCH / KATALOG (AGGREGATOR MULTI-WEB)
    // ---------------------------------------------------------
    if (action === "home" || action === "search" || action === "katalog") {
      const query = searchParams.get("q") || "";
      const page = Number(searchParams.get("page") || "1");
      const offset = (page - 1) * 24;

      // 1. Fetcher MangaDex (Global, Lengkap)
      const fetchMangaDex = async () => {
        let mdUrl = `https://api.mangadex.org/manga?includes[]=cover_art&limit=12&offset=${offset}&contentRating[]=safe&contentRating[]=suggestive`;
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

      // 2. Fetcher Komiku (Spesialis Manhwa/Manhua Update Harian ID)
      const fetchKomiku = async () => {
        try {
          const url = query ? `https://komiku.id/cari/?post_type=manga&s=${encodeURIComponent(query)}` : `https://komiku.id/`;
          const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
          if (!res.ok) return [];
          const html = await res.text();
          const results: any[] = [];

          // Native Regex Scraper: Ringan tanpa package tambahan
          const regex = /<div class="bge">[\s\S]*?<a href="\/manga\/([^/]+)\/"[\s\S]*?<img[^>]+src="([^"]+)"[\s\S]*?<h[34][^>]*>([^<]+)<\/h[34]>/gi;
          let match;
          while ((match = regex.exec(html)) !== null && results.length < 15) {
            let cover = match[2].split("?")[0]; // Ambil versi HD gambar dari parameter resize
            results.push({
              id: `komiku:${match[1]}`,
              title: match[3].trim(),
              cover: cover,
              type: "Manhwa/Manhua (ID)",
              source: "Komiku"
            });
          }
          return results;
        } catch (e) { return []; }
      };

      // JALANKAN SEMUA SECARA BERSAMAAN (Paralel untuk Kecepatan Ekstra)
      const [mdResult, komikuResult] = await Promise.allSettled([
        fetchMangaDex(),
        fetchKomiku()
      ]);

      let combined: any[] = [];
      // Tampilkan Komiku terlebih dahulu (karena lebih update untuk Manhwa/Manhua ID), diikuti MangaDex
      if (komikuResult.status === "fulfilled") combined.push(...komikuResult.value);
      if (mdResult.status === "fulfilled") combined.push(...mdResult.value);

      return NextResponse.json({ success: true, data: combined });
    }

    // ---------------------------------------------------------
    // ACTION: DETAIL KOMIK
    // ---------------------------------------------------------
    if (action === "detail" && id) {
      const realId = id.replace(/^(md:|fm:|omega:|komiku:)/, "");
      
      // DETAIL: MANGADEX
      if (id.startsWith("md:")) {
        const mangaUrl = `https://api.mangadex.org/manga/${realId}?includes[]=cover_art`;
        const feedUrl = `https://api.mangadex.org/manga/${realId}/feed?translatedLanguage[]=id&translatedLanguage[]=en&order[chapter]=desc&limit=200`;
        
        const [mangaRes, feedRes] = await Promise.all([
          fetch(mangaUrl, { signal: AbortSignal.timeout(8000) }).catch(() => null),
          fetch(feedUrl, { signal: AbortSignal.timeout(8000) }).catch(() => null)
        ]);

        let title = "Judul Tidak Diketahui";
        let coverUrl = "";
        let description = "Tidak ada sinopsis tersedia.";
        
        if (mangaRes && mangaRes.ok) {
          const mangaData = await mangaRes.json();
          if (mangaData?.data) {
            const m = mangaData.data;
            title = m.attributes?.title?.en || m.attributes?.title?.id || m.attributes?.title?.["ja-ro"] || title;
            description = m.attributes?.description?.id || m.attributes?.description?.en || description;
            const coverRel = m.relationships?.find((r: any) => r.type === "cover_art");
            if (coverRel?.attributes?.fileName) {
              coverUrl = `https://uploads.mangadex.org/covers/${realId}/${coverRel.attributes.fileName}.512.jpg`;
            }
          }
        }

        let chapters = [];
        if (feedRes && feedRes.ok) {
          const feedData = await feedRes.json();
          chapters = feedData.data?.map((ch: any) => ({
            chapterId: ch.id,
            title: `Ch. ${ch.attributes.chapter || '?'} ${ch.attributes.title ? `- ${ch.attributes.title}` : ''} [${ch.attributes.translatedLanguage?.toUpperCase()}]`,
            lang: ch.attributes.translatedLanguage,
          })) || [];
        }
        
        return NextResponse.json({ success: true, title, cover: coverUrl, description, chapters, data: { title, cover: coverUrl, description, chapters } });
      }

      // DETAIL: KOMIKU (EKSTRAKTOR WEB LOKAL)
      if (id.startsWith("komiku:")) {
        const mangaUrl = `https://komiku.id/manga/${realId}/`;
        const res = await fetch(mangaUrl, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error("Gagal mengambil data dari server Komiku.");
        const html = await res.text();

        const titleMatch = html.match(/<h1 itemprop="name"[^>]*>([^<]+)<\/h1>/i);
        const coverMatch = html.match(/<div class="ims">[\s\S]*?<img[^>]+src="([^"]+)"/i);
        const descMatch = html.match(/<p class="desc"[^>]*>([\s\S]*?)<\/p>/i);

        const title = titleMatch ? titleMatch[1].trim() : "Judul Tidak Diketahui";
        let coverUrl = coverMatch ? coverMatch[1].split("?")[0].trim() : "";
        const description = descMatch ? descMatch[1].trim().replace(/<[^>]+>/g, '') : "Tidak ada sinopsis.";

        const chapters = [];
        const chRegex = /<a href="\/ch\/([^/]+)\/"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        while ((match = chRegex.exec(html)) !== null) {
          const chTitle = match[2].replace(/<\/?[^>]+(>|$)/g, "").trim(); // Hapus tag span/html di dalam
          if (chTitle.toLowerCase().includes("chapter") || chTitle.toLowerCase().includes("ch.")) {
            chapters.push({
              chapterId: match[1],
              title: chTitle,
              lang: "id"
            });
          }
        }

        return NextResponse.json({ success: true, title, cover: coverUrl, description, chapters, data: { title, cover: coverUrl, description, chapters } });
      }
    }

    // ---------------------------------------------------------
    // ACTION: READ (BACA CHAPTER)
    // ---------------------------------------------------------
    if (action === "read" && id) {
      if (id.startsWith("fm:") && !FM_READ_ENABLED) {
        return NextResponse.json({ error: "FullManhwa sedang tidak stabil (Cloud 500). Silakan baca komik ini melalui sumber lain." }, { status: 403 });
      }

      // READ: MANGADEX
      if (id.startsWith("md:") && chapterId) {
        const mdHost = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`, { signal: AbortSignal.timeout(10000) });
        if (!mdHost.ok) throw new Error(`Gagal menghubungi server gambar MangaDex. Status: ${mdHost.status}`);
        
        const hostData = await mdHost.json();
        if (hostData.result !== "ok" || !hostData.chapter) throw new Error("Sistem MangaDex menolak permintaan gambar.");

        const baseUrl = hostData.baseUrl;
        const hash = hostData.chapter.hash;
        const chapterImages = hostData.chapter.data?.length > 0 ? hostData.chapter.data : hostData.chapter.dataSaver || [];

        if (chapterImages.length === 0) throw new Error("Tidak ada halaman gambar yang ditemukan.");

        const images = chapterImages.map((file: string) => `${baseUrl}/data/${hash}/${file}`);
        return NextResponse.json({ success: true, images });
      }

      // READ: KOMIKU
      if (id.startsWith("komiku:") && chapterId) {
         const chUrl = `https://komiku.id/ch/${chapterId}/`;
         const res = await fetch(chUrl, { signal: AbortSignal.timeout(10000) });
         if (!res.ok) throw new Error("Gagal menghubungi server gambar Komiku.");
         const html = await res.text();

         const bcContentIndex = html.indexOf('id="bc"');
         let images: string[] = [];
         
         if (bcContentIndex !== -1) {
            // Hanya ekstrak gambar dari dalam div area pembaca
            const bcContent = html.substring(bcContentIndex, html.indexOf('class="fb-comments"', bcContentIndex) || html.length);
            const imgRegex = /<img[^>]+(?:src|data-src)="([^"]+)"/gi;
            let imgM;
            while ((imgM = imgRegex.exec(bcContent)) !== null) {
               const imgUrl = imgM[1].trim();
               if (!imgUrl.includes("gif") && !imgUrl.includes("banner")) {
                  images.push(imgUrl);
               }
            }
         }

         if (images.length === 0) throw new Error("Tidak ada halaman gambar yang ditemukan pada chapter Komiku ini.");
         return NextResponse.json({ success: true, images });
      }
      
      return NextResponse.json({ success: true, images: [] });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali atau parameter kurang lengkap" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan internal pada server backend" }, { status: 500 });
  }
}
