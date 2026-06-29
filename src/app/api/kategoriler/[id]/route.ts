import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ad, renk } = await req.json();
  const kategori = await prisma.kategori.update({
    where: { id: parseInt(id) },
    data: { ad, renk },
  });
  return NextResponse.json(kategori);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.kategori.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
