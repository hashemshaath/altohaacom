import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserCircle, CheckCircle, Image, FileText, MapPin, Briefcase, Trophy, Star } from "lucide-react";

export function ProfileCompletenessWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["profile-completeness-widget"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles")
        .select("avatar_url, bio, country_code, city, full_name, account_type, is_verified, specialization")
        .limit(500);

      const total = profiles?.length || 0;
      const withAvatar = profiles?.filter(p => p.avatar_url).length || 0;
      const withBio = profiles?.filter(p => p.bio).length || 0;
      const withLocation = profiles?.filter(p => p.country_code || p.city).length || 0;
      const withSpecialty = profiles?.filter(p => p.specialization).length || 0;
      const verified = profiles?.filter(p => p.is_verified).length || 0;

      // Account types distribution
      const typeCounts: Record<string, number> = {};
      profiles?.forEach(p => {
        const t = p.account_type || "professional";
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      });

      // Completeness score: each field = 20%
      const avgCompleteness = total > 0
        ? Math.round(((withAvatar + withBio + withLocation + withSpecialty + verified) / (total * 5)) * 100)
        : 0;

      return {
        total, withAvatar, withBio, withLocation, withSpecialty, verified,
        typeCounts, avgCompleteness,
        avatarRate: total > 0 ? Math.round((withAvatar / total) * 100) : 0,
      };
    },
    staleTime: 60000,
  });

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-chart-2" />
            {isAr ? "اكتمال الملفات الشخصية" : "Profile Completeness"}
          </CardTitle>
          <Badge variant="outline" className="text-[9px]">{data.total} {isAr ? "ملف" : "profiles"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { icon: Image, label: isAr ? "صورة شخصية" : "Avatar", value: `${data.avatarRate}%`, sub: `${data.withAvatar} / ${data.total}`, color: "text-chart-1" },
            { icon: FileText, label: isAr ? "نبذة" : "Bio", value: data.withBio, color: "text-chart-3" },
            { icon: MapPin, label: isAr ? "الموقع" : "Location", value: data.withLocation, color: "text-chart-4" },
            { icon: CheckCircle, label: isAr ? "موثّق" : "Verified", value: data.verified, color: "text-chart-2" },
          ].map((m, i) => (
            <div key={i} className="p-2 rounded-xl bg-muted/30 border border-border/40">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon className={`h-3 w-3 ${m.color}`} />
                <span className="text-[9px] text-muted-foreground">{m.label}</span>
              </div>
              <p className="text-base font-bold">{m.value}</p>
              {m.sub && <p className="text-[8px] text-muted-foreground">{m.sub}</p>}
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">{isAr ? "متوسط الاكتمال" : "Avg Completeness"}</span>
            <span className="text-[10px] font-medium">{data.avgCompleteness}%</span>
          </div>
          <Progress value={data.avgCompleteness} className="h-1.5" />
        </div>

        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="flex items-center gap-1 text-chart-5"><Briefcase className="h-3 w-3" /> {data.withSpecialty} {isAr ? "تخصص" : "specialty"}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {Object.entries(data.typeCounts).map(([type, count]) => (
            <Badge key={type} variant="outline" className="text-[8px] gap-0.5">
              {type}: {count}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
