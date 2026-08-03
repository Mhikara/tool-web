// app/api/vyn-mail/inbox/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchInbox } from "@/lib/vynmail";

export async function GET(req: NextRequest) {
  const sidToken = req.cookies.get("vynmail_sid")?.value;

  if (!sidToken) {
    return NextResponse.json({ error: "Belum ada email aktif." }, { status: 401 });
  }

  try {
    const raw = await fetchInbox(sidToken);
    const messages = raw.map((m) => ({
      id: m.id,
      from: { address: m.from, name: m.from },
      subject: m.subject,
      intro: m.excerpt,
      seen: false,
      createdAt: new Date(Number(m.timestamp) * 1000).toISOString(),
    }));
    return NextResponse.json({ messages });
  } catch (err) {
    console.error("[vyn-mail/inbox]", err);
    return NextResponse.json({ error: "Gagal memuat inbox." }, { status: 502 });
  }
}
