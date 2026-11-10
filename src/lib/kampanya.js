// Tek günlük kampanya (11.11.2026, Bahadır Bey'in kararı): seçili modellerde uygulama fiyatından sabit TL indirim.
// Yalnız sitede gösterilir; veritabanındaki fiyat değişmez. Süre bitince kendiliğinden kapanır.
// Üstü çizili fiyat = kampanyadan önceki fiyat (son 10 günün en düşüğü), indirim oranı değil TL yazılır.
export const KAMPANYA = {
  ad: '11.11',
  baslangic: new Date('2026-11-11T00:00:00+03:00'),
  bitis: new Date('2026-11-12T00:00:00+03:00'),
  indirimTl: 1111,
  modeller: ['VSM', 'VSX', 'VB2 PRO (48V)'],
  hediye: { modeller: ['VSM', 'VSX'], metin: 'Kask + kilit hediye (11–16 Kasım)' },
};

export function kampanyaAktif(simdi = new Date()) {
  return simdi >= KAMPANYA.baslangic && simdi < KAMPANYA.bitis;
}

export function kampanyadaMi(appModel) {
  return kampanyaAktif() && !!appModel && KAMPANYA.modeller.includes(appModel);
}

export function hediyeVarMi(appModel) {
  const simdi = new Date();
  return !!appModel && KAMPANYA.hediye.modeller.includes(appModel)
    && simdi >= KAMPANYA.baslangic && simdi < new Date('2026-11-17T00:00:00+03:00');
}
