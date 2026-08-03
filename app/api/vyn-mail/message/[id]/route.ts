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

  const sidToken = req.cookies.get("vynmail_sid")?.value;
  if (!sidToken) {
    return NextResponse.json({ error: "Belum ada email aktif." }, { status: 401 });
  }

  try {
    const message = await fetchMessage(sidToken, parsed.data.id);
    const cleanHtml = DOMPurify.sanitize(message.body || "", {
      USE_PROFILES: { html: true },
    });

    return NextResponse.json({
      id: message.id,
      from: { address: message.from, name: message.from },
      subject: message.subject,
      createdAt: new Date(Number(message.timestamp) * 1000).toISOString(),
      text: message.excerpt,
      html: cleanHtml,
    });
  } catch (err) {
    console.error("[vyn-mail/message]", err);
    return NextResponse.json({ error: "Gagal memuat pesan." }, { status: 502 });
  }
}
