import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, User, Camera, FileText, Briefcase, Globe, AtSign } from "lucide-react";

/**
 * Compact profile completion card that encourages users
 * to finish setting up their profile.
 */
export function ProfileCompletionCard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["profile-completion", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, bio, specialization, country_code, username, profile_completed")
        .eq("user_id", user.id)
        .single();
      if (!profile) return null;

      const fields = [
        { key: "full_name", filled: !!profile.full_name, icon: User },
        { key: "avatar", filled: !!profile.avatar_url, icon: Camera },
        { key: "bio", filled: !!profile.bio, icon: FileText },
        { key: "specialization", filled: !!profile.specialization, icon: Briefcase },
        { key: "country", filled: !!profile.country_code, icon: Globe },
        { key: "username", filled: !!profile.username, icon: AtSign },
      ];
      const filled = fields.filter(f => f.filled).length;
      const percent = Math.round((filled / fields.length) * 100);
      const missing = fields.filter(f => !f.filled);

      return { ...profile, percent, missing, filled, total: fields.length };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });

  if (!data || data.percent === 100) return null;

  const missingLabels: Record<string, { en: string; ar: string }> = {
    full_name: { en: "Full name", ar: "الاسم الكامل" },
    avatar: { en: "Profile photo", ar: "صورة الملف" },
    bio: { en: "Bio", ar: "النبذة" },
    specialization: { en: "Specialization", ar: "التخصص" },
    country: { en: "Country", ar: "البلد" },
    username: { en: "Username", ar: "اسم المستخدم" },
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-primary/15 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/25">
      <CardContent className="relative p-4 sm:p-5">
        {/* Decorative gradient */}
        <div className="pointer-events-none absolute -end-10 -top-10 h-28 w-28 rounded-full bg-primary/8 blur-[40px]" />

        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-sm font-bold">
                {isAr ? "أكمل ملفك الشخصي" : "Complete Your Profile"}
              </p>
            </div>
            <Badge variant="secondary" className="text-[10px] font-bold tabular-nums rounded-lg px-2 py-0.5">
              {data.filled}/{data.total}
            </Badge>
          </div>

          <div className="space-y-1.5 mb-3">
            <Progress value={data.percent} className="h-2 rounded-full" />
            <p className="text-[10px] text-muted-foreground font-medium text-end tabular-nums">{data.percent}%</p>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {data.missing.slice(0, 3).map(({ key, icon: Icon }) => (
              <span key={key} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/40 rounded-lg px-2 py-1 border border-border/20">
                <Icon className="h-2.5 w-2.5" />
                {isAr ? missingLabels[key]?.ar : missingLabels[key]?.en}
              </span>
            ))}
            {data.missing.length > 3 && (
              <span className="text-[10px] text-muted-foreground bg-muted/40 rounded-lg px-2 py-1 border border-border/20">
                +{data.missing.length - 3}
              </span>
            )}
          </div>

          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors group/link"
          >
            {isAr ? "إكمال الملف" : "Complete now"}
            <ArrowRight className="h-3 w-3 rtl:rotate-180 transition-transform group-hover/link:translate-x-0.5 rtl:group-hover/link:-translate-x-0.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
