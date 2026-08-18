import { NextResponse } from "next/server";

// Pastikan flag FullManhwa dimatikan untuk aksi "read"
const FM_READ_ENABLED = false;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "home";
  const id = searchParams.get("id");
  const source = searchParams.get("source") || "mangadex";

  try {
    if (action === "home" || action === "search") {
      const query = searchParams.get("q") || "";
      
      if (source === "mangadex") {
        // PERBAIKAN: Tambah includes[]=cover_art & batasi limit
        const mdUrl = query 
          ? `https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&includes[]=cover_art&limit=20`
          : `https://api.mangadex.org/manga?includes[]=cover_art&limit=20&order[updatedAt]=desc`;
          
        const res = await fetch(mdUrl, { next: { revalidate: 3600 } });
        const data = await res.json();
        
        const results = data.data?.map((manga: any) => {
          const coverArt = manga.relationships.find((rel: any) => rel.type === "cover_art");
          const coverFile = coverArt?.attributes?.fileName;
          // PERBAIKAN: Format Cover MangaDex
          const coverUrl = coverFile ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFile}` : "";
          
          return {
            id: `md:${manga.id}`,
            title: manga.attributes.title.en || manga.attributes.title["id"] || "Unknown Title",
            cover: coverUrl,
            source: "MangaDex"
          };
        }) || [];
        
        return NextResponse.json({ success: true, data: results });
      }
    }

    if (action === "detail" && id) {
      const realId = id.replace("md:", ""); // Bersihkan prefix
      
      if (id.startsWith("md:")) {
        // PERBAIKAN: Tambah language id DAN en untuk chapter feed
        const feedUrl = `https://api.mangadex.org/manga/${realId}/feed?translatedLanguage[]=id&translatedLanguage[]=en&order[chapter]=desc&limit=100`;
        const res = await fetch(feedUrl);
        const data = await res.json();
        
        const chapters = data.data?.map((ch: any) => ({
          chapterId: ch.id,
          title: `Chapter ${ch.attributes.chapter || '?'} - ${ch.attributes.title || ch.attributes.translatedLanguage}`,
          lang: ch.attributes.translatedLanguage
        })) || [];
        
        return NextResponse.json({ success: true, chapters });
      }
    }

    if (action === "read" && id) {
      if (id.startsWith("fm:") && !FM_READ_ENABLED) {
        return NextResponse.json({ 
          error: "FullManhwa read is disabled due to cloud instability. Please use another source." 
        }, { status: 403 });
      }
      
      // Implementasi fetch chapter images untuk MangaDex / dll di sini...
      return NextResponse.json({ success: true, images: [] });
    }

    return NextResponse.json({ error: "Invalid action or missing parameters" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
