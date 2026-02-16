import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Globe, Instagram, Twitter, Facebook, Linkedin, Youtube } from "lucide-react";
import { toEnglishDigits } from "@/lib/formatNumber";

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram, twitter: Twitter, facebook: Facebook,
  linkedin: Linkedin, youtube: Youtube, website: Globe,
};

interface Props {
  profile: any;
  followStats: any;
  socialLinks: { key: string; value: string | null; label: string }[];
  isAr: boolean;
  isVisible: (section: string) => boolean;
  onFollowClick: (type: "followers" | "following") => void;
}

export function PublicProfileStats({ profile, followStats, socialLinks, isAr, isVisible, onFollowClick }: Props) {
  const stats = [
    { value: followStats?.followers || 0, label: isAr ? "متابعون" : "Followers", onClick: () => onFollowClick("followers") },
    { value: followStats?.following || 0, label: isAr ? "يتابع" : "Following", onClick: () => onFollowClick("following") },
    ...(profile.years_of_experience > 0 ? [{ value: `${profile.years_of_experience}+`, label: isAr ? "سنوات خبرة" : "Years Exp." }] : []),
    { value: profile.view_count || 0, label: isAr ? "زيارة" : "Views", icon: Eye },
  ];

  return (
    <Card className="rounded-2xl border-border/40">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-4 py-3 flex-wrap gap-3" dir={isAr ? "rtl" : "ltr"}>
          <div className="flex gap-6 sm:gap-8">
            {stats.map((stat, i) => (
              <button
                key={i}
                onClick={(stat as any).onClick}
                className={`flex flex-col items-center transition-colors ${(stat as any).onClick ? "hover:text-primary cursor-pointer" : "cursor-default"}`}
              >
                <span className="text-lg sm:text-xl font-bold tabular-nums">{typeof stat.value === 'number' ? toEnglishDigits(stat.value) : stat.value}</span>
                <span className="text-[10px] sm:text-[11px] text-muted-foreground flex items-center gap-1">
                  {(stat as any).icon && <Eye className="h-3 w-3" />}
                  {stat.label}
                </span>
              </button>
            ))}
          </div>

          {isVisible("social") && socialLinks.length > 0 && (
            <div className="flex gap-0.5">
              {socialLinks.map((link) => {
                const Icon = SOCIAL_ICONS[link.key] || Globe;
                return (
                  <Button key={link.key} variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                    <a href={link.value?.startsWith("http") ? link.value : `https://${link.value}`} target="_blank" rel="noopener noreferrer" title={link.label}>
                      <Icon className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
