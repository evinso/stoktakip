"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera, Loader2, CheckCircle2 } from "lucide-react";

interface BarcodeScannerProps {
  onSonuc: (barkod: string) => void;
  onKapat: () => void;
  /** Taramadan sonra kamerayı kapat (varsayılan: false = açık kal) */
  tekSeferlik?: boolean;
}

export default function BarcodeScanner({ onSonuc, onKapat, tekSeferlik = false }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [durum, setDurum] = useState<"baslıyor" | "tarama" | "hata">("baslıyor");
  const [hataMesaj, setHataMesaj] = useState("");
  const [sonOkunan, setSonOkunan] = useState("");
  const kontrolRef = useRef<{ stop: () => void } | null>(null);
  // Son başarılı okuma: barkod + zaman damgası
  const sonTaramaRef = useRef<{ barkod: string; zaman: number } | null>(null);

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

        const arkaKamera =
          cihazlar.find((c) =>
            c.label.toLowerCase().includes("back") ||
            c.label.toLowerCase().includes("arka") ||
            c.label.toLowerCase().includes("environment")
          ) ?? cihazlar[cihazlar.length - 1];

        setDurum("tarama");

        const kontrol = await reader.decodeFromVideoDevice(
          arkaKamera.deviceId,
          videoRef.current!,
          (sonuc) => {
            if (!aktif || !sonuc) return;
            const barkod = sonuc.getText();
            const simdi = Date.now();
            const son = sonTaramaRef.current;

            // Aynı barkod 1.5 saniye içinde tekrar geldiyse yok say
            if (son && son.barkod === barkod && simdi - son.zaman < 1500) return;

            sonTaramaRef.current = { barkod, zaman: simdi };
            setSonOkunan(barkod);
            setTimeout(() => setSonOkunan(""), 1200);

            onSonuc(barkod);

            if (tekSeferlik) {
              aktif = false;
              try { kontrol.stop(); } catch { /* ignore */ }
              onKapat();
            }
          }
        );
        kontrolRef.current = kontrol;
      } catch (e: unknown) {
        if (!aktif) return;
        const msg = e instanceof Error ? e.message : String(e);
        setDurum("hata");
        setHataMesaj(
          msg.includes("Permission") ? "Kamera izni reddedildi." : "Kamera açılamadı: " + msg
        );
      }
    };

    baslat();

    return () => {
      aktif = false;
      try { kontrolRef.current?.stop(); } catch { /* ignore */ }
    };
  }, [onSonuc, onKapat, tekSeferlik]);

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
                {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map((pos, i) => (
                  <div key={i} className={`absolute w-6 h-6 border-2 ${sonOkunan ? "border-emerald-400" : "border-indigo-400"} ${pos}
                    ${pos.includes("right") ? "border-l-0" : "border-r-0"}
                    ${pos.includes("bottom") ? "border-t-0" : "border-b-0"} transition-colors`} />
                ))}
                <div className={`absolute inset-x-0 h-0.5 animate-bounce top-1/2 transition-colors ${sonOkunan ? "bg-emerald-400/80" : "bg-indigo-400/80"}`} />
              </div>
            </div>
          )}

          {/* Başarı bildirimi */}
          {sonOkunan && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
              <div className="bg-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg">
                <CheckCircle2 size={16} />
                {sonOkunan}
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
          {tekSeferlik
            ? "Barkodu okutun — otomatik kapanır"
            : "Barkodu okutun — her taramada adet artar · Kapatmak için ✕"}
        </div>
      </div>
    </div>
  );
}
