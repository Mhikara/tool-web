import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Fitur upload belum aktif — Supabase Storage belum dikonfigurasi." },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File wajib diupload" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/[^\w.-]/g, "")}`;

    const { error } = await supabase.storage
      .from("uploads")
      .upload(fileName, buffer, { contentType: file.type, upsert: false });

    if (error) {
      return NextResponse.json({ error: `Gagal upload: ${error.message}` }, { status: 500 });
    }

    const { data } = supabase.storage.from("uploads").getPublicUrl(fileName);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memproses upload" }, { status: 500 });
  }
}
