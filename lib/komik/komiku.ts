/** Komiku helper: API pihak ketiga + fallback scrape komiku.org */

const KM_API = "https://komiku-rest-api.vercel.app";
const KM_WEB = "https://komiku.org";

const HDR: HeadersInit = {
  Accept: "text/html,application/json,*/*",
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile Safari/537.36",
  Referer: KM_WEB + "/",
};

function proxy(url: string) {
  if (!url) return "";
  if (url.startsWith("/api/komik/image")) return url;
  return `/api/komik/image?url=${encodeURIComponent(url)}`;
}

function cleanSlug(s: string) {
  return String(s || "")
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/manga\//, "")
    .replace(/^\/ch\//, "")
    .replace(/^\//, "")
    .replace(/\/$/, "");
}

export async function komikuHome(limit = 20, query = "", popular = false) {
  // 1) API terbaru / search
  try {
    let url = `${KM_API}/terbaru`;
    if (query) url = `\( {KM_API}/search?q= \){encodeURIComponent(query)}`;
    else if (popular) url = `${KM_API}/komik-populer`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const json = await res.json();
      const list = Array.isArray(json)
        ? json
        : json.data || json.comics || json.result || [];
      if (list.length) {
        return list.slice(0, limit).map((x: any) => {
          const slug = cleanSlug(x.slug || x.endpoint || x.href || x.link || "");
          const title = x.title || x.nama || x.name || slug.replace(/-/g, " ");
          const cover = x.image || x.thumbnail || x.cover || x.thumb || "";
          const ch =
            x.chapter ||
            x.latest_chapter ||
            x.latestChapter ||
            x.chapter_latest ||
            "Ch. Baru";
          return {
            id: `komiku:${slug}`,
            title,
            cover: proxy(cover),
            type: x.type || "Manhwa/Manhua",
            typeLabel: x.type || "Manhwa/Manhua",
            source: "komiku",
            sourceLabel: "Komiku",
            chapter: String(ch).replace(/Chapter/i, "Ch."),
            latestChapter: String(ch).replace(/Chapter/i, "Ch."),
            latest_chapter: String(ch).replace(/Chapter/i, "Ch."),
            statusLabel: String(ch).replace(/Chapter/i, "Ch."),
            rating: String(x.rating || "8.5"),
            score: Number(x.rating) || 8.5,
          };
        });
      }
    }
  } catch {}

  // 2) Scrape komiku.org
  try {
    let url = `${KM_WEB}/pustaka/?orderby=modified`;
    if (query) url = `\( {KM_WEB}/cari/?post_type=manga&s= \){encodeURIComponent(query)}`;
    else if (popular) url = `${KM_WEB}/other/hot/`;

    const res = await fetch(url, {
      headers: HDR,
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const results: any[] = [];
    const seen = new Set<string>();
    const re =
      /href="[^"]*\/manga\/([^/"]+)\/?"[\s\S]{0,400}?<(?:img)[^>]+(?:src|data-src|data-lazy-src)="([^"]+)"[\s\S]{0,300}?<h[1234][^>]*>([\s\S]*?)<\/h[1234]>/gi;
    let m;
    while ((m = re.exec(html)) !== null && results.length < limit) {
      const slug = m[1].trim();
      if (seen.has(slug)) continue;
      seen.add(slug);
      const title = m[3].replace(/<[^>]+>/g, "").trim() || slug.replace(/-/g, " ");
      results.push({
        id: `komiku:${slug}`,
        title,
        cover: proxy(m[2].split("?")[0]),
        type: "Manhwa/Manhua",
        typeLabel: "Manhwa/Manhua",
        source: "komiku",
        sourceLabel: "Komiku",
        chapter: "Ch. Baru",
        latestChapter: "Ch. Baru",
        latest_chapter: "Ch. Baru",
        statusLabel: "Ch. Baru",
        rating: "8.5",
        score: 8.5,
      });
    }
    return results;
  } catch {
    return [];
  }
}

export async function komikuDetail(slug: string) {
  const s = cleanSlug(slug);

  // API detail
  try {
    const res = await fetch(`\( {KM_API}/detail-komik/ \){s}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(9000),
    });
    if (res.ok) {
      const json = await res.json();
      const d = json.data || json;
      const chapters = (d.chapter_list || d.chapters || d.chapter || []).map(
        (c: any, i: number) => {
          const ep = cleanSlug(c.endpoint || c.slug || c.id || "");
          const name = c.name || c.title || c.chapter || `Chapter ${i + 1}`;
          return {
            id: ep,
            chapterId: ep,
            chapter_id: ep,
            slug: ep,
            title: name,
            name,
            chapter: String(name).replace(/[^\d.]+/g, "") || String(i + 1),
            chapterNumber: String(name).replace(/[^\d.]+/g, "") || String(i + 1),
          };
        }
      );
      if (d.title || chapters.length) {
        return {
          title: d.title || d.nama || s,
          cover: proxy(d.thumbnail || d.image || d.cover || ""),
          description: d.synopsis || d.description || d.sinopsis || "",
          status: d.status || "Ongoing",
          type: d.type || "Manhwa/Manhua",
          author: d.author || d.pengarang || "Unknown",
          genres: d.genre || d.genres || [],
          chapters,
        };
      }
    }
  } catch {}

  // Scrape detail
  try {
    const res = await fetch(`\( {KM_WEB}/manga/ \){s}/`, {
      headers: HDR,
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const tMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const cMatch = html.match(/<img[^>]+(?:src|data-src)="([^"]+)"[^>]*(?:alt|class)=[^>]*(?:cover|thumb|ims)/i)
      || html.match(/class="ims"[\s\S]*?<img[^>]+(?:src|data-src)="([^"]+)"/i);
    const dMatch = html.match(/<p class="desc"[^>]*>([\s\S]*?)<\/p>/i)
      || html.match(/itemprop="description"[^>]*>([\s\S]*?)</i);

    const chapters: any[] = [];
    const chRe = /href="[^"]*\/ch\/([^/"]+)\/?"[^>]*>\s*([\s\S]*?)<\/a>/gi;
    let cm;
    const seen = new Set<string>();
    while ((cm = chRe.exec(html)) !== null) {
      const ep = cm[1].trim();
      if (seen.has(ep)) continue;
      seen.add(ep);
      const name = cm[2].replace(/<[^>]+>/g, "").trim() || ep;
      chapters.push({
        id: ep,
        chapterId: ep,
        chapter_id: ep,
        slug: ep,
        title: name,
        name,
        chapter: name.replace(/[^\d.]+/g, "") || "0",
        chapterNumber: name.replace(/[^\d.]+/g, "") || "0",
      });
    }

    return {
      title: tMatch ? tMatch[1].replace(/<[^>]+>/g, "").trim() : s,
      cover: proxy(cMatch ? cMatch[1] : ""),
      description: dMatch ? dMatch[1].replace(/<[^>]+>/g, "").trim() : "",
      status: /completed|tamat/i.test(html) ? "Completed" : "Ongoing",
      type: "Manhwa/Manhua",
      author: "Unknown",
      genres: [] as string[],
      chapters,
    };
  } catch {
    return null;
  }
}

export async function komikuRead(chapterSlug: string) {
  let ep = cleanSlug(chapterSlug);
  if (!ep.startsWith("ch/") && !ep.includes("chapter")) {
    // sudah slug chapter
  }

  // API baca
  try {
    // format umum: /baca-chapter/{manga}/{num} atau full endpoint
    const tryUrls = [
      `\( {KM_API}/baca-chapter/ \){ep}`,
      `\( {KM_API}/chapter/ \){ep}`,
    ];
    for (const u of tryUrls) {
      const res = await fetch(u, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const json = await res.json();
      const d = json.data || json;
      const imgs = d.image || d.images || d.pages || d.chapter_image || [];
      const list = (Array.isArray(imgs) ? imgs : [])
        .map((x: any) =>
          typeof x === "string" ? x : x.chapter_image_link || x.src || x.url || ""
        )
        .filter(Boolean)
        .map((u: string) => proxy(u));
      if (list.length) {
        return { images: list, pages: list };
      }
    }
  } catch {}

  // Scrape chapter page
  try {
    const url = ep.startsWith("http")
      ? ep
      : `\( {KM_WEB}/ch/ \){ep.replace(/^ch\//, "")}/`;
    const res = await fetch(url, {
      headers: HDR,
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const images: string[] = [];
    const re = /<img[^>]+(?:src|data-src|data-lazy-src)="([^"]+)"/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      const u = m[1].trim();
      if (/gif|banner|logo|iklan|avatar|icon|button/i.test(u)) continue;
      if (/^https?:\/\//i.test(u)) images.push(proxy(u));
    }
    if (!images.length) return null;
    return { images, pages: images };
  } catch {
    return null;
  }
}
