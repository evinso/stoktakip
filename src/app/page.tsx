"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface DashboardData {
  toplamUrun: number;
  dusukStoklar: { id: number; ad: string; stok: number; minStok: number; birim: string }[];
  bugunSatis: { tutar: number; adet: number };
  toplamSatis: { tutar: number; adet: number };
  sonHareketler: {
    id: number;
    tur: string;
    miktar: number;
    createdAt: string;
    urun: { ad: string };
  }[];
  haftalikSatislar: { tarih: string; tutar: number }[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setYukleniyor(false); });
  }, []);

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const formatPara = (n: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Hoş geldiniz! İşte genel durumunuz.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Toplam Ürün"
          value={data.toplamUrun.toString()}
          icon={<Package className="text-indigo-600" size={22} />}
          color="bg-indigo-50"
          link="/urunler"
        />
        <StatCard
          title="Bugün Satış"
          value={formatPara(data.bugunSatis.tutar)}
          sub={`${data.bugunSatis.adet} işlem`}
          icon={<ShoppingCart className="text-emerald-600" size={22} />}
          color="bg-emerald-50"
          link="/raporlar"
        />
        <StatCard
          title="Toplam Ciro"
          value={formatPara(data.toplamSatis.tutar)}
          sub={`${data.toplamSatis.adet} satış`}
          icon={<TrendingUp className="text-blue-600" size={22} />}
          color="bg-blue-50"
          link="/raporlar"
        />
        <StatCard
          title="Düşük Stok"
          value={data.dusukStoklar.length.toString()}
          sub="Kritik ürün"
          icon={<AlertTriangle className="text-amber-600" size={22} />}
          color="bg-amber-50"
          link="/urunler"
          alert={data.dusukStoklar.length > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={18} className="text-indigo-500" />
            <h2 className="font-semibold text-slate-800">Haftalık Satışlar</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.haftalikSatislar}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="tarih" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip
                formatter={(v) => [formatPara(Number(v)), "Satış"]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
              />
              <Bar dataKey="tutar" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Düşük Stok Uyarısı
          </h2>
          {data.dusukStoklar.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Tüm stoklar yeterli</p>
          ) : (
            <ul className="space-y-2">
              {data.dusukStoklar.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/urunler/${u.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-amber-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-700">{u.ad}</span>
                    <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                      {u.stok} {u.birim}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/urunler"
            className="mt-4 block text-center text-indigo-600 text-sm font-medium hover:underline"
          >
            Tüm ürünleri gör →
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Son Stok Hareketleri</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="pb-3 font-medium">Ürün</th>
                <th className="pb-3 font-medium">Tür</th>
                <th className="pb-3 font-medium">Miktar</th>
                <th className="pb-3 font-medium">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {data.sonHareketler.map((h) => (
                <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 font-medium text-slate-700">{h.urun.ad}</td>
                  <td className="py-3">
                    {h.tur === "GIRIS" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium">
                        <ArrowUpRight size={12} /> Giriş
                      </span>
                    ) : h.tur === "CIKIS" ? (
                      <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-xs font-medium">
                        <ArrowDownRight size={12} /> Çıkış
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs font-medium">
                        Sayım
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-slate-600">{h.miktar} adet</td>
                  <td className="py-3 text-slate-400">
                    {new Date(h.createdAt).toLocaleString("tr-TR")}
                  </td>
                </tr>
              ))}
              {data.sonHareketler.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Henüz hareket yok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon,
  color,
  link,
  alert,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  link?: string;
  alert?: boolean;
}) {
  const content = (
    <div
      className={`bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer ${
        alert ? "border-amber-200" : "border-slate-100"
      }`}
    >
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{title}</p>
        <p className="text-xl font-bold text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
  return link ? <Link href={link}>{content}</Link> : content;
}
