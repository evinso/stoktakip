"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Camera, Wand2, RefreshCw } from "lucide-react";
import BarcodeScanner from "./BarcodeScanner";

interface Kategori {
  id: number;
  ad: string;
  renk: string;
}

interface UrunFormProps {
  varsayilan?: {
    ad?: string;
    barkod?: string;
    aciklama?: string;
    fiyat?: number;
    alisFiyati?: number;
    stok?: number;
    minStok?: number;
    birim?: string;
    kategoriId?: number | null;
  };
  onKaydet: (data: Record<string, unknown>) => Promise<void>;
  baslik: string;
  geriUrl?: string;
}

const birimler = ["adet", "kg", "litre", "metre", "paket", "kutu", "torba"];

export default function UrunForm({ varsayilan, onKaydet, baslik, geriUrl = "/urunler" }: UrunFormProps) {
  const router = useRouter();
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [kaydediyor, setKaydediyor] = useState(false);
  const [hata, setHata] = useState("");
  const [kameraAcik, setKameraAcik] = useState(false);

  const otomatikBarkod = () => {
    // EAN-13 formatında 12 rastgele rakam + check digit
    const rakamlar = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10));
    const kontrol = rakamlar.reduce((t, d, i) => t + d * (i % 2 === 0 ? 1 : 3), 0);
    const checkDigit = (10 - (kontrol % 10)) % 10;
    const barkod = [...rakamlar, checkDigit].join("");
    setForm((p) => ({ ...p, barkod }));
  };

  const [form, setForm] = useState({
    ad: varsayilan?.ad ?? "",
    barkod: varsayilan?.barkod ?? "",
    aciklama: varsayilan?.aciklama ?? "",
    fiyat: varsayilan?.fiyat?.toString() ?? "",
    alisFiyati: varsayilan?.alisFiyati?.toString() ?? "",
    stok: varsayilan?.stok?.toString() ?? "0",
    minStok: varsayilan?.minStok?.toString() ?? "5",
    birim: varsayilan?.birim ?? "adet",
    kategoriId: varsayilan?.kategoriId?.toString() ?? "",
  });

  useEffect(() => {
    fetch("/api/kategoriler").then((r) => r.json()).then(setKategoriler);
  }, []);

  const degistir = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ad || !form.fiyat) { setHata("Ad ve fiyat zorunludur."); return; }
    setKaydediyor(true);
    setHata("");
    try {
      await onKaydet({
        ...form,
        kategoriId: form.kategoriId ? parseInt(form.kategoriId) : null,
      });
      router.push("/urunler");
    } catch {
      setHata("Kayıt sırasında hata oluştu.");
    } finally {
      setKaydediyor(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(geriUrl)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">{baslik}</h1>
      </div>

      <form onSubmit={gonder} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
            <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Temel Bilgiler</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ürün Adı *</label>
              <input name="ad" value={form.ad} onChange={degistir} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ürün adını girin" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
              <textarea name="aciklama" value={form.aciklama} onChange={degistir} rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Ürün açıklaması..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Barkod</label>
              <div className="flex gap-2">
                <input name="barkod" value={form.barkod} onChange={degistir}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  placeholder="Barkod numarası" />
                <button type="button" onClick={() => setKameraAcik(true)}
                  title="Kamera ile tara"
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-indigo-600 transition-colors flex items-center gap-1 text-xs font-medium shrink-0">
                  <Camera size={15} /> Tara
                </button>
                <button type="button" onClick={otomatikBarkod}
                  title="Otomatik barkod oluştur"
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-colors flex items-center gap-1 text-xs font-medium shrink-0">
                  {form.barkod ? <RefreshCw size={13} /> : <Wand2 size={13} />}
                  {form.barkod ? "Yenile" : "Oluştur"}
                </button>
              </div>
              {form.barkod && (
                <p className="mt-1 text-xs text-slate-400 font-mono">{form.barkod}</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
            <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Fiyatlandırma</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Satış Fiyatı (₺) *</label>
                <input name="fiyat" type="number" step="0.01" min="0" value={form.fiyat} onChange={degistir} required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alış Fiyatı (₺)</label>
                <input name="alisFiyati" type="number" step="0.01" min="0" value={form.alisFiyati} onChange={degistir}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00" />
              </div>
            </div>
            {form.fiyat && form.alisFiyati && parseFloat(form.alisFiyati) > 0 && (
              <div className="bg-emerald-50 rounded-lg p-3 text-sm text-emerald-700">
                Kâr Marjı: ₺{(parseFloat(form.fiyat) - parseFloat(form.alisFiyati)).toFixed(2)}{" "}
                (%{(((parseFloat(form.fiyat) - parseFloat(form.alisFiyati)) / parseFloat(form.alisFiyati)) * 100).toFixed(1)})
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
            <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Stok & Kategori</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mevcut Stok</label>
              <input name="stok" type="number" min="0" value={form.stok} onChange={degistir}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Stok (Uyarı)</label>
              <input name="minStok" type="number" min="0" value={form.minStok} onChange={degistir}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Birim</label>
              <select name="birim" value={form.birim} onChange={degistir}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {birimler.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
              <select name="kategoriId" value={form.kategoriId} onChange={degistir}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">— Seçiniz —</option>
                {kategoriler.map((k) => (
                  <option key={k.id} value={k.id}>{k.ad}</option>
                ))}
              </select>
            </div>
          </div>

          {hata && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {hata}
            </div>
          )}

          <button
            type="submit"
            disabled={kaydediyor}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            <Save size={16} />
            {kaydediyor ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>

      {kameraAcik && (
        <BarcodeScanner
          tekSeferlik
          onSonuc={(barkod) => setForm((p) => ({ ...p, barkod }))}
          onKapat={() => setKameraAcik(false)}
        />
      )}
    </div>
  );
}
