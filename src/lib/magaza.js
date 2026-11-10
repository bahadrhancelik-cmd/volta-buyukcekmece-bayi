// Mağaza sabitleri ve ürün sayfası yardımcıları — hem sitede (Vue) hem sunucu tarafı
// sayfa üretiminde (api/sayfa.js) kullanılır; tarayıcıya özgü bir şey içermez.
export const WHATSAPP_NO = '905333049311';
export const TELEFON = '0533 304 93 11';
export const TAKSIT_SAYISI = 6;

export function whatsappLink(metin) {
  return `https://wa.me/${WHATSAPP_NO}?text=${encodeURIComponent(metin)}`;
}

export function urunWhatsappMetni(ad) {
  return `Merhaba, ${ad} hakkında bilgi almak istiyorum. (voltamotorbuyukcekmece.com)`;
}

const tl = (n) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n);

// "6 × 3.998 TL" — aylık tutar yukarı yuvarlanır (toplam fiyatın altında kalmasın)
export function taksitMetni(fiyat) {
  const f = Number(fiyat);
  if (!Number.isFinite(f) || f <= 0) return '';
  return `${TAKSIT_SAYISI} × ${tl(Math.ceil(f / TAKSIT_SAYISI))} TL`;
}

function specBul(specs, ...anahtarlar) {
  const s = (specs || []).find((x) => anahtarlar.some((a) => String(x.label || '').toLocaleLowerCase('tr').includes(a)));
  return s ? `${s.value}${s.unit ? ' ' + s.unit : ''}` : null;
}

// Ürün sayfası sık sorulanları. Plaka bilgisi Bahadır Bey'in teyidine göre:
// motosikletler plakalı ve tescilli, elektrikli bisikletler tescilsiz (30.10.2026).
export function urunSSS(m, kategoriEtiketi) {
  const ad = m.name;
  const kat = String(m.category || '');
  const liste = [];
  if (kat === 'elektrikli-bisiklet') {
    liste.push({ s: `${ad} plaka veya tescil gerektirir mi?`, c: `Hayır. Elektrikli bisikletler tescil ve plaka gerektirmez.` });
  } else if (kat === 'bike' || kat === 'benzinli-motosiklet') {
    liste.push({ s: `${ad} plakalı mı?`, c: `Evet, ${ad} plakalı ve tescilli olarak satılır; tescil işlemlerinde mağazamız yardımcı olur.` });
  }
  const menzil = specBul(m.specs, 'menzil');
  const sarj = specBul(m.specs, 'şarj süresi', 'sarj suresi');
  if (menzil || sarj) {
    const p = [];
    if (menzil) p.push(`menzili ${menzil}`);
    if (sarj) p.push(`şarj süresi ${sarj}`);
    liste.push({ s: `${ad} menzili ve şarj süresi ne kadar?`, c: `Üretici verilerine göre ${p.join(', ')}. Gerçek değerler yük, hız ve hava koşullarına göre değişir.` });
  }
  liste.push({ s: `${ad} taksitle alınabilir mi?`, c: `Evet. Kredi kartına ${TAKSIT_SAYISI} aya varan vade farksız taksit yapılır; fiyata vergiler dahildir.` });
  liste.push({ s: `${ad} mağazada var mı, görebilir miyim?`, c: m.inStock
    ? `Evet, şu an stokta. Beykent'teki mağazamızda Pazartesi–Cumartesi 10:00–19:30, Pazar 10:00–19:00 arası detaylı inceleyebilirsiniz.`
    : `Şu an stokta yok. Sayfadaki "Gelince haber ver" formunu doldurursanız stoğa girdiğinde sizi ararız; benzer modelleri mağazamızda inceleyebilirsiniz.` });
  liste.push({ s: `Garanti süresi ne kadar?`, c: `Tüm ürünlerimiz Volta Motor güvencesiyle 2 yıl garantilidir.` });
  void kategoriEtiketi;
  return liste;
}
