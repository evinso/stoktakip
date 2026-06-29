import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const kategoriler = await Promise.all([
    prisma.kategori.upsert({ where: { ad: "Elektronik" }, update: {}, create: { ad: "Elektronik", renk: "#6366f1" } }),
    prisma.kategori.upsert({ where: { ad: "Gıda" }, update: {}, create: { ad: "Gıda", renk: "#10b981" } }),
    prisma.kategori.upsert({ where: { ad: "Temizlik" }, update: {}, create: { ad: "Temizlik", renk: "#f59e0b" } }),
    prisma.kategori.upsert({ where: { ad: "Kırtasiye" }, update: {}, create: { ad: "Kırtasiye", renk: "#3b82f6" } }),
  ]);

  const urunler = [
    { ad: "USB Kablo", fiyat: 49.99, alisFiyati: 20, stok: 50, minStok: 10, birim: "adet", kategoriId: kategoriler[0].id, barkod: "8690001001" },
    { ad: "Bluetooth Kulaklık", fiyat: 299.90, alisFiyati: 150, stok: 15, minStok: 5, birim: "adet", kategoriId: kategoriler[0].id, barkod: "8690001002" },
    { ad: "Su — 1.5L", fiyat: 8.50, alisFiyati: 4, stok: 200, minStok: 50, birim: "adet", kategoriId: kategoriler[1].id, barkod: "8690002001" },
    { ad: "Çikolata", fiyat: 25.00, alisFiyati: 12, stok: 80, minStok: 20, birim: "adet", kategoriId: kategoriler[1].id, barkod: "8690002002" },
    { ad: "Deterjan 3kg", fiyat: 89.90, alisFiyati: 45, stok: 3, minStok: 10, birim: "paket", kategoriId: kategoriler[2].id, barkod: "8690003001" },
    { ad: "Kalem", fiyat: 5.00, alisFiyati: 2, stok: 100, minStok: 30, birim: "adet", kategoriId: kategoriler[3].id, barkod: "8690004001" },
    { ad: "Defter A4", fiyat: 35.00, alisFiyati: 18, stok: 40, minStok: 10, birim: "adet", kategoriId: kategoriler[3].id, barkod: "8690004002" },
  ];

  for (const u of urunler) {
    const mevcut = await prisma.urun.findFirst({ where: { ad: u.ad } });
    if (!mevcut) {
      const urun = await prisma.urun.create({ data: u });
      if (u.stok > 0) {
        await prisma.stokHareketi.create({
          data: { urunId: urun.id, tur: "GIRIS", miktar: u.stok, oncekiStok: 0, yeniStok: u.stok, aciklama: "Başlangıç stoğu" },
        });
      }
    }
  }

  console.log("Seed tamamlandı!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
