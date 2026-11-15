import { NextResponse } from "next/server";
import { detectLink } from "@/lib/eonbypass/detector";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get("url");

    if (!input) {
      return NextResponse.json(
        { success: false, error: "URL wajib diisi." },
        { status: 400 }
      );
    }

    if (input.length > 2048) {
      return NextResponse.json(
        { success: false, error: "URL terlalu panjang." },
        { status: 400 }
      );
    }

    const detected = detectLink(input);
    const parsed = new URL(input);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const rawName = segments.at(-1) || "";

    let fileName = "Nama file belum tersedia";

    try {
      const decoded = decodeURIComponent(rawName);
      if (decoded && decoded.includes(".")) {
        fileName = decoded;
      }
    } catch {
      // Nama file tidak dapat dibaca.
    }

    return NextResponse.json({
      success: true,
      data: {
        platform: detected.label,
        hostname: detected.hostname,
        fileName,
        fileType: detected.fileType || "Belum diketahui",
        fileSize: null,
        fileSizeLabel: "Belum tersedia",
        isDirectFile: detected.isDirectFile
      }
    }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error
        ? error.message
        : "Gagal membuat preview."
    }, { status: 400 });
  }
}
