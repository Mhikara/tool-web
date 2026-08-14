"use client";

import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";

export default function TranslateBlock({
  text,
  label = "Sinopsis",
}: {
  text?: string | null;
  label?: string;
}) {
  const original = (text || "").trim();
  const [show, setShow] = useState<"ori" | "id">("ori");
  const [idText, setIdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (!original) return null;

  const translate = async () => {
    if (idText) {
      setShow("id");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/komik/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: original }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Gagal");
      setIdText(j.translated || "");
      setShow("id");
    } catch (e: any) {
      setErr(e?.message || "Gagal translate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-white/10">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-zinc-200">{label}</h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setShow("ori")}
            className={
              "rounded-full px-2.5 py-1 text-[10px] font-semibold " +
              (show === "ori"
                ? "bg-white text-zinc-900"
                : "bg-zinc-800 text-zinc-400")
            }
          >
            EN
          </button>
          <button
            type="button"
            onClick={translate}
            disabled={loading}
            className={
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold " +
              (show === "id"
                ? "bg-violet-600 text-white"
                : "bg-zinc-800 text-zinc-300")
            }
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Languages className="h-3 w-3" />
            )}
            ID
          </button>
        </div>
      </div>
      {err && <p className="mb-2 text-xs text-amber-400">{err}</p>}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
        {show === "id" && idText ? idText : original}
      </p>
    </section>
  );
}
