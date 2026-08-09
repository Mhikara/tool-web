import Link from "next/link";

interface ComicCardProps {
  id: string;
  title: string;
  coverUrl: string | null;
  status: string;
  originalLanguage: string;
}

function getTypeBadge(originalLanguage: string): { label: string; className: string } {
  switch (originalLanguage) {
    case "ko":
      return { label: "MANHWA", className: "bg-blue-600" };
    case "zh":
    case "zh-hk":
      return { label: "MANHUA", className: "bg-red-600" };
    case "ja":
    default:
      return { label: "MANGA", className: "bg-amber-500" };
  }
}

export default function ComicCard({
  id,
  title,
  coverUrl,
  status,
  originalLanguage,
}: ComicCardProps) {
  const badge = getTypeBadge(originalLanguage);

  return (
    <Link
      href={`/tools/baca-komik/manga/${id}`}
      className="relative block bg-white border rounded-lg overflow-hidden hover:shadow transition"
    >
      <span
        className={`absolute top-1.5 left-1.5 z-10 text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${badge.className}`}
      >
        {badge.label}
      </span>

      {coverUrl ? (
        <img src={coverUrl} alt={title} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-xs text-gray-400">
          No Cover
        </div>
      )}

      <div className="p-2">
        <p className="text-xs font-medium line-clamp-2">{title}</p>
        <p className="text-[10px] text-gray-400 mt-1">{status}</p>
      </div>
    </Link>
  );
}
