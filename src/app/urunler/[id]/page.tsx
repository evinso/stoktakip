"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Edit,
  ArrowLeft,
  Package,
  Tag,
  Barcode,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from "lucide-react";

interface StokHareketi {
  id: number;
  tur: string;
  miktar: number;
  oncekiStok: number;
  yeniStok: number;
  aciklama: string | null;
  createdAt: string;
}

interface Urun {
  id: number;
  ad: string;
  barkod: string | null;
  aciklama: string | null;
  fiyat: number;
  alisFiyati: number;
  stok: number;
  minStok: number;
  birim: string;
  aktif: boolean;
  createdAt: string;
  updatedAt: string;
  kategori: { id: number; ad: string; renk: string } | null;
  stokHareketleri: StokHareketi[];
}

export default function UrunDetay() {
  const { id } = useParams();
  const router = useRouter();
  const [urun, setUrun] = useState<Urun | null>(null);
  const [stokModal, setStokModal] = useState(false);
  const [stokForm, setStokForm] = useState({ tur: "GIRIS", miktar: "", aciklama: "" });
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const yukle = () => {
    fetch(`/api/urunler/${id}`).then((r) => r.json()).then(setUrun);
  };

  useEffect(() => { yukle(); }, [id]);

  const stokGuncelle = async () => {
    if (!stokForm.miktar) return;
    setGonderiliyor(true);
    await fetch("/api/stok", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urunId: parseInt(id as string), ...stokForm, miktar: parseInt(stokForm.miktar) }),
    });
    setStokModal(false);
    setStokForm({ tur: "GIRIS", miktar: "", aciklama: "" });
    setGonderiliyor(false);
    yukle();
  };

  if (!urun) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const formatPara = (n: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);

  const marj = urun.alisFiyati > 0
    ? ((urun.fiyat - urun.alisFiyati) / urun.alisFiyati * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/urunler")}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{urun.ad}</h1>
          {urun.kategori && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
              style={{ backgroundColor: urun.kategori.renk + "20", color: urun.kategori.renk }}>
              {urun.kategori.ad}
            </span>
          )}
        </div>
        <Link href={`/urunler/${id}/duzenle`}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Edit size={15} /> Düzenle
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoKart icon={<TrendingUp className="text-indigo-600" size={20} />} baslik="Satış Fiyatı"
          deger={formatPara(urun.fiyat)} renk="bg-indigo-50" />
        <InfoKart icon={<TrendingUp className="text-slate-400" size={20} />} baslik="Alış Fiyatı"
          deger={formatPara(urun.alisFiyati)} renk="bg-slate-50" />
        <InfoKart icon={<Package className={urun.stok <= urun.minStok ? "text-red-500" : "text-emerald-600"} size={20} />}
          baslik="Mevcut Stok"
          deger={`${urun.stok} ${urun.birim}`}
          renk={urun.stok <= urun.minStok ? "bg-red-50" : "bg-emerald-50"}
          alt={urun.stok <= urun.minStok ? "Stok kritik seviyede!" : `Min: ${urun.minStok}`} />
        {marj && (
          <InfoKart icon={<TrendingUp className="text-amber-600" size={20} />} baslik="Kâr Marjı"
            deger={`%${marj}`} renk="bg-amber-50" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Package size={16} className="text-slate-400" /> Ürün Bilgileri
          </h2>
          <dl className="space-y-3 text-sm">
            {urun.barkod && (
              <div className="flex items-center gap-2">
                <Barcode size={14} className="text-slate-400" />
                <dt className="text-slate-400 w-20">Barkod</dt>
                <dd className="font-mono text-slate-700">{urun.barkod}</dd>
              </div>
            )}
            {urun.kategori && (
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-slate-400" />
                <dt className="text-slate-400 w-20">Kategori</dt>
                <dd className="text-slate-700">{urun.kategori.ad}</dd>
              </div>
            )}
            {urun.aciklama && (
              <div>
                <dt className="text-slate-400 mb-1">Açıklama</dt>
                <dd className="text-slate-700">{urun.aciklama}</dd>
              </div>
            )}
            <div className="pt-2 border-t border-slate-100">
              <dt className="text-slate-400 text-xs">Eklenme</dt>
              <dd className="text-slate-500 text-xs">{new Date(urun.createdAt).toLocaleString("tr-TR")}</dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Stok Hareketleri</h2>
            <button onClick={() => setStokModal(true)}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
              <Plus size={13} /> Hareket Ekle
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100 text-xs">
                  <th className="pb-2 font-medium">Tür</th>
                  <th className="pb-2 font-medium">Miktar</th>
                  <th className="pb-2 font-medium">Stok</th>
                  <th className="pb-2 font-medium">Açıklama</th>
                  <th className="pb-2 font-medium">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {urun.stokHareketleri.map((h) => (
                  <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2">
                      {h.tur === "GIRIS" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                          <ArrowUpRight size={10} /> Giriş
                        </span>
                      ) : h.tur === "CIKIS" ? (
                        <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-xs">
                          <ArrowDownRight size={10} /> Çıkış
                        </span>
                      ) : (
                        <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs">Sayım</span>
                      )}
                    </td>
                    <td className="py-2 font-medium">{h.miktar}</td>
                    <td className="py-2 text-slate-500">{h.oncekiStok} → {h.yeniStok}</td>
                    <td className="py-2 text-slate-400 text-xs">{h.aciklama || "—"}</td>
                    <td className="py-2 text-slate-400 text-xs">
                      {new Date(h.createdAt).toLocaleString("tr-TR")}
                    </td>
                  </tr>
                ))}
                {urun.stokHareketleri.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-400 text-xs">Hareket yok</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {stokModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-bold text-slate-900 text-lg mb-4">Stok Hareketi</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hareket Türü</label>
                <select value={stokForm.tur} onChange={(e) => setStokForm(p => ({ ...p, tur: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="GIRIS">Stok Girişi</option>
                  <option value="CIKIS">Stok Çıkışı</option>
                  <option value="SAYIM">Stok Sayımı</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Miktar</label>
                <input type="number" min="1" value={stokForm.miktar}
                  onChange={(e) => setStokForm(p => ({ ...p, miktar: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
                <input value={stokForm.aciklama} onChange={(e) => setStokForm(p => ({ ...p, aciklama: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="İsteğe bağlı..." />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setStokModal(false)}
                className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
                İptal
              </button>
              <button onClick={stokGuncelle} disabled={gonderiliyor}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                {gonderiliyor ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoKart({ icon, baslik, deger, renk, alt }: {
  icon: React.ReactNode;
  baslik: string;
  deger: string;
  renk: string;
  alt?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${renk}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{baslik}</p>
        <p className="text-lg font-bold text-slate-900">{deger}</p>
        {alt && <p className="text-xs text-slate-400">{alt}</p>}
      </div>
    </div>
  );
}
