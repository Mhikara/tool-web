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
    title: "Premium Bypasser",
    desc: "Bypass Linkvertise, Workink, & SC Key (No Captcha)",
    href: "/bypasser",
    icon: "🔓",
    tag: "Tools",
  },

  {
    title: "Roblox SC Finder",
    desc: "Cari SC No Key & Anti-Patched (Real-Time)",
    href: "/roblox",
    icon: "🎮",
    tag: "Tools",
  },

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
,
  {
    slug: "upload-zip",
    title: "Upload ZIP",
    description: "Ekstrak ZIP lalu push GitHub atau deploy Vercel",
    tag: "DEPLOY",
    icon: "📦",
    href: "/tools/upload-zip",
  },
  {
    slug: "multi-agent",
    title: "Multi-Agent AI",
    description: "Planner–Builder dengan rotasi API key, memori & project",
    tag: "AI",
    icon: "🤖",
    href: "/tools/multi-agent",
  },
,
  {
    slug: "api-keys",
    title: "API Key Manager",
    description: "Kelola & rotasi API key AI (Groq, OpenRouter, dll.)",
    tag: "AI",
    icon: "🔑",
    href: "/tools/api-keys",
  },
];
