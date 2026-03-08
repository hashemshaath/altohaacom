import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Building2, Shield, Users, Search, Check, Gavel, Globe } from "lucide-react";
import { useState } from "react";

interface SupervisingBodiesStepProps {
  supervisingBodyIds: string[];
  judgeIds: string[];
  onSupervisingChange: (ids: string[]) => void;
  onJudgesChange: (ids: string[]) => void;
}

export const SupervisingBodiesStep = memo(function SupervisingBodiesStep({
  supervisingBodyIds,
  judgeIds,
  onSupervisingChange,
  onJudgesChange,
}: SupervisingBodiesStepProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [entitySearch, setEntitySearch] = useState("");
  const [judgeSearch, setJudgeSearch] = useState("");

  // Fetch entities
  const { data: entities } = useQuery({
    queryKey: ["entities-for-wizard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("culinary_entities")
        .select("id, name, name_ar, type, scope, logo_url, country, city, abbreviation, abbreviation_ar")
        .eq("status", "active")
        .eq("is_visible", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch judges
  const { data: judges } = useQuery({
    queryKey: ["judges-for-wizard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("judge_profiles")
        .select("user_id, culinary_specialties, years_of_experience, judge_level, judge_category, full_name_ar, profile_photo_url, nationality")
      if (error) throw error;
      return data;
    },
  });

  const filteredEntities = entities?.filter((e) => {
    if (!entitySearch) return true;
    const q = entitySearch.toLowerCase();
    return e.name.toLowerCase().includes(q) || e.name_ar?.toLowerCase().includes(q) || e.abbreviation?.toLowerCase().includes(q);
  });

  const filteredJudges = judges?.filter((j) => {
    if (!judgeSearch) return true;
    const q = judgeSearch.toLowerCase();
    return j.full_name_ar?.toLowerCase().includes(q) || j.culinary_specialties?.some(s => s.toLowerCase().includes(q)) || j.judge_category?.toLowerCase().includes(q);
  });

  const toggleEntity = (id: string) => {
    if (supervisingBodyIds.includes(id)) {
      onSupervisingChange(supervisingBodyIds.filter((x) => x !== id));
    } else {
      onSupervisingChange([...supervisingBodyIds, id]);
    }
  };

  const toggleJudge = (userId: string) => {
    if (judgeIds.includes(userId)) {
      onJudgesChange(judgeIds.filter((x) => x !== userId));
    } else {
      onJudgesChange([...judgeIds, userId]);
    }
  };

  const entityTypeLabels: Record<string, { en: string; ar: string }> = {
    culinary_association: { en: "Association", ar: "جمعية" },
    government_entity: { en: "Government", ar: "حكومية" },
    private_association: { en: "Private", ar: "خاصة" },
    culinary_academy: { en: "Academy", ar: "أكاديمية" },
    industry_body: { en: "Industry", ar: "صناعية" },
  };

  return (
    <div className="space-y-6">
      {/* Supervising Bodies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {isAr ? "الجهات المشرفة والمعتمدة" : "Supervising & Sanctioning Bodies"}
          </CardTitle>
          <CardDescription>
            {isAr
              ? "اختر الجهات المشرفة على المسابقة مثل الجمعيات والمنظمات الحكومية"
              : "Select supervising organizations such as culinary associations and government bodies"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "بحث في الجهات..." : "Search entities..."}
              value={entitySearch}
              onChange={(e) => setEntitySearch(e.target.value)}
              className="ps-10"
            />
          </div>

          {supervisingBodyIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {supervisingBodyIds.map((id) => {
                const entity = entities?.find((e) => e.id === id);
                return (
                  <Badge key={id} variant="default" className="gap-1 cursor-pointer" onClick={() => toggleEntity(id)}>
                    {entity ? (isAr && entity.name_ar ? entity.name_ar : entity.name) : id}
                    <span className="text-primary-foreground/60">×</span>
                  </Badge>
                );
              })}
            </div>
          )}

          <div className="grid gap-2 max-h-[280px] overflow-y-auto">
            {filteredEntities?.map((entity) => {
              const isSelected = supervisingBodyIds.includes(entity.id);
              return (
                <button
                  key={entity.id}
                  type="button"
                  onClick={() => toggleEntity(entity.id)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-start transition-all ${
                    isSelected ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/30"
                  }`}
                >
                  {entity.logo_url ? (
                    <img src={entity.logo_url} alt="" className="h-9 w-9 rounded-xl object-cover shrink-0" loading="lazy" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted shrink-0">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {isAr && entity.name_ar ? entity.name_ar : entity.name}
                      {entity.abbreviation && (
                        <span className="text-muted-foreground"> ({isAr && entity.abbreviation_ar ? entity.abbreviation_ar : entity.abbreviation})</span>
                      )}
                    </p>
                    <div className="flex gap-2 text-[10px] text-muted-foreground">
                      <span>{isAr ? entityTypeLabels[entity.type]?.ar : entityTypeLabels[entity.type]?.en}</span>
                      {entity.country && <span>· {entity.country}</span>}
                      <span>· {entity.scope}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Judges Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-primary" />
            {isAr ? "لجنة التحكيم" : "Judging Panel"}
          </CardTitle>
          <CardDescription>
            {isAr
              ? "اختر الحكام من القائمة المسجلة. يمكن إرسال دعوات لاحقاً"
              : "Select judges from the registered list. Invitations can be sent later"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "بحث في الحكام..." : "Search judges..."}
              value={judgeSearch}
              onChange={(e) => setJudgeSearch(e.target.value)}
              className="ps-10"
            />
          </div>

          {judgeIds.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {isAr ? `${judgeIds.length} حكام مختارين` : `${judgeIds.length} judges selected`}
            </div>
          )}

          <div className="grid gap-2 max-h-[280px] overflow-y-auto">
            {filteredJudges?.map((judge) => {
              const isSelected = judgeIds.includes(judge.user_id);
              const specialties = judge.culinary_specialties?.join(", ") || "—";
              return (
                <button
                  key={judge.user_id}
                  type="button"
                  onClick={() => toggleJudge(judge.user_id)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-start transition-all ${
                    isSelected ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/30"
                  }`}
                >
                  {judge.profile_photo_url ? (
                    <img src={judge.profile_photo_url} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" loading="lazy" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted shrink-0">
                      <Gavel className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {judge.full_name_ar || judge.judge_category || "—"}
                    </p>
                    <div className="flex gap-2 text-[10px] text-muted-foreground">
                      <span>{specialties}</span>
                      <span>· {judge.years_of_experience || 0} {isAr ? "سنوات" : "yrs"}</span>
                      <span>· {judge.judge_level || "national"}</span>
                      {judge.nationality && <span>· {judge.nationality}</span>}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
