import { NextResponse } from "next/server";

type CacheOpts = {
  /** detik — browser + CDN */
  maxAge?: number;
  /** detik — hanya CDN Vercel (stale-while-revalidate) */
  swr?: number;
  /** true = jangan cache sama sekali */
  noStore?: boolean;
};

/** Header Cache-Control siap pakai */
export function cacheHeaders(opts: CacheOpts = {}) {
  if (opts.noStore) {
    return {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
    };
  }

  const maxAge = opts.maxAge ?? 60;
  const swr = opts.swr ?? maxAge * 2;

  return {
    "Cache-Control": `public, s-maxage=\( {maxAge}, stale-while-revalidate= \){swr}`,
    "CDN-Cache-Control": `public, s-maxage=\( {maxAge}, stale-while-revalidate= \){swr}`,
    "Vercel-CDN-Cache-Control": `public, s-maxage=\( {maxAge}, stale-while-revalidate= \){swr}`,
  };
}

/** JSON response + cache */
export function jsonCached(
  data: unknown,
  status = 200,
  opts: CacheOpts = {}
) {
  return NextResponse.json(data, {
    status,
    headers: cacheHeaders(opts),
  });
}

/** Error → selalu no-store */
export function jsonError(message: string, status = 500) {
  return NextResponse.json(
    { error: message },
    { status, headers: cacheHeaders({ noStore: true }) }
  );
}

/** Binary/file response + cache */
export function fileCached(
  body: BodyInit,
  contentType: string,
  filename: string,
  opts: CacheOpts = { maxAge: 3600, swr: 86400 }
) {
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      ...cacheHeaders(opts),
    },
  });
}
