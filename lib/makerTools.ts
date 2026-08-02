export type MakerField = {
  name: string;
  label: string;
  placeholder: string;
  type?: "text" | "textarea";
  default?: string;
};

export type MakerTool = {
  slug: string;
  title: string;
  description: string;
  tag: string;
  icon: string;
  fields: MakerField[];
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, values: Record<string, string>) => void;
};

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let lines: string[] = [];
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxWidth && line !== "") {
      lines.push(line);
      line = word + " ";
    } else {
      line = test;
    }
  }
  lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l.trim(), x, y + i * lineHeight));
  return lines.length;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const makerTools: MakerTool[] = [
  {
    slug: "fake-bank-jago",
    title: "Fake Bank Jago",
    description: "Generator visual saldo Bank Jago",
    tag: "SIMULASI",
    icon: "🏦",
    fields: [
      { name: "nama", label: "Nama Akun", placeholder: "Nama kamu", default: "Meydi Hikara" },
      { name: "saldo", label: "Saldo", placeholder: "1.000.000", default: "25.000.000" },
    ],
    draw: (ctx, w, h, v) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#F97316");
      grad.addColorStop(1, "#EA580C");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "rgba(255,255,255,0.15)";
      roundRect(ctx, 24, 24, w - 48, h - 48, 24);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "600 22px sans-serif";
      ctx.fillText(v.nama || "Nama Akun", 48, 90);

      ctx.font = "400 16px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillText("Saldo Tabungan Utama", 48, 140);

      ctx.font = "700 44px sans-serif";
      ctx.fillStyle = "#fff";
      ctx.fillText(`Rp${v.saldo || "0"}`, 48, 195);

      ctx.font = "italic 13px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText("*Gambar hasil generator / simulasi, bukan data asli", 48, h - 32);
    },
  },
  {
    slug: "brat-generator",
    title: "BRAT Generator",
    description: "Static + animated GIF",
    tag: "GIF",
    icon: "✨",
    fields: [{ name: "teks", label: "Teks", placeholder: "tulis sesuatu", default: "brat" }],
    draw: (ctx, w, h, v) => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#000";
      ctx.font = "900 46px Arial";
      ctx.textBaseline = "middle";
      ctx.filter = "blur(0.6px)";
      const text = (v.teks || "brat").toLowerCase();
      const metrics = ctx.measureText(text);
      const scale = Math.min(1, (w - 60) / metrics.width);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(scale, scale);
      ctx.textAlign = "center";
      ctx.fillText(text, 0, 0);
      ctx.restore();
    },
  },
  {
    slug: "iqc-generator",
    title: "IQC Generator",
    description: "Buat gambar IQC (Instagram Quote Card)",
    tag: "CUSTOM",
    icon: "🖼️",
    fields: [
      { name: "quote", label: "Kutipan", placeholder: "Tulis kutipan...", type: "textarea", default: "Kadang diam itu jawaban terbaik." },
      { name: "author", label: "Sumber/Nama", placeholder: "- Nama", default: "- Anonim" },
    ],
    draw: (ctx, w, h, v) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#1e1b2e");
      grad.addColorStop(1, "#0d0b14");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#fff";
      ctx.font = "italic 600 26px Georgia";
      ctx.textAlign = "center";
      const lines = wrapText(ctx, `"${v.quote || "Kutipan kamu di sini"}"`, w / 2, h / 2 - 20, w - 80, 36);

      ctx.font = "16px sans-serif";
      ctx.fillStyle = "#A78BFA";
      ctx.fillText(v.author || "- Anonim", w / 2, h / 2 + lines * 36 - 10);
    },
  },
  {
    slug: "sertifikat-tolol",
    title: "Sertifikat Tolol",
    description: "Buat sertifikat parodi dari nama",
    tag: "API",
    icon: "🎖️",
    fields: [{ name: "nama", label: "Nama Penerima", placeholder: "Nama", default: "Nama Kamu" }],
    draw: (ctx, w, h, v) => {
      ctx.fillStyle = "#FEF3C7";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#B45309";
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, w - 40, h - 40);
      ctx.strokeStyle = "#D97706";
      ctx.lineWidth = 2;
      ctx.strokeRect(32, 32, w - 64, h - 64);

      ctx.textAlign = "center";
      ctx.fillStyle = "#92400E";
      ctx.font = "700 22px Georgia";
      ctx.fillText("SERTIFIKAT PENGHARGAAN", w / 2, 90);

      ctx.font = "16px sans-serif";
      ctx.fillStyle = "#78350F";
      ctx.fillText("dengan bangga diberikan kepada", w / 2, 130);

      ctx.font = "italic 700 30px Georgia";
      ctx.fillStyle = "#B45309";
      ctx.fillText(v.nama || "Nama Kamu", w / 2, 175);

      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#78350F";
      wrapText(ctx, "atas dedikasinya yang luar biasa dalam bidang ke-tolol-an sehari-hari", w / 2, 210, w - 100, 20);
    },
  },
  {
    slug: "ektp-generator",
    title: "E-KTP Generator",
    description: "Full form demo",
    tag: "FULL",
    icon: "🪪",
    fields: [
      { name: "nama", label: "Nama", placeholder: "Nama Lengkap", default: "NAMA LENGKAP" },
      { name: "nik", label: "NIK", placeholder: "16 digit", default: "3200000000000000" },
      { name: "ttl", label: "Tempat/Tgl Lahir", placeholder: "Kota, 01-01-2000", default: "Kota, 01-01-2000" },
    ],
    draw: (ctx, w, h, v) => {
      ctx.fillStyle = "#DBEAFE";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#1D4ED8";
      ctx.fillRect(0, 0, w, 44);
      ctx.fillStyle = "#fff";
      ctx.font = "700 16px sans-serif";
      ctx.fillText("KARTU TANDA PENDUDUK (CONTOH)", 16, 28);

      ctx.fillStyle = "#1E293B";
      ctx.font = "12px sans-serif";
      ctx.fillText("NIK", 16, 70);
      ctx.font = "700 20px monospace";
      ctx.fillText(v.nik || "-", 16, 92);

      ctx.font = "12px sans-serif";
      ctx.fillText("Nama", 16, 120);
      ctx.font = "700 18px sans-serif";
      ctx.fillText(v.nama || "-", 16, 142);

      ctx.font = "12px sans-serif";
      ctx.fillText("Tempat/Tgl Lahir", 16, 168);
      ctx.font = "600 15px sans-serif";
      ctx.fillText(v.ttl || "-", 16, 188);

      ctx.font = "italic 11px sans-serif";
      ctx.fillStyle = "#64748B";
      ctx.fillText("*Contoh visual, bukan dokumen resmi", 16, h - 16);
    },
  },
  {
    slug: "fake-dana",
    title: "Fake Dana",
    description: "Generate saldo Dana palsu",
    tag: "CUSTOM",
    icon: "💰",
    fields: [{ name: "saldo", label: "Saldo", placeholder: "1.000.000", default: "5.000.000" }],
    draw: (ctx, w, h, v) => {
      ctx.fillStyle = "#0891B2";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      roundRect(ctx, 24, 24, w - 48, h - 48, 20);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.fillText("Saldo DANA", 48, 90);
      ctx.font = "700 40px sans-serif";
      ctx.fillText(`Rp${v.saldo || "0"}`, 48, 140);

      ctx.font = "italic 12px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText("*Simulasi visual, bukan saldo asli", 48, h - 30);
    },
  },
  {
    slug: "fakedev",
    title: "FakeDev",
    description: "Buat profil developer dari nama, bio, dan foto",
    tag: "API",
    icon: "💻",
    fields: [
      { name: "nama", label: "Nama", placeholder: "Nama developer", default: "devkamu" },
      { name: "bio", label: "Bio", placeholder: "Full-stack dev...", default: "Full-stack developer" },
    ],
    draw: (ctx, w, h, v) => {
      ctx.fillStyle = "#0D1117";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#30363D";
      ctx.lineWidth = 1;
      roundRect(ctx, 20, 20, w - 40, h - 40, 12);
      ctx.stroke();

      ctx.fillStyle = "#7C3AED";
      ctx.beginPath();
      ctx.arc(70, 80, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#E6EDF3";
      ctx.font = "700 20px monospace";
      ctx.fillText(v.nama || "devkamu", 115, 75);

      ctx.font = "14px monospace";
      ctx.fillStyle = "#8B949E";
      wrapText(ctx, v.bio || "Full-stack developer", 115, 95, w - 150, 18);
    },
  },
  {
    slug: "fake-lobby",
    title: "Fake Lobby",
    description: "FF & ML lobby palsu",
    tag: "GAME",
    icon: "🎮",
    fields: [
      { name: "judul", label: "Nama Lobby", placeholder: "Solo Rank", default: "Custom Room #1" },
      { name: "pemain", label: "Daftar Pemain (pisah koma)", placeholder: "A, B, C", default: "Player1, Player2, Player3" },
    ],
    draw: (ctx, w, h, v) => {
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#F59E0B";
      ctx.font = "700 22px sans-serif";
      ctx.fillText(v.judul || "Custom Room", 20, 44);

      const players = (v.pemain || "").split(",").map((p) => p.trim()).filter(Boolean);
      ctx.font = "16px sans-serif";
      players.forEach((p, i) => {
        ctx.fillStyle = "#374151";
        roundRect(ctx, 20, 60 + i * 40, w - 40, 32, 8);
        ctx.fill();
        ctx.fillStyle = "#F3F4F6";
        ctx.fillText(`${i + 1}. ${p}`, 32, 82 + i * 40);
      });
    },
  },
  {
    slug: "windows-quotes",
    title: "Windows Quotes",
    description: "Quote ala Windows",
    tag: "MEME",
    icon: "🪟",
    fields: [{ name: "teks", label: "Isi Quote", placeholder: "Tulis pesan...", type: "textarea", default: "Update sedang berjalan, jangan matikan perangkat." }],
    draw: (ctx, w, h, v) => {
      ctx.fillStyle = "#0078D7";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#fff";
      ctx.font = "300 28px sans-serif";
      ctx.textAlign = "center";
      wrapText(ctx, v.teks || "Pesan Windows di sini", w / 2, h / 2 - 20, w - 80, 36);

      ctx.font = "16px sans-serif";
      ctx.fillText("⊞ Windows", w / 2, h - 30);
    },
  },
  {
    slug: "tanya-ustadz",
    title: "Tanya Ustadz",
    description: "Meme generator",
    tag: "LUCU",
    icon: "🧕",
    fields: [
      { name: "tanya", label: "Pertanyaan", placeholder: "Tulis pertanyaan...", default: "Ustadz, bagaimana hukumnya..." },
      { name: "jawab", label: "Jawaban", placeholder: "Tulis jawaban...", default: "Hukumnya adalah..." },
    ],
    draw: (ctx, w, h, v) => {
      ctx.fillStyle = "#F0FDF4";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#166534";
      ctx.font = "700 14px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Q:", 20, 50);
      ctx.fillStyle = "#14532D";
      ctx.font = "16px sans-serif";
      let lines = wrapText(ctx, v.tanya || "Pertanyaan...", 50, 50, w - 70, 22);

      const yAns = 50 + lines * 22 + 30;
      ctx.fillStyle = "#166534";
      ctx.font = "700 14px sans-serif";
      ctx.fillText("A:", 20, yAns);
      ctx.fillStyle = "#14532D";
      ctx.font = "16px sans-serif";
      wrapText(ctx, v.jawab || "Jawaban...", 50, yAns, w - 70, 22);
    },
  },
];

export function getToolBySlug(slug: string) {
  return makerTools.find((t) => t.slug === slug);
}
