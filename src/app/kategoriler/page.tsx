"use client";

import { useEffect, useState } from "react";
import { Tag, Plus, Edit, Trash2, Check, X } from "lucide-react";

interface Kategori {
  id: number;
  ad: string;
  renk: string;
  _count: { urunler: number };
}

const renkSecenekleri = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
];

export default function KategorilerSayfasi() {
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [yeniForm, setYeniForm] = useState({ ad: "", renk: "#6366f1" });
  const [duzenleId, setDuzenleId] = useState<number | null>(null);
  const [duzenleForm, setDuzenleForm] = useState({ ad: "", renk: "" });
  const [silModal, setSilModal] = useState<Kategori | null>(null);
  const [kaydediyor, setKaydediyor] = useState(false);

  const yukle = () =>
    fetch("/api/kategoriler").then((r) => r.json()).then(setKategoriler);

  useEffect(() => { yukle(); }, []);

  const ekle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yeniForm.ad) return;
    setKaydediyor(true);
    await fetch("/api/kategoriler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(yeniForm),
    });
    setYeniForm({ ad: "", renk: "#6366f1" });
    setKaydediyor(false);
    yukle();
  };

  const guncelle = async (id: number) => {
    await fetch(`/api/kategoriler/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(duzenleForm),
    });
    setDuzenleId(null);
    yukle();
  };

  const sil = async (id: number) => {
    await fetch(`/api/kategoriler/${id}`, { method: "DELETE" });
    setSilModal(null);
    yukle();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Tag size={24} className="text-indigo-500" />
          Kategoriler
        </h1>
        <p className="text-slate-500 text-sm mt-1">Ürünlerinizi kategorilere ayırarak düzenleyin.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Yeni Kategori</h2>
        <form onSubmit={ekle} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">Kategori Adı</label>
            <input
              value={yeniForm.ad}
              onChange={(e) => setYeniForm((p) => ({ ...p, ad: e.target.value }))}
              placeholder="Örn: Elektronik, Gıda, Temizlik..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Renk</label>
            <div className="flex gap-1.5 flex-wrap max-w-xs">
              {renkSecenekleri.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setYeniForm((p) => ({ ...p, renk: r }))}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    yeniForm.renk === r ? "border-slate-900 scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: r }}
                />
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={kaydediyor || !yeniForm.ad}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={15} />
            {kaydediyor ? "Ekleniyor..." : "Ekle"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Ürün Sayısı</th>
              <th className="px-4 py-3 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {kategoriler.map((k) => (
              <tr key={k.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3">
                  {duzenleId === k.id ? (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {renkSecenekleri.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setDuzenleForm((p) => ({ ...p, renk: r }))}
                            className={`w-5 h-5 rounded-full border-2 transition-all ${
                              duzenleForm.renk === r ? "border-slate-900 scale-110" : "border-transparent"
                            }`}
                            style={{ backgroundColor: r }}
                          />
                        ))}
                      </div>
                      <input
                        value={duzenleForm.ad}
                        onChange={(e) => setDuzenleForm((p) => ({ ...p, ad: e.target.value }))}
                        className="px-2 py-1 border border-indigo-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: k.renk }} />
                      <span className="font-medium text-slate-800">{k.ad}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-slate-600">{k._count.urunler} ürün</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    {duzenleId === k.id ? (
                      <>
                        <button
                          onClick={() => guncelle(k.id)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Check size={15} />
                        </button>
                        <button
                          onClick={() => setDuzenleId(null)}
                          className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <X size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setDuzenleId(k.id); setDuzenleForm({ ad: k.ad, renk: k.renk }); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => setSilModal(k)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={k._count.urunler > 0}
                          title={k._count.urunler > 0 ? "Önce ürünleri kaldırın" : "Sil"}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {kategoriler.length === 0 && (
              <tr>
                <td colSpan={3} className="py-12 text-center text-slate-400">
                  Henüz kategori eklenmemiş.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {silModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-bold text-slate-900 text-lg mb-2">Kategori Sil</h3>
            <p className="text-slate-600 mb-6">
              <strong>{silModal.ad}</strong> kategorisini silmek istediğinize emin misiniz?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setSilModal(null)}
                className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
                İptal
              </button>
              <button onClick={() => sil(silModal.id)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
