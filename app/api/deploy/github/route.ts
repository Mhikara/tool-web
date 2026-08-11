import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type FileIn = { path: string; content: string; encoding?: "utf-8" | "base64" };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body.token || "").trim();
    const owner = String(body.owner || "").trim();
    const repo = String(body.repo || "").trim();
    const branch = String(body.branch || "main").trim();
    const message = String(body.message || "Deploy from ZIP").trim();
    const files = (body.files || []) as FileIn[];
    const createRepo = Boolean(body.createRepo);

    if (!token || !owner || !repo) {
      return NextResponse.json(
        { error: "token, owner, repo wajib" },
        { status: 400 }
      );
    }
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "files kosong" }, { status: 400 });
    }
    if (files.length > 400) {
      return NextResponse.json(
        { error: "Maksimal 400 file per upload" },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "tool-web-deploy",
    };

    // Buat repo jika diminta
    if (createRepo) {
      const cr = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: repo,
          private: Boolean(body.private),
          auto_init: true,
        }),
      });
      if (!cr.ok && cr.status !== 422) {
        const err = await cr.text();
        return NextResponse.json(
          { error: "Gagal buat repo: " + err.slice(0, 300) },
          { status: 400 }
        );
      }
    }

    // Ambil ref branch
    let refRes = await fetch(
      `https://api.github.com/repos/\( {owner}/ \){repo}/git/ref/heads/${branch}`,
      { headers }
    );
    if (!refRes.ok) {
      // coba buat dari default branch
      const repoRes = await fetch(
        `https://api.github.com/repos/\( {owner}/ \){repo}`,
        { headers }
      );
      if (!repoRes.ok) {
        return NextResponse.json(
          { error: "Repo tidak ditemukan. Centang 'Buat repo baru' atau cek nama." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Branch " + branch + " tidak ada" },
        { status: 404 }
      );
    }
    const refJson = await refRes.json();
    const baseSha = refJson.object?.sha as string;

    const commitRes = await fetch(
      `https://api.github.com/repos/\( {owner}/ \){repo}/git/commits/${baseSha}`,
      { headers }
    );
    const commitJson = await commitRes.json();
    const baseTree = commitJson.tree?.sha as string;

    // Blob per file
    const treeItems: { path: string; mode: string; type: string; sha: string }[] =
      [];
    for (const f of files) {
      const path = String(f.path || "").replace(/^\/+/, "").replace(/\\/g, "/");
      if (!path || path.includes("..")) continue;
      const encoding = f.encoding === "base64" ? "base64" : "utf-8";
      const blobRes = await fetch(
        `https://api.github.com/repos/\( {owner}/ \){repo}/git/blobs`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ content: f.content, encoding }),
        }
      );
      if (!blobRes.ok) {
        const err = await blobRes.text();
        return NextResponse.json(
          { error: "Blob gagal " + path + ": " + err.slice(0, 200) },
          { status: 400 }
        );
      }
      const blob = await blobRes.json();
      treeItems.push({
        path,
        mode: "100644",
        type: "blob",
        sha: blob.sha,
      });
    }

    if (!treeItems.length) {
      return NextResponse.json({ error: "Tidak ada file valid" }, { status: 400 });
    }

    const treeRes = await fetch(
      `https://api.github.com/repos/\( {owner}/ \){repo}/git/trees`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ base_tree: baseTree, tree: treeItems }),
      }
    );
    if (!treeRes.ok) {
      return NextResponse.json(
        { error: "Gagal buat tree: " + (await treeRes.text()).slice(0, 300) },
        { status: 400 }
      );
    }
    const treeJson = await treeRes.json();

    const newCommitRes = await fetch(
      `https://api.github.com/repos/\( {owner}/ \){repo}/git/commits`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          message,
          tree: treeJson.sha,
          parents: [baseSha],
        }),
      }
    );
    if (!newCommitRes.ok) {
      return NextResponse.json(
        { error: "Gagal commit: " + (await newCommitRes.text()).slice(0, 300) },
        { status: 400 }
      );
    }
    const newCommit = await newCommitRes.json();

    const updateRef = await fetch(
      `https://api.github.com/repos/\( {owner}/ \){repo}/git/refs/heads/${branch}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ sha: newCommit.sha }),
      }
    );
    if (!updateRef.ok) {
      return NextResponse.json(
        { error: "Gagal update branch: " + (await updateRef.text()).slice(0, 300) },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      commit: newCommit.sha,
      files: treeItems.length,
      url: `https://github.com/\( {owner}/ \){repo}`,
      treeUrl: `https://github.com/\( {owner}/ \){repo}/tree/${branch}`,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
