"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  BarChart3,
  ArrowDownUp,
} from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/urunler", icon: Package, label: "Ürünler" },
  { href: "/kategoriler", icon: Tag, label: "Kategoriler" },
  { href: "/pos", icon: ShoppingCart, label: "Satış (POS)" },
  { href: "/stok", icon: ArrowDownUp, label: "Stok Hareketleri" },
  { href: "/raporlar", icon: BarChart3, label: "Raporlar" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-slate-900 text-white flex flex-col min-h-screen">
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Package size={16} />
          </div>
          <div>
            <p className="font-bold text-sm">Stok Takip</p>
            <p className="text-xs text-slate-400">Yönetim Paneli</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <p className="text-xs text-slate-500 text-center">v1.0.0 · Stok Takip</p>
      </div>
    </aside>
  );
}
