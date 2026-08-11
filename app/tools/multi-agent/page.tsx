"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bot,
  KeyRound,
  Brain,
  History,
  FolderKanban,
  Send,
  Loader2,
  Plus,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  ApiKeyEntry,
  HistMsg,
  Project,
  Provider,
  addMemory,
  loadHistory,
  loadKeys,
  loadMemory,
  loadProjects,
  markFail,
  markOk,
  nextKey,
  saveHistory,
  saveKeys,
  saveMemory,
  saveProjects,
} from "../../../lib/ai/keyStore";

const AGENTS = [
  {
    id: "planner",
    name: "Planner",
    system:
      "Kamu Planner. Pecah goal user jadi langkah singkat, jelas, berbahasa Indonesia. Maks 8 langkah.",
  },
  {
    id: "researcher",
    name: "Researcher",
    system:
      "Kamu Researcher. Beri fakta/ringkasan yang berguna untuk goal. Bahasa Indonesia. Jujur jika tidak yakin.",
  },
  {
    id: "builder",
    name: "Builder",
    system:
      "Kamu Builder. Tulis solusi praktis: kode, struktur file, atau checklist implementasi. Bahasa Indonesia.",
  },
  {
    id: "reviewer",
    name: "Reviewer",
    system:
      "Kamu Reviewer. Kritik solusi, cari bug/risiko, sarankan perbaikan singkat. Bahasa Indonesia.",
  },
] as const;

