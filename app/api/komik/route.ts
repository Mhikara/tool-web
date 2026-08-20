import { NextResponse } from "next/server";

// FLAG: FullManhwa read dibatasi karena cloud instability
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

function wrapProxy(url: string) {
  if (!url) return "";
  if (url.startsWith("/api/komik/image")) return url;
  return `/api/komik/image?url=${encodeURIComponent(url)}`;
}

function createResponse(data: any, status = 200, isCacheable = false) {
  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  });
  if (isCacheable) headers.set("Cache-Control", "s-maxage=43200, stale-while-revalidate");
  else headers.set("Cache-Control", "no-store, max-age=0");
  return NextResponse.json(data, { status, headers });
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
      const limit = 20;
      const offset = (page - 1) * limit;
      const allowCache = (!query && sort !== "populer" && page === 1);

      const tasks: Promise<any[]>[] = [];

      // 1. ENGINE MANGADEX
      if (sourceFilter === "semua" || sourceFilter === "all" || sourceFilter === "mangadex") {
        tasks.push(
          (async () => {
            try {
              let mdUrl = `https://api.mangadex.org/manga?includes[]=cover_art&limit=${limit}&offset=${offset}&contentRating[]=safe&contentRating[]=suggestive`;
              if (query) mdUrl += `&title=${encodeURIComponent(query)}`;
              else if (sort === "populer") mdUrl += `&order[rating]=desc`;
              else mdUrl += `&order[updatedAt]=desc`;
              
              const res = await fetch(mdUrl, { signal: AbortSignal.timeout(6000) });
              if (!res.ok) return [];
              
              const data = await res.json();
              return (data.data || []).map((manga: any) => {
                const coverRel = manga.relationships?.find((r: any) => r.type === "cover_art");
                const coverFile = coverRel?.attributes?.fileName;
                const rawCover = coverFile ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFile}.256.jpg` : "";

                const titles = manga.attributes?.title || {};
                const titleStr = titles.en || titles.id || titles["ja-ro"] || titles.ja || Object.values(titles)[0] || "Judul Tidak Diketahui";

                const lastCh = manga.attributes?.lastChapter;
                const chLabel = lastCh ? (String(lastCh).toLowerCase().startsWith("ch") ? String(lastCh) : `Ch. ${lastCh}`) : "Ch. Baru";
                const origLang = manga.attributes?.originalLanguage;
                const typeStr = origLang === "ko" ? "Manhwa" : (origLang === "zh" || origLang === "zh-hk") ? "Manhua" : "Manga";

                return {
                  id: `md:${manga.id}`,
                  title: titleStr,
                  cover: wrapProxy(rawCover),
                  type: typeStr,
                  typeLabel: typeStr,
                  source: "mangadex",
                  chapter: chLabel,
                  latestChapter: chLabel,
                  latest_chapter: chLabel,
                  statusLabel: chLabel,
                  rating: "8.9",
                  score: 8.9,
                  updateOn: formatWaktu(manga.attributes?.updatedAt || manga.attributes?.createdAt)
                };
              });
            } catch { return []; } 
          })()
        );
      }

      // 2. ENGINE KOMIKU
      if (sourceFilter === "semua" || sourceFilter === "all" || sourceFilter === "komiku") {
        tasks.push(
          (async () => {
            try {
              let url = `https://komiku.id/`;
              if (query) url = `https://komiku.id/cari/?post_type=manga&s=${encodeURIComponent(query)}`;
              else if (sort === "populer") url = `https://komiku.id/other/hot/`;

              const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
              if (!res.ok) return [];
              
              const html = await res.text();
              const results: any[] = [];
              const regex = /<div class="bge">[\s\S]*?<a href="\/manga\/([^/]+)\/"[\s\S]*?<img[^>]+(?:src|data-src|data-lazy-src)="([^"]+)"[\s\S]*?<h[34][^>]*>([\s\S]*?)<\/h[34]>([\s\S]*?)<\/div>\s*<\/div>/gi;
              
              let match;
              while ((match = regex.exec(html)) !== null && results.length < limit) {
                const slug = match[1].trim();
                const rawCover = match[2].split("?")[0].trim();
                let rawTitle = match[3].replace(/<\/?[^>]+(>|$)/g, "").trim();
                
                // Cegah judul komik terdeteksi sebagai "Chapter X"
                if (rawTitle.toLowerCase().startsWith("chapter ") && !rawTitle.toLowerCase().includes("komik")) {
                  rawTitle = `Komik ${slug.replace(/-/g, " ")}`;
                }

                const extraHtml = match[4] || "";
                const chMatch = extraHtml.match(/(?:Chapter|Ch\.)\s*[\d.]+/i);
                const chLabel = chMatch ? chMatch[0].replace("Chapter", "Ch.") : "Ch. Baru";

                results.push({
                  id: `komiku:${slug}`,
                  title: rawTitle,
                  cover: wrapProxy(rawCover),
                  type: "Manhwa/Manhua",
                  typeLabel: "Manhwa/Manhua",
                  source: "komiku",
                  chapter: chLabel,
                  latestChapter: chLabel,
                  latest_chapter: chLabel,
                  statusLabel: chLabel,
                  rating: "8.7",
                  score: 8.7,
                  updateOn: formatWaktu(new Date().toISOString())
                });
              }
              return results;
            } catch { return []; } 
          })()
        );
      }

      // 3. ENGINE FULLMANHWA
      if (sourceFilter === "semua" || sourceFilter === "all" || sourceFilter === "fullmanhwa") {
        tasks.push(
          (async () => {
            try {
              let url = `https://fullmanhwa.com/`;
              if (query) url = `https://fullmanhwa.com/?s=${encodeURIComponent(query)}`;
              else if (sort === "populer") url = `https://fullmanhwa.com/manga/?order=popular`;

              const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
              if (!res.ok) return [];
              
              const html = await res.text();
              const results: any[] = [];
              const regex = /<div class="bsx">[\s\S]*?<a href="[^"]*\/manga\/([^/]+)\/"[\s\S]*?<img[^>]+src="([^"]+)"[\s\S]*?<div class="tt">\s*([\s\S]*?)\s*<\/div>([\s\S]*?)<\/a>/gi;
              
              let match;
              while ((match = regex.exec(html)) !== null && results.length < limit) {
                const slug = match[1].trim();
                const rawCover = match[2].trim();
                let rawTitle = match[3].replace(/<\/?[^>]+(>|$)/g, "").trim();

                const extraHtml = match[4] || "";
                const chMatch = extraHtml.match(/<div class="epxs">([^<]+)<\/div>/i);
                const chLabel = chMatch ? chMatch[1].trim().replace("Chapter", "Ch.") : "Ch. Baru";

                results.push({
                  id: `fm:${slug}`,
                  title: rawTitle || slug.replace(/-/g, " "),
                  cover: wrapProxy(rawCover),
                  type: "Manhwa",
                  typeLabel: "Manhwa",
                  source: "fullmanhwa",
                  chapter: chLabel,
                  latestChapter: chLabel,
                  latest_chapter: chLabel,
                  statusLabel: chLabel,
                  rating: "8.6",
                  score: 8.6,
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

      return createResponse({
        success: true,
        data: combined,
        list: combined,
        latest: combined,
        popular: combined,
        topRated: combined.slice(0, 12),
        sources: ["mangadex", "komiku", "fullmanhwa", "omega"],
      }, 200, allowCache);
    }

    // ---------------------------------------------------------
    // ACTION: DETAIL KOMIK
    // ---------------------------------------------------------
    if (action === "detail" && id) {
      const { prefix, realId } = parseId(id);
      
      let title = "Judul Tidak Diketahui";
      let coverUrl = "";
      let description = "Tidak ada sinopsis tersedia.";
      let chapters: any[] = [];

      if (prefix === "md") {
        const [mangaRes, feedRes] = await Promise.allSettled([
          fetch(`https://api.mangadex.org/manga/${realId}?includes[]=cover_art`, { signal: AbortSignal.timeout(8000) }),
          fetch(`https://api.mangadex.org/manga/${realId}/feed?translatedLanguage[]=id&translatedLanguage[]=en&order[chapter]=desc&limit=200`, { signal: AbortSignal.timeout(8000) })
        ]);
        
        if (mangaRes.status === "fulfilled" && mangaRes.value.ok) {
          const mData = await mangaRes.value.json();
          if (mData?.data) {
             const m = mData.data;
             const titles = m.attributes?.title || {};
             title = titles.en || titles.id || titles["ja-ro"] || titles.ja || Object.values(titles)[0] || title;
             description = m.attributes?.description?.id || m.attributes?.description?.en || description;
             const coverRel = m.relationships?.find((r: any) => r.type === "cover_art");
             if (coverRel?.attributes?.fileName) {
               coverUrl = wrapProxy(`https://uploads.mangadex.org/covers/${realId}/${coverRel.attributes.fileName}.512.jpg`);
             }
          }
        }

        if (feedRes.status === "fulfilled" && feedRes.value.ok) {
          const fData = await feedRes.value.json();
          chapters = (fData.data || []).map((ch: any) => {
            const cNum = ch.attributes?.chapter;
            const cTitle = ch.attributes?.title;
            let finalTitle = "";
            if (cNum !== null && cNum !== undefined && cNum !== "") finalTitle = `Ch. ${cNum}`;
            else finalTitle = "Oneshot / Extra";
            
            if (cTitle && cTitle !== "null" && cTitle.trim() !== "" && cTitle !== "0") finalTitle += ` - ${cTitle}`;
            else if (cNum === "0") finalTitle = "Ch. 0 - Prolog";
            
            return {
              chapterId: ch.id,
              title: `${finalTitle} [${(ch.attributes?.translatedLanguage || 'ID').toUpperCase()}]`,
              lang: ch.attributes?.translatedLanguage,
            };
          });
        }
      }
      else if (prefix === "komiku") {
        const res = await fetch(`https://komiku.id/manga/${realId}/`, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const html = await res.text();
          const tMatch = html.match(/<h1 itemprop="name"[^>]*>([\s\S]*?)<\/h1>/i);
          const cMatch = html.match(/<div class="ims">[\s\S]*?<img[^>]+(?:src|data-src)="([^"]+)"/i);
          const dMatch = html.match(/<p class="desc"[^>]*>([\s\S]*?)<\/p>/i);

          title = tMatch ? tMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim() : `Komik ${realId.replace(/-/g, " ")}`;
          coverUrl = cMatch ? wrapProxy(cMatch[1].split("?")[0].trim()) : "";
          description = dMatch ? dMatch[1].trim().replace(/<[^>]+>/g, '') : "Tidak ada sinopsis.";

          const chRegex = /<a href="\/ch\/([^/]+)\/"[^>]*>([\s\S]*?)<\/a>/gi;
          let match;
          while ((match = chRegex.exec(html)) !== null) {
            let chTitle = match[2].replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();
            if (!chTitle || chTitle === "0") chTitle = `Chapter ${match[1].replace(/[^0-9]/g, '') || 'Baru'}`;
            if (chTitle.toLowerCase().includes("chapter") || chTitle.toLowerCase().includes("ch")) {
              chapters.push({ chapterId: match[1], title: chTitle, lang: "id" });
            }
          }
        }
      }
      else if (prefix === "fm") {
        const res = await fetch(`https://fullmanhwa.com/manga/${realId}/`, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const html = await res.text();
          const tMatch = html.match(/<h1 itemprop="name"[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<h1 class="entry-title"[^>]*>([\s\S]*?)<\/h1>/i);
          const cMatch = html.match(/<div class="thumb"[\s\S]*?<img[^>]+src="([^"]+)"/i);
          const dMatch = html.match(/<div itemprop="description"[\s\S]*?>([\s\S]*?)<\/div>/i) || html.match(/<div class="entry-content"[^>]*>([\s\S]*?)<\/div>/i);

          title = tMatch ? tMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim() : realId.replace(/-/g, " ");
          coverUrl = cMatch ? wrapProxy(cMatch[1].trim()) : "";
          description = dMatch ? dMatch[1].trim().replace(/<[^>]+>/g, '') : "Tidak ada sinopsis.";

          const chRegex = /<li[^>]*data-num[^>]*>[\s\S]*?<a href="[^"]*\/([^/]+)\/"[^>]*>[\s\S]*?<span class="chapternum">([^<]+)<\/span>/gi;
          let match;
          while ((match = chRegex.exec(html)) !== null) {
            let chTitle = match[2].trim();
            if (!chTitle || chTitle === "0") chTitle = `Chapter ${match[1].replace(/[^0-9]/g, '') || 'Baru'}`;
            chapters.push({ chapterId: match[1], title: chTitle, lang: "id" });
          }
        }
      }
      else {
        title = `Komik (${prefix})`;
        description = `Sumber web '${prefix}' saat ini tidak aktif atau sedang dalam pemeliharaan.`;
        chapters = [{ chapterId: "error", title: "Pemberitahuan Sistem (Offline)", lang: "id" }];
      }

      return createResponse({
        success: true,
        title,
        cover: coverUrl,
        description,
        chapters,
        data: { title, cover: coverUrl, description, chapters }
      }, 200, true);
    }

    // ---------------------------------------------------------
    // ACTION: READ (BACA CHAPTER)
    // ---------------------------------------------------------
    if (action === "read" && id && chapterId) {
      const { prefix } = parseId(id);

      if (prefix === "fm" && !FM_READ_ENABLED) {
        return createResponse({ error: "Server FullManhwa sedang tidak stabil (Rawan 500 Cloudflare). Silakan baca komik ini melalui sumber MangaDex atau Komiku." }, 403);
      }
      if (prefix === "omega" || chapterId === "error") {
        return createResponse({ error: "Sistem tidak dapat memuat gambar karena sumber dari web ini offline." }, 403);
      }

      if (prefix === "fm") {
        const res = await fetch(`https://fullmanhwa.com/${chapterId}/`, { signal: AbortSignal.timeout(9000) });
        if (!res.ok) return createResponse({ error: "Gagal menghubungi server FullManhwa." }, 502);
        const html = await res.text();
        const readerArea = html.match(/<div id="readerarea"[^>]*>([\s\S]*?)<\/div>/i);
        if (!readerArea) return createResponse({ error: "Area gambar tidak ditemukan." }, 404);
        
        let images: string[] = [];
        const imgRegex = /<img[^>]+src="([^"]+)"/gi;
        let imgM;
        while ((imgM = imgRegex.exec(readerArea[1])) !== null) images.push(imgM[1].trim());
        return createResponse({ success: true, images }, 200, true);
      }

      if (prefix === "md") {
        const mdHost = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`, { signal: AbortSignal.timeout(9000) });
        if (!mdHost.ok) return createResponse({ error: "Gagal menghubungi MangaDex." }, 502);
        
        const hostData = await mdHost.json();
        if (hostData.result !== "ok" || !hostData.chapter) return createResponse({ error: "Sistem MangaDex menolak permintaan." }, 403);

        const baseUrl = hostData.baseUrl;
        const hash = hostData.chapter.hash;
        const chapterImages = hostData.chapter.data?.length > 0 ? hostData.chapter.data : hostData.chapter.dataSaver || [];
        if (chapterImages.length === 0) return createResponse({ error: "Halaman kosong." }, 404);

        const images = chapterImages.map((file: string) => `${baseUrl}/data/${hash}/${file}`);
        return createResponse({ success: true, images }, 200, true);
      }

      if (prefix === "komiku") {
         const res = await fetch(`https://komiku.id/ch/${chapterId}/`, { signal: AbortSignal.timeout(9000) });
         if (!res.ok) return createResponse({ error: "Gagal menghubungi server Komiku." }, 502);
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
         if (images.length === 0) return createResponse({ error: "Gambar tidak ditemukan." }, 404);
         return createResponse({ success: true, images }, 200, true);
      }
      
      return createResponse({ error: "Aksi baca tidak dikenali." }, 400);
    }

    return createResponse({ error: "Aksi tidak dikenali atau parameter kurang lengkap" }, 400);

  } catch (error: any) {
    return createResponse({ error: error.message || "Terjadi kesalahan internal" }, 500);
  }
}
