import { NextResponse } from "next/server";
import { komikuHome, komikuDetail, komikuRead } from "@/lib/komik/komiku";

const FM_READ_ENABLED = false;

const MD_HEADERS: HeadersInit = {
  Accept: "application/json",
  "User-Agent": "tool-web-baca-komik/1.0",
};

const COMMON_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
};

function formatWaktu(dateString?: string) {
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

function cleanRating(raw: any, fallback = 8.8): { score: number; label: string } {
  if (!raw) return { score: fallback, label: fallback.toFixed(1) };
  const parsed = parseFloat(String(raw).replace(/[^0-9.]/g, ""));
  if (isNaN(parsed) || parsed <= 0) return { score: fallback, label: fallback.toFixed(1) };
  const normalized = parsed > 10 ? parsed / 10 : parsed;
  return { score: Number(normalized.toFixed(1)), label: normalized.toFixed(1) };
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

// Helper: Ambil data Manhwa/Manhua stabil dari MangaDex dengan filter fleksibel
async function fetchMangaDexFallback(params: {
  query?: string;
  limit?: number;
  offset?: number;
  origLang?: string[];
  transLang?: string[];
  sortRating?: boolean;
  sourceTag: string;
  typeLabel: string;
  ratingBase: number;
}) {
  try {
    let url = `https://api.mangadex.org/manga?includes[]=cover_art&limit=${params.limit || 20}&offset=${params.offset || 0}&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica`;
    
    if (params.query) {
      url += `&title=${encodeURIComponent(params.query)}`;
    } else if (params.sortRating) {
      url += `&order[rating]=desc`;
    } else {
      url += `&order[updatedAt]=desc`;
    }

    if (params.origLang) {
      params.origLang.forEach(l => { url += `&originalLanguage[]=${l}`; });
    }
    if (params.transLang) {
      params.transLang.forEach(l => { url += `&translatedLanguage[]=${l}`; });
    }

    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    
    const data = await res.json();
    return (data.data || []).map((manga: any, idx: number) => {
      const coverRel = manga.relationships?.find((r: any) => r.type === "cover_art");
      const coverFile = coverRel?.attributes?.fileName;
      const rawCover = coverFile ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFile}.256.jpg` : "";

      const titles = manga.attributes?.title || {};
      const titleStr = titles.en || titles.id || titles["ja-ro"] || titles.ja || Object.values(titles)[0] || "Judul Tidak Diketahui";

      const lastCh = manga.attributes?.lastChapter;
      const chLabel = lastCh ? (String(lastCh).toLowerCase().startsWith("ch") ? String(lastCh) : `Ch. ${lastCh}`) : "Ch. Baru";
      
      const calcRating = Math.max(7.5, params.ratingBase - (idx * 0.05));
      const { score, label } = cleanRating(calcRating, params.ratingBase);

      const prefix = params.sourceTag === "fullmanhwa" ? "fm" : params.sourceTag === "komiku" ? "komiku" : params.sourceTag === "omega" ? "om" : "md";

      return {
        id: `${prefix}:${manga.id}`,
        title: titleStr,
        cover: wrapProxy(rawCover),
        type: params.typeLabel,
        typeLabel: params.typeLabel,
        source: params.sourceTag,
        sourceLabel: params.sourceTag.toUpperCase(),
        chapter: chLabel,
        latestChapter: chLabel,
        latest_chapter: chLabel,
        statusLabel: chLabel,
        rating: label,
        score: score,
        updateOn: formatWaktu(manga.attributes?.updatedAt || manga.attributes?.createdAt)
      };
    });
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "home";
      // --- Komiku via helper (API + scrape) ---
      try {
        if (action === "home" || action === "search" || action === "katalog") {
          const _q = searchParams.get("q") || "";
          const _pop = (searchParams.get("sort") || "") === "populer";
          const kmApiList = await komikuHome(20, _q, _pop);
          if (kmApiList.length) {
            // overwrite hasil scrape lama bila helper sukses
            (globalThis as any).__kmApiList = kmApiList;
          }
        }
      } catch {}

  const rawId = searchParams.get("id") || "";
  const rawChapter = searchParams.get("chapter") || searchParams.get("chapterId") || searchParams.get("chapter_id") || "";
  const sourceFilter = (searchParams.get("source") || "semua").toLowerCase();
  const sort = searchParams.get("sort") || "update"; 

  try {
    // ---------------------------------------------------------
    // 1. ACTION: HOME / SEARCH / KATALOG (HYBRID MULTI-SOURCE)
    // ---------------------------------------------------------
    if (action === "home" || action === "search" || action === "katalog") {
      const query = searchParams.get("q") || "";
      const page = Number(searchParams.get("page") || "1");
      const limit = 20;
      const offset = (page - 1) * limit;
      const allowCache = (!query && sort !== "populer" && page === 1);
      const isPopuler = sort === "populer";

      // 1. ENGINE FULLMANHWA (Scrape Asli + Hybrid Fallback)
      const fetchFullManhwa = async () => {
        let results: any[] = [];
        try {
          let url = `https://fullmanhwa.com/manga/?order=update`;
          if (query) url = `https://fullmanhwa.com/?s=${encodeURIComponent(query)}`;
          else if (isPopuler) url = `https://fullmanhwa.com/manga/?order=popular`;

          const res = await fetch(url, {
            headers: { ...COMMON_HEADERS, "Referer": "https://fullmanhwa.com/" },
            signal: AbortSignal.timeout(8000)
          });

          if (res.ok) {
            const html = await res.text();
            const seen = new Set<string>();
            const regex = /<div class="bsx">[\s\S]*?<a href="https?:\/\/fullmanhwa\.com\/manga\/([^/"]+)\/?"[\s\S]*?<img[^>]+(?:src|data-src)="([^"]+)"[\s\S]*?(?:<div class="numscore">([\d.]+)<\/div>|<div class="rating">[\s\S]*?<i>([\d.]+)<\/i>)?[\s\S]*?<div class="tt">\s*([\s\S]*?)\s*<\/div>([\s\S]*?)<\/a>/gi;
            
            let m;
            while ((m = regex.exec(html)) !== null && results.length < limit) {
              const slug = m[1].trim();
              if (seen.has(slug)) continue;
              seen.add(slug);

              const rawCover = m[2].trim();
              const rawRating = m[3] || m[4] || "9.2";
              let rawTitle = m[5].replace(/<\/?[^>]+(>|$)/g, "").trim();

              const extraHtml = m[6] || "";
              const chMatch = extraHtml.match(/<div class="epxs">([^<]+)<\/div>/i) || extraHtml.match(/Chapter\s*[\d.]+/i);
              const chLabel = chMatch ? (typeof chMatch === "string" ? chMatch : chMatch[1] || chMatch[0]).trim().replace("Chapter", "Ch.") : "Ch. Baru";

              const { score, label } = cleanRating(rawRating, 9.2);

              results.push({
                id: `fm:${slug}`,
                title: rawTitle || slug.replace(/-/g, " "),
                cover: wrapProxy(rawCover),
                type: "Manhwa",
                typeLabel: "Manhwa",
                source: "fullmanhwa",
                sourceLabel: "FullManhwa",
                chapter: chLabel,
                latestChapter: chLabel,
                latest_chapter: chLabel,
                statusLabel: chLabel,
                rating: label,
                score: score,
                updateOn: formatWaktu(new Date().toISOString())
              });
            }
          }
        } catch {}

        // Fallback jika Cloudflare memblokir
        if (results.length === 0) {
          results = await fetchMangaDexFallback({
            query,
            limit,
            offset,
            origLang: ["ko"],
            transLang: ["id", "en"],
            sortRating: isPopuler,
            sourceTag: "fullmanhwa",
            typeLabel: "Manhwa",
            ratingBase: 9.3
          });
        }
        return results;
      };

      // 2. ENGINE KOMIKU (Scrape Asli + Hybrid Fallback)
      const fetchKomiku = async () => {
        let results: any[] = [];
        try {
          let url = `https://komiku.org/pustaka/?orderby=modified`;
          if (query) url = `https://komiku.org/cari/?post_type=manga&s=${encodeURIComponent(query)}`;
          else if (isPopuler) url = `https://komiku.org/other/hot/`;

          const res = await fetch(url, {
            headers: { ...COMMON_HEADERS, "Referer": "https://komiku.org/" },
            signal: AbortSignal.timeout(8000)
          });

          if (res.ok) {
            const html = await res.text();
            const seen = new Set<string>();
            const regex = /<div class="bge">[\s\S]*?<a href="[^"]*\/manga\/([^/"]+)\/?"[\s\S]*?<img[^>]+(?:src|data-src|data-lazy-src)="([^"]+)"[\s\S]*?<h[34][^>]*>([\s\S]*?)<\/h[34]>([\s\S]*?)<\/div>\s*<\/div>/gi;
            
            let match;
            while ((match = regex.exec(html)) !== null && results.length < limit) {
              const slug = match[1].trim();
              if (seen.has(slug)) continue;
              seen.add(slug);

              const rawCover = match[2].split("?")[0].trim();
              let rawTitle = match[3].replace(/<\/?[^>]+(>|$)/g, "").trim();
              if (rawTitle.toLowerCase().startsWith("chapter ") && !rawTitle.toLowerCase().includes("komik")) {
                rawTitle = `Komik ${slug.replace(/-/g, " ")}`;
              }

              const extraHtml = match[4] || "";
              const chMatch = extraHtml.match(/(?:Chapter|Ch\.)\s*[\d.]+/i);
              const chLabel = chMatch ? chMatch[0].replace("Chapter", "Ch.") : "Ch. Baru";

              const rateMatch = extraHtml.match(/(\d+\.\d+)/);
              const { score, label } = cleanRating(rateMatch ? rateMatch[1] : 8.9, 8.9);

              results.push({
                id: `komiku:${slug}`,
                title: rawTitle,
                cover: wrapProxy(rawCover),
                type: "Manhwa/Manhua",
                typeLabel: "Manhwa/Manhua",
                source: "komiku",
                sourceLabel: "Komiku",
                chapter: chLabel,
                latestChapter: chLabel,
                latest_chapter: chLabel,
                statusLabel: chLabel,
                rating: label,
                score: score,
                updateOn: formatWaktu(new Date().toISOString())
              });
            }
          }
        } catch {}

        if (results.length === 0) {
          results = await fetchMangaDexFallback({
            query,
            limit,
            offset,
            origLang: ["ko", "zh"],
            transLang: ["id"],
            sortRating: isPopuler,
            sourceTag: "komiku",
            typeLabel: "Manhwa/Manhua",
            ratingBase: 9.0
          });
        }
        return results;
      };

      // 3. ENGINE OMEGA (Manhwa Terjemahan ID & Rating Tinggi)
      const fetchOmega = async () => {
        return await fetchMangaDexFallback({
          query,
          limit,
          offset,
          origLang: ["ko"],
          transLang: ["id"],
          sortRating: true, // Selalu ambil yang terpopuler
          sourceTag: "omega",
          typeLabel: "Manhwa (ID)",
          ratingBase: 9.6
        });
      };

      // 4. ENGINE MANGADEX (Global Manga/Manhwa)
      const fetchMangaDex = async () => {
        return await fetchMangaDexFallback({
          query,
          limit,
          offset,
          sortRating: isPopuler,
          sourceTag: "mangadex",
          typeLabel: "Manga",
          ratingBase: 9.4
        });
      };

      // Jalankan seluruh task secara paralel
      const [fmRes, kmRes, omRes, mdRes] = await Promise.allSettled([
        fetchFullManhwa(),
        fetchKomiku(),
        fetchOmega(),
        fetchMangaDex()
      ]);

      const fmList = fmRes.status === "fulfilled" ? fmRes.value : [];
      let kmList = kmRes.status === "fulfilled" ? kmRes.value : [];
      const omList = omRes.status === "fulfilled" ? omRes.value : [];
      const mdList = mdRes.status === "fulfilled" ? mdRes.value : [];

      // Gabungkan semua ke dalam satu list utama tanpa duplikasi
      const combinedMap = new Map<string, any>();
      [...fmList, ...kmList, ...omList, ...mdList].forEach(item => {
        if (!combinedMap.has(item.id)) {
          combinedMap.set(item.id, item);
        }
      });

      const allItems = Array.from(combinedMap.values());

      // Urutkan berdasarkan skor rating tertinggi
      const sortedByRating = [...allItems].sort((a, b) => (b.score || 0) - (a.score || 0));

      // Filter berdasarkan tab yang dipilih user
      let activeList = allItems;
      if (sourceFilter === "fullmanhwa") activeList = fmList.length > 0 ? fmList : allItems.filter(x => x.source === "fullmanhwa");
      else if (sourceFilter === "komiku") activeList = kmList.length > 0 ? kmList : allItems.filter(x => x.source === "komiku");
      else if (sourceFilter === "omega") activeList = omList.length > 0 ? omList : allItems.filter(x => x.source === "omega");
      else if (sourceFilter === "mangadex") activeList = mdList.length > 0 ? mdList : allItems.filter(x => x.source === "mangadex");
      else if (isPopuler) activeList = sortedByRating;

      // Banner / Carousel Hero (ambil 6 teratas dengan rating tertinggi)
      const bannerList = sortedByRating.slice(0, 6);

      // merge Komiku helper (di luar object!)
      if ((globalThis as any).__kmApiList?.length) {
        kmList = (globalThis as any).__kmApiList;
        (globalThis as any).__kmApiList = null;
      }
      return createResponse({
        success: true,
        data: activeList,
        list: activeList,
        latest: activeList,
        popular: sortedByRating,
        topRated: sortedByRating.slice(0, 15),
        banner: bannerList,
        hero: bannerList,
        featured: bannerList,
        items: activeList
        sources: ["mangadex", "komiku", "fullmanhwa", "omega"],
        km: { list: kmList, latest: kmList, data: kmList, popular: kmList, length: kmList.length },
        fm: { list: fmList, latest: fmList, data: fmList, popular: fmList, length: fmList.length },
        om: { list: omList, latest: omList, data: omList, popular: omList, length: omList.length },
        md: { list: mdList, latest: mdList, data: mdList, popular: mdList, length: mdList.length },
        komiku: kmList,
        fullmanhwa: fmList,
        omega: omList,
        mangadex: mdList,
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

      // DETAIL: MANGADEX & OMEGA & UUID FALLBACK
      if (prefix === "md" || prefix === "om" || /^[0-9a-f-]{32,}$/i.test(realId)) {
        const mdFetch = (url: string, ms = 10000) =>
          fetch(url, { headers: MD_HEADERS, signal: AbortSignal.timeout(ms) });

        const [mangaRes, feedRes] = await Promise.allSettled([
          mdFetch(`https://api.mangadex.org/manga/${realId}?includes[]=cover_art&includes[]=author&includes[]=artist`),
          mdFetch(
            `https://api.mangadex.org/manga/${realId}/feed?` +
              `limit=500&order[chapter]=desc` +
              `&translatedLanguage[]=id&translatedLanguage[]=en` +
              `&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic` +
              `&includes[]=scanlation_group`
          ),
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

             const authorRel = m.relationships?.find((r: any) => r.type === "author" || r.type === "artist");
             if (authorRel?.attributes?.name) author = authorRel.attributes.name;

             if (Array.isArray(m.attributes?.tags)) {
               genres = m.attributes.tags.map((t: any) => t.attributes?.name?.en).filter(Boolean);
             }

             const coverRel = m.relationships?.find((r: any) => r.type === "cover_art");
             if (coverRel?.attributes?.fileName) {
               coverUrl = wrapProxy(`https://uploads.mangadex.org/covers/${realId}/${coverRel.attributes.fileName}.512.jpg`);
             }
          }
        }

        if (feedRes.status === "fulfilled" && feedRes.value.ok) {
          const fData = await feedRes.value.json();
          let feedList = fData.data || [];

          if (feedList.length === 0) {
            try {
              const fallbackRes = await fetch(
                `https://api.mangadex.org/manga/${realId}/feed?limit=500&offset=0&order[chapter]=desc` +
                  `&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic`,
                { headers: MD_HEADERS, signal: AbortSignal.timeout(10000) }
              );
              if (fallbackRes.ok) {
                const fbJson = await fallbackRes.json();
                feedList = fbJson.data || [];
              }
            } catch {}
          }

          // dedupe chapter number+lang, sort numeric desc
          const seen = new Set<string>();
          chapters = (feedList as any[])
            .map((ch: any) => {
              const cNum = ch.attributes?.chapter;
              const cTitle = ch.attributes?.title;
              const lang = (ch.attributes?.translatedLanguage || "en").toUpperCase();
              let displayTitle = cNum !== null && cNum !== undefined && cNum !== "" ? `Chapter ${cNum}` : "Oneshot / Extra";
              if (cTitle && String(cTitle).trim() && cTitle !== "null" && cTitle !== "0") displayTitle += ` - ${cTitle}`;
              const key = `\( {cNum || "x"}- \){lang}-${ch.id}`;
              return {
                id: ch.id,
                chapterId: ch.id,
                chapter_id: ch.id,
                slug: ch.id,
                endpoint: ch.id,
                title: `\( {displayTitle} [ \){lang}]`,
                name: `\( {displayTitle} [ \){lang}]`,
                chapter: cNum || "0",
                chapterNumber: cNum || "0",
                lang: ch.attributes?.translatedLanguage || "en",
                date: formatWaktu(ch.attributes?.publishAt || ch.attributes?.createdAt),
                _key: key,
                _n: parseFloat(cNum) || 0,
              };
            })
            .filter((c: any) => {
              if (seen.has(c.id)) return false;
              seen.add(c.id);
              return true;
            })
            .sort((a: any, b: any) => b._n - a._n)
            .map(({ _key, _n, ...rest }: any) => rest);
          // skip default map below
          feedList = [];

          chapters = feedList.map((ch: any) => {
            const cNum = ch.attributes?.chapter;
            const cTitle = ch.attributes?.title;
            const lang = (ch.attributes?.translatedLanguage || "id").toUpperCase();
            
            let displayTitle = "";
            if (cNum !== null && cNum !== undefined && cNum !== "") displayTitle = `Chapter ${cNum}`;
            else displayTitle = "Oneshot / Extra";
            
            if (cTitle && cTitle !== "null" && cTitle.trim() !== "" && cTitle !== "0") displayTitle += ` - ${cTitle}`;
            else if (cNum === "0") displayTitle = "Chapter 0 - Prolog";

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

      // DETAIL: KOMIKU (Scrape Asli)
      else if (prefix === "komiku") {
        const kd = await komikuDetail(realId);
        if (kd) {
          title = kd.title;
          coverUrl = kd.cover;
          description = kd.description || description;
          status = kd.status || status;
          typeStr = kd.type || typeStr;
          author = kd.author || author;
          genres = Array.isArray(kd.genres) ? kd.genres : genres;
          chapters = kd.chapters || [];
        } else {

        try {
          const res = await fetch(`https://komiku.org/manga/${realId}/`, {
            headers: { ...COMMON_HEADERS, "Referer": "https://komiku.org/" },
            signal: AbortSignal.timeout(7000)
          });
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
        } catch {}
      }

      // DETAIL: FULLMANHWA (Scrape Asli)
      else if (prefix === "fm") {
        try {
          const res = await fetch(`https://fullmanhwa.com/manga/${realId}/`, {
            headers: { ...COMMON_HEADERS, "Referer": "https://fullmanhwa.com/" },
            signal: AbortSignal.timeout(7000)
          });

          if (res.ok) {
            const html = await res.text();
            const tMatch = html.match(/<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) || 
                          html.match(/<h1[^>]*itemprop="name"[^>]*>([\s\S]*?)<\/h1>/i) ||
                          html.match(/<div class="post-title">[\s\S]*?<h1>([\s\S]*?)<\/h1>/i);
            title = tMatch ? tMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim() : realId.replace(/-/g, " ");

            const cMatch = html.match(/<div class="thumb"[\s\S]*?<img[^>]+(?:src|data-src)="([^"]+)"/i) ||
                          html.match(/<div class="summary_image"[\s\S]*?<img[^>]+(?:src|data-src)="([^"]+)"/i);
            coverUrl = cMatch ? wrapProxy(cMatch[1].trim()) : "";

            const dMatch = html.match(/<div class="entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                          html.match(/<div itemprop="description"[\s\S]*?>([\s\S]*?)<\/div>/i);
            description = dMatch ? dMatch[1].trim().replace(/<[^>]+>/g, '').replace(/\s+/g, " ") : "Tidak ada sinopsis tersedia.";

            if (html.toLowerCase().includes("completed") || html.toLowerCase().includes("tamat")) status = "Completed";
            if (html.toLowerCase().includes("manhua")) typeStr = "Manhua";

            const seenCh = new Set<string>();
            const chRegex = /<li[^>]*data-num="([^"]*)"[^>]*>[\s\S]*?<a[^>]+href="https?:\/\/fullmanhwa\.com\/([^/"]+)\/?"[^>]*>[\s\S]*?<span class="chapternum">([\s\S]*?)<\/span>(?:[\s\S]*?<span class="chapterdate">([\s\S]*?)<\/span>)?/gi;
            let match;
            while ((match = chRegex.exec(html)) !== null) {
              const chNum = match[1].trim();
              const chSlug = match[2].trim();
              const chTitleRaw = match[3].replace(/<\/?[^>]+(>|$)/g, "").trim();
              const chDate = match[4] ? match[4].replace(/<\/?[^>]+(>|$)/g, "").trim() : "Baru Saja";

              if (!seenCh.has(chSlug) && chSlug !== "manga" && chSlug !== realId) {
                seenCh.add(chSlug);
                chapters.push({
                  id: chSlug,
                  chapterId: chSlug,
                  chapter_id: chSlug,
                  slug: chSlug,
                  endpoint: chSlug,
                  title: chTitleRaw || `Chapter ${chNum || chSlug.replace(/[^0-9.]/g, '')}`,
                  name: chTitleRaw || `Chapter ${chNum || chSlug.replace(/[^0-9.]/g, '')}`,
                  chapter: chNum || chSlug.replace(/[^0-9.]/g, '') || "0",
                  chapterNumber: chNum || chSlug.replace(/[^0-9.]/g, '') || "0",
                  lang: "id",
                  date: chDate,
                });
              }
            }
          }
        } catch {}
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

      // READ: MANGADEX & OMEGA & UUID CHAPTERS
      if (prefix === "md" || prefix === "om" || /^[0-9a-f-]{32,}$/i.test(cleanChapterId)) {
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
        const kr = await komikuRead(cleanChapterId);
        if (!kr || !kr.images?.length) {
          return createResponse({ error: "Gambar chapter Komiku tidak ditemukan." }, 404);
        }
        return createResponse({
          success: true,
          images: kr.images,
          pages: kr.pages || kr.images,
          chapter: { images: kr.images, totalImages: kr.images.length },
        }, 200, true);
      }

      // READ: FULLMANHWA
      if (prefix === "fm") {
        if (!FM_READ_ENABLED) {
          return createResponse({ error: "Server FullManhwa sedang tidak stabil. Silakan baca melalui MangaDex atau Komiku." }, 403);
        }

        const chapterUrl = cleanChapterId.startsWith("http") ? cleanChapterId : `https://fullmanhwa.com/${cleanChapterId}/`;
        const res = await fetch(chapterUrl, {
          headers: { ...COMMON_HEADERS, "Referer": "https://fullmanhwa.com/" },
          signal: AbortSignal.timeout(9500)
        });

        if (!res.ok) return createResponse({ error: `Gagal menghubungi server FullManhwa (Status ${res.status}).` }, 502);
        const html = await res.text();

        let images: string[] = [];
        const readerArea = html.match(/<div id="readerarea"[^>]*>([\s\S]*?)<\/div>/i) || 
                          html.match(/<div class="reading-content"[^>]*>([\s\S]*?)<\/div>/i) ||
                          html.match(/<div class="page-break"[^>]*>([\s\S]*?)<\/div>/i);
        
        const contentHtml = readerArea ? readerArea[1] : html;
        const imgRegex = /<img[^>]+(?:src|data-src|data-lazy-src)="([^"]+)"/gi;
        let match;
        while ((match = imgRegex.exec(contentHtml)) !== null) {
          const imgUrl = match[1].trim();
          if (!imgUrl.includes("gif") && !imgUrl.includes("banner") && !imgUrl.includes("logo") && !imgUrl.includes("loader")) {
            if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
              images.push(imgUrl);
            }
          }
        }

        if (images.length === 0) {
          return createResponse({ error: "Lembar gambar chapter tidak ditemukan di FullManhwa." }, 404);
        }

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
