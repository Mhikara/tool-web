import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 20;

function isValidTarget(input: string) {
  try {
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(input)) return true;
    const u = input.startsWith("http") ? input : "https://" + input;
    new URL(u);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { target } = await req.json();
    if (!target || typeof target !== "string") {
      return NextResponse.json({ error: "URL / domain / IP wajib diisi" }, { status: 400 });
    }

    const clean = target.trim();
    if (!isValidTarget(clean)) {
      return NextResponse.json({ error: "Format target tidak valid" }, { status: 400 });
    }

    const urlToCheck = clean.startsWith("http") ? clean : "https://" + clean;

    // 1) Google Safe Browsing lookup via public transparency (ringan)
    // 2) Fallback: cek header + redirect mencurigakan
    let safeBrowsing: any = null;
    try {
      const sb = await fetch(
        "https://transparencyreport.google.com/transparencyreport/api/v3/safebrowsing/status?site=" +
          encodeURIComponent(urlToCheck),
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        }
      );
      const text = await sb.text();
      safeBrowsing = text.slice(0, 500);
    } catch {
      safeBrowsing = null;
    }

    // Cek response site
    let siteInfo: any = { reachable: false };
    try {
      const res = await fetch(urlToCheck, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      siteInfo = {
        reachable: true,
        status: res.status,
        finalUrl: res.url,
        contentType: res.headers.get("content-type"),
        server: res.headers.get("server"),
      };
    } catch (e: any) {
      siteInfo = { reachable: false, error: e?.message || "unreachable" };
    }

    // URLHaus (malware URL DB publik, gratis)
    let urlhaus: any = null;
    try {
      const uh = await fetch("https://urlhaus-api.abuse.ch/v1/url/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "url=" + encodeURIComponent(urlToCheck),
      });
      urlhaus = await uh.json();
    } catch {
      urlhaus = null;
    }

    const malicious =
      urlhaus?.query_status === "listed" ||
      (typeof safeBrowsing === "string" &&
        /malware|phishing|social engineering/i.test(safeBrowsing));

    return NextResponse.json({
      target: clean,
      url: urlToCheck,
      verdict: malicious ? "BERBAHAYA" : siteInfo.reachable ? "AMAN / TIDAK TERDAFTAR" : "TIDAK BISA DIAKSES",
      malicious: !!malicious,
      siteInfo,
      urlhaus: urlhaus
        ? {
            status: urlhaus.query_status,
            threat: urlhaus.threat || null,
            tags: urlhaus.tags || null,
          }
        : null,
      note: "Hasil dari database publik (URLhaus + cek dasar). Bukan pengganti antivirus penuh.",
    });
  } catch (err: any) {
    console.error("[virus-scan]", err);
    return NextResponse.json(
      { error: err?.message || "Gagal scan" },
      { status: 500 }
    );
  }
}
