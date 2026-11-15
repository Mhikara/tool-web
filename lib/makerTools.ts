export type MakerTool = {
  slug: string;
  title: string;
  description: string;
  tag: string;
  icon: string;
};

export const makerTools: MakerTool[] = [
  {
    slug: "qr-code-maker",
    title: "QR Code Maker",
    description: "Buat QR untuk URL, WhatsApp, Wi-Fi, dan teks.",
    tag: "QR",
    icon: "▦",
  },
  {
    slug: "thumbnail-maker",
    title: "Thumbnail Maker",
    description: "Desain thumbnail video dengan foto dan teks.",
    tag: "DESIGN",
    icon: "🎬",
  },
  {
    slug: "meme-maker",
    title: "Meme Maker",
    description: "Buat meme sendiri dengan foto dan tulisan.",
    tag: "FUN",
    icon: "😂",
  },
  {
    slug: "sticker-maker",
    title: "Sticker Maker",
    description: "Buat stiker dari gambar dan teks.",
    tag: "STICKER",
    icon: "✨",
  },
  {
    slug: "logo-maker",
    title: "Logo Maker",
    description: "Buat logo sederhana dengan teks, bentuk, dan warna.",
    tag: "BRAND",
    icon: "🎨",
  },
  {
    slug: "social-media-maker",
    title: "Social Media Maker",
    description: "Desain konten Feed dan Story media sosial.",
    tag: "SOCIAL",
    icon: "📱",
  },
];
