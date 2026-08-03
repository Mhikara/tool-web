import { createClient, SupabaseClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "uploads";

function getAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export function isStorageReady() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;
  return !!(url && key);
}

export async function uploadToStorage(
  data: Buffer | Uint8Array,
  fileName: string,
  contentType = "application/octet-stream"
): Promise<{ url: string; path: string } | { error: string }> {
  const supabase = getAdmin();
  if (!supabase) return { error: "Supabase Storage belum dikonfigurasi" };

  const safeName = fileName.replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const path = Date.now() + "-" + safeName;

  const { error } = await supabase.storage.from(BUCKET).upload(path, data, {
    contentType,
    upsert: false,
  });
  if (error) return { error: error.message };

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: pub.publicUrl, path };
}

export async function mirrorUrlToStorage(
  sourceUrl: string,
  fileName: string,
  maxBytes = 40 * 1024 * 1024
): Promise<{ url: string; path: string } | { error: string }> {
  try {
    const res = await fetch(sourceUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!res.ok) return { error: "Gagal mengambil file sumber" };

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength > maxBytes) return { error: "File terlalu besar (maks 40MB)" };

    return uploadToStorage(buffer, fileName, contentType);
  } catch (e: any) {
    return { error: e?.message || "Gagal mirror file" };
  }
}
