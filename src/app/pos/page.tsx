"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  CheckCircle,
  X,
  SplitSquareHorizontal,
  Tag,
} from "lucide-react";

interface Urun {
  id: number;
  ad: string;
  fiyat: number;
  stok: number;
  birim: string;
  barkod: string | null;
  kategori: { ad: string; renk: string } | null;
}

interface SepetKalem {
  urun: Urun;
  adet: number;
}

type OdemeTuru = "NAKIT" | "KART" | "PARCALI";

interface SonucModal {
  satisId: number;
  toplam: number;
  odemeTuru: OdemeTuru;
  alinanPara: number;
  paraUstu: number;
  nakitTutar: number;
  kartTutar: number;
}

export default function POSSayfasi() {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [filtreli, setFiltreli] = useState<Urun[]>([]);
  const [arama, setArama] = useState("");
  const [sepet, setSepet] = useState<SepetKalem[]>([]);
  const [indirim, setIndirim] = useState("");
  const [odemeTuru, setOdemeTuru] = useState<OdemeTuru>("NAKIT");

  // Nakit / Kart alanları
  const [alinanPara, setAlinanPara] = useState("");
  const [pNakit, setPNakit] = useState("");
  const [pKart, setPKart] = useState("");

  const [islemde, setIslemde] = useState(false);
  const [sonuc, setSonuc] = useState<SonucModal | null>(null);
  const [aktifKategori, setAktifKategori] = useState<string>("Tümü");

  useEffect(() => {
    fetch("/api/urunler")
      .then((r) => r.json())
      .then((d) => { setUrunler(d); setFiltreli(d); });
  }, []);

  const kategoriler = ["Tümü", ...Array.from(new Set(urunler.map((u) => u.kategori?.ad).filter(Boolean) as string[]))];

  const filtrele = useCallback(
    (q: string, kat: string) => {
      setFiltreli(
        urunler.filter((u) => {
          const aramaTutar =
            u.ad.toLowerCase().includes(q.toLowerCase()) ||
            (u.barkod && u.barkod.includes(q));
          const kategoriTutar = kat === "Tümü" || u.kategori?.ad === kat;
          return aramaTutar && kategoriTutar;
        })
      );
    },
    [urunler]
  );

  useEffect(() => { filtrele(arama, aktifKategori); }, [arama, aktifKategori, filtrele]);

  const sepeteEkle = (urun: Urun) => {
    setSepet((prev) => {
      const mevcut = prev.find((k) => k.urun.id === urun.id);
      if (mevcut) {
        if (mevcut.adet >= urun.stok) return prev;
        return prev.map((k) => k.urun.id === urun.id ? { ...k, adet: k.adet + 1 } : k);
      }
      if (urun.stok === 0) return prev;
      return [...prev, { urun, adet: 1 }];
    });
  };

  const adetAyarla = (urunId: number, delta: number) => {
    setSepet((prev) =>
      prev
        .map((k) => k.urun.id === urunId ? { ...k, adet: k.adet + delta } : k)
        .filter((k) => k.adet > 0)
    );
  };

  const adetDirektGir = (urunId: number, deger: string) => {
    const sayi = parseInt(deger);
    if (isNaN(sayi) || sayi <= 0) {
      setSepet((prev) => prev.filter((k) => k.urun.id !== urunId));
      return;
    }
    setSepet((prev) =>
      prev.map((k) => {
        if (k.urun.id !== urunId) return k;
        return { ...k, adet: Math.min(sayi, k.urun.stok) };
      })
    );
  };

  const sepettenKaldir = (urunId: number) => setSepet((prev) => prev.filter((k) => k.urun.id !== urunId));
  const sepetiTemizle = () => {
    setSepet([]);
    setIndirim("");
    setAlinanPara("");
    setPNakit("");
    setPKart("");
  };

  const araToplam = sepet.reduce((t, k) => t + k.urun.fiyat * k.adet, 0);
  const indirimTutar = parseFloat(indirim || "0");
  const toplamTutar = Math.max(0, araToplam - indirimTutar);

  // Para üstü hesapları
  const nakit = parseFloat(alinanPara || "0");
  const paraUstu = odemeTuru === "NAKIT" ? Math.max(0, nakit - toplamTutar) : 0;

  const parcaliNakit = parseFloat(pNakit || "0");
  const parcaliKart = parseFloat(pKart || "0");
  const parcaliToplam = parcaliNakit + parcaliKart;
  const parcaliParaUstu = Math.max(0, parcaliNakit - (toplamTutar - parcaliKart));
  const parcaliEksik = parcaliToplam < toplamTutar;

  const odemeTamamMi =
    (odemeTuru === "NAKIT" && nakit >= toplamTutar) ||
    odemeTuru === "KART" ||
    (odemeTuru === "PARCALI" && !parcaliEksik && parcaliToplam > 0);

  const satisTamamla = async () => {
    if (sepet.length === 0 || islemde) return;
    setIslemde(true);
    try {
      const body =
        odemeTuru === "PARCALI"
          ? { kalemler: sepet.map((k) => ({ urunId: k.urun.id, adet: k.adet })), odemeTuru, indirim: indirimTutar, nakitTutar: parcaliNakit, kartTutar: parcaliKart }
          : { kalemler: sepet.map((k) => ({ urunId: k.urun.id, adet: k.adet })), odemeTuru, indirim: indirimTutar, alinanPara: odemeTuru === "NAKIT" ? nakit || toplamTutar : toplamTutar };

      const res = await fetch("/api/satislar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setSonuc({
          satisId: data.id,
          toplam: data.toplamTutar,
          odemeTuru: data.odemeTuru,
          alinanPara: data.alinanPara,
          paraUstu: data.paraUstu,
          nakitTutar: data.nakitTutar,
          kartTutar: data.kartTutar,
        });
        sepetiTemizle();
        fetch("/api/urunler").then((r) => r.json()).then((d) => { setUrunler(d); setFiltreli(d); });
      } else {
        alert(data.error ?? "Hata oluştu");
      }
    } finally {
      setIslemde(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);

  return (
    <div className="flex gap-0 h-[calc(100vh-48px)] -mx-6 -mt-6">
      {/* Sol — Ürün Paneli */}
      <div className="flex-1 flex flex-col bg-slate-50 p-5 gap-4 overflow-hidden">
        {/* Başlık + Arama */}
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart size={20} className="text-indigo-500" /> Satış Ekranı
            </h1>
          </div>
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Ürün adı veya barkod..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Kategori Filtreleri */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {kategoriler.map((kat) => (
            <button
              key={kat}
              onClick={() => setAktifKategori(kat)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                aktifKategori === kat
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {kat}
            </button>
          ))}
        </div>

        {/* Ürün Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {filtreli.map((u) => {
              const sepetteki = sepet.find((k) => k.urun.id === u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => sepeteEkle(u)}
                  disabled={u.stok === 0}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    u.stok === 0
                      ? "bg-slate-100 border-slate-100 opacity-40 cursor-not-allowed"
                      : sepetteki
                      ? "bg-indigo-50 border-indigo-300 shadow-sm"
                      : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md active:scale-95"
                  }`}
                >
                  {sepetteki && (
                    <span className="absolute top-2 right-2 bg-indigo-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {sepetteki.adet}
                    </span>
                  )}
                  <p className="font-semibold text-slate-800 text-sm line-clamp-2 pr-5">{u.ad}</p>
                  {u.kategori && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full mt-1.5 inline-block font-medium"
                      style={{ backgroundColor: u.kategori.renk + "20", color: u.kategori.renk }}
                    >
                      {u.kategori.ad}
                    </span>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-indigo-600 font-bold">{fmt(u.fiyat)}</span>
                    <span className={`text-xs ${u.stok <= 5 && u.stok > 0 ? "text-amber-500 font-medium" : "text-slate-400"}`}>
                      {u.stok === 0 ? "Tükendi" : `${u.stok} ${u.birim}`}
                    </span>
                  </div>
                </button>
              );
            })}
            {filtreli.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400">
                <Search size={32} className="mx-auto mb-2 text-slate-200" />
                Ürün bulunamadı
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sağ — Sepet Paneli */}
      <div className="w-[480px] flex flex-col bg-white border-l border-slate-200 shadow-xl overflow-hidden">
        {/* Sepet Başlık */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <h2 className="font-bold text-base flex items-center gap-2">
            <ShoppingCart size={18} />
            Sepet
            {sepet.length > 0 && (
              <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {sepet.reduce((t, k) => t + k.adet, 0)} ürün
              </span>
            )}
          </h2>
          {sepet.length > 0 && (
            <button onClick={sepetiTemizle} className="text-xs text-slate-400 hover:text-red-400 transition-colors">
              Sepeti Temizle
            </button>
          )}
        </div>

        {/* Sepet Kalemleri */}
        <div className="flex-1 overflow-y-auto">
          {sepet.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 py-16">
              <ShoppingCart size={48} className="mb-3" />
              <p className="text-base font-medium">Sepet boş</p>
              <p className="text-sm mt-1">Sol taraftan ürünlere tıklayın</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {sepet.map((k) => (
                <div key={k.urun.id} className="rounded-xl bg-white border-2 border-slate-200 shadow-sm overflow-hidden">
                  {/* Ürün adı satırı */}
                  <div className="flex items-center justify-between px-3 pt-3 pb-1 gap-2">
                    <p className="font-bold text-slate-900 text-sm leading-tight flex-1 min-w-0">{k.urun.ad}</p>
                    <button
                      onClick={() => sepettenKaldir(k.urun.id)}
                      className="shrink-0 w-6 h-6 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {/* Fiyat + adet kontrolü */}
                  <div className="flex items-center justify-between px-3 pb-3 gap-3">
                    <div>
                      <p className="text-xs text-slate-400">Birim fiyat</p>
                      <p className="text-sm font-bold text-indigo-600">{fmt(k.urun.fiyat)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => adetAyarla(k.urun.id, -1)}
                        className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors font-bold text-slate-700"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={k.urun.stok}
                        value={k.adet}
                        onChange={(e) => adetDirektGir(k.urun.id, e.target.value)}
                        className="w-12 text-center text-base font-black text-slate-900 border-2 border-slate-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                      />
                      <button
                        onClick={() => adetAyarla(k.urun.id, 1)}
                        disabled={k.adet >= k.urun.stok}
                        className="w-8 h-8 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-30 rounded-lg flex items-center justify-center transition-colors text-white"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Toplam</p>
                      <p className="text-sm font-black text-slate-900">{fmt(k.urun.fiyat * k.adet)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {sepet.length > 0 && (
          <div className="border-t border-slate-100 bg-white">
            {/* Ara Toplam / İndirim */}
            <div className="px-5 pt-4 pb-3 space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Ara Toplam</span>
                <span className="font-medium">{fmt(araToplam)}</span>
              </div>

              {/* İndirim */}
              <div className="flex items-center gap-2">
                <Tag size={13} className="text-slate-400 shrink-0" />
                <label className="text-sm text-slate-500 w-20 shrink-0">İndirim (₺)</label>
                <input
                  type="number"
                  min="0"
                  max={araToplam}
                  value={indirim}
                  onChange={(e) => setIndirim(e.target.value)}
                  className="flex-1 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="0.00"
                />
              </div>

              {indirimTutar > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 font-medium">
                  <span>İndirim</span>
                  <span>-{fmt(indirimTutar)}</span>
                </div>
              )}

              <div className="flex justify-between text-lg font-bold text-slate-900 border-t border-slate-100 pt-2">
                <span>Toplam</span>
                <span className="text-indigo-600">{fmt(toplamTutar)}</span>
              </div>
            </div>

            {/* Ödeme Yöntemi */}
            <div className="px-5 pb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Ödeme Yöntemi</p>
              <div className="grid grid-cols-3 gap-2">
                {(["NAKIT", "KART", "PARCALI"] as OdemeTuru[]).map((tur) => {
                  const Icon = tur === "NAKIT" ? Banknote : tur === "KART" ? CreditCard : SplitSquareHorizontal;
                  const label = tur === "NAKIT" ? "Nakit" : tur === "KART" ? "Kart" : "Parçalı";
                  return (
                    <button
                      key={tur}
                      onClick={() => setOdemeTuru(tur)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                        odemeTuru === tur
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      <Icon size={18} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ödeme Detayları */}
            <div className="px-5 pb-3 space-y-2">
              {odemeTuru === "NAKIT" && (
                <div className="bg-amber-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600 w-28 shrink-0">Alınan Para (₺)</label>
                    <input
                      type="number"
                      min={0}
                      value={alinanPara}
                      onChange={(e) => setAlinanPara(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-amber-200 rounded-lg text-sm font-bold text-right focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      placeholder={toplamTutar.toFixed(2)}
                    />
                  </div>
                  {/* Hızlı tuşlar */}
                  <div className="flex gap-1.5 flex-wrap">
                    {[50, 100, 200, 500].map((tutar) => (
                      <button
                        key={tutar}
                        onClick={() => setAlinanPara(tutar.toString())}
                        className="px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        ₺{tutar}
                      </button>
                    ))}
                    <button
                      onClick={() => setAlinanPara(toplamTutar.toFixed(2))}
                      className="px-2.5 py-1 bg-amber-200 rounded-lg text-xs font-bold text-amber-900 hover:bg-amber-300 transition-colors"
                    >
                      Tam
                    </button>
                  </div>
                  {paraUstu > 0 && (
                    <div className="flex justify-between text-sm font-bold text-emerald-700 bg-emerald-50 rounded-lg px-3 py-1.5">
                      <span>Para Üstü</span>
                      <span>{fmt(paraUstu)}</span>
                    </div>
                  )}
                </div>
              )}

              {odemeTuru === "KART" && (
                <div className="bg-blue-50 rounded-xl p-3 text-center text-sm text-blue-700 font-medium">
                  <CreditCard size={20} className="mx-auto mb-1 text-blue-500" />
                  Kart ile ödeme: {fmt(toplamTutar)}
                </div>
              )}

              {odemeTuru === "PARCALI" && (
                <div className="bg-purple-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Parçalı Ödeme Dağılımı</p>

                  <div className="flex items-center gap-2">
                    <Banknote size={14} className="text-amber-500 shrink-0" />
                    <label className="text-sm text-slate-600 w-16 shrink-0">Nakit (₺)</label>
                    <input
                      type="number"
                      min={0}
                      value={pNakit}
                      onChange={(e) => {
                        setPNakit(e.target.value);
                        const n = parseFloat(e.target.value || "0");
                        const kalan = Math.max(0, toplamTutar - n);
                        setPKart(kalan.toFixed(2));
                      }}
                      className="flex-1 px-3 py-1.5 border border-purple-200 rounded-lg text-sm font-bold text-right focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-blue-500 shrink-0" />
                    <label className="text-sm text-slate-600 w-16 shrink-0">Kart (₺)</label>
                    <input
                      type="number"
                      min={0}
                      value={pKart}
                      onChange={(e) => {
                        setPKart(e.target.value);
                        const k = parseFloat(e.target.value || "0");
                        const kalan = Math.max(0, toplamTutar - k);
                        setPNakit(kalan.toFixed(2));
                      }}
                      className="flex-1 px-3 py-1.5 border border-purple-200 rounded-lg text-sm font-bold text-right focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Hızlı böl */}
                  <div className="flex gap-1.5">
                    {[25, 50, 75].map((yuzde) => (
                      <button
                        key={yuzde}
                        onClick={() => {
                          const n = (toplamTutar * yuzde) / 100;
                          setPNakit(n.toFixed(2));
                          setPKart((toplamTutar - n).toFixed(2));
                        }}
                        className="flex-1 py-1 bg-white border border-purple-200 rounded-lg text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors"
                      >
                        %{yuzde} Nakit
                      </button>
                    ))}
                  </div>

                  {/* Özet */}
                  <div className="bg-white rounded-lg p-2 space-y-1 text-xs border border-purple-100">
                    <div className="flex justify-between text-amber-600">
                      <span>Nakit</span><span className="font-bold">{fmt(parcaliNakit)}</span>
                    </div>
                    <div className="flex justify-between text-blue-600">
                      <span>Kart</span><span className="font-bold">{fmt(parcaliKart)}</span>
                    </div>
                    <div className={`flex justify-between font-bold pt-1 border-t ${parcaliEksik ? "text-red-500" : "text-emerald-600"}`}>
                      <span>{parcaliEksik ? "Eksik" : "Para Üstü"}</span>
                      <span>{parcaliEksik ? `-${fmt(toplamTutar - parcaliToplam)}` : fmt(parcaliParaUstu)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tamamla Butonu */}
            <div className="px-5 pb-5">
              <button
                onClick={satisTamamla}
                disabled={islemde || sepet.length === 0 || (odemeTuru !== "KART" && !odemeTamamMi)}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-base transition-colors shadow-lg"
              >
                {islemde
                  ? "İşleniyor..."
                  : odemeTuru === "PARCALI" && parcaliEksik
                  ? `Eksik: ${fmt(toplamTutar - parcaliToplam)}`
                  : `Satışı Tamamla — ${fmt(toplamTutar)}`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Başarı Modalı */}
      {sonuc && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={44} className="text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">Satış Tamamlandı!</h3>
            <p className="text-slate-400 text-sm mb-6">#{sonuc.satisId} numaralı işlem</p>

            <div className="bg-slate-50 rounded-2xl p-5 space-y-3 text-sm mb-6 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Toplam Tutar</span>
                <span className="font-bold text-slate-900 text-base">{fmt(sonuc.toplam)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ödeme Türü</span>
                <span className="font-semibold">
                  {sonuc.odemeTuru === "NAKIT" ? "Nakit" : sonuc.odemeTuru === "KART" ? "Kart" : "Parçalı"}
                </span>
              </div>
              {sonuc.odemeTuru === "PARCALI" && (
                <>
                  <div className="flex justify-between text-amber-600">
                    <span className="flex items-center gap-1"><Banknote size={13} /> Nakit</span>
                    <span className="font-bold">{fmt(sonuc.nakitTutar)}</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span className="flex items-center gap-1"><CreditCard size={13} /> Kart</span>
                    <span className="font-bold">{fmt(sonuc.kartTutar)}</span>
                  </div>
                </>
              )}
              {sonuc.odemeTuru === "NAKIT" && (
                <div className="flex justify-between text-slate-600">
                  <span>Alınan Para</span>
                  <span>{fmt(sonuc.alinanPara)}</span>
                </div>
              )}
              {sonuc.paraUstu > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold border-t border-slate-200 pt-3">
                  <span>Para Üstü</span>
                  <span className="text-lg">{fmt(sonuc.paraUstu)}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSonuc(null)}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-colors flex items-center justify-center gap-2 text-base"
            >
              <X size={18} /> Yeni Satış
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
