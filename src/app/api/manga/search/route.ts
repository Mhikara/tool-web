import { NextRequest, NextResponse } from "next/server";
import { searchManga } from "@/lib/mangadex";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: "Kata kunci minimal 2 karakter" }, { status: 400 });
  }

  try {
    const results = await searchManga(query.trim());
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[manga/search]", err);
    return NextResponse.json({ error: "Gagal mencari manga" }, { status: 500 });
  }
}
