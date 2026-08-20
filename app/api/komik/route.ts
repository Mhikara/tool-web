import { NextResponse } from "next/server";

const FM_READ_ENABLED = true; // Diaktifkan dengan timeout aman & fallback

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
  const decoded = decodeURIComponent(rawId);
  const parts = decoded.split(":");
  if (parts.length > 1) return { prefix: parts[0].toLowerCase(), realId: parts.slice(1).join(":") };
  return { prefix: "md", realId: decoded };
}

function wrapProxy(url: string) {
  if (!url) return "";
  if (url.startsWith("/api/komik/image")) return url;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return url;
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
  const rawId = searchParams.get("id") || "";
  const rawChapter = searchParams.get("chapter") || searchParams.get("chapterId") || searchParams.get("chapter_id") || "";
  const sourceFilter = (searchParams.get("source") || "semua").toLowerCase();
  const sort = searchParams.get("sort") || "update"; 

  try {
    // ---------------------------------------------------------
    // 1. ACTION: HOME / SEARCH / KATALOG 
    // ---------------------------------------------------------
    if (action === "home" || action === "search" || action === "katalog") {
      const query = searchParams.get("q") || "";
      const page = Number(searchParams.get("page") || "1");
      const limit = 20;
      const offset = (page - 1) * limit;
      const allowCache = (!query && sort !== "populer" && page === 1);

      const tasks: Promise<any[]>[] = [];

      // ENGINE: MANGADEX
      if (sourceFilter === "semua" || sourceFilter === "all" || sourceFilter === "mangadex") {
        tasks.push(
          (async () => {
            try {
              let mdUrl = `https://api.mangadex.org/manga?includes[]=cover_art&limit=${limit}&offset=${offset}&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica`;
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

      // ENGINE: KOMIKU
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

      // ENGINE: FULLMANHWA
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

      const normalized = (combined || []).map((x: any) => ({
        ...x,
        typeLabel: x.typeLabel || x.type || x.source,
        statusLabel: x.statusLabel || x.latestChapter || x.chapter || "",
        source: String(x.source || "").toLowerCase(),
      }));

      return createResponse({
        success: true,
        data: normalized,
        list: normalized,
        latest: normalized,
        popular: normalized,
        topRated: normalized.slice(0, 12),
        sources: ["mangadex", "komiku", "fullmanhwa", "omega"],
      }, 200, allowCache);
    }

    // ---------------------------------------------------------
    // 2. ACTION: DETAIL KOMIK
    // ---------------------------------------------------------
    if (action === "detail" && rawId) {
      const { prefix, realId } = parseId(rawId);
      
      let title = "Judul Tidak Diketahui";
      let coverUrl = "";
      let description = "Tidak ada sinopsis tersedia.";
      let status = "Ongoing";
      let typeStr = "Manhwa";
      let author = "Unknown";
      let genres: string[] = ["Action", "Adventure", "Fantasy"];
      let chapters: any[] = [];

      // DETAIL: MANGADEX
      if (prefix === "md") {
        const [mangaRes, feedRes] = await Promise.allSettled([
          fetch(`https://api.mangadex.org/manga/${realId}?includes[]=cover_art&includes[]=author&includes[]=artist`, { signal: AbortSignal.timeout(8000) }),
          fetch(`https://api.mangadex.org/manga/${realId}/feed?translatedLanguage[]=id&translatedLanguage[]=en&limit=500&order[chapter]=desc&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic`, { signal: AbortSignal.timeout(8000) })
        ]);
        
        if (mangaRes.status === "fulfilled" && mangaRes.value.ok) {
          const mData = await mangaRes.value.json();
          if (mData?.data) {
             const m = mData.data;
             const titles = m.attributes?.title || {};
             title = titles.en || titles.id || titles["ja-ro"] || titles.ja || Object.values(titles)[0] || title;
             description = m.attributes?.description?.id || m.attributes?.description?.en || Object.values(m.attributes?.description || {})[0] || description;
             status = m.attributes?.status || status;
             const origLang = m.attributes?.originalLanguage;
             typeStr = origLang === "ko" ? "Manhwa" : (origLang === "zh" || origLang === "zh-hk") ? "Manhua" : "Manga";

             // Author
             const authorRel = m.relationships?.find((r: any) => r.type === "author" || r.type === "artist");
             if (authorRel?.attributes?.name) author = authorRel.attributes.name;

             // Genres
             if (Array.isArray(m.attributes?.tags)) {
               genres = m.attributes.tags.map((t: any) => t.attributes?.name?.en).filter(Boolean);
             }

             // Cover
             const coverRel = m.relationships?.find((r: any) => r.type === "cover_art");
             if (coverRel?.attributes?.fileName) {
               coverUrl = wrapProxy(`https://uploads.mangadex.org/covers/${realId}/${coverRel.attributes.fileName}.512.jpg`);
             }
          }
        }

        // Parse MangaDex Chapters
        if (feedRes.status === "fulfilled" && feedRes.value.ok) {
          const fData = await feedRes.value.json();
          let feedList = fData.data || [];

          // Fallback jika id/en kosong: ambil semua bahasa
          if (feedList.length === 0) {
            try {
              const fallbackRes = await fetch(`https://api.mangadex.org/manga/${realId}/feed?limit=500&order[chapter]=desc&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica`, { signal: AbortSignal.timeout(6000) });
              if (fallbackRes.ok) {
                const fbJson = await fallbackRes.json();
                feedList = fbJson.data || [];
              }
            } catch {}
          }

          chapters = feedList.map((ch: any) => {
            const cNum = ch.attributes?.chapter;
            const cTitle = ch.attributes?.title;
            const lang = (ch.attributes?.translatedLanguage || "id").toUpperCase();
            
            let displayTitle = "";
            if (cNum !== null && cNum !== undefined && cNum !== "") {
              displayTitle = `Chapter ${cNum}`;
            } else {
              displayTitle = "Oneshot / Extra";
            }
            
            if (cTitle && cTitle !== "null" && cTitle.trim() !== "" && cTitle !== "0") {
              displayTitle += ` - ${cTitle}`;
            } else if (cNum === "0") {
              displayTitle = "Chapter 0 - Prolog";
            }

            return {
              id: ch.id,
              chapterId: ch.id,
              chapter_id: ch.id,
              slug: ch.id,
              endpoint: ch.id,
              title: `${displayTitle} [${lang}]`,
              name: `${displayTitle} [${lang}]`,
              chapter: cNum || "0",
              chapterNumber: cNum || "0",
              lang: ch.attributes?.translatedLanguage || "id",
              date: formatWaktu(ch.attributes?.publishAt || ch.attributes?.createdAt),
            };
          });
        }
      }

      // DETAIL: KOMIKU
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

          const chRegex = /<a[^>]+href="[^"]*\/ch\/([^/"]+)\/?"[^>]*>([\s\S]*?)<\/a>/gi;
          let match;
          while ((match = chRegex.exec(html)) !== null) {
            const chSlug = match[1].trim();
            let rawChTitle = match[2].replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();
            if (!rawChTitle || rawChTitle === "0") {
              rawChTitle = `Chapter ${chSlug.replace(/[^0-9.]/g, '') || 'Baru'}`;
            }

            chapters.push({
              id: chSlug,
              chapterId: chSlug,
              chapter_id: chSlug,
              slug: chSlug,
              endpoint: chSlug,
              title: rawChTitle,
              name: rawChTitle,
              chapter: chSlug.replace(/[^0-9.]/g, '') || "0",
              chapterNumber: chSlug.replace(/[^0-9.]/g, '') || "0",
              lang: "id",
              date: "Baru Saja",
            });
          }
        }
      }

      // DETAIL: FULLMANHWA
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

          const chRegex = /<li[^>]*>[\s\S]*?<a[^>]+href="https?:\/\/fullmanhwa\.com\/([^/"]+)\/?"[^>]*>([\s\S]*?)<\/a>/gi;
          let match;
          while ((match = chRegex.exec(html)) !== null) {
            const chSlug = match[1].trim();
            let rawChTitle = match[2].replace(/<\/?[^>]+(>|$)/g, "").trim();
            if (rawChTitle.toLowerCase().includes("chapter") || chSlug.includes("chapter")) {
              if (!rawChTitle || rawChTitle === "0") rawChTitle = `Chapter ${chSlug.replace(/[^0-9.]/g, '') || 'Baru'}`;
              chapters.push({
                id: chSlug,
                chapterId: chSlug,
                chapter_id: chSlug,
                slug: chSlug,
                endpoint: chSlug,
                title: rawChTitle,
                name: rawChTitle,
                chapter: chSlug.replace(/[^0-9.]/g, '') || "0",
                chapterNumber: chSlug.replace(/[^0-9.]/g, '') || "0",
                lang: "id",
                date: "Baru Saja",
              });
            }
          }
        }
      }

      // DETAIL: FALLBACK SUMBER LAIN
      else {
        title = `Komik (${prefix})`;
        description = `Sumber web '${prefix}' saat ini tidak aktif atau sedang dalam pemeliharaan.`;
        chapters = [{
          id: "error",
          chapterId: "error",
          slug: "error",
          title: "Pemberitahuan Sistem (Offline)",
          name: "Pemberitahuan Sistem (Offline)",
          chapter: "0",
          lang: "id",
          date: "Hari ini"
        }];
      }

      const detailPayload = {
        id: rawId,
        title,
        name: title,
        cover: coverUrl,
        thumb: coverUrl,
        image: coverUrl,
        description,
        synopsis: description,
        desc: description,
        status,
        type: typeStr,
        typeLabel: typeStr,
        author,
        genres,
        genre: genres,
        total_chapters: chapters.length,
        totalChapters: chapters.length,
        chapterCount: chapters.length,
        chapters,
        chapter_list: chapters,
        chapterList: chapters,
        list: chapters,
      };

      return createResponse({
        success: true,
        ...detailPayload,
        data: detailPayload,
        manga: detailPayload,
        detail: detailPayload,
      }, 200, true);
    }

    // ---------------------------------------------------------
    // 3. ACTION: READ (BACA CHAPTER GAMBAR)
    // ---------------------------------------------------------
    if (action === "read" && rawId && rawChapter) {
      const { prefix } = parseId(rawId);
      const cleanChapterId = decodeURIComponent(rawChapter).trim();

      // READ: MANGADEX
      if (prefix === "md") {
        const mdHost = await fetch(`https://api.mangadex.org/at-home/server/${cleanChapterId}?forcePort443=true`, { signal: AbortSignal.timeout(9000) });
        if (!mdHost.ok) return createResponse({ error: "Gagal menghubungi server MangaDex." }, 502);
        
        const hostData = await mdHost.json();
        if (hostData.result !== "ok" || !hostData.chapter) return createResponse({ error: "Sistem MangaDex menolak permintaan chapter." }, 403);

        const baseUrl = hostData.baseUrl;
        const hash = hostData.chapter.hash;
        const rawImages = hostData.chapter.data?.length > 0 ? hostData.chapter.data : hostData.chapter.dataSaver || [];
        if (rawImages.length === 0) return createResponse({ error: "Halaman chapter kosong." }, 404);

        const images = rawImages.map((file: string) => `${baseUrl}/data/${hash}/${file}`);
        return createResponse({
          success: true,
          images,
          chapter: { images, totalImages: images.length }
        }, 200, true);
      }

      // READ: KOMIKU
      if (prefix === "komiku") {
         const res = await fetch(`https://komiku.id/ch/${cleanChapterId}/`, { signal: AbortSignal.timeout(9000) });
         if (!res.ok) return createResponse({ error: "Gagal menghubungi server Komiku." }, 502);
         const html = await res.text();
         
         let images: string[] = [];
         const imgRegex = /<img[^>]+(?:src|data-src|data-lazy-src)="([^"]+)"/gi;
         let match;
         while ((match = imgRegex.exec(html)) !== null) {
           const imgUrl = match[1].trim();
           if (!imgUrl.includes("gif") && !imgUrl.includes("banner") && !imgUrl.includes("logo") && !imgUrl.includes("iklan") && !imgUrl.includes("avatar")) {
             if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
               images.push(imgUrl);
             }
           }
         }
         if (images.length === 0) return createResponse({ error: "Gambar chapter tidak ditemukan." }, 404);
         return createResponse({
           success: true,
           images,
           chapter: { images, totalImages: images.length }
         }, 200, true);
      }

      // READ: FULLMANHWA
      if (prefix === "fm") {
        if (!FM_READ_ENABLED) {
          return createResponse({ error: "Server FullManhwa sedang tidak stabil. Silakan baca melalui MangaDex atau Komiku." }, 403);
        }
        const res = await fetch(`https://fullmanhwa.com/${cleanChapterId}/`, { signal: AbortSignal.timeout(9000) });
        if (!res.ok) return createResponse({ error: "Gagal menghubungi server FullManhwa." }, 502);
        const html = await res.text();
        const readerArea = html.match(/<div id="readerarea"[^>]*>([\s\S]*?)<\/div>/i) || html.match(/<div class="reading-content"[^>]*>([\s\S]*?)<\/div>/i);
        
        let images: string[] = [];
        const contentHtml = readerArea ? readerArea[1] : html;
        const imgRegex = /<img[^>]+src="([^"]+)"/gi;
        let match;
        while ((match = imgRegex.exec(contentHtml)) !== null) {
          const imgUrl = match[1].trim();
          if (!imgUrl.includes("gif") && !imgUrl.includes("banner") && !imgUrl.includes("logo")) {
            images.push(imgUrl);
          }
        }
        if (images.length === 0) return createResponse({ error: "Gambar tidak ditemukan di FullManhwa." }, 404);
        return createResponse({
          success: true,
          images,
          chapter: { images, totalImages: images.length }
        }, 200, true);
      }
      
      return createResponse({ error: "Aksi baca tidak didukung untuk sumber ini." }, 400);
    }

    return createResponse({ error: "Aksi tidak dikenali atau parameter kurang lengkap" }, 400);

  } catch (error: any) {
    return createResponse({ error: error.message || "Terjadi kesalahan internal" }, 500);
  }
}
