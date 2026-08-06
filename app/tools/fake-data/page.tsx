"use client";

import { useState } from "react";
import Link from "next/link";

const FIRST = [
  "Andi", "Budi", "Citra", "Dewi", "Eko", "Fitri", "Gita", "Hadi",
  "Indra", "Joko", "Kartika", "Lina", "Maya", "Nanda", "Putri", "Rizky",
];
const LAST = [
  "Saputra", "Wijaya", "Santoso", "Pratama", "Nugroho", "Lestari",
  "Kurniawan", "Sari", "Hidayat", "Wibowo", "Rahmawati", "Gunawan",
];
const DOMAINS = ["example.com", "mail.test", "demo.local", "sample.id"];
const STREETS = [
  "Jl. Melati", "Jl. Mawar", "Jl. Kenanga", "Jl. Sudirman", "Jl. Gatot Subroto",
];
const CITIES = [
  "Jakarta", "Bandung", "Surabaya", "Medan", "Yogyakarta", "Semarang", "Makassar",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function phoneID() {
  return "08" + String(randInt(100000000, 999999999));
}

function generateOne() {
  const first = pick(FIRST);
  const last = pick(LAST);
  const name = first + " " + last;
  const email =
    first.toLowerCase() +
    "." +
    last.toLowerCase() +
    randInt(1, 99) +
    "@" +
    pick(DOMAINS);
  return {
    name,
    email,
    phone: phoneID(),
    username: (first + last + randInt(10, 99)).toLowerCase(),
    password: "Test@" + randInt(1000, 9999) + "!",
    address: pick(STREETS) + " No. " + randInt(1, 200),
    city: pick(CITIES),
    zip: String(randInt(10000, 99999)),
    company: "PT " + last + " " + pick(["Digital", "Jaya", "Makmur", "Abadi"]),
    birthdate:
      randInt(1985, 2004) +
      "-" +
      String(randInt(1, 12)).padStart(2, "0") +
      "-" +
      String(randInt(1, 28)).padStart(2, "0"),
    note: "DATA DUMMY — hanya untuk testing",
  };
}

export default function FakeDataPage() {
  const [count, setCount] = useState(5);
  const [rows, setRows] = useState<ReturnType<typeof generateOne>[]>([]);
  const [copied, setCopied] = useState("");

  const run = () => {
    const n = Math.min(50, Math.max(1, count));
    setRows(Array.from({ length: n }, () => generateOne()));
    setCopied("");
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
    } catch {
      setCopied("Gagal copy");
    }
  };

  const wrap = {
    background: "#0B0710",
    minHeight: "100vh",
    color: "#F3EEFA",
    fontFamily: "sans-serif",
    padding: 20,
  } as const;

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <Link href="/" style={{ color: "#9C90AC", fontSize: 13 }}>
          ← Kembali
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "12px 0 4px" }}>
          🧪 Fake Data
        </h1>
        <p style={{ fontSize: 13, color: "#9C90AC", marginBottom: 16 }}>
          Generator data dummy untuk tes form / API. Bukan data orang sungguhan.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Number(e.target.value) || 1)}
            style={{
              width: 80,
              padding: 10,
              borderRadius: 10,
              border: "1px solid #333",
              background: "#1C1226",
              color: "#fff",
            }}
          />
          <button
            type="button"
            onClick={run}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              border: "none",
              background: "#A855F7",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            Generate
          </button>
        </div>

        {rows.length > 0 && (
          <>
            <button
              type="button"
              onClick={() =>
                copy(JSON.stringify(rows, null, 2), "JSON disalin")
              }
              style={{
                width: "100%",
                marginBottom: 8,
                padding: 10,
                borderRadius: 10,
                border: "1px solid #444",
                background: "#1C1226",
                color: "#C4B5FD",
                fontWeight: 600,
              }}
            >
              Copy semua (JSON)
            </button>
            {copied && (
              <p style={{ fontSize: 12, color: "#86EFAC", marginBottom: 8 }}>
                {copied}
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {rows.map((r, i) => (
                <div
                  key={i}
                  style={{
                    background: "#1C1226",
                    borderRadius: 12,
                    padding: 14,
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    {r.name}
                  </div>
                  <div style={{ color: "#9C90AC", lineHeight: 1.6 }}>
                    {r.email}
                    <br />
                    {r.phone} · @{r.username}
                    <br />
                    {r.address}, {r.city} {r.zip}
                    <br />
                    {r.company} · lahir {r.birthdate}
                    <br />
                    pass: {r.password}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copy(JSON.stringify(r, null, 2), "Baris " + (i + 1))
                    }
                    style={{
                      marginTop: 8,
                      fontSize: 11,
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid #444",
                      background: "transparent",
                      color: "#A78BFA",
                    }}
                  >
                    Copy JSON
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
