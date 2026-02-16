import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { countryFlag } from "@/lib/countryFlag";
import { toEnglishDigits } from "@/lib/formatNumber";
import { Calendar, Earth, Globe, Mail, Shield } from "lucide-react";

interface Props {
  profile: any;
  qrCode: any;
  isAr: boolean;
  isVisible: (s: string) => boolean;
  getCountryName: (code: string | null) => string | null;
  profileUrl: string;
  t: (key: string) => string;
}

export function PublicProfileSidebar({ profile, qrCode, isAr, isVisible, getCountryName, profileUrl, t }: Props) {
  return (
    <div className="space-y-4">
      {/* Contact Card */}
      <Card className="rounded-2xl border-border/30 bg-card/90">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-primary" />
            {isAr ? "التواصل" : "Contact"}
          </h3>
          {isVisible("contact") && profile.email && (
            <Button variant="outline" size="sm" className="w-full gap-2 justify-start text-xs h-8 rounded-xl border-border/30" asChild>
              <a href={`mailto:${profile.email}`}><Mail className="h-3 w-3 text-primary" />{profile.email}</a>
            </Button>
          )}
          {isVisible("contact") && profile.website && (
            <Button variant="outline" size="sm" className="w-full gap-2 justify-start text-xs h-8 rounded-xl border-border/30" asChild>
              <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer">
                <Globe className="h-3 w-3 text-primary" /><span className="truncate">{profile.website}</span>
              </a>
            </Button>
          )}

          {profile.nationality && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Earth className="h-3.5 w-3.5 text-primary/60" />
              {countryFlag(profile.nationality)} {getCountryName(profile.nationality)}
              <span className="text-[9px] text-muted-foreground/60">({isAr ? "الجنسية" : "Nationality"})</span>
            </div>
          )}

          <Separator className="bg-border/20" />
          
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3 text-primary/50" />
            {t("memberSince")}: {toEnglishDigits(new Date(profile.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "long" }))}
          </div>
          {profile.account_number && (
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-muted-foreground/40" />
              <Badge variant="outline" className="font-mono text-[9px] border-border/30">{profile.account_number}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code */}
      {qrCode && (
        <Card className="rounded-2xl border-border/30 bg-card/90">
          <CardContent className="p-4 flex flex-col items-center">
            <QRCodeDisplay
              code={qrCode.code}
              label={isAr ? "رمز QR" : "QR Code"}
              size={120}
              vCardData={{
                fullName: profile.full_name || "Unknown",
                phone: profile.phone || undefined,
                website: profile.website || undefined,
                location: profile.location || undefined,
                accountNumber: profile.account_number || undefined,
                profileUrl,
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
