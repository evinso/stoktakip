import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const kategoriler = await prisma.kategori.findMany({
    include: { _count: { select: { urunler: true } } },
    orderBy: { ad: "asc" },
  });
  return NextResponse.json(kategoriler);
}

export async function POST(req: NextRequest) {
  const { ad, renk } = await req.json();
  if (!ad) return NextResponse.json({ error: "Ad zorunludur" }, { status: 400 });
  const kategori = await prisma.kategori.create({ data: { ad, renk } });
  return NextResponse.json(kategori, { status: 201 });
}
