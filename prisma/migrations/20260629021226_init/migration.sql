-- CreateTable
CREATE TABLE "Kategori" (
    "id" SERIAL NOT NULL,
    "ad" TEXT NOT NULL,
    "renk" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Kategori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Urun" (
    "id" SERIAL NOT NULL,
    "ad" TEXT NOT NULL,
    "barkod" TEXT,
    "aciklama" TEXT,
    "fiyat" DOUBLE PRECISION NOT NULL,
    "alisFiyati" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stok" INTEGER NOT NULL DEFAULT 0,
    "minStok" INTEGER NOT NULL DEFAULT 5,
    "birim" TEXT NOT NULL DEFAULT 'adet',
    "resimUrl" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "kategoriId" INTEGER,

    CONSTRAINT "Urun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StokHareketi" (
    "id" SERIAL NOT NULL,
    "urunId" INTEGER NOT NULL,
    "tur" TEXT NOT NULL,
    "miktar" INTEGER NOT NULL,
    "oncekiStok" INTEGER NOT NULL,
    "yeniStok" INTEGER NOT NULL,
    "aciklama" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StokHareketi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Satis" (
    "id" SERIAL NOT NULL,
    "toplamTutar" DOUBLE PRECISION NOT NULL,
    "odemeTuru" TEXT NOT NULL DEFAULT 'NAKIT',
    "indirim" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "alinanPara" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paraUstu" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "not" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Satis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatisKalemi" (
    "id" SERIAL NOT NULL,
    "satisId" INTEGER NOT NULL,
    "urunId" INTEGER NOT NULL,
    "adet" INTEGER NOT NULL,
    "birimFiyat" DOUBLE PRECISION NOT NULL,
    "toplam" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SatisKalemi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kategori_ad_key" ON "Kategori"("ad");

-- CreateIndex
CREATE UNIQUE INDEX "Urun_barkod_key" ON "Urun"("barkod");

-- AddForeignKey
ALTER TABLE "Urun" ADD CONSTRAINT "Urun_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "Kategori"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StokHareketi" ADD CONSTRAINT "StokHareketi_urunId_fkey" FOREIGN KEY ("urunId") REFERENCES "Urun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SatisKalemi" ADD CONSTRAINT "SatisKalemi_satisId_fkey" FOREIGN KEY ("satisId") REFERENCES "Satis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SatisKalemi" ADD CONSTRAINT "SatisKalemi_urunId_fkey" FOREIGN KEY ("urunId") REFERENCES "Urun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
