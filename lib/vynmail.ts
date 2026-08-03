// lib/vynmail.ts
// Client tipis untuk 1secmail temporary email API (https://www.1secmail.com/api/)
// Dipilih karena TIDAK perlu proses buat-akun (no account/token step),
// sehingga jauh lebih tahan terhadap blokir IP data center dibanding
// provider yang mewajibkan registrasi seperti mail.tm.

const ONESEC_BASE = "https://www.1secmail.com/api/v1";

export interface TempAddress {
  login: string;
  domain: string;
  address: string;
}

export interface TempMessageSummary {
  id: number;
  from: string;
  subject: string;
  date: string;
}

export interface TempMessageFull extends TempMessageSummary {
  textBody: string;
  htmlBody: string;
}

export async function generateAddress(): Promise<TempAddress> {
  const res = await fetch(`${ONESEC_BASE}/?action=genRandomMailbox&count=1`);
  if (!res.ok) throw new Error("Gagal membuat alamat email sementara");
  const data = await res.json();
  const full = data?.[0];
  if (!full || !full.includes("@")) {
    throw new Error("Format alamat tidak valid dari provider");
  }
  const [login, domain] = full.split("@");
  return { login, domain, address: full };
}

export async function fetchInbox(
  login: string,
  domain: string
): Promise<TempMessageSummary[]> {
  const url = `${ONESEC_BASE}/?action=getMessages&login=${encodeURIComponent(
    login
  )}&domain=${encodeURIComponent(domain)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Gagal mengambil inbox");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchMessage(
  login: string,
  domain: string,
  id: string
): Promise<TempMessageFull> {
  const url = `${ONESEC_BASE}/?action=readMessage&login=${encodeURIComponent(
    login
  )}&domain=${encodeURIComponent(domain)}&id=${encodeURIComponent(id)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Gagal mengambil isi pesan");
  return res.json();
}
