import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEntityQRCode } from "@/hooks/useQRCode";
import { UserCareerTimeline } from "@/components/admin/UserCareerTimeline";
import { UserBadgesDisplay } from "@/components/badges/UserBadgesDisplay";
import { FileText, Globe, Copy, UserPlus, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import { getVerificationUrl, generateVCard, downloadVCard } from "@/lib/qrCode";

interface ProfileOverviewTabProps {
  profile: any;
  userId: string;
}

/* ── Section Title ── */
function SectionTitle({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <h3 className="flex items-center gap-2.5 text-base font-semibold mb-3">
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </h3>
  );
}

/* ── Barcode SVG ── */
function Barcode({ value, height = 44 }: { value: string; height?: number }) {
  const bars: number[] = [1, 1, 0, 1, 1, 0];
  for (const char of value) {
    const code = char.charCodeAt(0);
    for (let i = 7; i >= 0; i--) bars.push((code >> i) & 1);
    bars.push(0);
  }
  bars.push(0, 1, 1, 0, 1, 1);

  return (
    <svg
      viewBox={`0 0 ${bars.length} ${height}`}
      className="w-full"
      height={height}
      preserveAspectRatio="none"
    >
      {bars.map((bar, i) =>
        bar ? <rect key={i} x={i} y={0} width={0.7} height={height} className="fill-primary/70" /> : null
      )}
    </svg>
  );
}

/* ── Main Component ── */
export function ProfileOverviewTab({ profile, userId }: ProfileOverviewTabProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";
  const { data: qrCode } = useEntityQRCode("user", profile?.username || undefined, "account");
  const verificationUrl = qrCode ? getVerificationUrl(qrCode.code) : "";
  const digits = qrCode ? qrCode.code.slice(-4) : "";

  const handleCopyCode = () => {
    if (!digits) return;
    navigator.clipboard.writeText(digits);
    toast({ title: isAr ? "تم النسخ" : "Copied" });
  };

  const handleSaveContact = () => {
    if (!profile) return;
    const vcard = generateVCard({
      fullName: profile.full_name || "",
      phone: profile.phone || undefined,
      website: profile.website || undefined,
      location: profile.location || undefined,
      accountNumber: profile.account_number || undefined,
      profileUrl: profile.username
        ? `https://altohaacom.lovable.app/${profile.username}`
        : undefined,
    });
    downloadVCard(vcard, (profile.full_name || "contact").replace(/\s+/g, "_"));
  };

  const handleDownloadQR = () => {
    if (!qrCode) return;
    const svg = document.getElementById(`qr-${qrCode.code}`);
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
      a.download = `qr-${digits}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const socialLinks = [
    { key: "website", label: "Web", value: profile?.website },
    { key: "instagram", label: "Instagram", value: profile?.instagram },
    { key: "twitter", label: "X", value: profile?.twitter },
    { key: "facebook", label: "Facebook", value: profile?.facebook },
    { key: "linkedin", label: "LinkedIn", value: profile?.linkedin },
    { key: "youtube", label: "YouTube", value: profile?.youtube },
    { key: "tiktok", label: "TikTok", value: profile?.tiktok },
    { key: "snapchat", label: "Snapchat", value: profile?.snapchat },
  ].filter((l) => l.value);

  return (
    <div className="space-y-8" dir={isAr ? "rtl" : "ltr"}>
      {/* ── Bio ── */}
      {(profile?.bio || profile?.bio_ar) && (
        <section>
          <SectionTitle icon={FileText} label={isAr ? "النبذة" : "About"} />
          <Card>
            <CardContent className="py-5">
              <p className="text-[15px] leading-7 whitespace-pre-wrap text-foreground/90">
                {isAr ? (profile?.bio_ar || profile?.bio) : profile?.bio}
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ── Career Timeline ── */}
      <section>
        <UserCareerTimeline userId={userId} isAr={isAr} />
      </section>

      {/* ── Badges ── */}
      <section>
        <UserBadgesDisplay userId={userId} />
      </section>

      {/* ── Social Links ── */}
      {socialLinks.length > 0 && (
        <section>
          <SectionTitle icon={Globe} label={isAr ? "التواصل" : "Links"} />
          <Card>
            <CardContent className="py-5">
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((link) => (
                  <Badge
                    key={link.key}
                    variant="outline"
                    className="text-xs gap-1.5 font-normal py-1.5 px-3"
                  >
                    <span className="font-semibold">{link.label}</span>
                    <span className="text-muted-foreground">{link.value}</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          ██  PREMIUM IDENTITY CARD – from scratch  ██
          ═══════════════════════════════════════════════ */}
      {qrCode && (
        <section>
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background:
                "linear-gradient(145deg, hsl(var(--primary) / 0.12) 0%, hsl(var(--card)) 40%, hsl(var(--primary) / 0.06) 100%)",
            }}
          >
            {/* ── Subtle pattern overlay ── */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* ── Gold border line on top ── */}
            <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

            <div className="relative z-10 p-6 sm:p-8">
              {/* ── Top Row: Logo + Card Title ── */}
              <div className="flex items-center justify-between mb-6">
                <img
                  src="/altohaa-logo.png"
                  alt="Altohaa"
                  className="h-10 sm:h-12 object-contain"
                />
                <div className="text-end">
                  <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-primary">
                    {isAr ? "بطاقة التحقق الرقمية" : "Digital Verification"}
                  </p>
                  <p className="text-[9px] text-muted-foreground tracking-wider mt-0.5">
                    {isAr ? "بطاقة هوية المنصة" : "Platform Identity Card"}
                  </p>
                </div>
              </div>

              {/* ── Thin gold separator ── */}
              <div className="h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent mb-6" />

              {/* ── Main body: avatar + info + QR ── */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Left: Avatar */}
                <div className="shrink-0 flex flex-col items-center gap-2">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || ""}
                      className="h-[88px] w-[88px] rounded-xl object-cover ring-2 ring-primary/25 shadow-lg"
                    />
                  ) : (
                    <div className="h-[88px] w-[88px] rounded-xl bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                      <span className="text-3xl font-bold text-primary/60">
                        {(profile?.full_name || "?")[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Center: User info */}
                <div className="flex-1 text-center sm:text-start min-w-0">
                  <h4 className="text-lg font-bold text-foreground leading-tight truncate">
                    {isAr
                      ? profile?.full_name_ar || profile?.full_name
                      : profile?.full_name}
                  </h4>
                  {profile?.current_title && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {profile.current_title}
                    </p>
                  )}
                  {profile?.account_number && (
                    <p className="font-mono text-[11px] text-primary/70 mt-2 tracking-[0.15em]">
                      {profile.account_number}
                    </p>
                  )}

                  {/* 4-digit verification inline */}
                  <div className="flex items-center gap-1 mt-3 justify-center sm:justify-start">
                    <span className="text-[9px] text-muted-foreground me-1.5 uppercase tracking-wider">
                      {isAr ? "كود" : "Code"}
                    </span>
                    {digits.split("").map((d, i) => (
                      <span
                        key={i}
                        className="inline-flex h-7 w-6 items-center justify-center rounded-md border border-primary/25 bg-primary/5 font-mono text-sm font-bold text-primary"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: QR code */}
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <div className="rounded-lg border border-primary/15 bg-background p-2.5 shadow-sm">
                    <QRCodeSVG
                      id={`qr-${qrCode.code}`}
                      value={verificationUrl}
                      size={100}
                      level="M"
                      includeMargin={false}
                      fgColor="hsl(36, 55%, 38%)"
                      bgColor="transparent"
                    />
                  </div>
                  <span className="text-[8px] text-muted-foreground tracking-widest uppercase">
                    {isAr ? "امسح للتحقق" : "Scan to verify"}
                  </span>
                </div>
              </div>

              {/* ── Barcode section ── */}
              <div className="mt-6 px-4 sm:px-8">
                <Barcode value={profile?.account_number || qrCode.code} />
                <p className="text-center font-mono text-[9px] tracking-[0.35em] text-muted-foreground mt-1">
                  {profile?.account_number || qrCode.code}
                </p>
              </div>

              {/* ── Bottom separator ── */}
              <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mt-5 mb-4" />

              {/* ── Actions ── */}
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-[11px] h-8 border-primary/20 hover:bg-primary/5 hover:border-primary/30"
                  onClick={handleCopyCode}
                >
                  <Copy className="h-3 w-3" />
                  {isAr ? "نسخ الكود" : "Copy Code"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-[11px] h-8 border-primary/20 hover:bg-primary/5 hover:border-primary/30"
                  onClick={handleDownloadQR}
                >
                  <Download className="h-3 w-3" />
                  {isAr ? "تحميل QR" : "Download QR"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-[11px] h-8 border-primary/20 hover:bg-primary/5 hover:border-primary/30"
                  onClick={handleSaveContact}
                >
                  <UserPlus className="h-3 w-3" />
                  {isAr ? "حفظ جهة اتصال" : "Save Contact"}
                </Button>
              </div>
            </div>

            {/* ── Gold border line on bottom ── */}
            <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
          </div>
        </section>
      )}
    </div>
  );
}
