import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toEnglishDigits } from "@/lib/formatNumber";
import {
  Users, Globe, Briefcase, Trophy, BookOpen, Calendar, GraduationCap,
  Award, Shield, MapPin, Hash, Clock
} from "lucide-react";

interface Props {
  entity: {
    type: string;
    member_count?: number | null;
    founded_year?: number | null;
    country?: string | null;
    city?: string | null;
    registration_number?: string | null;
    license_number?: string | null;
    website?: string | null;
    is_verified?: boolean;
    verification_level?: string | null;
  };
  followerCount: number;
  counts?: {
    competitions: number;
    programs: number;
    events: number;
    positions: number;
    memberships: number;
  };
}

const educationalTypes = ["culinary_academy", "university", "college", "training_center"];

export function EntityOverviewCard({ entity, followerCount, counts }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const isEdu = educationalTypes.includes(entity.type);

  const metrics = [
    {
      icon: Users,
      value: followerCount,
      label: isAr ? "متابعون" : "Followers",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: isEdu ? GraduationCap : Users,
      value: entity.member_count || counts?.memberships || 0,
      label: isAr ? (isEdu ? "طلاب مسجلون" : "أعضاء مسجلون") : (isEdu ? "Enrolled Students" : "Registered Members"),
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      icon: Briefcase,
      value: counts?.positions || 0,
      label: isAr ? "فريق العمل" : "Team Members",
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    {
      icon: Trophy,
      value: counts?.competitions || 0,
      label: isAr ? "مسابقات" : "Competitions",
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
    },
    {
      icon: BookOpen,
      value: counts?.programs || 0,
      label: isAr ? "برامج" : "Programs",
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      icon: Calendar,
      value: counts?.events || 0,
      label: isAr ? "فعاليات" : "Events",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-primary/10">
            <Award className="h-3.5 w-3.5 text-primary" />
          </div>
          {isAr ? "نظرة عامة" : "At a Glance"}
        </h3>
      </div>
      <CardContent className="p-0">
        {/* Key metrics grid */}
        <div className="grid grid-cols-3 divide-x divide-y divide-border/50 rtl:divide-x-reverse">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5 p-3 text-center transition-colors hover:bg-muted/30">
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${m.bgColor}`}>
                  <Icon className={`h-4 w-4 ${m.color}`} />
                </div>
                <p className="text-lg font-bold leading-none">{toEnglishDigits(String(m.value))}</p>
                <p className="text-[9px] leading-tight text-muted-foreground">{m.label}</p>
              </div>
            );
          })}
        </div>

        {/* Verification & info strip */}
        <div className="border-t bg-muted/20 px-4 py-3 space-y-2">
          {entity.is_verified && (
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-chart-3" />
              <span className="text-xs font-medium text-chart-3">
                {isAr ? "جهة موثقة" : "Verified Organization"}
              </span>
              {entity.verification_level && (
                <Badge variant="secondary" className="text-[9px] h-4">
                  {entity.verification_level}
                </Badge>
              )}
            </div>
          )}
          {entity.founded_year && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{isAr ? "تأسست عام" : "Est."} {toEnglishDigits(String(entity.founded_year))}</span>
              <span className="text-muted-foreground/50">
                ({new Date().getFullYear() - entity.founded_year} {isAr ? "سنة" : "years"})
              </span>
            </div>
          )}
          {(entity.city || entity.country) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{entity.city}{entity.country ? `, ${entity.country}` : ""}</span>
            </div>
          )}
          {entity.registration_number && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Hash className="h-3 w-3" />
              <span className="font-mono">{entity.registration_number}</span>
            </div>
          )}
          {entity.website && (
            <div className="flex items-center gap-2 text-xs">
              <Globe className="h-3 w-3 text-primary" />
              <a href={entity.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                {entity.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
