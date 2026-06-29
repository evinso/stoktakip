import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);

  const [
    toplamUrun,
    dusukStoklar,
    bugunSatislar,
    toplamSatislar,
    sonHareketler,
    kategoriSayilari,
  ] = await Promise.all([
    prisma.urun.count({ where: { aktif: true } }),
    prisma.$queryRaw<Array<{ id: number; ad: string; stok: number; minStok: number; birim: string }>>`
      SELECT id, ad, stok, minStok, birim FROM Urun WHERE aktif = 1 AND stok <= minStok LIMIT 5
    `,
    prisma.satis.aggregate({
      where: { createdAt: { gte: bugun } },
      _sum: { toplamTutar: true },
      _count: true,
    }),
    prisma.satis.aggregate({
      _sum: { toplamTutar: true },
      _count: true,
    }),
    prisma.stokHareketi.findMany({
      include: { urun: { select: { ad: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.kategori.findMany({
      include: { _count: { select: { urunler: true } } },
    }),
  ]);

  const son7Gun = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const haftalikSatislar = await Promise.all(
    son7Gun.map(async (gun) => {
      const sonraki = new Date(gun);
      sonraki.setDate(sonraki.getDate() + 1);
      const agg = await prisma.satis.aggregate({
        where: { createdAt: { gte: gun, lt: sonraki } },
        _sum: { toplamTutar: true },
      });
      return {
        tarih: gun.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric" }),
        tutar: agg._sum.toplamTutar ?? 0,
      };
    })
  );

  return NextResponse.json({
    toplamUrun,
    dusukStoklar,
    bugunSatis: {
      tutar: bugunSatislar._sum.toplamTutar ?? 0,
      adet: bugunSatislar._count,
    },
    toplamSatis: {
      tutar: toplamSatislar._sum.toplamTutar ?? 0,
      adet: toplamSatislar._count,
    },
    sonHareketler,
    haftalikSatislar,
    kategoriSayilari,
  });
}
