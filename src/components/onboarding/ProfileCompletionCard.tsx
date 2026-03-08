import { memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Camera, FileText, MapPin, Briefcase, Globe, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const FIELDS = [
  { key: "avatar", labelEn: "Photo", labelAr: "صورة", icon: Camera, check: (p: any) => !!p?.avatar_url },
  { key: "bio", labelEn: "Bio", labelAr: "نبذة", icon: FileText, check: (p: any) => !!p?.bio && p.bio.length > 10 },
  { key: "location", labelEn: "Location", labelAr: "الموقع", icon: MapPin, check: (p: any) => !!p?.location || !!p?.country_code },
  { key: "specialization", labelEn: "Specialty", labelAr: "التخصص", icon: Briefcase, check: (p: any) => !!p?.specialization || !!p?.job_title },
  { key: "social", labelEn: "Social", labelAr: "التواصل", icon: Globe, check: (p: any) => !!p?.instagram || !!p?.twitter || !!p?.linkedin },
];

export function ProfileCompletionCard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: profile } = useQuery({
    queryKey: ["profile-completion", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, bio, location, country_code, specialization, job_title, instagram, twitter, linkedin, profile_completed")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
    staleTime: 60000,
  });

  if (!user || !profile || profile.profile_completed) return null;

  const completed = FIELDS.filter((f) => f.check(profile)).length;
  const percent = Math.round((completed / FIELDS.length) * 100);
  
  if (percent === 100) return null;

  const nextIncomplete = FIELDS.find((f) => !f.check(profile));

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {isAr ? "اكتمال الملف" : "Profile Setup"}
          </h3>
          <span className="text-sm font-bold text-primary">{percent}%</span>
        </div>
        <Progress value={percent} className="h-1.5 mb-3" />
        
        <div className="flex gap-1.5 mb-3">
          {FIELDS.map((field) => {
            const done = field.check(profile);
            return (
              <div
                key={field.key}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-xl transition-all",
                  done ? "bg-chart-3/10 text-chart-3" : "bg-muted text-muted-foreground"
                )}
                title={isAr ? field.labelAr : field.labelEn}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <field.icon className="h-3.5 w-3.5" />}
              </div>
            );
          })}
        </div>

        {nextIncomplete && (
          <Link to="/profile?tab=edit">
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-8">
              <nextIncomplete.icon className="h-3 w-3" />
              {isAr ? `أضف ${nextIncomplete.labelAr}` : `Add ${nextIncomplete.labelEn}`}
              <ArrowRight className="h-3 w-3 ms-auto" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
