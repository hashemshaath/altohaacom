import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCareerTimeline } from "@/components/admin/UserCareerTimeline";
import { UserBadgesDisplay } from "@/components/badges/UserBadgesDisplay";
import { IdentityCard } from "@/components/profile/IdentityCard";
import { UserCompetitionStats } from "@/components/profile/UserCompetitionStats";
import { FileText, Globe } from "lucide-react";
import { StaggeredList } from "@/components/ui/staggered-list";

interface ProfileOverviewTabProps {
  profile: any;
  userId: string;
}

function SectionTitle({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <h3 className="flex items-center gap-2.5 text-base font-semibold mb-3">
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </h3>
  );
}

export function ProfileOverviewTab({ profile, userId }: ProfileOverviewTabProps) {
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
    <StaggeredList className="space-y-8" stagger={80}>
      {/* Bio */}
      {(profile?.bio || profile?.bio_ar) && (
        <section>
          <SectionTitle icon={FileText} label={isAr ? "النبذة" : "About"} />
          <Card>
            <CardContent className="py-5">
              <p className="text-[15px] leading-7 whitespace-pre-wrap text-foreground/90" dir={isAr && profile?.bio_ar ? "rtl" : "ltr"}>
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

      {/* Competition Stats */}
      <section>
        <UserCompetitionStats userId={userId} />
      </section>

      {/* Badges */}
      <section>
        <UserBadgesDisplay userId={userId} />
      </section>

      {/* Social Links */}
      {socialLinks.length > 0 && (
        <section>
          <SectionTitle icon={Globe} label={isAr ? "التواصل" : "Links"} />
          <Card>
            <CardContent className="py-5">
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((link) => {
                  const url = link.value?.startsWith("http") ? link.value : `https://${link.value}`;
                  return (
                    <a
                      key={link.key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5 text-xs transition-colors hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
                    >
                      <span className="font-semibold">{link.label}</span>
                      <span className="text-muted-foreground" dir="ltr">{link.value}</span>
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Identity Card */}
      <IdentityCard profile={profile} userId={userId} />
    </StaggeredList>
  );
}
