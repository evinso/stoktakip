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

interface SonucModal {
  satisId: number;
  toplam: number;
  alinan: number;
  ustu: number;
  odemeTuru: string;
}

export default function POSSayfasi() {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [filtreli, setFiltreli] = useState<Urun[]>([]);
  const [arama, setArama] = useState("");
  const [sepet, setSepet] = useState<SepetKalem[]>([]);
  const [indirim, setIndirim] = useState("");
  const [alinanPara, setAlinanPara] = useState("");
  const [odemeTuru, setOdemeTuru] = useState<"NAKIT" | "KART">("NAKIT");
  const [islemde, setIslemde] = useState(false);
  const [sonuc, setSonuc] = useState<SonucModal | null>(null);

  useEffect(() => {
    fetch("/api/urunler").then((r) => r.json()).then((d) => {
      setUrunler(d);
      setFiltreli(d);
    });
  }, []);

  const filtrele = useCallback((q: string) => {
    setFiltreli(
      urunler.filter((u) =>
        u.ad.toLowerCase().includes(q.toLowerCase()) ||
        (u.barkod && u.barkod.includes(q))
      )
    );
  }, [urunler]);

  useEffect(() => { filtrele(arama); }, [arama, filtrele]);

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

  const sepettenKaldir = (urunId: number) => {
    setSepet((prev) => prev.filter((k) => k.urun.id !== urunId));
  };

  const sepetiTemizle = () => setSepet([]);

  const araToplam = sepet.reduce((t, k) => t + k.urun.fiyat * k.adet, 0);
  const indirimTutar = parseFloat(indirim || "0");
  const toplamTutar = Math.max(0, araToplam - indirimTutar);
  const alinan = parseFloat(alinanPara || "0");
  const paraUstu = odemeTuru === "NAKIT" ? Math.max(0, alinan - toplamTutar) : 0;

  const satisTamamla = async () => {
    if (sepet.length === 0) return;
    setIslemde(true);
    try {
      const res = await fetch("/api/satislar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kalemler: sepet.map((k) => ({ urunId: k.urun.id, adet: k.adet })),
          odemeTuru,
          indirim: indirimTutar,
          alinanPara: odemeTuru === "NAKIT" ? alinan || toplamTutar : toplamTutar,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSonuc({
          satisId: data.id,
          toplam: data.toplamTutar,
          alinan: data.alinanPara,
          ustu: data.paraUstu,
          odemeTuru: data.odemeTuru,
        });
        setSepet([]);
        setIndirim("");
        setAlinanPara("");
        fetch("/api/urunler").then((r) => r.json()).then((d) => { setUrunler(d); setFiltreli(d); });
      } else {
        alert(data.error ?? "Hata oluştu");
      }
    } finally {
      setIslemde(false);
    }
  };

  const formatPara = (n: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);

  return (
    <div className="h-[calc(100vh-48px)] flex gap-4">
      {/* Sol - Ürün Listesi */}
      <div className="flex-1 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart size={24} className="text-indigo-500" />
            Satış Ekranı (POS)
          </h1>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Ürün adı veya barkod ara..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {filtreli.map((u) => (
              <button
                key={u.id}
                onClick={() => sepeteEkle(u)}
                disabled={u.stok === 0}
                className={`p-4 bg-white rounded-xl shadow-sm border text-left transition-all ${
                  u.stok === 0
                    ? "border-slate-100 opacity-50 cursor-not-allowed"
                    : "border-slate-100 hover:border-indigo-300 hover:shadow-md active:scale-95"
                }`}
              >
                <p className="font-medium text-slate-800 text-sm line-clamp-2">{u.ad}</p>
                {u.kategori && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full mt-1 inline-block"
                    style={{ backgroundColor: u.kategori.renk + "20", color: u.kategori.renk }}>
                    {u.kategori.ad}
                  </span>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-indigo-600 font-bold text-sm">{formatPara(u.fiyat)}</span>
                  <span className={`text-xs ${u.stok <= 5 ? "text-amber-500" : "text-slate-400"}`}>
                    {u.stok === 0 ? "Tükendi" : `${u.stok} ${u.birim}`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sağ - Sepet */}
      <div className="w-80 flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <ShoppingCart size={16} className="text-indigo-500" />
            Sepet
            {sepet.length > 0 && (
              <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded-full font-bold">
                {sepet.length}
              </span>
            )}
          </h2>
          {sepet.length > 0 && (
            <button onClick={sepetiTemizle} className="text-xs text-red-500 hover:text-red-700">
              Temizle
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sepet.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 py-12">
              <ShoppingCart size={40} className="mb-2" />
              <p className="text-sm">Sepet boş</p>
              <p className="text-xs mt-1">Ürünlere tıklayarak ekleyin</p>
            </div>
          ) : (
            sepet.map((k) => (
              <div key={k.urun.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{k.urun.ad}</p>
                  <p className="text-xs text-indigo-600 font-bold">{formatPara(k.urun.fiyat)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => adetAyarla(k.urun.id, -1)}
                    className="w-6 h-6 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 flex items-center justify-center text-xs font-bold transition-colors">
                    <Minus size={11} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{k.adet}</span>
                  <button onClick={() => adetAyarla(k.urun.id, 1)}
                    disabled={k.adet >= k.urun.stok}
                    className="w-6 h-6 bg-indigo-100 hover:bg-indigo-200 disabled:opacity-40 rounded text-indigo-700 flex items-center justify-center text-xs font-bold transition-colors">
                    <Plus size={11} />
                  </button>
                </div>
                <button onClick={() => sepettenKaldir(k.urun.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {sepet.length > 0 && (
          <div className="p-4 border-t border-slate-100 space-y-3">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Ara Toplam</span>
                <span>{formatPara(araToplam)}</span>
              </div>
              {indirimTutar > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>İndirim</span>
                  <span>-{formatPara(indirimTutar)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 text-base pt-1 border-t border-slate-100">
                <span>Toplam</span>
                <span className="text-indigo-600">{formatPara(toplamTutar)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">İndirim (₺)</label>
              <input type="number" min="0" max={araToplam} value={indirim}
                onChange={(e) => setIndirim(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00" />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setOdemeTuru("NAKIT")}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  odemeTuru === "NAKIT" ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}>
                <Banknote size={15} /> Nakit
              </button>
              <button onClick={() => setOdemeTuru("KART")}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  odemeTuru === "KART" ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}>
                <CreditCard size={15} /> Kart
              </button>
            </div>

            {odemeTuru === "NAKIT" && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Alınan Para (₺)</label>
                <input type="number" min={toplamTutar} value={alinanPara}
                  onChange={(e) => setAlinanPara(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={toplamTutar.toFixed(2)} />
                {paraUstu > 0 && (
                  <div className="mt-1 text-xs font-bold text-emerald-600 text-right">
                    Para Üstü: {formatPara(paraUstu)}
                  </div>
                )}
              </div>
            )}

            <button onClick={satisTamamla} disabled={islemde}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors shadow-sm">
              {islemde ? "İşleniyor..." : `Satışı Tamamla • ${formatPara(toplamTutar)}`}
            </button>
          </div>
        )}
      </div>

      {/* Başarı Modalı */}
      {sonuc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={36} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Satış Tamamlandı!</h3>
            <p className="text-slate-500 text-sm mb-5">#{sonuc.satisId} numaralı satış</p>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Toplam</span>
                <span className="font-bold">{formatPara(sonuc.toplam)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ödeme</span>
                <span className="font-medium">{sonuc.odemeTuru === "NAKIT" ? "Nakit" : "Kart"}</span>
              </div>
              {sonuc.odemeTuru === "NAKIT" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Alınan</span>
                    <span>{formatPara(sonuc.alinan)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Para Üstü</span>
                    <span>{formatPara(sonuc.ustu)}</span>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => setSonuc(null)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
              <X size={16} /> Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
