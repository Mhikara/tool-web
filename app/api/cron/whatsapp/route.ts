import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Ambil script terbaru dari ScriptBlox
    const res = await fetch("https://scriptblox.com/api/script/fetch?page=1", {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 0 },
    });
    const data = await res.json();
    const scripts = data?.result?.scripts?.slice(0, 5) || [];

    if (scripts.length === 0) {
      return NextResponse.json({ message: "Tidak ada script baru hari ini." });
    }

    // 2. Format pesan rapi untuk WhatsApp Saluran / Grup
    const dateStr = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let message = `🔥 *UPDATE ROBLOX SC HARIAN* 🔥\n📅 ${dateStr}\n🌐 Web: https://tool-web-drab.vercel.app/roblox\n\n`;

    scripts.forEach((sc: any, i: number) => {
      message += `*${i + 1}. ${sc.title}*\n`;
      message += `🎮 Game: *${sc.game?.name || "Universal"}*\n`;
      message += `🔓 Key: *${sc.key ? "With Key" : "No Key (Keyless)"}*\n`;
      message += `📜 Script:\n\`\`\`${sc.script}\`\`\`\n\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━━━\n⚡ Ambil ratusan SC lainnya di: *tool-web-drab.vercel.app/roblox*`;

    // Catatan: Jika kamu memakai Gateway API WhatsApp seperti Fonnte / Wablas,
    // kamu bisa langsung kirim `message` ini menggunakan fetch ke API Gateway mereka.

    return NextResponse.json({
      success: true,
      previewMessage: message,
      totalScripts: scripts.length,
    });
  } catch {
    return NextResponse.json({ error: "Gagal menyusun pesan update harian." }, { status: 500 });
  }
}
