export type ComicType = "all" | "manga" | "manhwa" | "manhua";
export type ComicStatus =
  | "all"
  | "ongoing"
  | "completed"
  | "hiatus"
  | "cancelled";
export type Demographic =
  | "all"
  | "shounen"
  | "shoujo"
  | "seinen"
  | "josei";
export type SortKey = "latest" | "rating" | "followed" | "az";

export type CatalogFilters = {
  q: string;
  type: ComicType;
  status: ComicStatus;
  demographic: Demographic;
  sort: SortKey;
  genres: string[];
  page: number;
};

export const GENRE_OPTIONS: { id: string; label: string }[] = [
  { id: "391b0423-d847-4e45-8cd9-b62ee8941a91", label: "Action" },
  { id: "87cc87cd-a395-47af-b27f-477aadbdf3b5", label: "Adventure" },
  { id: "4d32cc48-9f00-4cca-9b5a-a839f076a428", label: "Comedy" },
  { id: "b9af3a63-f058-46de-aeaf-3a18dbbd1bd1", label: "Drama" },
  { id: "cdc58593-87dd-415e-bac9-2cd5d0d54bea", label: "Fantasy" },
  { id: "cdad7e68-1419-41fc-b994-f7b89bc6aed9", label: "Horror" },
  { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", label: "Romance" },
  { id: "e5301a38-98e6-4595-be2e-2a329bdd1d86", label: "Slice of Life" },
  { id: "a3c67850-4684-404e-9b7f-c603f29aae4e", label: "Adult" },
  { id: "eabc5b4c-6aff-42f3-b831-7e82c5a229e6", label: "Supernatural" },
];

export const DEFAULT_FILTERS: CatalogFilters = {
  q: "",
  type: "all",
  status: "all",
  demographic: "all",
  sort: "latest",
  genres: [],
  page: 1,
};

export function parseFilters(sp: URLSearchParams): CatalogFilters {
  const genresRaw = sp.get("genres") || "";
  return {
    q: sp.get("q") || "",
    type: (sp.get("type") as ComicType) || "all",
    status: (sp.get("status") as ComicStatus) || "all",
    demographic: (sp.get("demographic") as Demographic) || "all",
    sort: (sp.get("sort") as SortKey) || "latest",
    genres: genresRaw ? genresRaw.split(",").filter(Boolean) : [],
    page: Math.max(1, Number(sp.get("page") || 1) || 1),
  };
}

export function toQuery(filters: CatalogFilters): string {
  const sp = new URLSearchParams();
  if (filters.q.trim()) sp.set("q", filters.q.trim());
  if (filters.type !== "all") sp.set("type", filters.type);
  if (filters.status !== "all") sp.set("status", filters.status);
  if (filters.demographic !== "all") sp.set("demographic", filters.demographic);
  if (filters.sort !== "latest") sp.set("sort", filters.sort);
  if (filters.genres.length) sp.set("genres", filters.genres.join(","));
  if (filters.page > 1) sp.set("page", String(filters.page));
  const s = sp.toString();
  return s ? `?${s}` : "";
}
