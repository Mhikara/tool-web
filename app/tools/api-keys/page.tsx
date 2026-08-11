"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KeyRound, Plus, Trash2, RefreshCw, Download, Upload } from "lucide-react";
import {
  ApiKeyEntry,
  Provider,
  addKey,
  exportKeysJson,
  importKeysJson,
  loadKeys,
  removeKey,
  resetKey,
  saveKeys,
} from "../../../lib/ai/keyStore";

const PROVIDERS: { id: Provider; label: string; hint: string }[] = [
  { id: "openrouter", label: "OpenRouter", hint: "openrouter.ai/keys" },
  { id: "groq", label: "Groq", hint: "console.groq.com" },
  { id: "openai", label: "OpenAI", hint: "platform.openai.com" },
  { id: "anthropic", label: "Anthropic", hint: "console.anthropic.com" },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [provider, setProvider] = useState<Provider>("openrouter");
  const [newKey, setNewKey] = useState("");
  const [label, setLabel] = useState("");
  const [msg, setMsg] = useState("");
  const [importText, setImportText] = useState("");

  useEffect(() => {
    setKeys(loadKeys());
  }, []);

  const active = useMemo(() => keys.filter((k) => !k.disabled).length, [keys]);

  function refresh() {
    setKeys(loadKeys());
  }

  function onAdd() {
    if (!newKey.trim()) {
      setMsg("Isi API key");
      return;
    }
    addKey(provider, newKey.trim(), label.trim() || undefined);
    setNewKey("");
    setLabel("");
    refresh();
    setMsg("Key ditambahkan");
  }

  function onExport() {
    const blob = new Blob([exportKeysJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "api-keys-backup.json";
    a.click();
    setMsg("Exported");
  }

  function onImport() {
    try {
      importKeysJson(importText);
      refresh();
      setImportText("");
      setMsg("Import OK");
    } catch (e: any) {
      setMsg(e?.message || "Import gagal");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-lg px-4 py-6">
        <Link href="/" className="text-sm text-zinc-400">
          ← Home
        </Link>
        <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold">
          <KeyRound className="h-7 w-7 text-violet-400" /> API Key Manager
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Kelola banyak key. Multi-Agent otomatis ganti key jika kuota habis.
          Data hanya di browser (localStorage).
        </p>

        <div className="mt-2 text-xs text-zinc-500">
          Aktif: {active} / {keys.length} ·{" "}
          <Link href="/tools/multi-agent" className="text-violet-400 underline">
            Buka Multi-Agent
          </Link>
        </div>

        <div className="mt-5 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <select
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} — {p.hint}
              </option>
            ))}
          </select>
          <input
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            placeholder="Label (opsional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            type="password"
            placeholder="Tempel API key"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
          <button
            type="button"
            onClick={onAdd}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-bold"
          >
            <Plus className="h-4 w-4" /> Tambah key
          </button>
        </div>

        <ul className="mt-4 space-y-2">
          {keys.length === 0 && (
            <li className="text-sm text-zinc-500">Belum ada key</li>
          )}
          {keys.map((k) => (
            <li
              key={k.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold">
                    {k.label || k.provider}
                    {k.disabled ? (
                      <span className="ml-2 text-xs text-red-400">OFF</span>
                    ) : (
                      <span className="ml-2 text-xs text-emerald-400">ON</span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {k.provider}
                    {k.failCount ? ` · fail ${k.failCount}` : ""}
                    {k.lastError ? ` · ${k.lastError}` : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { resetKey(k.id); refresh(); }}>
                    <RefreshCw className="h-4 w-4 text-zinc-400" />
                  </button>
                  <button type="button" onClick={() => { removeKey(k.id); refresh(); }}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-2 rounded-2xl border border-zinc-800 p-4">
          <div className="text-sm font-bold">Backup / restore</div>
          <button
            type="button"
            onClick={onExport}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-800 py-2 text-xs font-bold"
          >
            <Download className="h-3.5 w-3.5" /> Export JSON
          </button>
          <textarea
            className="min-h-[80px] w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs"
            placeholder='Paste JSON export di sini lalu Import'
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <button
            type="button"
            onClick={onImport}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-800 py-2 text-xs font-bold"
          >
            <Upload className="h-3.5 w-3.5" /> Import JSON
          </button>
        </div>

        {msg && <p className="mt-3 text-xs text-amber-300">{msg}</p>}

        <p className="mt-6 text-[11px] text-zinc-600">
          Jangan bagikan file export (berisi key mentah). Key tidak disimpan di
          server database.
        </p>
      </div>
    </div>
  );
}
