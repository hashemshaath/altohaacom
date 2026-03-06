import { memo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, ArrowRight, Database, Users, Building2, Trophy } from "lucide-react";

interface EntityScore {
  label: string;
  labelAr: string;
  icon: React.ElementType;
  score: number;
  total: number;
  complete: number;
}

function computeCompleteness(records: any[], requiredFields: string[]): { complete: number; total: number; score: number } {
  if (!records.length) return { complete: 0, total: 0, score: 0 };
  let complete = 0;
  for (const r of records) {
    const filled = requiredFields.filter(f => r[f] != null && r[f] !== "").length;
    if (filled >= requiredFields.length * 0.8) complete++;
  }
  return { complete, total: records.length, score: Math.round((complete / records.length) * 100) };
}

export const DataQualityDashboardWidget = memo(function DataQualityDashboardWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: scores } = useQuery({
    queryKey: ["data-quality-widget"],
    queryFn: async () => {
      const [{ data: orgs }, { data: companies }, { data: profiles }, { data: competitions }] = await Promise.allSettled([
        supabase.from("organizers").select("name, name_ar, email, phone, website, city, country, description").limit(500),
        supabase.from("companies").select("name, name_ar, email, phone, website, city, country, description").limit(500),
        supabase.from("profiles").select("full_name, email, phone, country, city, avatar_url, bio").limit(500),
        supabase.from("competitions").select("title, title_ar, description, country_code, city, venue, competition_start").limit(500),
      ]).then(results => results.map(r => r.status === "fulfilled" ? r.value : { data: [] }));

      const entities: EntityScore[] = [
        {
          label: "Organizers", labelAr: "المنظمون", icon: Building2,
          ...computeCompleteness(orgs || [], ["name", "name_ar", "email", "phone", "website", "city", "country", "description"]),
        },
        {
          label: "Companies", labelAr: "الشركات", icon: Database,
          ...computeCompleteness(companies || [], ["name", "name_ar", "email", "phone", "website", "city", "country", "description"]),
        },
        {
          label: "Profiles", labelAr: "المستخدمون", icon: Users,
          ...computeCompleteness(profiles || [], ["full_name", "email", "phone", "country", "city", "avatar_url", "bio"]),
        },
        {
          label: "Competitions", labelAr: "المسابقات", icon: Trophy,
          ...computeCompleteness(competitions || [], ["title", "title_ar", "description", "country_code", "city", "venue", "competition_start"]),
        },
      ];

      const overallScore = entities.length
        ? Math.round(entities.reduce((s, e) => s + e.score, 0) / entities.length)
        : 0;

      return { entities, overallScore };
    },
    staleTime: 120_000,
  });

  const overall = scores?.overallScore ?? 0;
  const color = overall >= 75 ? "text-chart-3" : overall >= 50 ? "text-chart-2" : "text-destructive";
  const OverallIcon = overall >= 75 ? ShieldCheck : ShieldAlert;

  return (
    <Card className="rounded-2xl border-border/40">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <OverallIcon className={`h-4.5 w-4.5 ${color}`} />
          </div>
          <div>
            <CardTitle className="text-base">{isAr ? "جودة البيانات" : "Data Quality"}</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {isAr ? "اكتمال البيانات عبر الكيانات" : "Entity completeness tracking"}
            </CardDescription>
          </div>
        </div>
        <Badge variant="outline" className={`text-sm font-bold ${color}`}>
          {overall}%
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{isAr ? "الجودة الإجمالية" : "Overall Quality"}</span>
            <span className={`font-bold ${color}`}>{overall}%</span>
          </div>
          <Progress value={overall} className="h-2" />
        </div>

        {/* Per entity */}
        <div className="space-y-2">
          {scores?.entities?.map((e) => {
            const eColor = e.score >= 75 ? "text-chart-3" : e.score >= 50 ? "text-chart-2" : "text-destructive";
            const Icon = e.icon;
            return (
              <div key={e.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs flex-1 truncate">{isAr ? e.labelAr : e.label}</span>
                <span className={`text-[10px] font-bold ${eColor}`}>{e.score}%</span>
                <Badge variant="secondary" className="text-[9px]">{e.complete}/{e.total}</Badge>
              </div>
            );
          })}
        </div>

        <Button variant="outline" size="sm" className="w-full gap-1.5" asChild>
          <Link to="/admin/smart-import">
            {isAr ? "تحسين البيانات" : "Improve Data"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
});
