"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bot, Send, Loader2, Plus, Trash2, RefreshCw } from "lucide-react";
import {
  ApiKeyEntry, HistMsg, Project, Provider,
  addMemory, loadHistory, loadKeys, loadMemory, loadProjects,
  markFail, markOk, nextKey, saveHistory, saveKeys, saveMemory, saveProjects,
} from "../../../lib/ai/keyStore";

const AGENTS = [
  { name: "Planner", system: "Kamu Planner. Pecah goal jadi langkah singkat berbahasa Indonesia. Maks 8 langkah." },
  { name: "Researcher", system: "Kamu Researcher. Ringkas info berguna untuk goal. Bahasa Indonesia." },
  { name: "Builder", system: "Kamu Builder. Beri solusi praktis/kode/checklist. Bahasa Indonesia." },
  { name: "Reviewer", system: "Kamu Reviewer. Kritik singkat & perbaikan. Bahasa Indonesia." },
] as const;

export default function MultiAgentPage() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [history, setHistory] = useState<HistMsg[]>([]);
  const [tab, setTab] = useState<"chat" | "keys">("chat");
  const [provider, setProvider] = useState<Provider>("openrouter");
  const [newKey, setNewKey] = useState("");
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setKeys(loadKeys());
    setHistory(loadHistory());
  }, []);

  const activeKeyCount = useMemo(() => keys.filter((k) => k.key && !k.disabled).length, [keys]);

  function persistKeys(list: ApiKeyEntry[]) {
    saveKeys(list);
    setKeys(list);
  }

  async function callWithRotate(system: string, messages: { role: string; content: string }[]) {
    let list = loadKeys();
    const tried = new Set<string>();
    let lastErr = "Tidak ada API key";
    for (let i = 0; i < 6; i++) {
      const entry = nextKey(list.filter((k) => !tried.has(k.id)));
      if (!entry) break;
      tried.add(entry.id);
      setStatus("Key: " + (entry.label || entry.provider));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: entry.provider, apiKey: entry.key, system, messages }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        markOk(entry.id);
        return data.content as string;
      }
      lastErr = data.error || "Gagal";
      if (data.retryable !== false) {
        markFail(entry.id);
        list = loadKeys();
        setStatus("Ganti key…");
        continue;
      }
      throw new Error(lastErr);
    }
    throw new Error(lastErr + " (semua key gagal)");
  }

  async function runAgents() {
    const g = goal.trim();
    if (!g) return;
    if (!activeKeyCount) { setTab("keys"); setStatus("Tambah API key dulu"); return; }
    setBusy(true);
    let hist = loadHistory();
    const push = (role: HistMsg["role"], content: string, agent?: string) => {
      hist = [...hist, { id: String(Date.now()) + Math.random(), role, content, agent, at: Date.now() }];
      saveHistory(hist);
      setHistory(hist);
    };
    push("user", g);
    try {
      const mem = loadMemory().slice(-6).map((m) => m.text).join("\n");
      let chain = "";
      for (const agent of AGENTS) {
        setStatus("Agent: " + agent.name);
        const content = await callWithRotate(agent.system, [{
          role: "user",
          content: (mem ? "Memori:\n" + mem + "\n" : "") + "Tugas: " + g + (chain ? "\n\nSebelumnya:\n" + chain.slice(-5000) : ""),
        }]);
        chain += "\n\n### " + agent.name + "\n" + content;
        push("assistant", content, agent.name);
      }
      addMemory("Goal: " + g.slice(0, 180));
      setStatus("Selesai");
    } catch (e: any) {
      setStatus(e?.message || "Error");
      push("assistant", "Error: " + (e?.message || "gagal"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link href="/" className="text-sm text-zinc-400">← Home</Link>
        <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold">
          <Bot className="h-7 w-7 text-violet-400" /> Multi-Agent AI
        </h1>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setTab("chat")} className={"rounded-full px-3 py-1.5 text-xs font-bold " + (tab === "chat" ? "bg-violet-600" : "bg-zinc-900 text-zinc-400")}>Chat</button>
          <button type="button" onClick={() => setTab("keys")} className={"rounded-full px-3 py-1.5 text-xs font-bold " + (tab === "keys" ? "bg-violet-600" : "bg-zinc-900 text-zinc-400")}>Keys ({activeKeyCount})</button>
        </div>

        {tab === "keys" && (
          <div className="mt-4 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <select className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" value={provider} onChange={(e) => setProvider(e.target.value as Provider)}>
              <option value="openrouter">OpenRouter</option>
              <option value="groq">Groq</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
            <div className="flex gap-2">
              <input className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" type="password" placeholder="API key" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
              <button type="button" className="rounded-lg bg-violet-600 px-3" onClick={() => {
                if (!newKey.trim()) return;
                persistKeys([...keys, { id: String(Date.now()), provider, key: newKey.trim(), label: provider + " · " + newKey.trim().slice(-4), failCount: 0 }]);
                setNewKey("");
              }}><Plus className="h-4 w-4" /></button>
            </div>
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between rounded-lg bg-zinc-950 px-3 py-2 text-xs">
                <span>{k.label}{k.disabled ? " · OFF" : ""}</span>
                <span className="flex gap-2">
                  <button type="button" onClick={() => persistKeys(keys.map((x) => x.id === k.id ? { ...x, disabled: false, failCount: 0 } : x))}><RefreshCw className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => persistKeys(keys.filter((x) => x.id !== k.id))}><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === "chat" && (
          <div className="mt-4 space-y-3">
            <textarea className="min-h-[100px] w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm" placeholder="Goal project…" value={goal} onChange={(e) => setGoal(e.target.value)} />
            <p className="text-xs text-zinc-500">{status}</p>
            <button type="button" disabled={busy} onClick={runAgents} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Jalankan Multi-Agent
            </button>
            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {history.slice(-16).map((h) => (
                <div key={h.id} className={"rounded-xl p-3 text-xs " + (h.role === "user" ? "bg-violet-950/40" : "bg-zinc-900")}>
                  <div className="mb-1 text-[10px] font-bold uppercase text-zinc-500">{h.agent || h.role}</div>
                  <pre className="whitespace-pre-wrap font-sans text-zinc-200">{h.content}</pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
