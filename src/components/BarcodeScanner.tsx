"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera, Loader2 } from "lucide-react";

interface BarcodeScannerProps {
  onSonuc: (barkod: string) => void;
  onKapat: () => void;
}

export default function BarcodeScanner({ onSonuc, onKapat }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [durum, setDurum] = useState<"baslıyor" | "tarama" | "hata">("baslıyor");
  const [hataMesaj, setHataMesaj] = useState("");
  const kontrolRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    let aktif = true;

    const baslat = async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();

        const cihazlar = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!aktif) return;

        if (cihazlar.length === 0) {
          setDurum("hata");
          setHataMesaj("Kamera bulunamadı.");
          return;
        }

        // Arka kamerayı tercih et
        const arkaKamera = cihazlar.find((c) =>
          c.label.toLowerCase().includes("back") ||
          c.label.toLowerCase().includes("arka") ||
          c.label.toLowerCase().includes("environment")
        ) ?? cihazlar[cihazlar.length - 1];

        setDurum("tarama");

        const kontrol = await reader.decodeFromVideoDevice(
          arkaKamera.deviceId,
          videoRef.current!,
          (sonuc) => {
            if (!aktif) return;
            if (sonuc) {
              onSonuc(sonuc.getText());
            }
          }
        );
        kontrolRef.current = kontrol;
      } catch (e: unknown) {
        if (!aktif) return;
        const msg = e instanceof Error ? e.message : String(e);
        setDurum("hata");
        setHataMesaj(msg.includes("Permission") ? "Kamera izni reddedildi." : "Kamera açılamadı: " + msg);
      }
    };

    baslat();

    return () => {
      aktif = false;
      try { kontrolRef.current?.stop(); } catch { /* ignore */ }
    };
  }, [onSonuc]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-md">
        {/* Başlık */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Camera size={18} className="text-indigo-500" />
            Barkod Tara
          </div>
          <button onClick={onKapat} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Kamera alanı */}
        <div className="relative bg-black aspect-[4/3]">
          <video ref={videoRef} className="w-full h-full object-cover" />

          {/* Hedefleme çerçevesi */}
          {durum === "tarama" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-36 relative">
                {/* Köşe çizgileri */}
                {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map((pos, i) => (
                  <div key={i} className={`absolute w-6 h-6 border-indigo-400 border-2 ${pos} ${
                    pos.includes("right") ? "border-l-0" : "border-r-0"
                  } ${pos.includes("bottom") ? "border-t-0" : "border-b-0"}`} />
                ))}
                {/* Tarama çizgisi animasyonu */}
                <div className="absolute inset-x-0 h-0.5 bg-indigo-400/80 animate-bounce top-1/2" />
              </div>
            </div>
          )}

          {/* Yükleniyor */}
          {durum === "baslıyor" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3">
              <Loader2 size={32} className="animate-spin text-indigo-400" />
              <p className="text-sm">Kamera başlatılıyor...</p>
            </div>
          )}

          {/* Hata */}
          {durum === "hata" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 px-6 text-center">
              <Camera size={32} className="text-red-400" />
              <p className="text-sm text-red-300">{hataMesaj}</p>
            </div>
          )}
        </div>

        <div className="px-5 py-3 text-center text-xs text-slate-400 bg-slate-50">
          Barkodu kamera çerçevesine tutun — otomatik okunur
        </div>
      </div>
    </div>
  );
}
