export type ExternalTool = {
  slug: string;
  title: string;
  description: string;
  tag: string;
  icon: string;
};

export const externalTools: ExternalTool[] = [
  {
    slug: "upload-tiktok-hd",
    title: "Upload TikTok HD",
    description: "Proses MP4 HD + TikTok Studio",
    tag: "HD",
    icon: "🎵",
  },
  {
    slug: "get-code-html",
    title: "Get Code HTML",
    description: "Extract, preview, copy & download source",
    tag: "PRO",
    icon: "</>",
  },
  {
    slug: "deploy-update-web",
    title: "Deploy & Update Web",
    description: "Deploy Vercel atau Netlify + update project",
    tag: "UPDATE",
    icon: "🚀",
  },
  {
    slug: "nexus-ai",
    title: "Nexus AI",
    description: "Artificial Intelligence",
    tag: "AI",
    icon: "🤖",
  },
  {
    slug: "foto-to-link",
    title: "Foto To Link",
    description: "Upload & share",
    tag: "MEDIA",
    icon: "🖼️",
  },
  {
    slug: "web-encryption",
    title: "Web Encryption",
    description: "Encrypt & protect HTML",
    tag: "SECURE",
    icon: "🛡️",
  },
  {
    slug: "unban-whatsapp",
    title: "Unban WhatsApp",
    description: "Tools & panduan unban WhatsApp",
    tag: "WA",
    icon: "💬",
  },
];

export function getExternalBySlug(slug: string) {
  return externalTools.find((t) => t.slug === slug);
}
