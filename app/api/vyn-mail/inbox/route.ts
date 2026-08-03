// app/api/vyn-mail/inbox/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchInbox } from "@/lib/vynmail";

export async function GET(req: NextRequest) {
  const login = req.cookies.get("vynmail_login")?.value;
  const domain = req.cookies.get("vynmail_domain")?.value;

  if (!login || !domain) {
    return NextResponse.json({ error: "Belum ada email aktif." }, { status: 401 });
  }

  try {
    const messages = await fetchInbox(login, domain);
    return NextResponse.json({ messages });
  } catch (err) {
    console.error("[vyn-mail/inbox]", err);
    return NextResponse.json({ error: "Gagal memuat inbox." }, { status: 502 });
  }
}
