import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftRight, User, ChefHat } from "lucide-react";

interface EntryComparisonProps {
  competitionId: string;
}

export function EntryComparison({ competitionId }: EntryComparisonProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [leftId, setLeftId] = useState<string>("");
  const [rightId, setRightId] = useState<string>("");

  const { data: registrations } = useQuery({
    queryKey: ["comparison-registrations", competitionId],
    queryFn: async () => {
      const { data: regs } = await supabase
        .from("competition_registrations")
        .select("id, participant_id, dish_name, dish_image_url")
        .eq("competition_id", competitionId)
        .eq("status", "approved");

      if (!regs?.length) return [];

      const participantIds = regs.map(r => r.participant_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", participantIds);

      return regs.map(r => ({
        ...r,
        profile: profiles?.find(p => p.user_id === r.participant_id),
      }));
    },
    enabled: !!competitionId,
  });

  const { data: criteria } = useQuery({
    queryKey: ["comparison-criteria", competitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("judging_criteria")
        .select("*")
        .eq("competition_id", competitionId)
        .order("sort_order");
      return data || [];
    },
    enabled: !!competitionId,
  });

  const { data: comparisonScores } = useQuery({
    queryKey: ["comparison-scores", leftId, rightId],
    queryFn: async () => {
      if (!leftId || !rightId) return null;

      const { data: scores } = await supabase
        .from("competition_scores")
        .select("*")
        .in("registration_id", [leftId, rightId]);

      if (!scores) return null;

      const getAvg = (regId: string, critId: string) => {
        const critScores = scores.filter(s => s.registration_id === regId && s.criteria_id === critId);
        if (critScores.length === 0) return 0;
        return critScores.reduce((sum, s) => sum + Number(s.score), 0) / critScores.length;
      };

      return { scores, getAvg };
    },
    enabled: !!leftId && !!rightId,
  });

  const leftEntry = registrations?.find(r => r.id === leftId);
  const rightEntry = registrations?.find(r => r.id === rightId);

  const renderEntry = (entry: typeof leftEntry) => {
    if (!entry) return <div className="h-32 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground text-sm">{language === "ar" ? "اختر مشارك" : "Select entry"}</div>;
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border">
        <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden shrink-0">
          {entry.dish_image_url ? (
            <img src={entry.dish_image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center"><ChefHat className="h-5 w-5 text-muted-foreground" /></div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{entry.dish_name || (language === "ar" ? "بدون اسم" : "Unnamed")}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Avatar className="h-4 w-4">
              <AvatarImage src={entry.profile?.avatar_url || undefined} />
              <AvatarFallback><User className="h-2 w-2" /></AvatarFallback>
            </Avatar>
            <span className="truncate">{entry.profile?.full_name || "Participant"}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowLeftRight className="h-5 w-5" />
          {language === "ar" ? "مقارنة المشاركين" : "Entry Comparison"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selectors */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Select value={leftId} onValueChange={setLeftId}>
              <SelectTrigger>
                <SelectValue placeholder={language === "ar" ? "المشارك الأول" : "Entry A"} />
              </SelectTrigger>
              <SelectContent>
                {registrations?.filter(r => r.id !== rightId).map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.dish_name || r.profile?.full_name || "Entry"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {renderEntry(leftEntry)}
          </div>
          <div className="space-y-2">
            <Select value={rightId} onValueChange={setRightId}>
              <SelectTrigger>
                <SelectValue placeholder={language === "ar" ? "المشارك الثاني" : "Entry B"} />
              </SelectTrigger>
              <SelectContent>
                {registrations?.filter(r => r.id !== leftId).map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.dish_name || r.profile?.full_name || "Entry"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {renderEntry(rightEntry)}
          </div>
        </div>

        {/* Score Comparison */}
        {leftId && rightId && comparisonScores && criteria && (
          <div className="space-y-4">
            {criteria.map(crit => {
              const leftAvg = comparisonScores.getAvg(leftId, crit.id);
              const rightAvg = comparisonScores.getAvg(rightId, crit.id);
              const leftPct = crit.max_score > 0 ? (leftAvg / crit.max_score) * 100 : 0;
              const rightPct = crit.max_score > 0 ? (rightAvg / crit.max_score) * 100 : 0;

              return (
                <div key={crit.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{language === "ar" && crit.name_ar ? crit.name_ar : crit.name}</span>
                    <span className="text-xs text-muted-foreground">/ {crit.max_score}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-primary font-medium">{leftAvg.toFixed(1)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${leftPct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">vs</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-primary font-medium">{rightAvg.toFixed(1)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${rightPct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
