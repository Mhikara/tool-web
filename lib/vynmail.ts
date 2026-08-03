// lib/vynmail.ts
// Client tipis untuk Guerrilla Mail API (https://www.guerrillamail.com/GuerrillaMailAPI.html)
// Provider ke-3 setelah mail.tm (502) dan 1secmail (403) gagal.
// User-Agent eksplisit ditambahkan karena banyak temp-mail API menolak
// request server-side tanpa header ini.

const GM_BASE = "https://api.guerrillamail.com/ajax.php";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) VynMailBot/1.0";

export interface GmAddress {
  address: string;
  sidToken: string;
}

export interface GmMessageSummary {
  id: string;
  from: string;
  subject: string;
  excerpt: string;
  timestamp: string;
}

export interface GmMessageFull extends GmMessageSummary {
  body: string;
}

async function gmFetch(params: Record<string, string>) {
  const url = `${GM_BASE}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) {
    throw new Error(`Guerrilla Mail HTTP ${res.status}`);
  }
  return res.json();
}

export async function generateAddress(): Promise<GmAddress> {
  const data = await gmFetch({ f: "get_email_address", lang: "en" });
  if (!data?.email_addr || !data?.sid_token) {
    throw new Error("Respons tidak lengkap dari Guerrilla Mail");
  }
  return { address: data.email_addr, sidToken: data.sid_token };
}

export async function fetchInbox(sidToken: string): Promise<GmMessageSummary[]> {
  const data = await gmFetch({ f: "check_email", seq: "0", sid_token: sidToken });
  const list = data?.list || [];
  return list.map((m: any) => ({
    id: String(m.mail_id),
    from: m.mail_from,
    subject: m.mail_subject,
    excerpt: m.mail_excerpt,
    timestamp: m.mail_timestamp,
  }));
}

export async function fetchMessage(
  sidToken: string,
  id: string
): Promise<GmMessageFull> {
  const data = await gmFetch({ f: "fetch_email", email_id: id, sid_token: sidToken });
  return {
    id: String(data.mail_id),
    from: data.mail_from,
    subject: data.mail_subject,
    excerpt: data.mail_excerpt,
    timestamp: data.mail_timestamp,
    body: data.mail_body || "",
  };
}
