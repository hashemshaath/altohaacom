import { useState, useRef, useCallback, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageContext";
import { Camera, X } from "lucide-react";

interface QRScannerProps {
  onScan: (code: string) => void;
}

export const QRScanner = memo(function QRScanner({ onScan }: QRScannerProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(0);

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsScanning(true);
      scanFrame();
    } catch (err) {
      setError(isAr ? "لا يمكن الوصول للكاميرا" : "Cannot access camera. Please allow camera permissions.");
    }
  };

  const scanFrame = () => {
    if (!videoRef.current || !streamRef.current) return;

    // Use BarcodeDetector if available (Chrome/Edge/Android)
    if ("BarcodeDetector" in window) {
      const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      const loop = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            // Extract code from URL if it's a verification URL
            const codeMatch = rawValue.match(/[?&]code=([^&]+)/i);
            const code = codeMatch ? codeMatch[1] : rawValue;
            stopCamera();
            onScan(code.toUpperCase());
            return;
          }
        } catch {
          // ignore detection errors
        }
        animationRef.current = requestAnimationFrame(loop);
      };
      animationRef.current = requestAnimationFrame(loop);
    } else {
      // Fallback: prompt manual entry
      setError(
        isAr
          ? "متصفحك لا يدعم مسح QR. يرجى إدخال الكود يدوياً."
          : "Your browser doesn't support QR scanning. Please enter the code manually."
      );
      stopCamera();
    }
  };

  if (!isScanning && !error) {
    return (
      <Button variant="outline" size="sm" onClick={startCamera} className="gap-2">
        <Camera className="h-4 w-4" />
        {isAr ? "مسح رمز QR" : "Scan QR Code"}
      </Button>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-muted-foreground mt-2">
        <p>{error}</p>
        <Button variant="ghost" size="sm" onClick={() => { setError(null); startCamera(); }} className="mt-1">
          {isAr ? "حاول مرة أخرى" : "Try again"}
        </Button>
      </div>
    );
  }

  return (
    <Card className="mt-4 overflow-hidden">
      <CardContent className="p-0 relative">
        <div className="relative bg-black aspect-video max-h-[300px]">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          {/* Scanning overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-primary/60 rounded-xl relative">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-0.5 bg-primary/40 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="p-3 flex items-center justify-between bg-muted/50">
          <p className="text-xs text-muted-foreground">
            {isAr ? "وجّه الكاميرا نحو رمز QR" : "Point camera at QR code"}
          </p>
          <Button variant="ghost" size="sm" onClick={stopCamera}>
            <X className="h-4 w-4 me-1" />
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
