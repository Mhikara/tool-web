import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const savedState = req.cookies.get("tiktok_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.json({ error: "State tidak valid atau login dibatalkan" }, { status: 400 });
  }

  try {
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY || "",
        client_secret: process.env.TIKTOK_CLIENT_SECRET || "",
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.TIKTOK_REDIRECT_URI || "",
      }),
    });

    const data = await tokenRes.json();

    if (!data.access_token) {
      return NextResponse.json({ error: "Gagal mendapatkan access token", detail: data }, { status: 500 });
    }

    const res = NextResponse.redirect(new URL("/tiktok-studio?connected=1", req.url));
    res.cookies.set("tiktok_access_token", data.access_token, {
      httpOnly: true,
      maxAge: data.expires_in || 86400,
      secure: true,
      path: "/",
    });
    if (data.refresh_token) {
      res.cookies.set("tiktok_refresh_token", data.refresh_token, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        secure: true,
        path: "/",
      });
    }
    res.cookies.delete("tiktok_oauth_state");
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Terjadi kesalahan saat proses login TikTok" }, { status: 500 });
  }
}
