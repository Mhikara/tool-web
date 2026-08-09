import { NextResponse } from "next/server";
import { getAvailableTags } from "@/lib/mangadex";

export async function GET() {
  try {
    const tags = await getAvailableTags();
    return NextResponse.json({ tags });
  } catch (err) {
    console.error("[manga/tags]", err);
    return NextResponse.json({ error: "Gagal mengambil genre" }, { status: 500 });
  }
}
