"use client";

import { useEffect, useState } from "react";
import { ArrowDownUp, ArrowUpRight, ArrowDownRight, Filter } from "lucide-react";

interface StokHareketi {
  id: number;
  tur: string;
  miktar: number;
  oncekiStok: number;
  yeniStok: number;
  aciklama: string | null;
  createdAt: string;
  urun: { ad: string; birim: string };
}

export default function StokHareketleriSayfasi() {
  const [hareketler, setHareketler] = useState<StokHareketi[]>([]);
  const [filtre, setFiltre] = useState("HEPSI");
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    fetch("/api/stok")
      .then((r) => r.json())
      .then((d) => { setHareketler(d); setYukleniyor(false); });
  }, []);

  const filtreli = filtre === "HEPSI" ? hareketler : hareketler.filter((h) => h.tur === filtre);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ArrowDownUp size={24} className="text-indigo-500" />
          Stok Hareketleri
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Tüm stok giriş, çıkış ve sayım işlemleri
        </p>
      </div>

      <div className="flex gap-2">
        {["HEPSI", "GIRIS", "CIKIS", "SAYIM"].map((t) => (
          <button
            key={t}
            onClick={() => setFiltre(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              filtre === t
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Filter size={13} />
            {t === "HEPSI" ? "Tümü" : t === "GIRIS" ? "Giriş" : t === "CIKIS" ? "Çıkış" : "Sayım"}
          </button>
        ))}
        <span className="ml-auto text-sm text-slate-400 self-center">
          {filtreli.length} hareket
        </span>
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
                <th className="px-4 py-3 font-medium">Ürün</th>
                <th className="px-4 py-3 font-medium">Tür</th>
                <th className="px-4 py-3 font-medium">Miktar</th>
                <th className="px-4 py-3 font-medium">Önceki Stok</th>
                <th className="px-4 py-3 font-medium">Yeni Stok</th>
                <th className="px-4 py-3 font-medium">Açıklama</th>
                <th className="px-4 py-3 font-medium">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {filtreli.map((h) => (
                <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{h.urun.ad}</td>
                  <td className="px-4 py-3">
                    {h.tur === "GIRIS" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium">
                        <ArrowUpRight size={11} /> Giriş
                      </span>
                    ) : h.tur === "CIKIS" ? (
                      <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-xs font-medium">
                        <ArrowDownRight size={11} /> Çıkış
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs font-medium">
                        Sayım
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700">
                    {h.tur === "CIKIS" ? "-" : "+"}{h.miktar} {h.urun.birim}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{h.oncekiStok}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${h.yeniStok < h.oncekiStok ? "text-red-600" : "text-emerald-600"}`}>
                      {h.yeniStok}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{h.aciklama || "—"}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(h.createdAt).toLocaleString("tr-TR")}
                  </td>
                </tr>
              ))}
              {filtreli.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Hareket bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
