// Vercel serverless function — receives the public contact form, stores a
// best-effort audit row in Supabase, and emails the dealer via Resend.
//
// Env (Vercel project settings) — hepsi isteğe bağlı; mesaj her durumda Supabase'e yazılır:
//   RESEND_API_KEY     — Resend API key (https://resend.com); yoksa e-posta gitmez
//   CONTACT_FROM_EMAIL — verified Resend sender, e.g. "Volta Bayi <bayi@alanadiniz.com>"
//   CONTACT_TO_EMAIL   — recipient (defaults to the dealer Gmail below)
//   SUPABASE_URL       — enables the audit log; falls back to VITE_SUPABASE_URL
//   SUPABASE_ANON_KEY  — falls back to VITE_SUPABASE_ANON_KEY

const DEFAULT_FROM = 'Volta Bayi <onboarding@resend.dev>';
const DEFAULT_TO = 'cdhmotorluaraclar@gmail.com';

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Yöntem desteklenmiyor.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const name = String(body.name ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const message = String(body.message ?? '').trim();

  if (!name || !phone || !message) {
    return res.status(400).json({ error: 'Ad, telefon ve mesaj alanları zorunludur.' });
  }
  if (name.length > 200 || phone.length > 50 || message.length > 5000) {
    return res.status(400).json({ error: 'Girdiğiniz bilgiler çok uzun.' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM;
  const to = process.env.CONTACT_TO_EMAIL || DEFAULT_TO;

  // Mesaj önce veritabanına yazılır (admin paneli > Mesajlar). E-posta ek bildirimdir:
  // RESEND_API_KEY yoksa ya da gönderim başarısızsa, kayıt yapıldıysa müşteri hata görmez.
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  let saved = false;
  if (supabaseUrl && supabaseKey) {
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/contact_messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ name, phone, message }),
      });
      saved = r.ok;
      if (!r.ok) console.error('[contact] insert failed', r.status, await r.text());
    } catch (e) {
      console.error('[contact] insert exception', e);
    }
  } else {
    console.error('[contact] Supabase env not configured');
  }

  if (!RESEND_API_KEY) {
    if (saved) return res.status(200).json({ ok: true });
    console.error('[contact] RESEND_API_KEY is not configured and insert failed');
    return res.status(500).json({ error: 'Mesaj gönderilemedi. Lütfen telefonla ulaşın.' });
  }

  const subject = `Yeni iletişim formu mesajı — ${name}`;
  const html =
    `<h2 style="margin:0 0 16px">Yeni iletişim formu mesajı</h2>` +
    `<p><strong>Ad Soyad:</strong> ${escapeHtml(name)}</p>` +
    `<p><strong>Telefon:</strong> ${escapeHtml(phone)}</p>` +
    `<p><strong>Mesaj:</strong></p>` +
    `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`;
  const text =
    `Yeni iletişim formu mesajı\n\n` +
    `Ad Soyad: ${name}\n` +
    `Telefon: ${phone}\n\n` +
    `Mesaj:\n${message}`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from, to: [to], subject, html, text }),
    });
    if (!r.ok) {
      console.error('[contact] resend error', r.status, await r.text());
      if (saved) return res.status(200).json({ ok: true });
      return res.status(502).json({ error: 'Mesaj gönderilemedi. Lütfen telefonla ulaşın.' });
    }
  } catch (e) {
    console.error('[contact] resend exception', e);
    if (saved) return res.status(200).json({ ok: true });
    return res.status(502).json({ error: 'Mesaj gönderilemedi. Lütfen telefonla ulaşın.' });
  }

  return res.status(200).json({ ok: true });
}
