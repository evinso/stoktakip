import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const satislar = await prisma.satis.findMany({
    include: {
      kalemler: { include: { urun: { select: { ad: true, birim: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json(satislar);
}

export async function POST(req: NextRequest) {
  const { kalemler, odemeTuru, indirim, alinanPara } = await req.json();

  if (!kalemler || kalemler.length === 0) {
    return NextResponse.json({ error: "Sepet boş" }, { status: 400 });
  }

  const urunler = await prisma.urun.findMany({
    where: { id: { in: kalemler.map((k: { urunId: number }) => k.urunId) } },
  });

  for (const kalem of kalemler) {
    const urun = urunler.find((u) => u.id === kalem.urunId);
    if (!urun) return NextResponse.json({ error: `Ürün bulunamadı: ${kalem.urunId}` }, { status: 404 });
    if (urun.stok < kalem.adet) {
      return NextResponse.json({ error: `${urun.ad} için yetersiz stok` }, { status: 400 });
    }
  }

  let araToplam = 0;
  for (const kalem of kalemler) {
    const urun = urunler.find((u) => u.id === kalem.urunId)!;
    araToplam += urun.fiyat * kalem.adet;
  }

  const toplamIndirim = parseFloat(indirim ?? 0);
  const toplamTutar = araToplam - toplamIndirim;
  const alinan = parseFloat(alinanPara ?? toplamTutar);
  const paraUstu = alinan - toplamTutar;

  const satis = await prisma.$transaction(async (tx) => {
    const yeniSatis = await tx.satis.create({
      data: {
        toplamTutar,
        odemeTuru: odemeTuru ?? "NAKIT",
        indirim: toplamIndirim,
        alinanPara: alinan,
        paraUstu,
        kalemler: {
          create: kalemler.map((kalem: { urunId: number; adet: number }) => {
            const urun = urunler.find((u) => u.id === kalem.urunId)!;
            return {
              urunId: kalem.urunId,
              adet: kalem.adet,
              birimFiyat: urun.fiyat,
              toplam: urun.fiyat * kalem.adet,
            };
          }),
        },
      },
      include: { kalemler: { include: { urun: true } } },
    });

    for (const kalem of kalemler) {
      const urun = urunler.find((u) => u.id === kalem.urunId)!;
      const yeniStok = urun.stok - kalem.adet;
      await tx.urun.update({ where: { id: kalem.urunId }, data: { stok: yeniStok } });
      await tx.stokHareketi.create({
        data: {
          urunId: kalem.urunId,
          tur: "CIKIS",
          miktar: kalem.adet,
          oncekiStok: urun.stok,
          yeniStok,
          aciklama: `Satış #${yeniSatis.id}`,
        },
      });
    }

    return yeniSatis;
  });

  return NextResponse.json(satis, { status: 201 });
}
