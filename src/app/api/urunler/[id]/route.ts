import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const urun = await prisma.urun.findUnique({
    where: { id: parseInt(id) },
    include: {
      kategori: true,
      stokHareketleri: { orderBy: { createdAt: "desc" }, take: 20 },
      satisKalemleri: {
        include: { satis: true },
        orderBy: { satis: { createdAt: "desc" } },
        take: 10,
      },
    },
  });
  if (!urun) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  return NextResponse.json(urun);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const { ad, fiyat, alisFiyati, minStok, barkod, aciklama, birim, kategoriId, aktif } = data;

  const urun = await prisma.urun.update({
    where: { id: parseInt(id) },
    data: {
      ad,
      fiyat: parseFloat(fiyat),
      alisFiyati: parseFloat(alisFiyati ?? 0),
      minStok: parseInt(minStok ?? 5),
      barkod: barkod || null,
      aciklama: aciklama || null,
      birim: birim ?? "adet",
      kategoriId: kategoriId ? parseInt(kategoriId) : null,
      aktif: aktif !== undefined ? aktif : true,
    },
    include: { kategori: true },
  });
  return NextResponse.json(urun);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.urun.update({
    where: { id: parseInt(id) },
    data: { aktif: false },
  });
  return NextResponse.json({ ok: true });
}
