// Mağaza konumu Google Haritalar'daki işletme profilinden (voltabeykent@gmail.com) gelir.
// Ad + adres birlikte verildiğinde Google doğrudan işletme kaydını (yorumlar, saatler) açar.
const YER = 'Volta Motor Beykent Beylikdüzü Büyükçekmece Fabrika Satış Mağazası, Pınartepe Mahallesi Avrupa Caddesi No:83T, Büyükçekmece/İstanbul';
const q = encodeURIComponent(YER);
export const HARITA_GOMULU = `https://www.google.com/maps?q=${q}&output=embed&hl=tr`;
export const YOL_TARIFI = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
export const HARITADA_AC = `https://www.google.com/maps/search/?api=1&query=${q}`;
