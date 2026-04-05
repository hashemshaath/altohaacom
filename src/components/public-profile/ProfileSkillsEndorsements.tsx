import { memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, Users } from "lucide-react";

interface ProfileSkillsEndorsementsProps {
  userId: string;
  userSpecialties?: any[];
  isAr: boolean;
  compact?: boolean;
}

export const ProfileSkillsEndorsements = memo(function ProfileSkillsEndorsements({
  userId, userSpecialties = [], isAr, compact = false,
}: ProfileSkillsEndorsementsProps) {
  // Fetch endorsement counts for each specialty
  const { data: endorsements = [] } = useQuery({
    queryKey: ["skill-endorsements", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_specialties")
        .select("specialty_id, specialties(name, name_ar)")
        .eq("user_id", userId);
      return data || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const skills = useMemo(() => {
    const combined = new Map<string, { name: string; nameAr: string; count: number }>();

    // From specialties registry
    for (const us of userSpecialties) {
      const spec = us.specialties;
      if (spec) {
        combined.set(spec.name, {
          name: spec.name,
          nameAr: spec.name_ar || spec.name,
          count: us.endorsed_count || 0,
        });
      }
    }

    // From endorsements query as fallback
    for (const e of endorsements) {
      const spec = (e as any).specialties;
      if (spec && !combined.has(spec.name)) {
        combined.set(spec.name, {
          name: spec.name,
          nameAr: spec.name_ar || spec.name,
          count: 0,
        });
      }
    }

    return Array.from(combined.values()).sort((a, b) => b.count - a.count);
  }, [userSpecialties, endorsements]);

  if (skills.length === 0) return null;

  const displayed = compact ? skills.slice(0, 6) : skills;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-4/10">
          <Sparkles className="h-3.5 w-3.5 text-chart-4" />
        </div>
        <h3 className="text-sm font-bold">{isAr ? "المهارات والتخصصات" : "Skills & Specializations"}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {displayed.map((skill) => (
          <Tooltip key={skill.name}>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="rounded-xl px-3 py-1.5 text-xs font-medium border-border/30 bg-muted/20 hover:bg-muted/40 transition-all duration-200 gap-1.5 cursor-default group"
              >
                <span className="group-hover:text-primary transition-colors">
                  {isAr ? skill.nameAr : skill.name}
                </span>
                {skill.count > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-chart-2 bg-chart-2/10 rounded-full px-1.5 py-0.5">
                    <Users className="h-2.5 w-2.5" />
                    {skill.count}
                  </span>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {skill.count > 0
                ? (isAr ? `${skill.count} تأييد` : `${skill.count} endorsement${skill.count > 1 ? "s" : ""}`)
                : (isAr ? "لا توجد تأييدات بعد" : "No endorsements yet")}
            </TooltipContent>
          </Tooltip>
        ))}
        {compact && skills.length > 6 && (
          <Badge variant="outline" className="rounded-xl px-3 py-1.5 text-xs text-muted-foreground border-dashed">
            +{skills.length - 6} {isAr ? "أخرى" : "more"}
          </Badge>
        )}
      </div>
    </div>
  );
});
