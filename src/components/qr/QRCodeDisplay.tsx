import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { QrCode, Download, Copy, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getVerificationUrl, generateVCard, downloadVCard } from "@/lib/qrCode";

interface QRCodeDisplayProps {
  code: string;
  label?: string;
  size?: number;
  showActions?: boolean;
  /** If provided, enables "Save Contact" button */
  vCardData?: {
    fullName: string;
    phone?: string;
    email?: string;
    organization?: string;
    title?: string;
    website?: string;
    location?: string;
    accountNumber?: string;
    profileUrl?: string;
  };
  className?: string;
  compact?: boolean;
}

export const QRCodeDisplay = React.forwardRef<HTMLDivElement, QRCodeDisplayProps>(function QRCodeDisplay({
  code,
  label,
  size = 180,
  showActions = true,
  vCardData,
  className = "",
  compact = false,
}, ref) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";
  const verificationUrl = getVerificationUrl(code);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: isAr ? "تم النسخ" : "Copied",
      description: isAr ? "تم نسخ الكود" : "Code copied to clipboard",
    });
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById(`qr-${code}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = `qr-${code}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleSaveContact = () => {
    if (!vCardData) return;
    const vcard = generateVCard(vCardData);
    downloadVCard(vcard, vCardData.fullName.replace(/\s+/g, "_"));
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <QRCodeSVG
          id={`qr-${code}`}
          value={verificationUrl}
          size={64}
          level="M"
          className="rounded-md"
        />
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="font-mono text-xs tracking-widest w-fit">
            {code}
          </Badge>
          {showActions && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={handleCopyCode}>
              <Copy className="h-3 w-3 me-1" />
              {isAr ? "نسخ" : "Copy"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card ref={ref} className={`border-border/50 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <QrCode className="h-4 w-4" />
          {label || (isAr ? "رمز QR" : "QR Code")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <div className="rounded-xl border bg-background p-3 shadow-sm">
          <QRCodeSVG
            id={`qr-${code}`}
            value={verificationUrl}
            size={size}
            level="M"
            includeMargin
          />
        </div>

        <Badge variant="outline" className="font-mono text-sm tracking-[0.2em]">
          {code}
        </Badge>

        {showActions && (
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyCode}>
              <Copy className="h-3.5 w-3.5 me-1.5" />
              {isAr ? "نسخ الكود" : "Copy Code"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadQR}>
              <Download className="h-3.5 w-3.5 me-1.5" />
              {isAr ? "تحميل QR" : "Download QR"}
            </Button>
            {vCardData && (
              <Button variant="secondary" size="sm" onClick={handleSaveContact}>
                <UserPlus className="h-3.5 w-3.5 me-1.5" />
                {isAr ? "حفظ جهة اتصال" : "Save Contact"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

QRCodeDisplay.displayName = "QRCodeDisplay";
