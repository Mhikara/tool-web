"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Copy, RefreshCw, Trash2, Inbox as InboxIcon, X } from "lucide-react";

interface MessageSummary {
  id: string;
  from: { address: string; name: string };
  subject: string;
  intro: string;
  seen: boolean;
  createdAt: string;
}

interface MessageFull {
  id: string;
  from: { address: string; name: string };
  subject: string;
  createdAt: string;
  text: string;
  html: string;
}

const POLL_INTERVAL_MS = 6000;

export default function VynMailPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [selected, setSelected] = useState<MessageFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInbox = useCallback(async () => {
    try {
      const res = await fetch("/api/vyn-mail/inbox");
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages);
        setError(null);
      } else if (res.status === 401) {
        setAddress(null);
      }
    } catch {}
  }, []);

  const generateEmail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vyn-mail/create", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setAddress(data.address);
        setMessages([]);
      } else {
        setError(data.error || "Gagal membuat email.");
      }
    } catch {
      setError("Koneksi gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const resetEmail = async () => {
    await fetch("/api/vyn-mail/delete", { method: "POST" });
    setAddress(null);
    setMessages([]);
    setSelected(null);
  };

  const openMessage = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vyn-mail/message/${id}`);
      const data = await res.json();
      if (res.ok) setSelected(data);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const manualRefresh = async () => {
    setRefreshing(true);
    await loadInbox();
    setRefreshing(false);
  };

  useEffect(() => {
    const match = document.cookie.match(/vynmail_address=([^;]+)/);
    if (match) setAddress(decodeURIComponent(match[1]));
  }, []);

  useEffect(() => {
    if (!address) return;
    loadInbox();
    const interval = setInterval(loadInbox, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [address, loadInbox]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-8 md:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-pink-500/15 flex items-center justify-center">
            <Mail className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">VYN-Mail</h1>
            <p className="text-sm text-zinc-400">Email sementara dengan inbox otomatis</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 mb-6">
          {!address ? (
            <button
              onClick={generateEmail}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-pink-500 hover:bg-pink-600 transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? "Membuat email..." : "Generate Email"}
            </button>
          ) : (
            <div>
              <p className="text-xs text-zinc-400 mb-1">Alamat email kamu</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate text-pink-300 font-mono text-sm bg-black/30 px-3 py-2 rounded-lg">
                  {address}
                </code>
                <button
                  onClick={copyAddress}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label="Salin alamat"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied && <p className="text-xs text-green-400 mt-1">Disalin!</p>}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={manualRefresh}
                  className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <button
                  onClick={resetEmail}
                  className="flex-1 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Buat Baru
                </button>
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        </div>

        {address && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <InboxIcon className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-300">
                Inbox ({messages.length})
              </h2>
            </div>

            {messages.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-zinc-500 text-sm">
                Belum ada pesan masuk. Inbox akan diperbarui otomatis.
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg) => (
                  <motion.button
                    key={msg.id}
                    onClick={() => openMessage(msg.id)}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-4"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-medium text-sm truncate">
                        {msg.from?.name || msg.from?.address}
                      </span>
                      <span className="text-xs text-zinc-500 shrink-0">
                        {new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300 truncate mt-1">{msg.subject}</p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{msg.intro}</p>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full md:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl md:rounded-2xl bg-zinc-900 border border-white/10 p-5"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">{selected.subject}</h3>
                  <p className="text-xs text-zinc-400 mt-1">Dari: {selected.from?.address}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {selected.html ? (
                <div
                  className="text-sm text-zinc-200 leading-relaxed [&_a]:text-pink-400 [&_a]:underline [&_img]:max-w-full [&_img]:rounded-lg"
                  dangerouslySetInnerHTML={{ __html: selected.html }}
                />
              ) : (
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{selected.text}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
