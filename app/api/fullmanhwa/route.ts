import { NextRequest, NextResponse } from "next/server";

const TARGET = "https://fullmanhwa.com";

function cleanHtml(html: string, showImages: boolean): string {
  // Hapus script, iframe, embed, object
  html = html.replace(/<(script|iframe|noscript|embed|object)[\s\S]*?<\/\1>/gi, "");
  
  // Hapus iklan (class/id mengandung kata iklan)
  html = html.replace(/<(div|section|aside|span|header|footer)[^>]*?\s(class|id)=["'][^"']*(?:ad|ads|advert|banner|popup|overlay|modal|promo|sponsor|sticky)[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi, "");
  
  // Hapus link iklan
  html = html.replace(/<a[^>]*?href=["'][^"']*(?:ad|ads|click|pop|offer|promo)[^"']*["'][^>]*>[\s\S]*?<\/a>/gi, "");
  
  if (!showImages) {
    // Ganti gambar dengan placeholder
    html = html.replace(/<img[^>]*?src=["'][^"']+["'][^>]*?>/gi, '<div style="background:#141414;border:2px dashed #2a2a2a;color:#555;padding:40px;text-align:center;margin:16px 0;border-radius:10px;font-size:13px;letter-spacing:1px">[Gambar Dihapus — Toggle untuk tampilkan]</div>');
    html = html.replace(/<(picture|video|audio|source|svg)[\s\S]*?<\/\1>/gi, "");
  }
  
  // Perbaiki link internal jadi absolute
  html = html.replace(/href=["']\/([^"']*)["']/g, `href="${TARGET}/$1"`);
  
  // Inject dark mode CSS
  const css = `<style>
*{max-width:100%!important;box-sizing:border-box}
body{background:#0a0a0a;color:#e4e4e4;font-family:system-ui,-apple-system,sans-serif;line-height:1.6;padding:16px}
a{color:#a78bfa;text-decoration:none}
a:hover{text-decoration:underline}
[class*=ad],[id*=ad],[class*=popup],[id*=popup],[class*=banner],[id*=banner],[class*=sponsor],[id*=sponsor]{display:none!important}
</style>`;
  
  html = html.includes('</head>') 
    ? html.replace('</head>', css + '</head>') 
    : css + html;
    
  return html;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "/";
  const showImages = searchParams.get("img") === "true";

  const targetUrl = `${TARGET}${path.startsWith('/') ? path : '/' + path}`;
  
  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Gagal fetch dari FullManhwa" }, { status: res.status });
    }

    const ct = res.headers.get("content-type") || "";
    
    if (ct.includes("text/html")) {
      const html = await res.text();
      return new NextResponse(cleanHtml(html, showImages), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    
    // Teruskan asset non-HTML (CSS, JS)
    const blob = await res.blob();
    return new NextResponse(blob, { headers: { "Content-Type": ct } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Proxy error" }, { status: 500 });
  }
}
