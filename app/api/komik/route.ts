import { NextResponse } from "next/server";

// FLAG: Atur ke 'true' HANYA JIKA server FullManhwa sedang stabil/tidak HTTP 500
const FM_READ_ENABLED = false;

// HELPER: Format Tanggal ke Hari dan Bulan Indonesia (Misal: "Minggu, 12 Agustus")
function formatWaktu(dateString: string) {
  if (!dateString) return "Baru Saja";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  
  return `${namaHari[date.getDay()]}, ${date.getDate()} ${namaBulan[date.getMonth()]}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "home";
  const id = searchParams.get("id");
  const chapterId = searchParams.get("chapter");
  const sourceFilter = (searchParams.get("source") || "semua").toLowerCase();
  
  // PENYESUAIAN: Menangkap parameter sort (update terbaru vs populer/rating)
  const sort = searchParams.get("sort") || "update"; 

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
              
              if (query) {
                mdUrl += `&title=${encodeURIComponent(query)}`;
              } else if (sort === "populer") {
                // Mengikuti rating popularitas tertinggi
                mdUrl += `&order[rating]=desc`;
              } else {
                mdUrl += `&order[updatedAt]=desc`;
              }
              
              const res = await fetch(mdUrl, { signal: AbortSignal.timeout(4500) });
              if (!res.ok) return [];
              
              const data = await res.json();
              return data.data?.map((manga: any) => {
                const cover = manga.relationships?.find((r: any) => r.type === "cover_art");
                const coverFile = cover?.attributes?.fileName;
                const lastCh = manga.attributes.lastChapter;
                
                return {
                  id: `md:${manga.id}`,
                  title: manga.attributes.title?.en || manga.attributes.title?.id || manga.attributes.title?.["ja-ro"] || "Judul Tidak Diketahui",
                  cover: coverFile ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFile}.512.jpg` : "",
                  type: manga.attributes.originalLanguage === "ko" ? "Manhwa" : manga.attributes.originalLanguage === "zh" ? "Manhua" : "Manga",
                  source: "MangaDex",
                  // PENYESUAIAN: Tangkap Judul/Nomor Chapter & Format Hari/Bulan
                  latestChapter: lastCh ? `Ch. ${lastCh}` : "Update Baru",
                  updateOn: formatWaktu(manga.attributes.updatedAt || manga.attributes.createdAt)
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
              let url = `https://komiku.id/`;
              if (query) {
                url = `https://komiku.id/cari/?post_type=manga&s=${encodeURIComponent(query)}`;
              } else if (sort === "populer") {
                // Mengambil dari halaman Hot / Populer Komiku
                url = `https://komiku.id/other/hot/`;
              }

              const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
              if (!res.ok) return [];
              
              const html = await res.text();
              const results: any[] = [];
              const regex = /<div class="bge">[\s\S]*?<a href="\/manga\/([^/]+)\/"[\s\S]*?<img[^>]+(?:src|data-src)="([^"]+)"[\s\S]*?<h[34][^>]*>([^<]+)<\/h[34]>([\s\S]*?)<\/div>\s*<\/div>/gi;
              
              let match;
              while ((match = regex.exec(html)) !== null && results.length < 12) {
                const extraHtml = match[4] || "";
                const chMatch = extraHtml.match(/Chapter\s*[\d.]+/i);
                
                results.push({
                  id: `komiku:${match[1]}`,
                  title: match[3].replace(/<\/?[^>]+(>|$)/g, "").trim(),
                  cover: match[2].split("?")[0].trim(),
                  type: "Manhwa/Manhua (ID)",
                  source: "Komiku",
                  latestChapter: chMatch ? chMatch[0] : "Terbaru",
                  updateOn: formatWaktu(new Date().toISOString()) // Set hari ini secara default untuk web scraping
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
              let url = `https://fullmanhwa.com/`;
              if (query) {
                url = `https://fullmanhwa.com/?s=${encodeURIComponent(query)}`;
              } else if (sort === "populer") {
                // Mengambil list Manhwa populer berdasarkan rating/views
                url = `https://fullmanhwa.com/manga/?order=popular`;
              }

              const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
              if (!res.ok) return [];
              
              const html = await res.text();
              const results: any[] = [];
              const regex = /<div class="bsx">[\s\S]*?<a href="[^"]*\/manga\/([^/]+)\/"[\s\S]*?<img[^>]+src="([^"]+)"[\s\S]*?<div class="tt">\s*([^<]+)\s*<\/div>([\s\S]*?)<\/a>/gi;
              
              let match;
              while ((match = regex.exec(html)) !== null && results.length < 12) {
                const extraHtml = match[4] || "";
                const chMatch = extraHtml.match(/<div class="epxs">([^<]+)<\/div>/i);
                
                results.push({
                  id: `fm:${match[1]}`,
                  title: match[3].trim(),
                  cover: match[2].trim(),
                  type: "Manhwa (ID)",
                  source: "FullManhwa",
                  latestChapter: chMatch ? chMatch[1].trim() : "Terbaru",
                  updateOn: formatWaktu(new Date().toISOString())
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
          chapters = feedData.data?.map((ch: any) => {
            const cNum = ch.attributes.chapter;
            const cTitle = ch.attributes.title;
            
            let finalTitle = "";
            if (cNum !== null && cNum !== undefined && cNum !== "") {
              finalTitle = `Ch. ${cNum}`;
            } else {
              finalTitle = "Oneshot / Extra";
            }
            
            if (cTitle && cTitle !== "null" && cTitle.trim() !== "" && cTitle !== "0") {
              finalTitle += ` - ${cTitle}`;
            } else if (cNum === "0") {
              finalTitle += " - Prolog";
            }
            
            return {
              chapterId: ch.id,
              title: `${finalTitle} [${(ch.attributes.translatedLanguage || 'ID').toUpperCase()}]`,
              lang: ch.attributes.translatedLanguage,
            };
          }) || [];
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
          let chTitle = match[2].replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();
          if (!chTitle || chTitle === "0") {
            chTitle = `Chapter ${match[1].replace(/[^0-9]/g, '') || 'Extra'}`;
          }
          if (chTitle.toLowerCase().includes("chapter") || chTitle.toLowerCase().includes("ch")) {
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
          let chTitle = match[2].trim();
          if (!chTitle || chTitle === "0") chTitle = `Chapter ${match[1].replace(/[^0-9]/g, '') || 'Extra'}`;
          chapters.push({ chapterId: match[1], title: chTitle, lang: "id" });
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
      
      // READ: FULLMANHWA
      if (id.startsWith("fm:")) {
        if (!FM_READ_ENABLED) {
          return NextResponse.json({ error: "Server FullManhwa sedang tidak stabil (Rawan 500 Cloudflare). Silakan cari & baca judul ini menggunakan sumber MangaDex atau Komiku." }, { status: 403 });
        }
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
