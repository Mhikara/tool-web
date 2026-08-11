"use client";

export type Provider = "openrouter" | "groq" | "openai" | "anthropic";

export type ApiKeyEntry = {
  id: string;
  provider: Provider;
  key: string;
  label?: string;
  disabled?: boolean;
  failCount?: number;
};

const KEYS = "ma_api_keys_v1";
const MEM = "ma_memory_v1";
const HIST = "ma_history_v1";
const PROJ = "ma_projects_v1";

export function loadKeys(): ApiKeyEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEYS) || "[]");
  } catch {
    return [];
  }
}

export function saveKeys(list: ApiKeyEntry[]) {
  localStorage.setItem(KEYS, JSON.stringify(list));
}

export function nextKey(list: ApiKeyEntry[]): ApiKeyEntry | null {
  const active = list.filter((k) => k.key && !k.disabled);
  if (!active.length) return null;
  active.sort((a, b) => (a.failCount || 0) - (b.failCount || 0));
  return active[0];
}

export function markFail(id: string) {
  const list = loadKeys();
  const i = list.findIndex((k) => k.id === id);
  if (i < 0) return;
  list[i].failCount = (list[i].failCount || 0) + 1;
  if ((list[i].failCount || 0) >= 3) list[i].disabled = true;
  saveKeys(list);
}

export function markOk(id: string) {
  const list = loadKeys();
  const i = list.findIndex((k) => k.id === id);
  if (i < 0) return;
  list[i].failCount = 0;
  list[i].disabled = false;
  saveKeys(list);
}

export type MemoryItem = { id: string; text: string; at: number };

export function loadMemory(): MemoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(MEM) || "[]");
  } catch {
    return [];
  }
}

export function saveMemory(items: MemoryItem[]) {
  localStorage.setItem(MEM, JSON.stringify(items.slice(-40)));
}

export function addMemory(text: string) {
  const items = loadMemory();
  items.push({ id: String(Date.now()), text: text.slice(0, 800), at: Date.now() });
  saveMemory(items);
}

export type HistMsg = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  agent?: string;
  at: number;
};

export function loadHistory(): HistMsg[] {
  try {
    return JSON.parse(localStorage.getItem(HIST) || "[]");
  } catch {
    return [];
  }
}

export function saveHistory(msgs: HistMsg[]) {
  localStorage.setItem(HIST, JSON.stringify(msgs.slice(-80)));
}

export type Project = {
  id: string;
  name: string;
  goal: string;
  notes: string;
  updatedAt: number;
};

export function loadProjects(): Project[] {
  try {
    return JSON.parse(localStorage.getItem(PROJ) || "[]");
  } catch {
    return [];
  }
}

export function saveProjects(list: Project[]) {
  localStorage.setItem(PROJ, JSON.stringify(list.slice(-30)));
}
