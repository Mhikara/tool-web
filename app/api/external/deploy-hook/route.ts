import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

function isAllowedHook(url: string) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return (
      host === "api.vercel.com" ||
      host.endsWith(".vercel.com") ||
      host === "api.netlify.com" ||
      host.endsWith(".netlify.com")
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const hookUrl = body?.hookUrl;
    const note = body?.note || "";

    if (!hookUrl || typeof hookUrl !== "string") {
      return NextResponse.json(
        { error: "Deploy Hook URL wajib diisi" },
        { status: 400 }
      );
    }

    if (!isAllowedHook(hookUrl.trim())) {
      return NextResponse.json(
        {
          error:
            "URL tidak diizinkan. Hanya mendukung Deploy Hook Vercel atau Netlify.",
        },
        { status: 400 }
      );
    }

    const res = await fetch(hookUrl.trim(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "tool-web-deploy-hook/1.0",
      },
      body: JSON.stringify({
        source: "tool-web",
        note: note || "Triggered from Deploy & Update Web",
      }),
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text.slice(0, 500) };
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          error: "Gagal trigger deploy",
          status: res.status,
          detail: data,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Deploy di-trigger. Cek dashboard Vercel/Netlify.",
      status: res.status,
      detail: data,
    });
  } catch (err: any) {
    console.error("[deploy-hook]", err);
    return NextResponse.json(
      { error: err?.message || "Gagal memproses deploy hook" },
      { status: 500 }
    );
  }
}
