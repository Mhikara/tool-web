export type Platform =
  | "direct"
  | "google-drive"
  | "mediafire"
  | "dropbox"
  | "github"
  | "linkvertise"
  | "workink"
  | "sub2unlock"
  | "unknown";

export interface DetectedLink {
  platform: Platform;
  label: string;
  hostname: string;
  fileType: string | null;
  isDirectFile: boolean;
}

const PLATFORMS: {
  platform: Platform;
  label: string;
  domains: string[];
}[] = [
  {
    platform: "google-drive",
    label: "Google Drive",
    domains: ["drive.google.com", "docs.google.com"]
  },
  {
    platform: "mediafire",
    label: "MediaFire",
    domains: ["mediafire.com", "www.mediafire.com"]
  },
  {
    platform: "dropbox",
    label: "Dropbox",
    domains: ["dropbox.com", "www.dropbox.com", "dl.dropboxusercontent.com"]
  },
  {
    platform: "github",
    label: "GitHub",
    domains: ["github.com", "raw.githubusercontent.com", "objects.githubusercontent.com"]
  },
  {
    platform: "linkvertise",
    label: "Linkvertise",
    domains: ["linkvertise.com", "linkvertise.download"]
  },
  {
    platform: "workink",
    label: "Workink",
    domains: ["work.ink", "workink.net", "workink.one"]
  },
  {
    platform: "sub2unlock",
    label: "Sub2Unlock",
    domains: ["sub2unlock.com", "sub2unlock.io", "sub2unlock.net"]
  }
];

const FILE_TYPES: Record<string, string> = {
  apk: "APK",
  zip: "ZIP",
  rar: "RAR",
  "7z": "7Z",
  pdf: "PDF",
  mp4: "Video MP4",
  mkv: "Video MKV",
  mp3: "Audio MP3",
  wav: "Audio WAV",
  jpg: "Gambar JPG",
  jpeg: "Gambar JPEG",
  png: "Gambar PNG",
  webp: "Gambar WebP",
  gif: "GIF",
  txt: "Text",
  json: "JSON",
  exe: "EXE"
};

function matchesDomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function detectLink(input: string): DetectedLink {
  let parsed: URL;

  try {
    parsed = new URL(input.trim());
  } catch {
    throw new Error("Format URL tidak valid.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Hanya URL HTTP dan HTTPS yang didukung.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("URL dengan kredensial tidak diizinkan.");
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathname = decodeURIComponent(parsed.pathname);
  const extension = pathname.match(/\.([a-z0-9]{1,8})$/i)?.[1]?.toLowerCase() ?? null;

  const fileType = extension ? FILE_TYPES[extension] ?? "File" : null;

  for (const item of PLATFORMS) {
    if (item.domains.some(domain => matchesDomain(hostname, domain))) {
      return {
        platform: item.platform,
        label: item.label,
        hostname,
        fileType,
        isDirectFile: false
      };
    }
  }

  if (fileType) {
    return {
      platform: "direct",
      label: "Direct Link",
      hostname,
      fileType,
      isDirectFile: true
    };
  }

  return {
    platform: "unknown",
    label: "Link Tidak Dikenal",
    hostname,
    fileType: null,
    isDirectFile: false
  };
}
