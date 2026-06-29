"use client";

import UrunForm from "@/components/UrunForm";

export default function YeniUrun() {
  const kaydet = async (data: Record<string, unknown>) => {
    const res = await fetch("/api/urunler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Kayıt başarısız");
    }
  };

  return <UrunForm baslik="Yeni Ürün Ekle" onKaydet={kaydet} />;
}
