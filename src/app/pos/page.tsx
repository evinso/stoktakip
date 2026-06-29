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
  Camera,
} from "lucide-react";
import BarcodeScanner from "@/components/BarcodeScanner";

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
  const [kameraAcik, setKameraAcik] = useState(false);
  const [barkodUyari, setBarkodUyari] = useState("");

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

  const barkodTaraVeSepeteEkle = (barkod: string) => {
    const urun = urunler.find((u) => u.barkod === barkod);
    if (urun) {
      sepeteEkle(urun);
      setBarkodUyari("");
    } else {
      setBarkodUyari(`"${barkod}" barkodlu ürün bulunamadı.`);
      setTimeout(() => setBarkodUyari(""), 3000);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] -mx-6 -mt-6 overflow-hidden">

      {/* ── ÜST SATIR: Ürün Grid (sol) + Sepet (sağ) ── */}
      <div className="flex flex-1 min-h-0">

        {/* Sol — Ürün Grid */}
        <div className="flex-1 flex flex-col bg-slate-50 p-5 gap-4 overflow-hidden">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 shrink-0">
              <ShoppingCart size={20} className="text-indigo-500" /> Satış Ekranı
            </h1>
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={arama} onChange={(e) => setArama(e.target.value)}
                placeholder="Ürün adı veya barkod..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm" />
            </div>
            <button onClick={() => setKameraAcik(true)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
              <Camera size={16} /> Barkod Tara
            </button>
          </div>
          {barkodUyari && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
              {barkodUyari}
            </div>
          )}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none shrink-0">
            {kategoriler.map((kat) => (
              <button key={kat} onClick={() => setAktifKategori(kat)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  aktifKategori === kat ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}>
                {kat}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
              {filtreli.map((u) => {
                const sepetteki = sepet.find((k) => k.urun.id === u.id);
                return (
                  <button key={u.id} onClick={() => sepeteEkle(u)} disabled={u.stok === 0}
                    className={`p-4 rounded-xl border text-left transition-all relative ${
                      u.stok === 0 ? "bg-slate-100 border-slate-100 opacity-40 cursor-not-allowed"
                        : sepetteki ? "bg-indigo-50 border-indigo-300 shadow-sm"
                        : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md active:scale-95"
                    }`}>
                    {sepetteki && (
                      <span className="absolute top-2 right-2 bg-indigo-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {sepetteki.adet}
                      </span>
                    )}
                    <p className="font-semibold text-slate-800 text-sm line-clamp-2 pr-5">{u.ad}</p>
                    {u.kategori && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full mt-1.5 inline-block font-medium"
                        style={{ backgroundColor: u.kategori.renk + "20", color: u.kategori.renk }}>
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
                  <Search size={32} className="mx-auto mb-2 text-slate-200" />Ürün bulunamadı
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sağ — Sepet (sadece ürün listesi) */}
        <div className="w-[340px] flex flex-col bg-white border-l-2 border-slate-200">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-900 shrink-0">
            <h2 className="font-bold text-sm text-white flex items-center gap-2">
              <ShoppingCart size={15} /> Sepet
              {sepet.length > 0 && (
                <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {sepet.reduce((t, k) => t + k.adet, 0)} ürün
                </span>
              )}
            </h2>
            {sepet.length > 0 && (
              <button onClick={sepetiTemizle} className="text-xs text-slate-400 hover:text-red-400 transition-colors">Temizle</button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {sepet.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300">
                <ShoppingCart size={40} className="mb-2" />
                <p className="text-sm font-medium">Sepet boş</p>
                <p className="text-xs mt-1">Sol taraftan ürün ekleyin</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {sepet.map((k) => (
                  <div key={k.urun.id} className="rounded-xl bg-white border-2 border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-3 pt-2.5 pb-1 gap-2">
                      <p className="font-bold text-slate-900 text-sm leading-tight flex-1 min-w-0">{k.urun.ad}</p>
                      <button onClick={() => sepettenKaldir(k.urun.id)}
                        className="shrink-0 w-6 h-6 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between px-3 pb-2.5 gap-2">
                      <span className="text-sm font-bold text-indigo-600 shrink-0">{fmt(k.urun.fiyat)}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => adetAyarla(k.urun.id, -1)}
                          className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-700 transition-colors">
                          <Minus size={12} />
                        </button>
                        <input type="number" min={1} max={k.urun.stok} value={k.adet}
                          onChange={(e) => adetDirektGir(k.urun.id, e.target.value)}
                          className="w-10 text-center text-sm font-black text-slate-900 border-2 border-slate-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        <button onClick={() => adetAyarla(k.urun.id, 1)} disabled={k.adet >= k.urun.stok}
                          className="w-7 h-7 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-30 rounded-lg flex items-center justify-center text-white transition-colors">
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-sm font-black text-slate-900 shrink-0">{fmt(k.urun.fiyat * k.adet)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ALTTA: ÖDEME ALANI (tam genişlik) ── */}
      <div className="border-t-2 border-slate-300 bg-white shrink-0">
        <div className="flex items-stretch gap-0 h-full">

          {/* Sütun 1: Tutar özeti */}
          <div className="w-64 border-r border-slate-200 px-5 py-4 flex flex-col justify-center gap-1.5 bg-slate-50">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Ara Toplam</span><span className="font-medium">{fmt(araToplam)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Tag size={12} className="text-slate-400 shrink-0" />
              <span className="text-sm text-slate-500 shrink-0">İndirim</span>
              <input type="number" min="0" max={araToplam} value={indirim}
                onChange={(e) => setIndirim(e.target.value)}
                className="flex-1 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                placeholder="0.00" />
            </div>
            {indirimTutar > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 font-medium">
                <span>İndirim</span><span>-{fmt(indirimTutar)}</span>
              </div>
            )}
            <div className="flex justify-between items-center bg-indigo-600 rounded-xl px-3 py-2 mt-1">
              <span className="text-xs font-bold text-indigo-200">TOPLAM</span>
              <span className="text-xl font-black text-white">{fmt(toplamTutar)}</span>
            </div>
          </div>

          {/* Sütun 2: Yöntem seçimi */}
          <div className="w-52 border-r border-slate-200 px-4 py-4 flex flex-col justify-center gap-2 bg-slate-50">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ödeme Yöntemi</p>
            <div className="flex gap-2">
              {(["NAKIT", "KART", "PARCALI"] as OdemeTuru[]).map((tur) => {
                const Icon = tur === "NAKIT" ? Banknote : tur === "KART" ? CreditCard : SplitSquareHorizontal;
                const label = tur === "NAKIT" ? "Nakit" : tur === "KART" ? "Kart" : "Parçalı";
                return (
                  <button key={tur} onClick={() => setOdemeTuru(tur)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
                      odemeTuru === tur ? "bg-indigo-600 text-white border-indigo-600 shadow" : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"
                    }`}>
                    <Icon size={16} />{label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sütun 3: Ödeme detayı */}
          <div className="flex-1 border-r border-slate-200 px-4 py-4 flex flex-col justify-center gap-2">
            {odemeTuru === "NAKIT" && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600 w-28 shrink-0">Alınan Para (₺)</label>
                  <input type="number" min={0} value={alinanPara} onChange={(e) => setAlinanPara(e.target.value)}
                    className="flex-1 px-3 py-2 border border-amber-200 rounded-lg text-sm font-bold text-right bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder={toplamTutar.toFixed(2)} />
                </div>
                <div className="flex gap-1.5">
                  {[50, 100, 200, 500].map((t) => (
                    <button key={t} onClick={() => setAlinanPara(t.toString())}
                      className="flex-1 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold text-amber-700 hover:bg-amber-50 transition-colors">₺{t}</button>
                  ))}
                  <button onClick={() => setAlinanPara(toplamTutar.toFixed(2))}
                    className="flex-1 py-1.5 bg-amber-400 hover:bg-amber-500 rounded-lg text-xs font-bold text-white transition-colors">Tam</button>
                </div>
                {paraUstu > 0 && (
                  <div className="flex justify-between text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5">
                    <span>Para Üstü</span><span>{fmt(paraUstu)}</span>
                  </div>
                )}
              </>
            )}
            {odemeTuru === "KART" && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <CreditCard size={24} className="text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Kart ile tahsil edilecek</p>
                  <p className="text-xl font-black text-slate-900">{fmt(toplamTutar)}</p>
                </div>
              </div>
            )}
            {odemeTuru === "PARCALI" && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Banknote size={13} className="text-amber-500 shrink-0" />
                  <label className="text-sm text-slate-600 w-14 shrink-0">Nakit (₺)</label>
                  <input type="number" min={0} value={pNakit}
                    onChange={(e) => { setPNakit(e.target.value); setPKart(Math.max(0, toplamTutar - parseFloat(e.target.value || "0")).toFixed(2)); }}
                    className="flex-1 px-2 py-1.5 border border-amber-200 rounded-lg text-sm font-bold text-right bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="0.00" />
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard size={13} className="text-blue-500 shrink-0" />
                  <label className="text-sm text-slate-600 w-14 shrink-0">Kart (₺)</label>
                  <input type="number" min={0} value={pKart}
                    onChange={(e) => { setPKart(e.target.value); setPNakit(Math.max(0, toplamTutar - parseFloat(e.target.value || "0")).toFixed(2)); }}
                    className="flex-1 px-2 py-1.5 border border-blue-200 rounded-lg text-sm font-bold text-right bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="0.00" />
                </div>
                <div className="flex gap-1.5">
                  {[25, 50, 75].map((y) => (
                    <button key={y} onClick={() => { const n = (toplamTutar * y) / 100; setPNakit(n.toFixed(2)); setPKart((toplamTutar - n).toFixed(2)); }}
                      className="flex-1 py-1 bg-white border border-purple-200 rounded-lg text-xs font-bold text-purple-700 hover:bg-purple-50 transition-colors">
                      %{y} Nakit
                    </button>
                  ))}
                </div>
                <div className={`flex justify-between text-xs font-bold rounded-lg px-3 py-1.5 border ${parcaliEksik ? "bg-red-50 border-red-100 text-red-600" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
                  <span>{parcaliEksik ? "Eksik" : "Para Üstü"}</span>
                  <span>{parcaliEksik ? `-${fmt(toplamTutar - parcaliToplam)}` : fmt(parcaliParaUstu)}</span>
                </div>
              </div>
            )}
            {sepet.length === 0 && odemeTuru === "NAKIT" && (
              <p className="text-sm text-slate-300 text-center">Sepete ürün ekleyin</p>
            )}
          </div>

          {/* Sütun 4: Tamamla butonu */}
          <div className="w-56 px-4 py-4 flex items-center">
            <button onClick={satisTamamla}
              disabled={islemde || sepet.length === 0 || (odemeTuru !== "KART" && !odemeTamamMi)}
              className="w-full h-full min-h-[72px] bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-2xl font-black text-base transition-colors shadow-md flex flex-col items-center justify-center gap-1">
              {islemde ? "İşleniyor..." : odemeTuru === "PARCALI" && parcaliEksik
                ? (<><span className="text-sm">Eksik</span><span>{fmt(toplamTutar - parcaliToplam)}</span></>)
                : (<><span className="text-sm font-bold opacity-80">Satışı Tamamla</span><span className="text-xl">{fmt(toplamTutar)}</span></>)}
            </button>
          </div>

        </div>
      </div>

      {/* Kamera Barkod Tarayıcı */}
      {kameraAcik && (
        <BarcodeScanner
          onSonuc={barkodTaraVeSepeteEkle}
          onKapat={() => setKameraAcik(false)}
        />
      )}

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
