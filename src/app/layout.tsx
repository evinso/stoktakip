import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Stok Takip Sistemi",
  description: "Profesyonel stok ve satış yönetimi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="h-full">
      <body className="h-full flex bg-slate-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </body>
    </html>
  );
}
