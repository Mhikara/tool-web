import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type FileIn = { path: string; content: string; encoding?: "utf-8" | "base64" };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body.token || "").trim();
    const name = String(body.name || "zip-deploy").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const files = (body.files || []) as FileIn[];
    const projectId = body.projectId ? String(body.projectId) : undefined;

    if (!token) {
      return NextResponse.json({ error: "Vercel token wajib" }, { status: 400 });
    }
    if (!files.length) {
      return NextResponse.json({ error: "files kosong" }, { status: 400 });
    }
    if (files.length > 400) {
      return NextResponse.json({ error: "Maks 400 file" }, { status: 400 });
    }

    const vercelFiles = files
      .map((f) => {
        const file = String(f.path || "").replace(/^\/+/, "").replace(/\\/g, "/");
        if (!file || file.includes("..")) return null;
        const data =
          f.encoding === "base64"
            ? f.content
            : Buffer.from(f.content, "utf-8").toString("base64");
        return { file, data, encoding: "base64" as const };
      })
      .filter(Boolean);

    const payload: any = {
      name,
      files: vercelFiles,
      projectSettings: {
        framework: null,
      },
    };
    if (projectId) payload.project = projectId;

    const res = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let json: any = {};
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text.slice(0, 400) };
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: json?.error?.message || json?.message || text.slice(0, 400) },
        { status: res.status }
      );
    }

    const url =
      json.url && !String(json.url).startsWith("http")
        ? "https://" + json.url
        : json.url;

    return NextResponse.json({
      ok: true,
      id: json.id,
      url: url,
      inspector: json.inspectorUrl,
      readyState: json.readyState,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