export default function MultiAgentPage() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [memory, setMemory] = useState<{ id: string; text: string; at: number }[]>([]);
  const [history, setHistory] = useState<HistMsg[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tab, setTab] = useState<"chat" | "keys" | "memory" | "history" | "project">("chat");

  const [provider, setProvider] = useState<Provider>("openrouter");
  const [newKey, setNewKey] = useState("");
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [projectName, setProjectName] = useState("");
  const [activeProject, setActiveProject] = useState<string>("");

  useEffect(() => {
    setKeys(loadKeys());
    setMemory(loadMemory());
    setHistory(loadHistory());
    setProjects(loadProjects());
  }, []);

  const activeKeyCount = useMemo(
    () => keys.filter((k) => k.key && !k.disabled).length,
    [keys]
  );

  function persistKeys(list: ApiKeyEntry[]) {
    saveKeys(list);
    setKeys(list);
  }

  function addKey() {
    const key = newKey.trim();
    if (!key) return;
    const entry: ApiKeyEntry = {
      id: String(Date.now()),
      provider,
      key,
      label: provider + " · " + key.slice(-4),
      failCount: 0,
    };
    persistKeys([...keys, entry]);
    setNewKey("");
  }

  function removeKey(id: string) {
    persistKeys(keys.filter((k) => k.id !== id));
  }

  function resetKey(id: string) {
    const list = keys.map((k) =>
      k.id === id ? { ...k, disabled: false, failCount: 0 } : k
    );
    persistKeys(list);
  }

  async function callWithRotate(
    agentSystem: string,
    messages: { role: string; content: string }[]
  ): Promise<string> {
    let list = loadKeys();
    const tried = new Set<string>();
    let lastErr = "Tidak ada API key";

    for (let attempt = 0; attempt < 6; attempt++) {
      const entry = nextKey(list.filter((k) => !tried.has(k.id)));
      if (!entry) break;
      tried.add(entry.id);
      setStatus("Pakai key " + (entry.label || entry.provider) + "…");

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: entry.provider,
          apiKey: entry.key,
          system: agentSystem,
          messages,
        }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        markOk(entry.id);
        list = loadKeys();
        return data.content as string;
      }
      lastErr = data.error || "Gagal";
      if (data.retryable !== false) {
        markFail(entry.id);
        list = loadKeys();
        setStatus("Key gagal, ganti key lain…");
        continue;
      }
      throw new Error(lastErr);
    }
    throw new Error(lastErr + " (semua key habis/gagal)");
  }

  async function runAgents() {
    const g = goal.trim();
    if (!g) return;
    if (!activeKeyCount) {
      setStatus("Tambah minimal 1 API key di tab Keys");
      setTab("keys");
      return;
    }
    setBusy(true);
    setStatus("Menjalankan multi-agent…");
    const memText = loadMemory()
      .slice(-8)
      .map((m) => m.text)
      .join("\n");
    const proj = loadProjects().find((p) => p.id === activeProject);

    let hist = loadHistory();
    const push = (role: HistMsg["role"], content: string, agent?: string) => {
      hist = [
        ...hist,
        {
          id: String(Date.now()) + Math.random(),
          role,
          content,
          agent,
          at: Date.now(),
        },
      ];
      saveHistory(hist);
      setHistory(hist);
    };

    push("user", g);

    try {
      const context =
        (proj
          ? "Project: " +
            proj.name +
            "\nGoal project: " +
            proj.goal +
            "\nCatatan: " +
            proj.notes +
            "\n"
          : "") +
        (memText ? "Memori:\n" + memText + "\n" : "") +
        "Tugas user: " +
        g;

      let chain = "";
      for (const agent of AGENTS) {
        setStatus("Agent: " + agent.name);
        const content = await callWithRotate(agent.system, [
          {
            role: "user",
            content:
              context +
              (chain ? "\n\nHasil agent sebelumnya:\n" + chain.slice(-6000) : ""),
          },
        ]);
        chain += "\n\n### " + agent.name + "\n" + content;
        push("assistant", content, agent.name);
      }

      addMemory("Goal: " + g.slice(0, 200) + " | Ringkas: " + chain.slice(0, 400));
      setMemory(loadMemory());

      if (proj) {
        const list = loadProjects().map((p) =>
          p.id === proj.id
            ? {
                ...p,
                notes: (p.notes + "\n---\n" + chain.slice(0, 1500)).slice(-4000),
                updatedAt: Date.now(),
              }
            : p
        );
        saveProjects(list);
        setProjects(list);
      }

      setStatus("Selesai");
    } catch (e: any) {
      setStatus(e?.message || "Error");
      push("assistant", "Error: " + (e?.message || "gagal"));
    } finally {
      setBusy(false);
    }
  }

  function createProject() {
    const name =
      projectName.trim() || "Project " + new Date().toLocaleDateString("id-ID");
    const p: Project = {
      id: String(Date.now()),
      name,
      goal: goal || "",
      notes: "",
      updatedAt: Date.now(),
    };
    const list = [p, ...loadProjects()];
    saveProjects(list);
    setProjects(list);
    setActiveProject(p.id);
    setProjectName("");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link href="/" className="text-sm text-zinc-400">
          ← Home
        </Link>
        <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold">
          <Bot className="h-7 w-7 text-violet-400" /> Multi-Agent AI
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Planner → Researcher → Builder → Reviewer. Key otomatis diganti jika
          kuota habis. Memori, history, dan project tersimpan di browser.
        </p>

        <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
          {(
            [
              ["chat", "Chat"],
              ["keys", "Keys"],
              ["memory", "Memori"],
              ["history", "History"],
              ["project", "Project"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold " +
                (tab === id
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-900 text-zinc-400")
              }
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "keys" && (
          <div className="mt-4 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold">
              <KeyRound className="h-4 w-4" /> API Keys ({activeKeyCount} aktif)
            </div>
            <select
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
            >
              <option value="openrouter">OpenRouter</option>
              <option value="groq">Groq (gratis tier)</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                type="password"
                placeholder="Tempel API key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
              <button
                type="button"
                onClick={addKey}
                className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-bold"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <ul className="space-y-2">
              {keys.map((k) => (
                <li
                  key={k.id}
                  className="flex items-center justify-between rounded-lg bg-zinc-950 px-3 py-2 text-xs"
                >
                  <span>
                    {k.label || k.provider}
                    {k.disabled ? " · OFF" : ""}
                    {k.failCount ? " · fail " + k.failCount : ""}
                  </span>
                  <span className="flex gap-2">
                    <button type="button" onClick={() => resetKey(k.id)} title="Reset">
                      <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
                    </button>
                    <button type="button" onClick={() => removeKey(k.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-zinc-500">
              Key hanya di localStorage browser. Server tidak menyimpan key permanen.
            </p>
          </div>
        )}

        {tab === "memory" && (
          <div className="mt-4 space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold">
                <Brain className="h-4 w-4" /> Memori
              </span>
              <button
                type="button"
                className="text-xs text-red-400"
                onClick={() => {
                  saveMemory([]);
                  setMemory([]);
                }}
              >
                Hapus semua
              </button>
            </div>
            {memory.length === 0 && (
              <p className="text-sm text-zinc-500">Belum ada memori</p>
            )}
            {memory
              .slice()
              .reverse()
              .map((m) => (
                <p key={m.id} className="rounded-lg bg-zinc-950 p-2 text-xs text-zinc-300">
                  {m.text}
                </p>
              ))}
          </div>
        )}

        {tab === "history" && (
          <div className="mt-4 space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold">
                <History className="h-4 w-4" /> History
              </span>
              <button
                type="button"
                className="text-xs text-red-400"
                onClick={() => {
                  saveHistory([]);
                  setHistory([]);
                }}
              >
                Hapus
              </button>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {history.map((h) => (
                <div
                  key={h.id}
                  className={
                    "rounded-lg p-2 text-xs " +
                    (h.role === "user" ? "bg-violet-950/50" : "bg-zinc-950")
                  }
                >
                  <div className="mb-1 text-[10px] uppercase text-zinc-500">
                    {h.agent || h.role}
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-zinc-200">
                    {h.content}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "project" && (
          <div className="mt-4 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold">
              <FolderKanban className="h-4 w-4" /> Save Project
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                placeholder="Nama project"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
              <button
                type="button"
                onClick={createProject}
                className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-bold"
              >
                Simpan
              </button>
            </div>
            <ul className="space-y-2">
              {projects.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveProject(p.id);
                      setGoal(p.goal || goal);
                    }}
                    className={
                      "w-full rounded-lg px-3 py-2 text-left text-sm " +
                      (activeProject === p.id
                        ? "bg-violet-900/50 ring-1 ring-violet-500"
                        : "bg-zinc-950")
                    }
                  >
                    <div className="font-bold">{p.name}</div>
                    <div className="text-xs text-zinc-500 line-clamp-2">{p.goal}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "chat" && (
          <div className="mt-4 space-y-3">
            <textarea
              className="min-h-[100px] w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="Tulis goal / project yang ingin dikerjakan agent…"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>
                Keys aktif: {activeKeyCount}
                {activeProject ? " · Project dipilih" : ""}
              </span>
              <span>{status}</span>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={runAgents}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Jalankan Multi-Agent
            </button>
            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {history.slice(-12).map((h) => (
                <div
                  key={h.id}
                  className={
                    "rounded-xl p-3 text-xs " +
                    (h.role === "user" ? "bg-violet-950/40" : "bg-zinc-900")
                  }
                >
                  <div className="mb-1 text-[10px] font-bold uppercase text-zinc-500">
                    {h.agent || h.role}
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-zinc-200">
                    {h.content}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
