export type ComicType = "all" | "manga" | "manhwa" | "manhua";
export type Demographic =
  | "all"
  | "shounen"
  | "shoujo"
  | "seinen"
  | "josei"
  | "none";

export const TYPE_OPTS: { id: ComicType; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "manga", label: "Manga" },
  { id: "manhwa", label: "Manhwa" },
  { id: "manhua", label: "Manhua" },
];

export const DEMO_OPTS: { id: Demographic; label: string }[] = [
  { id: "all", label: "Gender: Semua" },
  { id: "shounen", label: "Shounen" },
  { id: "shoujo", label: "Shoujo" },
  { id: "seinen", label: "Seinen" },
  { id: "josei", label: "Josei" },
];

/** UUID tag genre MangaDex (resmi) */
export const GENRE_OPTS: { id: string; label: string }[] = [
  { id: "", label: "Semua genre" },
  { id: "391b0423-d847-4e45-8cd9-b62ee8941a91", label: "Action" },
  { id: "87cc87cd-a395-47af-b27f-477aadbdf3b5", label: "Adventure" },
  { id: "4d32cc48-9f00-4cca-9b5a-a839f076a428", label: "Comedy" },
  { id: "b9af3a63-f058-46de-aeaf-3a18dbbd1bd1", label: "Drama" },
  { id: "cdc58593-87dd-415e-bac9-2cd5d0d54bea", label: "Fantasy" },
  { id: "cdad7e68-1419-41fc-b994-f7b89bc6aed9", label: "Horror" },
  { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", label: "Romance" },
  { id: "256c8bd9-4904-476b-b6e8-7ec16c53c6f8", label: "Sci-Fi" },
  { id: "e5301a38-98e6-4595-be2e-2a329bdd1d86", label: "Slice of Life" },
  { id: "eabc5b4c-6aff-42f3-b831-7e82c5a229e6", label: "Supernatural" },
  { id: "07251805-a27e-4d59-b488-f0bfbec15168", label: "Mystery" },
  { id: "a1f53773-c995-4d20-a5c4-4d4f0b42c1e2", label: "Psychological" },
  { id: "ee968100-4191-4968-93d3-f82d72ab1053", label: "Sports" },
];

export function mdLangForType(t: ComicType): string[] {
  if (t === "manga") return ["ja"];
  if (t === "manhwa") return ["ko"];
  if (t === "manhua") return ["zh", "zh-hk"];
  return [];
}

export function mergeQuery(
  current: URLSearchParams | { get: (k: string) => string | null },
  patch: Record<string, string | null>
): string {
  const sp = new URLSearchParams();
  // copy existing
  if (typeof (current as URLSearchParams).forEach === "function") {
    (current as URLSearchParams).forEach((v, k) => sp.set(k, v));
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === "" || v === "all") sp.delete(k);
    else sp.set(k, v);
  }
  const s = sp.toString();
  return s ? "?" + s : "";
}

export function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}
