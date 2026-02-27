import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Star, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";

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
        { key: "full_name", filled: !!profile.full_name },
        { key: "avatar", filled: !!profile.avatar_url },
        { key: "bio", filled: !!profile.bio },
        { key: "specialization", filled: !!profile.specialization },
        { key: "country", filled: !!profile.country_code },
        { key: "username", filled: !!profile.username },
      ];
      const filled = fields.filter(f => f.filled).length;
      const percent = Math.round((filled / fields.length) * 100);
      const missing = fields.filter(f => !f.filled).map(f => f.key);

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
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold">
            {isAr ? "أكمل ملفك الشخصي" : "Complete Your Profile"}
          </p>
          <Badge variant="secondary" className="text-[10px]">
            {data.percent}%
          </Badge>
        </div>
        <Progress value={data.percent} className="h-1.5 mb-2" />
        <div className="flex flex-wrap gap-1 mb-2">
          {data.missing.slice(0, 3).map(key => (
            <span key={key} className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
              {isAr ? missingLabels[key]?.ar : missingLabels[key]?.en}
            </span>
          ))}
        </div>
        <Link
          to="/profile"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {isAr ? "إكمال الملف" : "Complete now"}
          <ArrowRight className="h-3 w-3 rtl:rotate-180" />
        </Link>
      </CardContent>
    </Card>
  );
}
