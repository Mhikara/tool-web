import { NextRequest, NextResponse } from "next/server";
import { getAdjacentChapters } from "@/lib/mangadex";

export async function GET(
  req: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const nav = await getAdjacentChapters(params.chapterId);
    return NextResponse.json(nav);
  } catch (err) {
    console.error("[manga/chapter/nav]", err);
    return NextResponse.json({ error: "Gagal mengambil navigasi chapter" }, { status: 500 });
  }
}
