// lib/vynmail.ts
// Client tipis untuk mail.tm temporary email API (https://docs.mail.tm)

const MAILTM_BASE = "https://api.mail.tm";

export interface MailTmAccount {
  address: string;
  password: string;
  token: string;
}

export interface MailTmMessageSummary {
  id: string;
  from: { address: string; name: string };
  subject: string;
  intro: string;
  seen: boolean;
  createdAt: string;
}

export interface MailTmMessageFull extends MailTmMessageSummary {
  text: string;
  html: string[];
}

function randomString(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function createMailTmAccount(): Promise<MailTmAccount> {
  const domainsRes = await fetch(`${MAILTM_BASE}/domains?page=1`);
  if (!domainsRes.ok) throw new Error("Gagal mengambil daftar domain mail.tm");
  const domainsData = await domainsRes.json();
  const domain = domainsData?.["hydra:member"]?.[0]?.domain;
  if (!domain) throw new Error("Tidak ada domain mail.tm yang tersedia");

  const address = `vyn${randomString(10)}@${domain}`;
  const password = randomString(16);

  const createRes = await fetch(`${MAILTM_BASE}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password }),
  });
  if (!createRes.ok) {
    const errBody = await createRes.text();
    throw new Error(`Gagal membuat akun mail.tm: ${errBody}`);
  }

  const tokenRes = await fetch(`${MAILTM_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password }),
  });
  if (!tokenRes.ok) throw new Error("Gagal mendapatkan token mail.tm");
  const tokenData = await tokenRes.json();

  return { address, password, token: tokenData.token };
}

export async function fetchInbox(token: string): Promise<MailTmMessageSummary[]> {
  const res = await fetch(`${MAILTM_BASE}/messages?page=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Gagal mengambil inbox");
  const data = await res.json();
  return (data["hydra:member"] || []).map((m: any) => ({
    id: m.id,
    from: m.from,
    subject: m.subject,
    intro: m.intro,
    seen: m.seen,
    createdAt: m.createdAt,
  }));
}

export async function fetchMessage(token: string, id: string): Promise<MailTmMessageFull> {
  const res = await fetch(`${MAILTM_BASE}/messages/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Gagal mengambil isi pesan");
  const data = await res.json();
  return {
    id: data.id,
    from: data.from,
    subject: data.subject,
    intro: data.intro,
    seen: data.seen,
    createdAt: data.createdAt,
    text: data.text,
    html: data.html || [],
  };
}
