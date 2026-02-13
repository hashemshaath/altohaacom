import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEntityQRCode } from "@/hooks/useQRCode";
import { UserCareerTimeline } from "@/components/admin/UserCareerTimeline";
import { UserBadgesDisplay } from "@/components/badges/UserBadgesDisplay";
import { FileText, Globe, Copy, UserPlus } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import { getVerificationUrl, generateVCard, downloadVCard } from "@/lib/qrCode";

interface ProfileOverviewTabProps {
  profile: any;
  userId: string;
}

/* ── Simple SVG barcode from a string value ── */
function SimpleBarcode({ value, height = 50 }: { value: string; height?: number }) {
  const bars: number[] = [];
  bars.push(1, 1, 0, 1, 1, 0);
  for (const char of value) {
    const code = char.charCodeAt(0);
    for (let i = 7; i >= 0; i--) {
      bars.push((code >> i) & 1);
    }
    bars.push(0);
  }
  bars.push(0, 1, 1, 0, 1, 1);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        viewBox={`0 0 ${bars.length} ${height}`}
        className="w-full max-w-[200px]"
        height={height}
        preserveAspectRatio="none"
      >
        {bars.map((bar, i) =>
          bar ? (
            <rect key={i} x={i} y={0} width={0.7} height={height} fill="hsl(36, 60%, 35%)" fillOpacity={0.85} />
          ) : null
        )}
      </svg>
      <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
        {value}
      </span>
    </div>
  );
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

/* ── Main Component ── */
export function ProfileOverviewTab({ profile, userId }: ProfileOverviewTabProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";
  const { data: qrCode } = useEntityQRCode("user", profile?.username || undefined, "account");
  const verificationUrl = qrCode ? getVerificationUrl(qrCode.code) : "";

  const verificationDigits = qrCode ? qrCode.code.slice(-4) : "";

  const handleCopyCode = () => {
    if (!verificationDigits) return;
    navigator.clipboard.writeText(verificationDigits);
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
      profileUrl: profile.username ? `https://altohaacom.lovable.app/${profile.username}` : undefined,
    });
    downloadVCard(vcard, (profile.full_name || "contact").replace(/\s+/g, "_"));
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

      {/* ══════ Premium Golden Identity Card ══════ */}
      {qrCode && (
        <section>
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-primary/5 shadow-lg">
            {/* Decorative gold corner accents */}
            <div className="absolute top-0 left-0 h-20 w-20 border-t-2 border-l-2 border-primary/30 rounded-tl-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 h-20 w-20 border-b-2 border-r-2 border-primary/30 rounded-br-2xl pointer-events-none" />

            {/* Card Content */}
            <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10">
              {/* Header: Logo + Title */}
              <div className="flex items-center justify-between mb-8">
                <img
                  src="/altohaa-logo.png"
                  alt="Altohaa"
                  className="h-12 sm:h-14 object-contain"
                />
                <span className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-primary/70">
                  {isAr ? "بطاقة التحقق" : "Verification Card"}
                </span>
              </div>

              {/* Center: Avatar + QR side by side */}
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 mb-8">
                {/* Avatar + Name */}
                <div className="flex flex-col items-center gap-3 min-w-[140px]">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || ""}
                      className="h-24 w-24 rounded-2xl object-cover ring-2 ring-primary/30 shadow-md"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <span className="text-3xl font-bold text-primary/50">
                        {(profile?.full_name || "?")[0]}
                      </span>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="font-semibold text-sm text-foreground leading-tight">
                      {isAr ? (profile?.full_name_ar || profile?.full_name) : profile?.full_name}
                    </p>
                    {profile?.account_number && (
                      <p className="font-mono text-[10px] text-muted-foreground mt-0.5 tracking-wider">
                        {profile.account_number}
                      </p>
                    )}
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-xl border border-primary/15 bg-background p-3 shadow-sm">
                    <QRCodeSVG
                      id={`qr-${qrCode.code}`}
                      value={verificationUrl}
                      size={130}
                      level="M"
                      includeMargin
                      fgColor="hsl(36, 60%, 35%)"
                    />
                  </div>
                  {/* 4-Digit Verification Code */}
                  <div className="flex items-center gap-1.5">
                    {verificationDigits.split("").map((digit, i) => (
                      <span
                        key={i}
                        className="inline-flex h-9 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 font-mono text-lg font-bold text-primary tracking-wide"
                      >
                        {digit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Barcode */}
              <div className="mb-6">
                <SimpleBarcode value={profile?.account_number || qrCode.code} />
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mb-5" />

              {/* Actions */}
              <div className="flex flex-wrap justify-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs border-primary/20 hover:bg-primary/5"
                  onClick={handleCopyCode}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {isAr ? "نسخ الكود" : "Copy Code"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs border-primary/20 hover:bg-primary/5"
                  onClick={handleSaveContact}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {isAr ? "حفظ جهة اتصال" : "Save Contact"}
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
