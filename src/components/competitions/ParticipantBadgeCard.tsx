import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/i18n/LanguageContext";
import { useEntityQRCode } from "@/hooks/useQRCode";
import { getVerificationUrl } from "@/lib/qrCode";
import { useToast } from "@/hooks/use-toast";
import {
  Download, Copy, User, Trophy, Gavel, Shield, QrCode,
  CheckCircle2, Clock, Building2,
} from "lucide-react";
import type { QREntityType } from "@/lib/qrCode";

interface ParticipantBadgeCardProps {
  /** "participant" | "judge" | "team_member" */
  role: "participant" | "judge" | "team_member";
  /** The registration/judge-assignment/team-member row ID */
  entityId: string;
  personName: string;
  personPhoto?: string | null;
  competitionTitle: string;
  categoryName?: string | null;
  organizationName?: string | null;
  registrationNumber?: string | null;
  status?: string;
  roleTitle?: string | null;
  compact?: boolean;
  className?: string;
}

const ROLE_CONFIG = {
  participant: {
    icon: Trophy,
    labelEn: "Contestant",
    labelAr: "متسابق",
    color: "primary",
    prefix: "participant" as QREntityType,
  },
  judge: {
    icon: Gavel,
    labelEn: "Judge",
    labelAr: "حكم",
    color: "chart-4",
    prefix: "judge" as QREntityType,
  },
  team_member: {
    icon: Shield,
    labelEn: "Team Member",
    labelAr: "عضو فريق",
    color: "chart-3",
    prefix: "team_member" as QREntityType,
  },
};

export function ParticipantBadgeCard({
  role,
  entityId,
  personName,
  personPhoto,
  competitionTitle,
  categoryName,
  organizationName,
  registrationNumber,
  status,
  roleTitle,
  compact = false,
  className = "",
}: ParticipantBadgeCardProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";
  const config = ROLE_CONFIG[role];

  const { data: qrCode, isLoading } = useEntityQRCode(config.prefix, entityId, config.prefix);
  const verificationUrl = qrCode ? getVerificationUrl(qrCode.code) : "";

  const handleCopy = () => {
    if (!qrCode) return;
    navigator.clipboard.writeText(qrCode.code);
    toast({ title: isAr ? "تم النسخ" : "Copied", description: qrCode.code });
  };

  const handleDownload = () => {
    if (!qrCode) return;
    const svg = document.getElementById(`badge-qr-${entityId}`);
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
      a.download = `badge-${qrCode.code}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const Icon = config.icon;
  const initials = personName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {qrCode && (
          <QRCodeSVG
            id={`badge-qr-${entityId}`}
            value={verificationUrl}
            size={48}
            level="M"
            className="rounded shrink-0"
          />
        )}
        <div className="flex flex-col gap-0.5 min-w-0">
          <Badge variant="outline" className="w-fit text-[9px] gap-1">
            <Icon className="h-2.5 w-2.5" />
            {isAr ? config.labelAr : config.labelEn}
          </Badge>
          {qrCode && (
            <span className="font-mono text-[10px] text-muted-foreground tracking-widest">{qrCode.code}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={`overflow-hidden border-border/60 ${className}`}>
      {/* Header strip */}
      <div className={`bg-${config.color}/10 border-b px-4 py-2.5 flex items-center gap-2`}>
        <Icon className={`h-4 w-4 text-${config.color}`} />
        <span className="text-xs font-semibold">
          {isAr ? config.labelAr : config.labelEn}
          {roleTitle && ` — ${roleTitle}`}
        </span>
        {status && (
          <Badge
            variant={status === "approved" ? "default" : "secondary"}
            className="ms-auto text-[9px]"
          >
            {status === "approved" ? (
              <><CheckCircle2 className="h-2.5 w-2.5 me-0.5" />{isAr ? "مؤكد" : "Confirmed"}</>
            ) : (
              <><Clock className="h-2.5 w-2.5 me-0.5" />{isAr ? "معلق" : "Pending"}</>
            )}
          </Badge>
        )}
      </div>

      <CardContent className="p-4 flex flex-col items-center gap-3">
        {/* Person info */}
        <div className="flex items-center gap-3 w-full">
          <Avatar className="h-12 w-12 border-2 border-border">
            <AvatarImage src={personPhoto || undefined} />
            <AvatarFallback className="text-sm font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{personName}</p>
            {organizationName && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                <Building2 className="h-3 w-3 shrink-0" />
                {organizationName}
              </p>
            )}
            {categoryName && (
              <Badge variant="outline" className="text-[9px] mt-0.5">{categoryName}</Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* QR Code */}
        {isLoading ? (
          <div className="h-32 w-32 bg-muted/50 rounded-xl animate-pulse" />
        ) : qrCode ? (
          <div className="rounded-xl border bg-background p-2.5 shadow-sm">
            <QRCodeSVG
              id={`badge-qr-${entityId}`}
              value={verificationUrl}
              size={120}
              level="M"
              includeMargin
            />
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            <QrCode className="h-8 w-8 opacity-20" />
          </div>
        )}

        {/* Code + meta */}
        {qrCode && (
          <Badge variant="outline" className="font-mono text-xs tracking-[0.15em]">
            {qrCode.code}
          </Badge>
        )}
        {registrationNumber && (
          <p className="text-[10px] text-muted-foreground">
            {isAr ? "رقم التسجيل:" : "Reg #:"} <span className="font-mono font-medium">{registrationNumber}</span>
          </p>
        )}
        <p className="text-[10px] text-center text-muted-foreground line-clamp-1">{competitionTitle}</p>

        {/* Actions */}
        {qrCode && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={handleCopy}>
              <Copy className="h-3 w-3 me-1" />
              {isAr ? "نسخ" : "Copy"}
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={handleDownload}>
              <Download className="h-3 w-3 me-1" />
              {isAr ? "تحميل" : "Download"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
