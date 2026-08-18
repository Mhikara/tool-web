import { NextResponse } from "next/server";

// FLAG WAJIB: Mematikan baca chapter dari FullManhwa karena server cloud mereka sering HTTP 500
const FM_READ_ENABLED = false;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "home";
  const id = searchParams.get("id");
  
  try {
    // ---------------------------------------------------------
    // ACTION: HOME / SEARCH / KATALOG
    // ---------------------------------------------------------
    if (action === "home" || action === "search" || action === "katalog") {
      const query = searchParams.get("q") || "";
      const page = searchParams.get("page") || "1";
      const offset = (Number(page) - 1) * 24;
      
      // FIX 1: Wajib sertakan includes[]=cover_art. 
      // JANGAN pass string genre secara langsung ke URL ini karena MD butuh UUID (mencegah error "Tidak ada komik")
      let mdUrl = `https://api.mangadex.org/manga?includes[]=cover_art&limit=24&offset=${offset}`;
      
      if (query) {
        mdUrl += `&title=${encodeURIComponent(query)}`;
      } else {
        mdUrl += `&order[updatedAt]=desc`;
      }

      const res = await fetch(mdUrl, { next: { revalidate: 1800 } });
      const data = await res.json();
      
      let results: any[] = [];
      if (data && data.data) {
        results = data.data.map((manga: any) => {
          const coverArt = manga.relationships?.find((rel: any) => rel.type === "cover_art");
          const coverFile = coverArt?.attributes?.fileName;
          // Resolusi .512.jpg agar ringan namun tidak pecah di frontend
          const coverUrl = coverFile ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFile}.512.jpg` : "";
          
          const title = manga.attributes.title.en || manga.attributes.title.id || manga.attributes.title["ja-ro"] || "Judul Tidak Diketahui";
          
          return {
            id: `md:${manga.id}`,
            title: title,
            cover: coverUrl,
            type: manga.attributes.originalLanguage === "ko" ? "Manhwa" : manga.attributes.originalLanguage === "zh" ? "Manhua" : "Manga",
            source: "MangaDex"
          };
        });
      }
      
      return NextResponse.json({ success: true, data: results });
    }

    // ---------------------------------------------------------
    // ACTION: DETAIL KOMIK
    // ---------------------------------------------------------
    if (action === "detail" && id) {
      const realId = id.replace(/^(md:|fm:|omega:)/, "");
      
      if (id.startsWith("md:")) {
        // FIX 2: Sertakan translatedLanguage[]=id DAN en untuk mencegah kembalian 0 Chapter
        const feedUrl = `https://api.mangadex.org/manga/${realId}/feed?translatedLanguage[]=id&translatedLanguage[]=en&order[chapter]=desc&limit=300`;
        const feedRes = await fetch(feedUrl);
        const feedData = await feedRes.json();
        
        const chapters = feedData.data?.map((ch: any) => ({
          chapterId: ch.id,
          title: `Ch. ${ch.attributes.chapter || '?'} ${ch.attributes.title ? `- ${ch.attributes.title}` : ''} [${ch.attributes.translatedLanguage.toUpperCase()}]`,
          lang: ch.attributes.translatedLanguage,
        })) || [];
        
        return NextResponse.json({ success: true, chapters });
      }
    }

    // ---------------------------------------------------------
    // ACTION: READ (BACA CHAPTER)
    // ---------------------------------------------------------
    if (action === "read" && id) {
      // FIX 3: Memblokir pembacaan FullManhwa jika tidak stabil
      if (id.startsWith("fm:") && !FM_READ_ENABLED) {
        return NextResponse.json({ 
          error: "FullManhwa sedang tidak stabil (Sering HTTP 500). Silakan baca komik ini melalui sumber MangaDex, Omega, atau Komiku." 
        }, { status: 403 });
      }

      const chapterId = searchParams.get("chapter");
      
      if (id.startsWith("md:") && chapterId) {
        const mdHost = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`);
        const hostData = await mdHost.json();
        
        if (!hostData || !hostData.chapter) {
           throw new Error("Gagal memuat gambar dari server MangaDex.");
        }

        const baseUrl = hostData.baseUrl;
        const hash = hostData.chapter.hash;
        const images = hostData.chapter.data.map((file: string) => `${baseUrl}/data/${hash}/${file}`);

        return NextResponse.json({ success: true, images });
      }
      
      return NextResponse.json({ success: true, images: [] });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali atau parameter kurang lengkap" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan internal pada server backend" }, { status: 500 });
  }
}
