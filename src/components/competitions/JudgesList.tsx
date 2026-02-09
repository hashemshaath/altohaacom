import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Scale, CheckCircle2, ClipboardList, Briefcase, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { countryFlag } from "@/lib/countryFlag";

interface JudgesListProps {
  competitionId: string;
}

interface JudgeProfile {
  user_id: string;
  judge_title: string | null;
  judge_title_ar: string | null;
  judge_category: string | null;
  judge_level: string | null;
  nationality: string | null;
  second_nationality: string | null;
  country_of_residence: string | null;
  current_position: string | null;
  current_employer: string | null;
  profile_photo_url: string | null;
  culinary_specialties: string[] | null;
}

export function JudgesList({ competitionId }: JudgesListProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: judges, isLoading } = useQuery({
    queryKey: ["competition-judges-list", competitionId],
    queryFn: async () => {
      const { data: assignments, error } = await supabase
        .from("competition_judges")
        .select("id, judge_id, assigned_at")
        .eq("competition_id", competitionId);

      if (error) throw error;
      if (!assignments || assignments.length === 0) return [];

      const judgeIds = assignments.map((a) => a.judge_id);

      // Fetch basic profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, avatar_url, bio, specialization, is_verified, location")
        .in("user_id", judgeIds);

      // Fetch judge profiles for extended info
      const { data: judgeProfiles } = await supabase
        .from("judge_profiles")
        .select("user_id, judge_title, judge_title_ar, judge_category, judge_level, nationality, second_nationality, country_of_residence, current_position, current_employer, profile_photo_url, culinary_specialties")
        .in("user_id", judgeIds);

      // Get score counts per judge
      const { data: regIds } = await supabase
        .from("competition_registrations")
        .select("id")
        .eq("competition_id", competitionId)
        .eq("status", "approved");

      let scoreCounts = new Map<string, number>();
      if (regIds && regIds.length > 0) {
        const { data: scores } = await supabase
          .from("competition_scores")
          .select("judge_id")
          .in("registration_id", regIds.map((r) => r.id));

        scores?.forEach((s) => {
          scoreCounts.set(s.judge_id, (scoreCounts.get(s.judge_id) || 0) + 1);
        });
      }

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      const judgeProfileMap = new Map<string, JudgeProfile>(
        judgeProfiles?.map((jp) => [jp.user_id, jp as JudgeProfile]) || []
      );

      return assignments.map((assignment) => ({
        ...assignment,
        profile: profileMap.get(assignment.judge_id),
        judgeProfile: judgeProfileMap.get(assignment.judge_id) || null,
        scoresGiven: scoreCounts.get(assignment.judge_id) || 0,
      }));
    },
    enabled: !!competitionId,
  });

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-3">
          <Skeleton className="h-5 w-28" />
        </div>
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!judges || judges.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3">
        <h3 className="flex items-center gap-2 font-semibold text-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-4/10">
            <Scale className="h-3.5 w-3.5 text-chart-4" />
          </div>
          {isAr ? "لجنة التحكيم" : "Judges Panel"}
          <Badge variant="secondary" className="ms-1">{judges.length}</Badge>
        </h3>
      </div>
      <CardContent className="p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {judges.map((judge) => {
            const jp = judge.judgeProfile;
            const photo = jp?.profile_photo_url || judge.profile?.avatar_url;
            const name = judge.profile?.full_name || (isAr ? "حكم" : "Judge");
            const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
            const title = isAr && jp?.judge_title_ar ? jp.judge_title_ar : jp?.judge_title;
            const position = jp?.current_position;
            const employer = jp?.current_employer;
            const bio = judge.profile?.bio;
            const nationalityFlag = countryFlag(jp?.nationality);
            const residenceFlag = countryFlag(jp?.country_of_residence);
            const secondNationalityFlag = jp?.second_nationality ? countryFlag(jp.second_nationality) : "";

            return (
              <Link
                key={judge.id}
                to={`/${judge.profile?.username || judge.judge_id}`}
                className="group block rounded-xl border bg-card overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                {/* Top section with photo and info */}
                <div className="flex gap-3 p-4">
                  <Avatar className="h-16 w-16 rounded-xl shrink-0 ring-2 ring-background shadow-sm">
                    <AvatarImage src={photo || undefined} alt={name} className="object-cover" />
                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-lg font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Name + verified */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {name}
                      </span>
                      {judge.profile?.is_verified && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                    </div>

                    {/* Title */}
                    {title && (
                      <p className="text-xs text-primary/80 font-medium truncate">{title}</p>
                    )}

                    {/* Position & Employer */}
                    {(position || employer) && (
                      <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                        <Briefcase className="h-3 w-3 shrink-0" />
                        {position}{position && employer ? " · " : ""}{employer}
                      </p>
                    )}

                    {/* Flags row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {nationalityFlag && (
                        <span className="text-base leading-none" title={jp?.nationality || ""}>
                          {nationalityFlag}
                        </span>
                      )}
                      {secondNationalityFlag && secondNationalityFlag !== nationalityFlag && (
                        <span className="text-base leading-none" title={jp?.second_nationality || ""}>
                          {secondNationalityFlag}
                        </span>
                      )}
                      {residenceFlag && residenceFlag !== nationalityFlag && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5" />
                          <span className="text-base leading-none">{residenceFlag}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio snippet */}
                {bio && (
                  <div className="px-4 pb-3">
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{bio}</p>
                  </div>
                )}

                {/* Footer with badges */}
                <div className="border-t bg-muted/20 px-4 py-2 flex items-center gap-2 flex-wrap">
                  {jp?.judge_level && (
                    <Badge variant="outline" className="text-[9px] h-5 gap-0.5">
                      <Scale className="h-2.5 w-2.5" />
                      {jp.judge_level}
                    </Badge>
                  )}
                  {jp?.judge_category && (
                    <Badge variant="secondary" className="text-[9px] h-5">{jp.judge_category}</Badge>
                  )}
                  {judge.scoresGiven > 0 && (
                    <Badge variant="outline" className="text-[9px] h-5 gap-0.5 ms-auto">
                      <ClipboardList className="h-2.5 w-2.5" />
                      {judge.scoresGiven} {isAr ? "تقييم" : "scores"}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
