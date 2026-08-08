import { NextRequest, NextResponse } from "next/server";
import { getChapterPages } from "@/lib/mangadex";

export async function GET(
  req: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const pages = await getChapterPages(params.chapterId);
    return NextResponse.json({ pages });
  } catch (err) {
    console.error("[manga/chapter]", err);
    return NextResponse.json({ error: "Gagal mengambil halaman" }, { status: 500 });
  }
}
