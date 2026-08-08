export type SimpleTool = {
  slug: string;
  title: string;
  description: string;
  tag: string;
  icon: string;
  href: string;
};

export const toolsList: SimpleTool[] = [
  {
    slug: "baca-komik",
    title: "Baca Komik",
    description: "Baca manhwa dari ManhwaDesu tanpa iklan",
    tag: "KOMIK",
    icon: "📖",
    href: "/tools/baca-komik",
  },

  {
    slug: "fake-data",
    title: "Fake Data",
    description: "Generator data dummy untuk tes form",
    tag: "TEST",
    icon: "🧪",
    href: "/tools/fake-data",
  },

  {
    slug: "tiktok-hd-upload",
    title: "Upload TikTok HD",
    description: "Ambil video HD no-WM, unduh, siap upload",
    tag: "HD",
    icon: "📤",
    href: "/tools/tiktok-hd-upload",
  },

  {
    slug: "auto-clip",
    title: "Auto Clip",
    description: "Potong video jadi beberapa klip otomatis",
    tag: "VIDEO",
    icon: "✂️",
    href: "/tools/auto-clip",
  },
  {
    slug: "vyn-mail",
    title: "VYN-Mail",
    description: "Email sementara dengan inbox otomatis",
    tag: "MAIL",
    icon: "📧",
    href: "/tools/vyn-mail",
  },
  {
    slug: "virus-scan",
    title: "Virus Scan",
    description: "Scan URL, domain & IP",
    tag: "SECURITY",
    icon: "🛡️",
    href: "/tools/virus-scan",
  },
  {
    slug: "ai-chat",
    title: "Nexus AI",
    description: "Chat AI model gratis",
    tag: "AI",
    icon: "🤖",
    href: "/tools/ai-chat",
  },
  {
    slug: "web-encrypt",
    title: "Web Encryption",
    description: "Enkripsi & lindungi source HTML",
    tag: "SECURE",
    icon: "🔒",
    href: "/tools/web-encrypt",
  },
];
