// app/api/vyn-mail/delete/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("vynmail_token");
  res.cookies.delete("vynmail_address");
  return res;
}
