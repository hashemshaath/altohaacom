import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { countryFlag } from "@/lib/countryFlag";
import { toEnglishDigits } from "@/lib/formatNumber";
import { Calendar, Earth, Globe, Mail, Shield, ExternalLink, Sparkles } from "lucide-react";
import { FeatureGateForUser } from "@/components/membership/FeatureGate";

interface Props {
  profile: any;
  qrCode: any;
  isAr: boolean;
  isVisible: (s: string) => boolean;
  getCountryName: (code: string | null) => string | null;
  profileUrl: string;
  t: (key: string) => string;
}

export const PublicProfileSidebar = memo(function PublicProfileSidebar({ profile, qrCode, isAr, isVisible, getCountryName, profileUrl, t }: Props) {
  return (
    <div className="space-y-4">
      {/* Contact Card */}
      <Card className="rounded-2xl border-border/30 bg-card/90 overflow-hidden group hover:shadow-lg hover:shadow-primary/5 transition-all duration-500">
        <div className="h-1 bg-gradient-to-r from-primary/60 via-primary/30 to-chart-3/40" />
        <CardContent className="p-4 space-y-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-primary" />
            {isAr ? "التواصل" : "Contact"}
          </h3>

          <div className="space-y-2">
            {isVisible("contact") && profile.email && (
              <Button variant="outline" size="sm" className="w-full gap-2 justify-start text-xs h-9 rounded-xl border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group/btn" asChild>
                <a href={`mailto:${profile.email}`}>
                  <Mail className="h-3 w-3 text-primary shrink-0" />
                  <span className="truncate">{profile.email}</span>
                  <ExternalLink className="h-2.5 w-2.5 ms-auto opacity-0 group-hover/btn:opacity-60 transition-opacity" />
                </a>
              </Button>
            )}
            {isVisible("contact") && profile.website && (
              <Button variant="outline" size="sm" className="w-full gap-2 justify-start text-xs h-9 rounded-xl border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group/btn" asChild>
                <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-3 w-3 text-primary shrink-0" />
                  <span className="truncate">{profile.website.replace(/^https?:\/\//, "")}</span>
                  <ExternalLink className="h-2.5 w-2.5 ms-auto opacity-0 group-hover/btn:opacity-60 transition-opacity" />
                </a>
              </Button>
            )}
          </div>

          {profile.nationality && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-xl px-3 py-2 border border-border/15">
              <Earth className="h-3.5 w-3.5 text-primary/60 shrink-0" />
              <span>{countryFlag(profile.nationality)} {getCountryName(profile.nationality)}</span>
              <Badge variant="outline" className="text-[8px] h-4 ms-auto border-border/30">{isAr ? "الجنسية" : "Nationality"}</Badge>
            </div>
          )}

          <Separator className="bg-border/15" />
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3 text-primary/50 shrink-0" />
              <span>{t("memberSince")}: {toEnglishDigits(new Date(profile.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "long" }))}</span>
            </div>
            {profile.account_number && (
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                <Badge variant="outline" className="font-mono text-[9px] border-border/30 tabular-nums">{profile.account_number}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Membership Tier Badge */}
      {profile.membership_tier && profile.membership_tier !== "basic" && (
        <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 to-chart-3/5 overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all duration-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">{isAr ? "عضوية مميزة" : "Premium Member"}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "استمتع بمزايا حصرية" : "Enjoy exclusive benefits"}</p>
            </div>
            <Badge className="bg-primary text-primary-foreground text-[10px] rounded-xl">
              {profile.membership_tier === "professional" ? "Pro" : profile.membership_tier}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* QR Code */}
      <FeatureGateForUser feature="feature_qr_code" userId={profile?.user_id}>
        {qrCode && (
          <Card className="rounded-2xl border-border/30 bg-card/90 overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 group">
            <CardContent className="p-4 flex flex-col items-center">
              <div className="transition-transform duration-500 group-hover:scale-[1.02]">
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
              </div>
            </CardContent>
          </Card>
        )}
      </FeatureGateForUser>
    </div>
  );
}
