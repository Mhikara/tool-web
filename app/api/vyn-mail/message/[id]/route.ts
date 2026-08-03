// app/api/vyn-mail/message/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";
import { fetchMessage } from "@/lib/vynmail";

const paramsSchema = z.object({ id: z.string().min(1).max(20) });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const parsed = paramsSchema.safeParse(resolvedParams);
  if (!parsed.success) {
    return NextResponse.json({ error: "ID pesan tidak valid." }, { status: 400 });
  }

  const login = req.cookies.get("vynmail_login")?.value;
  const domain = req.cookies.get("vynmail_domain")?.value;
  if (!login || !domain) {
    return NextResponse.json({ error: "Belum ada email aktif." }, { status: 401 });
  }

  try {
    const message = await fetchMessage(login, domain, parsed.data.id);
    const cleanHtml = DOMPurify.sanitize(message.htmlBody || "", {
      USE_PROFILES: { html: true },
    });

    return NextResponse.json({
      id: String(message.id),
      from: { address: message.from, name: message.from },
      subject: message.subject,
      createdAt: message.date,
      text: message.textBody,
      html: cleanHtml,
    });
  } catch (err) {
    console.error("[vyn-mail/message]", err);
    return NextResponse.json({ error: "Gagal memuat pesan." }, { status: 502 });
  }
}
