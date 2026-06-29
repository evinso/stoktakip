"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import UrunForm from "@/components/UrunForm";

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
  kategoriId: number | null;
}

export default function UrunDuzenle() {
  const { id } = useParams();
  const [urun, setUrun] = useState<Urun | null>(null);

  useEffect(() => {
    fetch(`/api/urunler/${id}`).then((r) => r.json()).then(setUrun);
  }, [id]);

  const kaydet = async (data: Record<string, unknown>) => {
    const res = await fetch(`/api/urunler/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Güncelleme başarısız");
    }
  };

  if (!urun) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <UrunForm
      baslik="Ürün Düzenle"
      varsayilan={{
        ad: urun.ad,
        barkod: urun.barkod ?? "",
        aciklama: urun.aciklama ?? "",
        fiyat: urun.fiyat,
        alisFiyati: urun.alisFiyati,
        stok: urun.stok,
        minStok: urun.minStok,
        birim: urun.birim,
        kategoriId: urun.kategoriId,
      }}
      onKaydet={kaydet}
      geriUrl={`/urunler/${id}`}
    />
  );
}
