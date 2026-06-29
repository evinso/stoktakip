"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Package, AlertTriangle, Edit, Trash2 } from "lucide-react";

interface Urun {
  id: number;
  ad: string;
  barkod: string | null;
  fiyat: number;
  alisFiyati: number;
  stok: number;
  minStok: number;
  birim: string;
  aktif: boolean;
  kategori: { id: number; ad: string; renk: string } | null;
}

export default function UrunlerSayfasi() {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [arama, setArama] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [silModal, setSilModal] = useState<Urun | null>(null);

  const yukle = (q = "") => {
    setYukleniyor(true);
    fetch(`/api/urunler?search=${q}`)
      .then((r) => r.json())
      .then((d) => { setUrunler(d); setYukleniyor(false); });
  };

  useEffect(() => { yukle(); }, []);

  useEffect(() => {
    const t = setTimeout(() => yukle(arama), 300);
    return () => clearTimeout(t);
  }, [arama]);

  const sil = async (id: number) => {
    await fetch(`/api/urunler/${id}`, { method: "DELETE" });
    setSilModal(null);
    yukle(arama);
  };

  const formatPara = (n: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package size={24} className="text-indigo-500" />
            Ürünler
          </h1>
          <p className="text-slate-500 text-sm mt-1">{urunler.length} ürün listeleniyor</p>
        </div>
        <Link
          href="/urunler/yeni"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Yeni Ürün
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Ürün ara..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {yukleniyor ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Ürün Adı</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Satış Fiyatı</th>
                <th className="px-4 py-3 font-medium">Alış Fiyatı</th>
                <th className="px-4 py-3 font-medium">Stok</th>
                <th className="px-4 py-3 font-medium">Barkod</th>
                <th className="px-4 py-3 font-medium text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {urunler.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/urunler/${u.id}`}
                      className="font-medium text-slate-800 hover:text-indigo-600"
                    >
                      {u.ad}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {u.kategori ? (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: u.kategori.renk + "20",
                          color: u.kategori.renk,
                        }}
                      >
                        {u.kategori.ad}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {formatPara(u.fiyat)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatPara(u.alisFiyati)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                        u.stok <= u.minStok
                          ? "bg-red-100 text-red-600"
                          : "bg-emerald-100 text-emerald-600"
                      }`}
                    >
                      {u.stok <= u.minStok && <AlertTriangle size={10} />}
                      {u.stok} {u.birim}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                    {u.barkod || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/urunler/${u.id}/duzenle`}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => setSilModal(u)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {urunler.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Package size={40} className="mx-auto mb-2 text-slate-200" />
                    Ürün bulunamadı.{" "}
                    <Link href="/urunler/yeni" className="text-indigo-600 hover:underline">
                      Yeni ekle
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {silModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-bold text-slate-900 text-lg mb-2">Ürünü Sil</h3>
            <p className="text-slate-600 mb-6">
              <strong>{silModal.ad}</strong> ürününü silmek istediğinize emin misiniz?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSilModal(null)}
                className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                İptal
              </button>
              <button
                onClick={() => sil(silModal.id)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
