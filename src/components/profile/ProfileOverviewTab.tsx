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
function SimpleBarcode({ value, height = 48 }: { value: string; height?: number }) {
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
    <div className="flex flex-col items-center gap-1.5">
      <svg
        viewBox={`0 0 ${bars.length} ${height}`}
        className="w-full max-w-[220px]"
        height={height}
        preserveAspectRatio="none"
      >
        {bars.map((bar, i) =>
          bar ? (
            <rect key={i} x={i} y={0} width={0.7} height={height} className="fill-foreground" />
          ) : null
        )}
      </svg>
      <span className="font-mono text-[11px] tracking-[0.25em] text-muted-foreground">
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

  const handleCopyCode = () => {
    if (!qrCode) return;
    navigator.clipboard.writeText(qrCode.code.slice(-4));
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

      {/* ── Career Timeline (Education, Work, Memberships, Competitions, Awards) ── */}
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

      {/* ── QR Code · Barcode · Profile Image · Logo ── */}
      {qrCode && (
        <Card className="overflow-hidden">
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-5">
              {/* Profile Image */}
              {profile?.avatar_url && (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || ""}
                  className="h-20 w-20 rounded-2xl object-cover ring-2 ring-border shadow-md"
                />
              )}

              {/* Logo */}
              <img
                src="/altohaa-logo.png"
                alt="Altohaa"
                className="h-14 object-contain"
              />

              {/* QR Code */}
              <div className="rounded-xl border bg-background p-4 shadow-sm">
                <QRCodeSVG
                  id={`qr-${qrCode.code}`}
                  value={verificationUrl}
                  size={150}
                  level="M"
                  includeMargin
                />
              </div>

              {/* 4-digit Verification Code */}
              <Badge
                variant="outline"
                className="font-mono text-sm tracking-[0.3em] px-4 py-1.5"
              >
                {qrCode.code.slice(-4)}
              </Badge>

              {/* Barcode */}
              <SimpleBarcode value={profile?.account_number || qrCode.code} />

              {/* Actions */}
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={handleCopyCode}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {isAr ? "نسخ الكود" : "Copy Code"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={handleSaveContact}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {isAr ? "حفظ جهة اتصال" : "Save Contact"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
