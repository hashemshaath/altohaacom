import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, Globe, Instagram, Twitter, Facebook, Linkedin, Youtube, Users, UserCheck } from "lucide-react";
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
    { value: followStats?.followers || 0, label: isAr ? "متابعون" : "Followers", onClick: () => onFollowClick("followers"), icon: Users },
    { value: followStats?.following || 0, label: isAr ? "يتابع" : "Following", onClick: () => onFollowClick("following"), icon: UserCheck },
    ...(profile.years_of_experience > 0 ? [{ value: `${profile.years_of_experience}+`, label: isAr ? "سنوات خبرة" : "Years Exp." }] : []),
    { value: profile.view_count || 0, label: isAr ? "زيارة" : "Views", icon: Eye },
  ];

  return (
    <Card className="rounded-2xl border-border/30 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row items-center justify-between px-2 sm:px-4 py-2.5 gap-2">
          <div className="flex flex-wrap justify-center sm:justify-start gap-0 sm:gap-1">
            {stats.map((stat, i) => (
              <button
                key={i}
                onClick={(stat as any).onClick}
                className={`flex flex-col items-center px-2.5 sm:px-4 py-1.5 rounded-xl transition-all duration-200 min-w-[60px] ${(stat as any).onClick ? "hover:bg-primary/5 hover:text-primary cursor-pointer active:scale-95" : "cursor-default"}`}
              >
                <span className="text-sm sm:text-base md:text-lg font-bold tabular-nums leading-tight">{typeof stat.value === 'number' ? toEnglishDigits(stat.value) : stat.value}</span>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 whitespace-nowrap">
                  {stat.label}
                </span>
              </button>
            ))}
          </div>

          {isVisible("social") && socialLinks.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-8 bg-border/30 hidden sm:block" />
              <Separator className="bg-border/30 sm:hidden w-16" />
              <div className="flex gap-0.5">
                {socialLinks.map((link) => {
                  const Icon = SOCIAL_ICONS[link.key] || Globe;
                  return (
                    <Button key={link.key} variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors touch-manipulation" asChild>
                      <a href={link.value?.startsWith("http") ? link.value : `https://${link.value}`} target="_blank" rel="noopener noreferrer" title={link.label}>
                        <Icon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      </a>
                    </Button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
