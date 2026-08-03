// app/api/vyn-mail/message/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";
import { fetchMessage } from "@/lib/vynmail";

const paramsSchema = z.object({ id: z.string().min(1).max(100) });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const parsed = paramsSchema.safeParse(resolvedParams);
  if (!parsed.success) {
    return NextResponse.json({ error: "ID pesan tidak valid." }, { status: 400 });
  }

  const token = req.cookies.get("vynmail_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Belum ada email aktif." }, { status: 401 });
  }

  try {
    const message = await fetchMessage(token, parsed.data.id);

    const cleanHtml = (message.html || [])
      .map((chunk) => DOMPurify.sanitize(chunk, { USE_PROFILES: { html: true } }))
      .join("\n");

    return NextResponse.json({
      id: message.id,
      from: message.from,
      subject: message.subject,
      createdAt: message.createdAt,
      text: message.text,
      html: cleanHtml,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Sesi email sudah kadaluarsa." }, { status: 401 });
    }
    console.error("[vyn-mail/message]", err);
    return NextResponse.json({ error: "Gagal memuat pesan." }, { status: 502 });
  }
}
