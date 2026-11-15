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

    return NextResponse.json(
      { success: true, data: detected },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Gagal memeriksa link."
      },
      { status: 400 }
    );
  }
}
