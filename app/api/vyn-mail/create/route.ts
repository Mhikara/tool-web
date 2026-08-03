// app/api/vyn-mail/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateAddress } from "@/lib/vynmail";

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  timestamps.push(now);
  hits.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi beberapa menit lagi." },
      { status: 429 }
    );
  }

  try {
    const { address, sidToken } = await generateAddress();
    const res = NextResponse.json({ address });

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24,
    };

    res.cookies.set("vynmail_sid", sidToken, cookieOpts);
    res.cookies.set("vynmail_address", address, { ...cookieOpts, httpOnly: false });

    return res;
  } catch (err) {
    console.error("[vyn-mail/create]", err);
    return NextResponse.json(
      { error: "Gagal membuat email sementara. Coba lagi." },
      { status: 502 }
    );
  }
}
