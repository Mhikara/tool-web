"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { GitBranch, Rocket, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type OutFile = { path: string; content: string; encoding: "utf-8" | "base64" };

function isBinaryPath(path: string) {
  return /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|eot|mp[34]|wav|zip|pdf|wasm)$/i.test(
    path
  );
}

async function loadJSZip(): Promise<any> {
  if (typeof window === "undefined") return null;
  if ((window as any).JSZip) return (window as any).JSZip;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Gagal load JSZip"));
    document.head.appendChild(s);
  });
  return (window as any).JSZip;
}

async function zipToFiles(file: File): Promise<OutFile[]> {
  const JSZip = await loadJSZip();
  const zip = await JSZip.loadAsync(file);
  const out: OutFile[] = [];
  const names = Object.keys(zip.files);

  // deteksi root folder tunggal (GitHub archive style: repo-main/...)
  let prefix = "";
  const top = names
    .map((n) => n.split("/")[0])
    .filter((x, i, a) => a.indexOf(x) === i);
  if (top.length === 1 && names.every((n) => n === top[0] || n.startsWith(top[0] + "/"))) {
    prefix = top[0] + "/";
  }

  for (const name of names) {
    const entry = zip.files[name];
    if (!entry || entry.dir) continue;
    let path = name;
    if (prefix && path.startsWith(prefix)) path = path.slice(prefix.length);
    if (!path || path.startsWith(".git/")) continue;

    if (isBinaryPath(path)) {
      const b64 = await entry.async("base64");
      out.push({ path, content: b64, encoding: "base64" });
    } else {
      const text = await entry.async("string");
      out.push({ path, content: text, encoding: "utf-8" });
    }
  }
  return out;
}

export default function UploadZipPage() {
  const [tab, setTab] = useState<"github" | "vercel">("github");
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<OutFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState("");
  const [result, setResult] = useState<any>(null);

  // GitHub
  const [ghToken, setGhToken] = useState("");
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [createRepo, setCreateRepo] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);

  // Vercel
  const [vcToken, setVcToken] = useState("");
  const [projectName, setProjectName] = useState("zip-project");

  const onPick = useCallback(async (f: File | null) => {
    setResult(null);
    setLog("");
    setFile(f);
    setFiles([]);
    if (!f) return;
    setBusy(true);
    try {
      setLog("Mengekstrak ZIP...");
      const list = await zipToFiles(f);
      setFiles(list);
      setLog("Siap: " + list.length + " file");
    } catch (e: any) {
      setLog("Gagal ekstrak: " + (e?.message || e));
    } finally {
      setBusy(false);
    }
  }, []);

  const sizeLabel = useMemo(() => {
    if (!file) return "";
    return (file.size / 1024).toFixed(1) + " KB · " + files.length + " file";
  }, [file, files.length]);

  async function deployGitBranch() {
    if (!files.length) return setLog("Pilih ZIP dulu");
    setBusy(true);
    setResult(null);
    setLog("Upload ke GitHub...");
    try {
      const res = await fetch("/api/deploy/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: ghToken,
          owner,
          repo,
          branch,
          createRepo,
          private: isPrivate,
          message: "Upload ZIP via tool-web",
          files,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setResult(data);
      setLog("Berhasil push ke GitHub");
    } catch (e: any) {
      setLog(e?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  async function deployVercel() {
    if (!files.length) return setLog("Pilih ZIP dulu");
    setBusy(true);
    setResult(null);
    setLog("Deploy ke Vercel...");
    try {
      const res = await fetch("/api/deploy/vercel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: vcToken,
          name: projectName,
          files,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setResult(data);
      setLog("Deploy dibuat di Vercel");
    } catch (e: any) {
      setLog(e?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-lg px-4 py-6">
        <Link href="/" className="text-sm text-zinc-400">
          ← Home
        </Link>
        <h1 className="mt-3 text-2xl font-bold">Upload ZIP</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Ekstrak ZIP lalu push ke GitHub atau deploy ke Vercel — tanpa terminal.
        </p>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 px-4 py-8">
            <Upload className="h-8 w-8 text-violet-400" />
            <span className="text-sm font-medium">Pilih file .zip</span>
            <span className="text-xs text-zinc-500">{sizeLabel || "Maks disarankan &lt; 8MB"}</span>
            <input
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTab("github")}
            className={
              "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold " +
              (tab === "github" ? "bg-violet-600 text-white" : "bg-zinc-900 text-zinc-400")
            }
          >
            <GitBranch className="h-4 w-4" /> GitHub
          </button>
          <button
            type="button"
            onClick={() => setTab("vercel")}
            className={
              "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold " +
              (tab === "vercel" ? "bg-violet-600 text-white" : "bg-zinc-900 text-zinc-400")
            }
          >
            <Rocket className="h-4 w-4" /> Vercel
          </button>
        </div>

        {tab === "github" ? (
          <div className="mt-4 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-xs text-zinc-500">
              Token: GitHub → Settings → Developer settings → Personal access tokens
              (scope: repo)
            </p>
            <input
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="GitHub Token (ghp_...)"
              type="password"
              value={ghToken}
              onChange={(e) => setGhToken(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                placeholder="Username / org"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
              />
              <input
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                placeholder="Nama repo"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
              />
            </div>
            <input
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="Branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={createRepo}
                onChange={(e) => setCreateRepo(e.target.checked)}
              />
              Buat repo baru jika belum ada
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              Private
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={deployGitBranch}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}
              Unggah ke GitHub
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-xs text-zinc-500">
              Token: Vercel → Settings → Tokens
            </p>
            <input
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="Vercel Token"
              type="password"
              value={vcToken}
              onChange={(e) => setVcToken(e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="Nama project"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <button
              type="button"
              disabled={busy}
              onClick={deployVercel}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              Unggah ke Vercel
            </button>
          </div>
        )}

        {log && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm">
            {result?.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            )}
            <div>
              <p>{log}</p>
              {result?.url && (
                <a
                  href={result.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block text-violet-400 underline"
                >
                  {result.url}
                </a>
              )}
              {result?.treeUrl && (
                <a
                  href={result.treeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block text-violet-400 underline"
                >
                  {result.treeUrl}
                </a>
              )}
            </div>
          </div>
        )}

        <p className="mt-6 text-[11px] leading-relaxed text-zinc-600">
          Token hanya dikirim ke API server kamu saat deploy, tidak disimpan.
          Jangan bagikan token ke orang lain. ZIP besar / banyak file bisa timeout di
          paket Vercel gratis.
        </p>
      </div>
    </div>
  );
}
