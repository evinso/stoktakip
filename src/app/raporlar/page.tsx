"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, ShoppingBag, Package, CreditCard, Banknote } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface Satis {
  id: number;
  toplamTutar: number;
  odemeTuru: string;
  indirim: number;
  createdAt: string;
  kalemler: {
    id: number;
    adet: number;
    birimFiyat: number;
    toplam: number;
    urun: { ad: string; birim: string };
  }[];
}

const RENKLER = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

export default function RaporlarSayfasi() {
  const [satislar, setSatislar] = useState<Satis[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    fetch("/api/satislar?limit=200")
      .then((r) => r.json())
      .then((d) => { setSatislar(d); setYukleniyor(false); });
  }, []);

  const formatPara = (n: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);

  const toplamCiro = satislar.reduce((t, s) => t + s.toplamTutar, 0);
  const toplamIndirim = satislar.reduce((t, s) => t + s.indirim, 0);
  const nakitSatis = satislar.filter((s) => s.odemeTuru === "NAKIT").reduce((t, s) => t + s.toplamTutar, 0);
  const kartSatis = satislar.filter((s) => s.odemeTuru === "KART").reduce((t, s) => t + s.toplamTutar, 0);

  const gunlukSatislar = satislar.reduce(
    (acc, s) => {
      const gun = new Date(s.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
      acc[gun] = (acc[gun] ?? 0) + s.toplamTutar;
      return acc;
    },
    {} as Record<string, number>
  );
  const graficVeri = Object.entries(gunlukSatislar)
    .slice(-14)
    .map(([tarih, tutar]) => ({ tarih, tutar }));

  const urunSatislari = satislar
    .flatMap((s) => s.kalemler)
    .reduce(
      (acc, k) => {
        acc[k.urun.ad] = (acc[k.urun.ad] ?? 0) + k.adet;
        return acc;
      },
      {} as Record<string, number>
    );
  const enCokSatan = Object.entries(urunSatislari)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([ad, adet]) => ({ ad: ad.length > 15 ? ad.slice(0, 15) + "..." : ad, adet }));

  const odemeDagilimi = [
    { name: "Nakit", value: nakitSatis },
    { name: "Kart", value: kartSatis },
  ].filter((o) => o.value > 0);

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 size={24} className="text-indigo-500" />
          Raporlar & Analiz
        </h1>
        <p className="text-slate-500 text-sm mt-1">Satış performansı ve stok durumu</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatKart icon={<TrendingUp className="text-indigo-600" size={20} />}
          baslik="Toplam Ciro" deger={formatPara(toplamCiro)} renk="bg-indigo-50" />
        <StatKart icon={<ShoppingBag className="text-emerald-600" size={20} />}
          baslik="Toplam Satış" deger={satislar.length.toString() + " işlem"} renk="bg-emerald-50" />
        <StatKart icon={<Banknote className="text-amber-600" size={20} />}
          baslik="Nakit Tahsilat" deger={formatPara(nakitSatis)} renk="bg-amber-50" />
        <StatKart icon={<CreditCard className="text-blue-600" size={20} />}
          baslik="Kart Tahsilat" deger={formatPara(kartSatis)} renk="bg-blue-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-indigo-500" />
            Son 14 Gün Satışlar
          </h2>
          {graficVeri.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={graficVeri}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="tarih" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  formatter={(v) => [formatPara(Number(v)), "Satış"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
                <Bar dataKey="tutar" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-slate-300">
              Henüz satış verisi yok
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Ödeme Dağılımı</h2>
          {odemeDagilimi.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={odemeDagilimi} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={70} label={({ name, percent }) => `${name ?? ""} %${(((percent as number) ?? 0) * 100).toFixed(0)}`}>
                  {odemeDagilimi.map((_, i) => (
                    <Cell key={i} fill={RENKLER[i]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(v) => formatPara(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-300">Veri yok</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Package size={16} className="text-indigo-500" />
            En Çok Satan Ürünler
          </h2>
          {enCokSatan.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={enCokSatan} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis dataKey="ad" type="category" width={100} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="adet" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-300">Satış yok</div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Son Satışlar</h2>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {satislar.slice(0, 15).map((s) => (
              <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-700">#{s.id} — {s.kalemler.length} kalem</p>
                  <p className="text-xs text-slate-400">
                    {new Date(s.createdAt).toLocaleString("tr-TR")} ·{" "}
                    <span className={s.odemeTuru === "NAKIT" ? "text-amber-600" : "text-blue-600"}>
                      {s.odemeTuru === "NAKIT" ? "Nakit" : "Kart"}
                    </span>
                  </p>
                </div>
                <span className="font-bold text-slate-800">{formatPara(s.toplamTutar)}</span>
              </div>
            ))}
            {satislar.length === 0 && (
              <p className="text-center text-slate-300 py-8">Henüz satış yok</p>
            )}
          </div>
          {toplamIndirim > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 text-right">
              Toplam verilen indirim: {formatPara(toplamIndirim)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatKart({ icon, baslik, deger, renk }: {
  icon: React.ReactNode;
  baslik: string;
  deger: string;
  renk: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${renk}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{baslik}</p>
        <p className="text-base font-bold text-slate-900">{deger}</p>
      </div>
    </div>
  );
}
