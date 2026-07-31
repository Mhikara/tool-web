export type DownloaderTool = {
  slug: string;
  title: string;
  description: string;
  tag: string;
  icon: string;
};

export const downloaderTools: DownloaderTool[] = [
  {
    slug: "terabox",
    title: "Terabox Downloader",
    description: "Ambil file dari link share Terabox",
    tag: "FILE",
    icon: "📦",
  },
  {
    slug: "instagram",
    title: "Instagram",
    description: "Download video & foto",
    tag: "HD",
    icon: "📷",
  },
  {
    slug: "tiktok",
    title: "TikTok",
    description: "Video, foto & audio",
    tag: "MP4/MP3/JPG",
    icon: "🎵",
  },
  {
    slug: "youtube",
    title: "YouTube",
    description: "Video & audio",
    tag: "MP4/MP3",
    icon: "▶️",
  },
  {
    slug: "spotify",
    title: "Spotify Downloader",
    description: "Cari lagu, preview audio dan unduh Spotify ke MP3",
    tag: "MP3",
    icon: "🎧",
  },
];

export function getDownloaderBySlug(slug: string) {
  return downloaderTools.find((t) => t.slug === slug);
}
