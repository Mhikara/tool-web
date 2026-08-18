import { NextResponse } from "next/server";

// FLAG: Atur ke 'true' HANYA JIKA server FullManhwa sedang stabil/tidak HTTP 500
const FM_READ_ENABLED = false;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "home";
  const id = searchParams.get("id");
  const chapterId = searchParams.get("chapter");
  const sourceFilter = (searchParams.get("source") || "semua").toLowerCase();

  try {
    // ---------------------------------------------------------
    // ACTION: HOME / SEARCH / KATALOG (MULTI-WEB AGGREGATOR)
    // ---------------------------------------------------------
    if (action === "home" || action === "search" || action === "katalog") {
      const query = searchParams.get("q") || "";
      const page = Number(searchParams.get("page") || "1");
      const offset = (page - 1) * 20;

      const tasks: Promise<any[]>[] = [];

      // 1. ENGINE MANGADEX
      if (sourceFilter === "semua" || sourceFilter === "mangadex") {
        tasks.push(
          (async () => {
            try {
              let mdUrl = `https://api.mangadex.org/manga?includes[]=cover_art&limit=12&offset=${offset}&contentRating[]=safe&contentRating[]=suggestive`;
              if (query) mdUrl += `&title=${encodeURIComponent(query)}`;
              else mdUrl += `&order[updatedAt]=desc`;
              
              const res = await fetch(mdUrl, { signal: AbortSignal.timeout(4500) });
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
            } catch { return []; } 
          })()
        );
      }

      // 2. ENGINE KOMIKU
      if (sourceFilter === "semua" || sourceFilter === "komiku") {
        tasks.push(
          (async () => {
            try {
              const url = query ? `https://komiku.id/cari/?post_type=manga&s=${encodeURIComponent(query)}` : `https://komiku.id/`;
              const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
              if (!res.ok) return [];
              
              const html = await res.text();
              const results: any[] = [];
              const regex = /<div class="bge">[\s\S]*?<a href="\/manga\/([^/]+)\/"[\s\S]*?<img[^>]+(?:src|data-src)="([^"]+)"[\s\S]*?<h[34][^>]*>([^<]+)<\/h[34]>/gi;
              
              let match;
              while ((match = regex.exec(html)) !== null && results.length < 12) {
                results.push({
                  id: `komiku:${match[1]}`,
                  title: match[3].replace(/<\/?[^>]+(>|$)/g, "").trim(),
                  cover: match[2].split("?")[0].trim(),
                  type: "Manhwa/Manhua (ID)",
                  source: "Komiku"
                });
              }
              return results;
            } catch { return []; } 
          })()
        );
      }

      // 3. ENGINE FULLMANHWA
      if (sourceFilter === "semua" || sourceFilter === "fullmanhwa") {
        tasks.push(
          (async () => {
            try {
              const url = query ? `https://fullmanhwa.com/?s=${encodeURIComponent(query)}` : `https://fullmanhwa.com/`;
              const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
              if (!res.ok) return [];
              
              const html = await res.text();
              const results: any[] = [];
              // Standard MangaStream/Madara Theme Extraction
              const regex = /<div class="bsx">[\s\S]*?<a href="[^"]*\/manga\/([^/]+)\/"[\s\S]*?<img[^>]+src="([^"]+)"[\s\S]*?<div class="tt">\s*([^<]+)\s*<\/div>/gi;
              
              let match;
              while ((match = regex.exec(html)) !== null && results.length < 12) {
                results.push({
                  id: `fm:${match[1]}`,
                  title: match[3].trim(),
                  cover: match[2].trim(),
                  type: "Manhwa (ID)",
                  source: "FullManhwa"
                });
              }
              return results;
            } catch { return []; } 
          })()
        );
      }

      const settled = await Promise.allSettled(tasks);
      const combined: any[] = [];
      
      settled.forEach(res => {
        if (res.status === "fulfilled" && Array.isArray(res.value)) {
          combined.push(...res.value);
        }
      });

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
        
        const [mangaRes, feedRes] = await Promise.allSettled([
          fetch(mangaUrl, { signal: AbortSignal.timeout(6000) }),
          fetch(feedUrl, { signal: AbortSignal.timeout(6000) })
        ]);
        
        let title = "Judul Tidak Diketahui";
        let coverUrl = "";
        let description = "Tidak ada sinopsis tersedia.";
        
        if (mangaRes.status === "fulfilled" && mangaRes.value.ok) {
          const mangaData = await mangaRes.value.json();
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
        if (feedRes.status === "fulfilled" && feedRes.value.ok) {
          const feedData = await feedRes.value.json();
          chapters = feedData.data?.map((ch: any) => ({
            chapterId: ch.id,
            title: `Ch. ${ch.attributes.chapter || '?'} ${ch.attributes.title ? `- ${ch.attributes.title}` : ''} [${ch.attributes.translatedLanguage?.toUpperCase()}]`,
            lang: ch.attributes.translatedLanguage,
          })) || [];
        }
        return NextResponse.json({ success: true, title, cover: coverUrl, description, chapters, data: { title, cover: coverUrl, description, chapters } });
      }

      // DETAIL: KOMIKU
      if (id.startsWith("komiku:")) {
        const res = await fetch(`https://komiku.id/manga/${realId}/`, { signal: AbortSignal.timeout(7000) });
        if (!res.ok) throw new Error("Gagal mengambil data dari server Komiku.");
        const html = await res.text();

        const titleMatch = html.match(/<h1 itemprop="name"[^>]*>([^<]+)<\/h1>/i);
        const coverMatch = html.match(/<div class="ims">[\s\S]*?<img[^>]+src="([^"]+)"/i);
        const descMatch = html.match(/<p class="desc"[^>]*>([\s\S]*?)<\/p>/i);

        const chapters: any[] = [];
        const chRegex = /<a href="\/ch\/([^/]+)\/"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        while ((match = chRegex.exec(html)) !== null) {
          const chTitle = match[2].replace(/<\/?[^>]+(>|$)/g, "").trim();
          if (chTitle.toLowerCase().includes("chapter") || chTitle.toLowerCase().includes("ch.")) {
            chapters.push({ chapterId: match[1], title: chTitle, lang: "id" });
          }
        }
        
        return NextResponse.json({ 
          success: true, 
          title: titleMatch ? titleMatch[1].trim() : "Judul Tidak Diketahui", 
          cover: coverMatch ? coverMatch[1].split("?")[0].trim() : "", 
          description: descMatch ? descMatch[1].trim().replace(/<[^>]+>/g, '') : "Tidak ada sinopsis.", 
          chapters 
        });
      }

      // DETAIL: FULLMANHWA
      if (id.startsWith("fm:")) {
        const res = await fetch(`https://fullmanhwa.com/manga/${realId}/`, { signal: AbortSignal.timeout(7000) });
        if (!res.ok) throw new Error("Gagal mengambil data dari server FullManhwa.");
        const html = await res.text();

        const titleMatch = html.match(/<h1 itemprop="name"[^>]*>([^<]+)<\/h1>/i) || html.match(/<h1 class="entry-title"[^>]*>([^<]+)<\/h1>/i);
        const coverMatch = html.match(/<div class="thumb"[\s\S]*?<img[^>]+src="([^"]+)"/i);
        const descMatch = html.match(/<div itemprop="description"[\s\S]*?>([\s\S]*?)<\/div>/i) || html.match(/<div class="entry-content"[^>]*>([\s\S]*?)<\/div>/i);

        const chapters: any[] = [];
        const chRegex = /<li[^>]*data-num[^>]*>[\s\S]*?<a href="[^"]*\/([^/]+)\/"[^>]*>[\s\S]*?<span class="chapternum">([^<]+)<\/span>/gi;
        let match;
        while ((match = chRegex.exec(html)) !== null) {
          chapters.push({ chapterId: match[1], title: match[2].trim(), lang: "id" });
        }
        
        return NextResponse.json({ 
          success: true, 
          title: titleMatch ? titleMatch[1].trim() : "Judul Tidak Diketahui", 
          cover: coverMatch ? coverMatch[1].trim() : "", 
          description: descMatch ? descMatch[1].trim().replace(/<[^>]+>/g, '') : "Tidak ada sinopsis.", 
          chapters 
        });
      }
    }

    // ---------------------------------------------------------
    // ACTION: READ (BACA CHAPTER)
    // ---------------------------------------------------------
    if (action === "read" && id && chapterId) {
      
      // READ: FULLMANHWA (DENGAN GUARD SYSTEM)
      if (id.startsWith("fm:")) {
        if (!FM_READ_ENABLED) {
          return NextResponse.json({ error: "Server FullManhwa sedang tidak stabil (Rawan 500 Cloudflare). Silakan cari & baca judul ini menggunakan sumber MangaDex atau Komiku." }, { status: 403 });
        }
        // JIKA FM_READ_ENABLED = true, INI MESIN EKSTRAKTORNYA:
        const res = await fetch(`https://fullmanhwa.com/${chapterId}/`, { signal: AbortSignal.timeout(9000) });
        if (!res.ok) throw new Error("Gagal menghubungi server gambar FullManhwa.");
        const html = await res.text();
        const readerArea = html.match(/<div id="readerarea"[^>]*>([\s\S]*?)<\/div>/i);
        if (!readerArea) throw new Error("Area gambar tidak ditemukan di FullManhwa.");
        
        let images: string[] = [];
        const imgRegex = /<img[^>]+src="([^"]+)"/gi;
        let imgM;
        while ((imgM = imgRegex.exec(readerArea[1])) !== null) {
          images.push(imgM[1].trim());
        }
        return NextResponse.json({ success: true, images });
      }

      // READ: MANGADEX
      if (id.startsWith("md:")) {
        const mdHost = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`, { signal: AbortSignal.timeout(9000) });
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
      if (id.startsWith("komiku:")) {
         const res = await fetch(`https://komiku.id/ch/${chapterId}/`, { signal: AbortSignal.timeout(9000) });
         if (!res.ok) throw new Error("Gagal menghubungi server gambar Komiku.");
         const html = await res.text();

         const bcContentIndex = html.indexOf('id="bc"');
         let images: string[] = [];
         
         if (bcContentIndex !== -1) {
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
