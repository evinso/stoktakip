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
  const { kalemler, odemeTuru, indirim, alinanPara, nakitTutar, kartTutar } = await req.json();

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

  const araToplam = kalemler.reduce((t: number, kalem: { urunId: number; adet: number }) => {
    const urun = urunler.find((u) => u.id === kalem.urunId)!;
    return t + urun.fiyat * kalem.adet;
  }, 0);

  const toplamIndirim = parseFloat(indirim ?? 0);
  const toplamTutar = Math.max(0, araToplam - toplamIndirim);

  // Ödeme hesapları
  let hesapNakit = 0;
  let hesapKart = 0;
  let hesapAlinan = toplamTutar;
  let hesapParaUstu = 0;

  if (odemeTuru === "PARCALI") {
    hesapNakit = parseFloat(nakitTutar ?? 0);
    hesapKart = parseFloat(kartTutar ?? 0);
    hesapAlinan = hesapNakit + hesapKart;
    hesapParaUstu = Math.max(0, hesapNakit - (toplamTutar - hesapKart));
  } else if (odemeTuru === "NAKIT") {
    hesapNakit = parseFloat(alinanPara ?? toplamTutar);
    hesapAlinan = hesapNakit;
    hesapParaUstu = Math.max(0, hesapNakit - toplamTutar);
  } else {
    hesapKart = toplamTutar;
    hesapAlinan = toplamTutar;
  }

  const satis = await prisma.$transaction(async (tx) => {
    const yeniSatis = await tx.satis.create({
      data: {
        toplamTutar,
        odemeTuru: odemeTuru ?? "NAKIT",
        indirim: toplamIndirim,
        alinanPara: hesapAlinan,
        paraUstu: hesapParaUstu,
        nakitTutar: hesapNakit,
        kartTutar: hesapKart,
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
