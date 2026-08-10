const cache = new Map<string, string>();

export async function toId(text: string): Promise<string> {
  const raw = (text || "").trim();
  if (!raw) return "";
  const key = raw.slice(0, 400);
  if (cache.has(key)) return cache.get(key)!;
  try {
    const url =
      "https://api.mymemory.translated.net/get?q=" +
      encodeURIComponent(key) +
      "&langpair=en|id";
    const res = await fetch(url);
    if (!res.ok) return raw;
    const data = await res.json();
    const out = String(data?.responseData?.translatedText || raw).trim();
    cache.set(key, out);
    return out;
  } catch {
    return raw;
  }
}
