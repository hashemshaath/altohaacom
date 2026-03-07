import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { UserCareerTimeline } from "@/components/admin/UserCareerTimeline";
import { UserBadgesDisplay } from "@/components/badges/UserBadgesDisplay";
import { FeatureGateForUser } from "@/components/membership/FeatureGate";

import { ProfileActivityTimeline } from "@/components/profile/ProfileActivityTimeline";
import { FileText, Globe } from "lucide-react";
import { StaggeredList } from "@/components/ui/staggered-list";

interface ProfileOverviewTabProps {
  profile: any;
  userId: string;
}

function SectionTitle({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <h3 className="flex items-center gap-2.5 text-sm font-bold mb-3.5 uppercase tracking-wider text-muted-foreground">
      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 shadow-sm">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      {label}
      <div className="flex-1 h-px bg-border/40 ms-2" />
    </h3>
  );
}

export const ProfileOverviewTab = memo(function ProfileOverviewTab({ profile, userId }: ProfileOverviewTabProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

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
    <StaggeredList className="space-y-6" stagger={60}>
      {/* Bio */}
      {(profile?.bio || profile?.bio_ar) && (
        <section>
          <SectionTitle icon={FileText} label={isAr ? "النبذة" : "About"} />
          <Card className="border-border/30 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl bg-card/80 backdrop-blur-sm">
            <CardContent className="py-5 px-6">
              <p className="text-[15px] leading-[1.85] whitespace-pre-wrap text-foreground/85 font-[350]" dir={isAr && profile?.bio_ar ? "rtl" : "ltr"}>
                {isAr ? (profile?.bio_ar || profile?.bio) : profile?.bio}
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Career Timeline */}
      <section>
        <UserCareerTimeline userId={userId} isAr={isAr} />
      </section>

      {/* Badges */}
      <FeatureGateForUser feature="feature_custom_badges" userId={userId}>
        <section>
          <UserBadgesDisplay userId={userId} />
        </section>
      </FeatureGateForUser>

      {/* Recent Activity */}
      <section>
        <ProfileActivityTimeline userId={userId} />
      </section>

      {/* Social Links */}
      {socialLinks.length > 0 && (
        <section>
          <SectionTitle icon={Globe} label={isAr ? "التواصل" : "Links"} />
          <Card className="border-border/30 shadow-sm rounded-2xl bg-card/80 backdrop-blur-sm">
            <CardContent className="py-5 px-6">
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((link) => {
                  const url = link.value?.startsWith("http") ? link.value : `https://${link.value}`;
                  return (
                    <a
                      key={link.key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border/30 bg-muted/15 px-3.5 py-2 text-xs transition-all duration-200 hover:bg-primary/10 hover:border-primary/25 hover:text-primary hover:shadow-sm hover:-translate-y-0.5 active:scale-95"
                    >
                      <span className="font-bold">{link.label}</span>
                      <span className="text-muted-foreground/70" dir="ltr">{link.value}</span>
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </StaggeredList>
  );
}
