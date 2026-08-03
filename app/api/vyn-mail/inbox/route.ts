// app/api/vyn-mail/inbox/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchInbox } from "@/lib/vynmail";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("vynmail_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Belum ada email aktif." }, { status: 401 });
  }

  try {
    const messages = await fetchInbox(token);
    return NextResponse.json({ messages });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Sesi email sudah kadaluarsa." }, { status: 401 });
    }
    console.error("[vyn-mail/inbox]", err);
    return NextResponse.json({ error: "Gagal memuat inbox." }, { status: 502 });
  }
}
