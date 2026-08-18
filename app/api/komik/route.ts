import { NextResponse } from "next/server";

// FLAG: Atur ke 'true' HANYA JIKA server FullManhwa sedang stabil/tidak HTTP 500
const FM_READ_ENABLED = false;

function formatWaktu(dateString: string) {
  if (!dateString) return "Baru Saja";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Baru Saja";
  const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const namaBulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  return `${namaHari[date.getDay()]}, ${date.getDate()} ${namaBulan[date.getMonth()]}`;
}

function parseId(rawId: string) {
  if (!rawId) return { prefix: "md", realId: "" };
  const parts = rawId.split(":");
  if (parts.length > 1) return { prefix: parts[0], realId: parts.slice(1).join(":") };
  return { prefix: "md", realId: rawId };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "home";
  const id = searchParams.get("id") || "";
  const chapterId = searchParams.get("chapter");
  const sourceFilter = (searchParams.get("source") || "semua").toLowerCase();
  const sort = searchParams.get("sort") || "update"; 

  try {
    // ---------------------------------------------------------
    // ACTION: HOME / SEARCH / KATALOG 
    // ---------------------------------------------------------
    if (action === "home" || action === "search" || action === "katalog") {
      const query = searchParams.get("q") || "";
      const page = Number(searchParams.get("page") || "1");
      const offset = (page - 1) * 20;

      // PERBAIKAN: Konfigurasi Cache Next.js (Refresh 2x Sehari = 43200 Detik)
      // Jika sedang mencari (query ada) atau sorting Populer, jangan di-cache lama.
      const cacheTime = (query || sort === "populer" || page > 1) ? 0 : 43200;
      
      const fetchConfig: RequestInit = {
        signal: AbortSignal.timeout(6000),
        next: { revalidate: cacheTime }
      };

      const tasks: Promise<any[]>[] = [];

      // 1. ENGINE MANGADEX
      if (sourceFilter === "semua" || sourceFilter === "mangadex") {
        tasks.push(
          (async () => {
            try {
              let mdUrl = `https://api.mangadex.org/manga?includes[]=cover_art&limit=15&offset=${offset}`;
              if (query) mdUrl += `&title=${encodeURIComponent(query)}`;
              else if (sort === "populer") mdUrl += `&order[rating]=desc`;
              else mdUrl += `&order[updatedAt]=desc`;
              
              const res = await fetch(mdUrl, fetchConfig);
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
              if (query) url = `https://komiku.id/cari/?post_type=manga&s=${encodeURIComponent(query)}`;
              else if (sort === "populer") url = `https://komiku.id/other/hot/`;

              const res = await fetch(url, fetchConfig);
              if (!res.ok) return [];
              
              const html = await res.text();
              const results: any[] = [];
              const regex = /<div class="bge">[\s\S]*?<a href="\/manga\/([^/]+)\/"[\s\S]*?<img[^>]+(?:src|data-src)="([^"]+)"[\s\S]*?<h[34][^>]*>([^<]+)<\/h[34]>([\s\S]*?)<\/div>\s*<\/div>/gi;
              
              let match;
              while ((match = regex.exec(html)) !== null && results.length < 12) {
                const chMatch = (match[4] || "").match(/Chapter\s*[\d.]+/i);
                results.push({
                  id: `komiku:${match[1]}`,
                  title: match[3].replace(/<\/?[^>]+(>|$)/g, "").trim(),
                  cover: match[2].split("?")[0].trim(),
                  type: "Manhwa/Manhua (ID)",
                  source: "Komiku",
                  latestChapter: chMatch ? chMatch[0] : "Terbaru",
                  updateOn: formatWaktu(new Date().toISOString())
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
              if (query) url = `https://fullmanhwa.com/?s=${encodeURIComponent(query)}`;
              else if (sort === "populer") url = `https://fullmanhwa.com/manga/?order=popular`;

              const res = await fetch(url, fetchConfig);
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
      settled.forEach(res => { if (res.status === "fulfilled" && Array.isArray(res.value)) combined.push(...res.value); });
      return NextResponse.json({ success: true, data: combined });
    }

    // ---------------------------------------------------------
    // ACTION: DETAIL KOMIK
    // ---------------------------------------------------------
    if (action === "detail" && id) {
      const { prefix, realId } = parseId(id);
      
      let title = "Komik Tidak Ditemukan";
      let coverUrl = "";
      let description = "Data komik tidak dapat dimuat atau sumber tidak dikenali.";
      let chapters: any[] = [];

      // DETAIL: MANGADEX
      if (prefix === "md") {
        const [mangaRes, feedRes] = await Promise.allSettled([
          fetch(`https://api.mangadex.org/manga/${realId}?includes[]=cover_art`, { signal: AbortSignal.timeout(8000) }),
          fetch(`https://api.mangadex.org/manga/${realId}/feed?translatedLanguage[]=id&translatedLanguage[]=en&order[chapter]=desc&limit=200`, { signal: AbortSignal.timeout(8000) })
        ]);
        
        if (mangaRes.status === "fulfilled" && mangaRes.value.ok) {
          const mData = await mangaRes.value.json();
          if (mData?.data) {
             const m = mData.data;
             title = m.attributes?.title?.en || m.attributes?.title?.id || m.attributes?.title?.["ja-ro"] || "Judul Tidak Diketahui";
             description = m.attributes?.description?.id || m.attributes?.description?.en || "Tidak ada sinopsis tersedia.";
             const coverRel = m.relationships?.find((r: any) => r.type === "cover_art");
             if (coverRel?.attributes?.fileName) coverUrl = `https://uploads.mangadex.org/covers/${realId}/${coverRel.attributes.fileName}.512.jpg`;
          }
        }

        if (feedRes.status === "fulfilled" && feedRes.value.ok) {
          const fData = await feedRes.value.json();
          chapters = fData.data?.map((ch: any) => {
            const cNum = ch.attributes.chapter;
            const cTitle = ch.attributes.title;
            
            let finalTitle = "";
            if (cNum !== null && cNum !== undefined && cNum !== "") finalTitle = `Ch. ${cNum}`;
            else finalTitle = "Oneshot / Extra";
            
            if (cTitle && cTitle !== "null" && cTitle.trim() !== "" && cTitle !== "0") {
              finalTitle += ` - ${cTitle}`;
            } else if (cNum === "0") {
              finalTitle = "Ch. 0 - Prolog"; 
            }
            
            return {
              chapterId: ch.id,
              title: `${finalTitle} [${(ch.attributes.translatedLanguage || 'ID').toUpperCase()}]`,
              lang: ch.attributes.translatedLanguage,
            };
          }) || [];
        }
      }

      // DETAIL: KOMIKU
      else if (prefix === "komiku") {
        const res = await fetch(`https://komiku.id/manga/${realId}/`, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const html = await res.text();
          const tMatch = html.match(/<h1 itemprop="name"[^>]*>([^<]+)<\/h1>/i);
          const cMatch = html.match(/<div class="ims">[\s\S]*?<img[^>]+src="([^"]+)"/i);
          const dMatch = html.match(/<p class="desc"[^>]*>([\s\S]*?)<\/p>/i);

          title = tMatch ? tMatch[1].trim() : "Judul Tidak Diketahui";
          coverUrl = cMatch ? cMatch[1].split("?")[0].trim() : "";
          description = dMatch ? dMatch[1].trim().replace(/<[^>]+>/g, '') : "Tidak ada sinopsis.";

          const chRegex = /<a href="\/ch\/([^/]+)\/"[^>]*>([\s\S]*?)<\/a>/gi;
          let match;
          while ((match = chRegex.exec(html)) !== null) {
            let chTitle = match[2].replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();
            if (!chTitle || chTitle === "0") chTitle = `Chapter ${match[1].replace(/[^0-9]/g, '') || 'Extra'}`;
            if (chTitle.toLowerCase().includes("chapter") || chTitle.toLowerCase().includes("ch")) {
              chapters.push({ chapterId: match[1], title: chTitle, lang: "id" });
            }
          }
        }
      }

      // DETAIL: FULLMANHWA
      else if (prefix === "fm") {
        const res = await fetch(`https://fullmanhwa.com/manga/${realId}/`, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const html = await res.text();
          const tMatch = html.match(/<h1 itemprop="name"[^>]*>([^<]+)<\/h1>/i) || html.match(/<h1 class="entry-title"[^>]*>([^<]+)<\/h1>/i);
          const cMatch = html.match(/<div class="thumb"[\s\S]*?<img[^>]+src="([^"]+)"/i);
          const dMatch = html.match(/<div itemprop="description"[\s\S]*?>([\s\S]*?)<\/div>/i) || html.match(/<div class="entry-content"[^>]*>([\s\S]*?)<\/div>/i);

          title = tMatch ? tMatch[1].trim() : "Judul Tidak Diketahui";
          coverUrl = cMatch ? cMatch[1].trim() : "";
          description = dMatch ? dMatch[1].trim().replace(/<[^>]+>/g, '') : "Tidak ada sinopsis.";

          const chRegex = /<li[^>]*data-num[^>]*>[\s\S]*?<a href="[^"]*\/([^/]+)\/"[^>]*>[\s\S]*?<span class="chapternum">([^<]+)<\/span>/gi;
          let match;
          while ((match = chRegex.exec(html)) !== null) {
            let chTitle = match[2].trim();
            if (!chTitle || chTitle === "0") chTitle = `Chapter ${match[1].replace(/[^0-9]/g, '') || 'Extra'}`;
            chapters.push({ chapterId: match[1], title: chTitle, lang: "id" });
          }
        }
      }
      
      else {
        title = `Komik Eksternal (${prefix})`;
        description = `Sumber web '${prefix}' saat ini sedang dalam masa pemeliharaan atau tidak didukung lagi.`;
        chapters = [ { chapterId: "error", title: "Pemberitahuan Sistem (Offline)", lang: "id" } ];
      }

      return NextResponse.json({ success: true, title, cover: coverUrl, description, chapters, data: { title, cover: coverUrl, description, chapters } });
    }

    // ---------------------------------------------------------
    // ACTION: READ (BACA CHAPTER)
    // ---------------------------------------------------------
    if (action === "read" && id && chapterId) {
      const { prefix } = parseId(id);

      if (prefix === "fm" && !FM_READ_ENABLED) {
        throw new Error("Server FullManhwa sedang tidak stabil (Rawan 500 Cloudflare). Silakan baca komik ini melalui sumber MangaDex atau Komiku.");
      }
      if (prefix === "omega" || chapterId === "error") {
        throw new Error("Sistem tidak dapat memuat gambar karena sumber dari web ini sedang offline atau dalam perbaikan.");
      }

      if (prefix === "fm") {
        const res = await fetch(`https://fullmanhwa.com/${chapterId}/`, { signal: AbortSignal.timeout(9000) });
        if (!res.ok) throw new Error("Gagal menghubungi server gambar FullManhwa.");
        const html = await res.text();
        const readerArea = html.match(/<div id="readerarea"[^>]*>([\s\S]*?)<\/div>/i);
        if (!readerArea) throw new Error("Area gambar tidak ditemukan di FullManhwa.");
        
        let images: string[] = [];
        const imgRegex = /<img[^>]+src="([^"]+)"/gi;
        let imgM;
        while ((imgM = imgRegex.exec(readerArea[1])) !== null) images.push(imgM[1].trim());
        return NextResponse.json({ success: true, images });
      }

      if (prefix === "md") {
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

      if (prefix === "komiku") {
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
               if (!imgUrl.includes("gif") && !imgUrl.includes("banner")) images.push(imgUrl);
            }
         }
         if (images.length === 0) throw new Error("Tidak ada halaman gambar yang ditemukan pada chapter Komiku ini.");
         return NextResponse.json({ success: true, images });
      }
      
      throw new Error("Aksi baca tidak dikenali untuk sumber ini.");
    }

    return NextResponse.json({ error: "Aksi tidak dikenali atau parameter kurang lengkap" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan internal pada server backend" }, { status: 500 });
  }
}
