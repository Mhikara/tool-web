"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

const TYPES = [
  ["url", "🌐", "Website"],
  ["whatsapp", "💬", "WhatsApp"],
  ["wifi", "📶", "Wi-Fi"],
  ["text", "📝", "Teks"],
  ["email", "✉️", "Email"],
  ["phone", "📞", "Telepon"],
  ["sms", "📩", "SMS"],
  ["location", "📍", "Lokasi"],
];

const presets = [
  ["#111827", "#FFFFFF"],
  ["#312E81", "#FFFFFF"],
  ["#064E3B", "#FFFFFF"],
  ["#7F1D1D", "#FFFFFF"],
  ["#FFFFFF", "#111827"],
  ["#FDF2F8", "#831843"],
];

export default function QRStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const [type, setType] = useState("url");
  const [content, setContent] = useState("https://example.com");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [security, setSecurity] = useState("WPA");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [foreground, setForeground] = useState("#111827");
  const [background, setBackground] = useState("#FFFFFF");
  const [caption, setCaption] = useState("SCAN ME");
  const [brand, setBrand] = useState("SCAN TO OPEN");
  const [showFrame, setShowFrame] = useState(true);
  const [logoUrl, setLogoUrl] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 13px", borderRadius: 11,
    border: "1px solid #353047", background: "#171421",
    color: "#F8FAFC", outline: "none", fontSize: 14,
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", color: "#B9AECF", fontSize: 12,
    fontWeight: 700, marginBottom: 8,
  };

  const getPayload = () => {
    const escapeWifi = (value: string) =>
      value.replace(/([\\;,:"])/g, "\\$1");

    switch (type) {
      case "url": {
        const value = content.trim();
        if (!/^https?:\/\/.+/i.test(value)) throw new Error("Masukkan URL lengkap yang diawali https:// atau http://.");
        return value;
      }
      case "whatsapp": {
        const number = content.replace(/\D/g, "");
        if (number.length < 8) throw new Error("Nomor WhatsApp tidak valid.");
        return `https://wa.me/${number}`;
      }
      case "wifi":
        if (!ssid.trim()) throw new Error("Nama Wi-Fi belum diisi.");
        return `WIFI:T:${security};S:${escapeWifi(ssid)};P:${security === "nopass" ? "" : escapeWifi(password)};;`;
      case "text":
        if (!content.trim()) throw new Error("Masukkan teks terlebih dahulu.");
        return content.trim();
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Alamat email tidak valid.");
        return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      case "phone":
        if (phone.replace(/\D/g, "").length < 6) throw new Error("Nomor telepon tidak valid.");
        return `tel:${phone.replace(/[^\d+]/g, "")}`;
      case "sms":
        if (phone.replace(/\D/g, "").length < 6) throw new Error("Nomor telepon tidak valid.");
        return `SMSTO:${phone.replace(/[^\d+]/g, "")}:${message}`;
      case "location": {
        const lat = Number(latitude);
        const lon = Number(longitude);
        if (!latitude.trim() || !longitude.trim() || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
          throw new Error("Masukkan koordinat latitude dan longitude yang valid.");
        }
        return `geo:${lat},${lon}`;
      }
      default:
        throw new Error("Jenis QR tidak dikenal.");
    }
  };

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      setReady(false);
      setError("");

      try {
        const payload = getPayload();
        const qrUrl = await QRCode.toDataURL(payload, {
          width: 720,
          margin: 2,
          errorCorrectionLevel: logoUrl ? "H" : "Q",
          color: { dark: foreground, light: background },
        });
        if (cancelled) return;

        const qrImage = new Image();
        qrImage.onload = () => {
          if (cancelled) return;

          canvas.width = 1000;
          canvas.height = showFrame ? 1120 : 1000;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = background;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (showFrame) {
            ctx.fillStyle = foreground;
            ctx.textAlign = "center";
            ctx.font = "bold 35px Arial";
            ctx.fillText(brand.trim() || "SCAN TO OPEN", 500, 82);
          }

          ctx.drawImage(qrImage, 140, showFrame ? 130 : 80, 720, 720);

          if (logoRef.current) {
            const logo = logoRef.current;
            ctx.fillStyle = background;
            ctx.beginPath();
            ctx.roundRect(410, showFrame ? 410 : 360, 180, 180, 30);
            ctx.fill();
            ctx.drawImage(logo, 435, showFrame ? 435 : 385, 130, 130);
          }

          if (showFrame) {
            ctx.fillStyle = foreground;
            ctx.textAlign = "center";
            ctx.font = "bold 42px Arial";
            ctx.fillText(caption.trim() || "SCAN ME", 500, 940);
            ctx.globalAlpha = 0.65;
            ctx.font = "22px Arial";
            ctx.fillText("Powered by Maker Studio", 500, 1000);
            ctx.globalAlpha = 1;
          }

          setReady(true);
        };
        qrImage.onerror = () => {
          if (!cancelled) setError("Gagal memuat preview QR.");
        };
        qrImage.src = qrUrl;
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Gagal membuat QR Code.");
          setReady(false);
        }
      }
    };

    void render();
    return () => { cancelled = true; };
  }, [
    type, content, ssid, password, security, email, subject, message,
    phone, latitude, longitude, foreground, background, caption, brand,
    showFrame, logoUrl,
  ]);

  const uploadLogo = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Pilih file gambar yang valid.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran logo maksimal 5 MB.");
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (logoUrl) URL.revokeObjectURL(logoUrl);
      logoRef.current = image;
      setLogoUrl(url);
      setError("");
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Logo tidak dapat dibaca.");
    };
    image.src = url;
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ready || busy) return;
    setBusy(true);
    try {
      const link = document.createElement("a");
      link.download = `qr-maker-${type}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setBusy(false);
    }
  };

  const field = (label: string, value: string, setValue: (v: string) => void, placeholder: string, inputType = "text") => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input style={inputStyle} type={inputType} value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder}/>
    </div>
  );

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 16px 50px", color: "#F8FAFC", fontFamily: "Arial,sans-serif" }}>
      <a href="/maker" style={{ color: "#B9A4FF", textDecoration: "none", fontSize: 13 }}>← Kembali ke Maker</a>

      <header style={{ margin: "22px 0 24px" }}>
        <div style={{ color: "#A78BFA", fontSize: 11, fontWeight: 800, letterSpacing: 2 }}>MAKER STUDIO / QR DESIGNER</div>
        <h1 style={{ fontSize: 30, fontWeight: 900, margin: "8px 0" }}>QR Code Studio</h1>
        <p style={{ color: "#A6A0B5", fontSize: 14, lineHeight: 1.6, margin: 0 }}>Buat QR Code dengan gaya brand kamu. Atur konten, warna, logo, dan bingkai dalam satu editor.</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))", gap: 18 }}>
        <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
        <section style={{ background: "#100D19", border: "1px solid #30283D", borderRadius: 18, padding: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>01 · Pilih jenis QR</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8 }}>
            {TYPES.map(([id, icon, name]) => (
              <button key={id} type="button" onClick={() => setType(id)} style={{
                minHeight: 75, borderRadius: 12, border: type === id ? "1px solid #A78BFA" : "1px solid #393248",
                background: type === id ? "#30234D" : "#191522", color: "#F8FAFC",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 6, cursor: "pointer", fontSize: 11, fontWeight: 700,
              }}>
                <span style={{ fontSize: 21 }}>{icon}</span>{name}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gap: 13, marginTop: 20 }}>
            {type === "url" && field("URL WEBSITE", content, setContent, "https://website.com")}
            {type === "whatsapp" && field("NOMOR WHATSAPP", content, setContent, "628123456789")}
            {type === "text" && (
              <div>
                <label style={labelStyle}>ISI TEKS</label>
                <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Tulis pesan atau informasi..."/>
              </div>
            )}
            {type === "wifi" && <>
              {field("NAMA WI-FI / SSID", ssid, setSsid, "Nama jaringan")}
              {field("PASSWORD", password, setPassword, "Password Wi-Fi", "password")}
              <div>
                <label style={labelStyle}>KEAMANAN JARINGAN</label>
                <select style={inputStyle} value={security} onChange={(e) => setSecurity(e.target.value)}>
                  <option value="WPA">WPA / WPA2</option><option value="WEP">WEP</option><option value="nopass">Tanpa password</option>
                </select>
              </div>
            </>}
            {type === "email" && <>
              {field("ALAMAT EMAIL", email, setEmail, "nama@email.com", "email")}
              {field("SUBJEK", subject, setSubject, "Subjek email")}
              <div><label style={labelStyle}>PESAN</label><textarea style={{ ...inputStyle, minHeight: 75 }} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Isi pesan email"/></div>
            </>}
            {type === "phone" && field("NOMOR TELEPON", phone, setPhone, "+628123456789", "tel")}
            {type === "sms" && <>
              {field("NOMOR TUJUAN", phone, setPhone, "+628123456789", "tel")}
              <div><label style={labelStyle}>ISI SMS</label><textarea style={{ ...inputStyle, minHeight: 75 }} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Pesan SMS"/></div>
            </>}
            {type === "location" && <>
              {field("LATITUDE", latitude, setLatitude, "-6.200000")}
              {field("LONGITUDE", longitude, setLongitude, "106.816666")}
              <p style={{ color: "#8D879D", fontSize: 11, margin: 0 }}>Masukkan koordinat lokasi dalam format angka desimal.</p>
            </>}
          </div>
        </section>

        <section style={{ background: "#100D19", border: "1px solid #30283D", borderRadius: 18, padding: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>02 · Desain QR kamu</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
            <div>
              <label style={labelStyle}>WARNA QR</label>
              <input aria-label="Warna QR" type="color" value={foreground} onChange={(e) => setForeground(e.target.value)} style={{ width: "100%", height: 43, border: 0, background: "transparent" }}/>
            </div>
            <div>
              <label style={labelStyle}>WARNA LATAR</label>
              <input aria-label="Warna latar" type="color" value={background} onChange={(e) => setBackground(e.target.value)} style={{ width: "100%", height: 43, border: 0, background: "transparent" }}/>
            </div>
          </div>

          <label style={{ ...labelStyle, marginTop: 17 }}>PRESET WARNA</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
            {presets.map(([dark, light], i) => (
              <button key={i} aria-label={`Preset warna ${i + 1}`} type="button" onClick={() => { setForeground(dark); setBackground(light); }} style={{
                width: 38, height: 38, borderRadius: 10, background: light,
                border: `5px solid ${dark}`, outline: foreground === dark && background === light ? "2px solid #A78BFA" : "none",
                cursor: "pointer",
              }}/>
            ))}
          </div>

          <div style={{ marginTop: 19 }}>
            <label style={labelStyle}>UPLOAD LOGO TENGAH (OPSIONAL)</label>
            <input type="file" accept="image/*" onChange={(e) => uploadLogo(e.target.files?.[0])} style={{ ...inputStyle, padding: 9, fontSize: 12 }}/>
            {logoUrl && <button type="button" onClick={() => { URL.revokeObjectURL(logoUrl); setLogoUrl(""); logoRef.current = null; }} style={{ color: "#FCA5A5", marginTop: 8, background: "none", border: 0, cursor: "pointer" }}>Hapus logo ×</button>}
            <p style={{ color: "#8D879D", fontSize: 11, lineHeight: 1.5 }}>Gunakan logo sederhana. Logo mengurangi area data QR, sehingga pemindaian perlu diuji.</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            <input id="qr-frame" type="checkbox" checked={showFrame} onChange={(e) => setShowFrame(e.target.checked)}/>
            <label htmlFor="qr-frame" style={{ fontSize: 13, color: "#D5CDE4" }}>Gunakan bingkai desain</label>
          </div>

          {showFrame && <div style={{ display: "grid", gap: 12, marginTop: 15 }}>
            {field("JUDUL BRAND", brand, setBrand, "SCAN TO OPEN")}
            {field("TEKS AJAKAN", caption, setCaption, "SCAN ME")}
          </div>}
        </section>

        </div>

        <section style={{ background: "#100D19", border: "1px solid #30283D", borderRadius: 18, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div><div style={{ fontSize: 15, fontWeight: 800 }}>03 · Live Preview</div><div style={{ color: "#8D879D", fontSize: 11, marginTop: 4 }}>Hasil desain QR secara langsung</div></div>
            <span style={{ color: ready ? "#86EFAC" : "#FCD34D", fontSize: 11, fontWeight: 700 }}>{ready ? "● READY" : "● MEMPROSES"}</span>
          </div>
          <div style={{ padding: 10, background: "#211B2D", borderRadius: 14, display: "flex", justifyContent: "center" }}>
            <canvas ref={canvasRef} style={{ display: "block", width: "100%", maxWidth: 460, height: "auto", borderRadius: 8 }}/>
          </div>
          {error && <p role="alert" style={{ color: "#FCA5A5", fontSize: 12, marginTop: 12 }}>{error}</p>}
          <button type="button" onClick={download} disabled={!ready || busy} style={{
            width: "100%", padding: 15, border: 0, borderRadius: 12, marginTop: 15,
            background: ready ? "linear-gradient(100deg,#7C3AED,#A855F7)" : "#393248",
            color: "white", fontWeight: 800, fontSize: 14, cursor: ready ? "pointer" : "not-allowed",
          }}>{busy ? "Menyiapkan..." : "↓  Download QR Code PNG"}</button>
          <p style={{ color: "#8D879D", fontSize: 11, textAlign: "center", lineHeight: 1.6, margin: "12px 0 0" }}>Dibuat langsung di perangkat. Data dan logo tidak dikirim ke server.</p>
        </section>
      </div>
    </main>
  );
}
