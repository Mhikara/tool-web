import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const accessToken = req.cookies.get("tiktok_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Belum login ke TikTok. Silakan hubungkan akun dulu." },
      { status: 401 }
    );
  }

  try {
    const { videoUrl, title } = await req.json();
    if (!videoUrl) {
      return NextResponse.json({ error: "URL video wajib diisi (video harus bisa diakses publik)" }, { status: 400 });
    }

    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: title || "",
          privacy_level: "SELF_ONLY", // wajib SELF_ONLY sampai app kamu diaudit TikTok
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: videoUrl,
        },
      }),
    });

    const data = await initRes.json();

    if (data.error?.code && data.error.code !== "ok") {
      return NextResponse.json({ error: data.error.message || "Gagal upload ke TikTok", detail: data }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      publishId: data.data?.publish_id,
      note: "Video terkirim sebagai PRIVATE (SELF_ONLY) karena app belum diaudit TikTok.",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Terjadi kesalahan saat upload ke TikTok" }, { status: 500 });
  }
}
