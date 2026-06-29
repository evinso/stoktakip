import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const kategoriId = searchParams.get("kategoriId");

  const urunler = await prisma.urun.findMany({
    where: {
      aktif: true,
      ...(search && { ad: { contains: search } }),
      ...(kategoriId && { kategoriId: parseInt(kategoriId) }),
    },
    include: { kategori: true },
    orderBy: { ad: "asc" },
  });
  return NextResponse.json(urunler);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { ad, fiyat, alisFiyati, stok, minStok, barkod, aciklama, birim, kategoriId } = data;

  if (!ad || fiyat == null) {
    return NextResponse.json({ error: "Ad ve fiyat zorunludur" }, { status: 400 });
  }

  const urun = await prisma.urun.create({
    data: {
      ad,
      fiyat: parseFloat(fiyat),
      alisFiyati: parseFloat(alisFiyati ?? 0),
      stok: parseInt(stok ?? 0),
      minStok: parseInt(minStok ?? 5),
      barkod: barkod || null,
      aciklama: aciklama || null,
      birim: birim ?? "adet",
      kategoriId: kategoriId ? parseInt(kategoriId) : null,
    },
    include: { kategori: true },
  });

  if (stok > 0) {
    await prisma.stokHareketi.create({
      data: {
        urunId: urun.id,
        tur: "GIRIS",
        miktar: parseInt(stok),
        oncekiStok: 0,
        yeniStok: parseInt(stok),
        aciklama: "Başlangıç stoğu",
      },
    });
  }

  return NextResponse.json(urun, { status: 201 });
}
