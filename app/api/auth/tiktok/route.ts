import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;

  if (!clientKey || !redirectUri) {
    return NextResponse.json(
      { error: "TIKTOK_CLIENT_KEY atau TIKTOK_REDIRECT_URI belum diset di .env.local" },
      { status: 500 }
    );
  }

  const state = crypto.randomBytes(16).toString("hex");

  const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
  authUrl.searchParams.set("client_key", clientKey);
  authUrl.searchParams.set("scope", "user.info.basic,video.publish");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authUrl.toString());
  res.cookies.set("tiktok_oauth_state", state, { httpOnly: true, maxAge: 600 });
  return res;
}
