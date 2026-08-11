"use client";

export type Provider = "openrouter" | "groq" | "openai" | "anthropic";

export type ApiKeyEntry = {
  id: string;
  provider: Provider;
  key: string;
  label?: string;
  disabled?: boolean;
  failCount?: number;
  lastUsedAt?: number;
  lastError?: string;
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

/** Key aktif, prioritas failCount rendah + lastUsed lama */
export function nextKey(list?: ApiKeyEntry[]): ApiKeyEntry | null {
  const active = (list || loadKeys()).filter((k) => k.key && !k.disabled);
  if (!active.length) return null;
  active.sort((a, b) => {
    const fa = a.failCount || 0;
    const fb = b.failCount || 0;
    if (fa !== fb) return fa - fb;
    return (a.lastUsedAt || 0) - (b.lastUsedAt || 0);
  });
  return active[0];
}

export function markFail(id: string, error?: string) {
  const list = loadKeys();
  const i = list.findIndex((k) => k.id === id);
  if (i < 0) return;
  list[i].failCount = (list[i].failCount || 0) + 1;
  list[i].lastError = (error || "").slice(0, 120);
  if ((list[i].failCount || 0) >= 3) list[i].disabled = true;
  saveKeys(list);
}

export function markOk(id: string) {
  const list = loadKeys();
  const i = list.findIndex((k) => k.id === id);
  if (i < 0) return;
  list[i].failCount = 0;
  list[i].disabled = false;
  list[i].lastError = undefined;
  list[i].lastUsedAt = Date.now();
  saveKeys(list);
}

export function addKey(provider: Provider, key: string, label?: string) {
  const list = loadKeys();
  const k = key.trim();
  if (!k) return list;
  if (list.some((x) => x.key === k && x.provider === provider)) return list;
  list.push({
    id: String(Date.now()) + Math.random().toString(36).slice(2, 6),
    provider,
    key: k,
    label: label || provider + " · ··" + k.slice(-4),
    failCount: 0,
  });
  saveKeys(list);
  return list;
}

export function removeKey(id: string) {
  const list = loadKeys().filter((k) => k.id !== id);
  saveKeys(list);
  return list;
}

export function resetKey(id: string) {
  const list = loadKeys().map((k) =>
    k.id === id ? { ...k, disabled: false, failCount: 0, lastError: undefined } : k
  );
  saveKeys(list);
  return list;
}

export function exportKeysJson(): string {
  return JSON.stringify(loadKeys(), null, 2);
}

export function importKeysJson(raw: string): ApiKeyEntry[] {
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr)) throw new Error("Format JSON tidak valid");
  const cleaned: ApiKeyEntry[] = [];
  for (const x of arr) {
    if (!x || !x.key || !x.provider) continue;
    cleaned.push({
      id: String(x.id || Date.now() + Math.random()),
      provider: x.provider,
      key: String(x.key),
      label: x.label,
      disabled: Boolean(x.disabled),
      failCount: Number(x.failCount) || 0,
      lastUsedAt: x.lastUsedAt,
      lastError: x.lastError,
    });
  }
  saveKeys(cleaned);
  return cleaned;
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
