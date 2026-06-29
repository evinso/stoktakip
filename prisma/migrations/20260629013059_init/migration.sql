-- CreateTable
CREATE TABLE "Kategori" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ad" TEXT NOT NULL,
    "renk" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Urun" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ad" TEXT NOT NULL,
    "barkod" TEXT,
    "aciklama" TEXT,
    "fiyat" REAL NOT NULL,
    "alisFiyati" REAL NOT NULL DEFAULT 0,
    "stok" INTEGER NOT NULL DEFAULT 0,
    "minStok" INTEGER NOT NULL DEFAULT 5,
    "birim" TEXT NOT NULL DEFAULT 'adet',
    "resimUrl" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "kategoriId" INTEGER,
    CONSTRAINT "Urun_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "Kategori" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StokHareketi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "urunId" INTEGER NOT NULL,
    "tur" TEXT NOT NULL,
    "miktar" INTEGER NOT NULL,
    "oncekiStok" INTEGER NOT NULL,
    "yeniStok" INTEGER NOT NULL,
    "aciklama" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StokHareketi_urunId_fkey" FOREIGN KEY ("urunId") REFERENCES "Urun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Satis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "toplamTutar" REAL NOT NULL,
    "odemeTuru" TEXT NOT NULL DEFAULT 'NAKIT',
    "indirim" REAL NOT NULL DEFAULT 0,
    "alinanPara" REAL NOT NULL DEFAULT 0,
    "paraUstu" REAL NOT NULL DEFAULT 0,
    "not" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SatisKalemi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "satisId" INTEGER NOT NULL,
    "urunId" INTEGER NOT NULL,
    "adet" INTEGER NOT NULL,
    "birimFiyat" REAL NOT NULL,
    "toplam" REAL NOT NULL,
    CONSTRAINT "SatisKalemi_satisId_fkey" FOREIGN KEY ("satisId") REFERENCES "Satis" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SatisKalemi_urunId_fkey" FOREIGN KEY ("urunId") REFERENCES "Urun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Kategori_ad_key" ON "Kategori"("ad");

-- CreateIndex
CREATE UNIQUE INDEX "Urun_barkod_key" ON "Urun"("barkod");
