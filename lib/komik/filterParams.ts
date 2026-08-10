"use client";

/** Merge query: ubah 1 key tanpa hapus key lain */
export function mergeQuery(
  current: URLSearchParams,
  patch: Record<string, string | null | undefined>
): string {
  const sp = new URLSearchParams(current.toString());
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined || v === "" || v === "all") {
      sp.delete(k);
    } else {
      sp.set(k, v);
    }
  }
  const q = sp.toString();
  return q ? "?" + q : "";
}
