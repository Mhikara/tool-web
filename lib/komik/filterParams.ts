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

/** Map type → MangaDex originalLanguage */
export function mdLangForType(t: ComicType): string[] {
  if (t === "manga") return ["ja"];
  if (t === "manhwa") return ["ko"];
  if (t === "manhua") return ["zh", "zh-hk"];
  return [];
}

export function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}
