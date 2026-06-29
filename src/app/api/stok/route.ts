import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const hareketler = await prisma.stokHareketi.findMany({
    include: { urun: { select: { ad: true, birim: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(hareketler);
}

export async function POST(req: NextRequest) {
  const { urunId, tur, miktar, aciklama } = await req.json();

  const urun = await prisma.urun.findUnique({ where: { id: urunId } });
  if (!urun) return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });

  const gercekMiktar = parseInt(miktar);
  let yeniStok = urun.stok;

  if (tur === "GIRIS") {
    yeniStok = urun.stok + gercekMiktar;
  } else if (tur === "CIKIS") {
    if (urun.stok < gercekMiktar) {
      return NextResponse.json({ error: "Yetersiz stok" }, { status: 400 });
    }
    yeniStok = urun.stok - gercekMiktar;
  } else if (tur === "SAYIM") {
    yeniStok = gercekMiktar;
  }

  const [hareket] = await prisma.$transaction([
    prisma.stokHareketi.create({
      data: {
        urunId,
        tur,
        miktar: gercekMiktar,
        oncekiStok: urun.stok,
        yeniStok,
        aciklama: aciklama || null,
      },
    }),
    prisma.urun.update({
      where: { id: urunId },
      data: { stok: yeniStok },
    }),
  ]);

  return NextResponse.json(hareket, { status: 201 });
}
