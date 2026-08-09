import { NextRequest, NextResponse } from "next/server";
import { getMangaDetail, getChapters } from "@/lib/mangadex";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const manga = await getMangaDetail(params.id);
    if (!manga) {
      return NextResponse.json({ error: "Manga tidak ditemukan" }, { status: 404 });
    }
    const { chapters, language } = await getChapters(params.id, "en");
    return NextResponse.json({ manga, chapters, chapterLanguage: language });
  } catch (err) {
    console.error("[manga/detail]", err);
    return NextResponse.json({ error: "Gagal mengambil detail" }, { status: 500 });
  }
}
