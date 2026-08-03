// app/api/vyn-mail/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createMailTmAccount } from "@/lib/vynmail";

// Rate limit sederhana: maks 5 email baru per IP / 10 menit.
// Ganti dengan lib rate limiter yang sudah ada kalau mau konsisten.
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
    const account = await createMailTmAccount();
    const res = NextResponse.json({ address: account.address });

    res.cookies.set("vynmail_token", account.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    res.cookies.set("vynmail_address", account.address, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return res;
  } catch (err) {
    console.error("[vyn-mail/create]", err);
    return NextResponse.json(
      { error: "Gagal membuat email sementara. Coba lagi." },
      { status: 502 }
    );
  }
}
