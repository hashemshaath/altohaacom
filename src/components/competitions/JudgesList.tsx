import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Scale, CheckCircle2, ClipboardList, Briefcase, MapPin, Crown, MoreVertical, ShieldCheck, UserMinus } from "lucide-react";
import { Link } from "react-router-dom";
import { countryFlag } from "@/lib/countryFlag";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface JudgesListProps {
  competitionId: string;
  isOrganizer?: boolean;
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

export function JudgesList({ competitionId, isOrganizer = false }: JudgesListProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const isAr = language === "ar";
  const canAppoint = isOrganizer || !!isAdmin;
  const queryClient = useQueryClient();
  const [confirmDialog, setConfirmDialog] = useState<{ type: "appoint" | "remove"; judgeId: string; judgeName: string } | null>(null);

  // Fetch head judge role from competition_roles
  const { data: headJudgeId } = useQuery({
    queryKey: ["head-judge", competitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("competition_roles")
        .select("user_id")
        .eq("competition_id", competitionId)
        .eq("role", "head_judge")
        .eq("status", "active")
        .maybeSingle();
      return data?.user_id || null;
    },
    enabled: !!competitionId,
  });

  const appointHeadJudgeMutation = useMutation({
    mutationFn: async ({ judgeId }: { judgeId: string }) => {
      // First, revoke any existing head_judge role
      // Revoke any current active head_judge
      await supabase
        .from("competition_roles")
        .update({ status: "revoked", revoked_at: new Date().toISOString() })
        .eq("competition_id", competitionId)
        .eq("role", "head_judge")
        .eq("status", "active");

      // Check if a revoked row already exists for this judge
      const { data: existing } = await supabase
        .from("competition_roles")
        .select("id")
        .eq("competition_id", competitionId)
        .eq("user_id", judgeId)
        .eq("role", "head_judge")
        .maybeSingle();

      if (existing) {
        // Re-activate the existing revoked row
        const { error } = await supabase
          .from("competition_roles")
          .update({ status: "active", assigned_by: user?.id, assigned_at: new Date().toISOString(), revoked_at: null })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // Insert new row
        const { error } = await supabase.from("competition_roles").insert({
          competition_id: competitionId,
          user_id: judgeId,
          role: "head_judge",
          assigned_by: user?.id,
          status: "active",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["head-judge", competitionId] });
      toast({ title: isAr ? "تم التعيين" : "Appointed", description: isAr ? "تم تعيين رئيس لجنة التحكيم بنجاح" : "Head judge appointed successfully" });
    },
    onError: () => {
      toast({ title: isAr ? "خطأ" : "Error", description: isAr ? "فشل التعيين" : "Failed to appoint", variant: "destructive" });
    },
  });

  const removeHeadJudgeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("competition_roles")
        .update({ status: "revoked", revoked_at: new Date().toISOString() })
        .eq("competition_id", competitionId)
        .eq("role", "head_judge")
        .eq("status", "active");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["head-judge", competitionId] });
      toast({ title: isAr ? "تم الإزالة" : "Removed", description: isAr ? "تم إزالة رئيس لجنة التحكيم" : "Head judge removed" });
    },
  });

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

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, avatar_url, bio, specialization, is_verified, location")
        .in("user_id", judgeIds);

      const { data: judgeProfiles } = await supabase
        .from("judge_profiles")
        .select("user_id, judge_title, judge_title_ar, judge_category, judge_level, nationality, second_nationality, country_of_residence, current_position, current_employer, profile_photo_url, culinary_specialties")
        .in("user_id", judgeIds);

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

  // Sort: head judge first
  const sortedJudges = [...judges].sort((a, b) => {
    if (a.judge_id === headJudgeId) return -1;
    if (b.judge_id === headJudgeId) return 1;
    return 0;
  });

  return (
    <>
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
            {sortedJudges.map((judge) => {
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
              const isHeadJudge = judge.judge_id === headJudgeId;

              return (
                <div key={judge.id} className="relative group">
                  {/* Head Judge Crown Badge */}
                  {isHeadJudge && (
                    <div className="absolute -top-2 start-3 z-10">
                      <Badge className="gap-1 bg-amber-500 text-amber-50 hover:bg-amber-600 shadow-md text-[10px] px-2 py-0.5">
                        <Crown className="h-3 w-3" />
                        {isAr ? "رئيس التحكيم" : "Head Judge"}
                      </Badge>
                    </div>
                  )}

                  {/* Organizer dropdown menu */}
                  {canAppoint && (
                    <div className="absolute top-2 end-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur-sm shadow-sm">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!isHeadJudge ? (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                setConfirmDialog({ type: "appoint", judgeId: judge.judge_id, judgeName: name });
                              }}
                            >
                              <Crown className="h-4 w-4 me-2 text-amber-500" />
                              {isAr ? "تعيين رئيس التحكيم" : "Appoint as Head Judge"}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                setConfirmDialog({ type: "remove", judgeId: judge.judge_id, judgeName: name });
                              }}
                              className="text-destructive"
                            >
                              <UserMinus className="h-4 w-4 me-2" />
                              {isAr ? "إزالة من رئاسة التحكيم" : "Remove as Head Judge"}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  <Link
                    to={`/${judge.profile?.username || judge.judge_id}`}
                    className={`block rounded-xl border bg-card overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 ${
                      isHeadJudge ? "border-amber-400/50 ring-1 ring-amber-400/20 pt-2" : ""
                    }`}
                  >
                    {/* Top section with photo and info */}
                    <div className="flex gap-3 p-4">
                      <Avatar className={`h-16 w-16 rounded-xl shrink-0 shadow-sm ${isHeadJudge ? "ring-2 ring-amber-400" : "ring-2 ring-background"}`}>
                        <AvatarImage src={photo || undefined} alt={name} className="object-cover" />
                        <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-lg font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                            {name}
                          </span>
                          {judge.profile?.is_verified && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          )}
                          {isHeadJudge && (
                            <ShieldCheck className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          )}
                        </div>

                        {title && (
                          <p className="text-xs text-primary/80 font-medium truncate">{title}</p>
                        )}

                        {(position || employer) && (
                          <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                            <Briefcase className="h-3 w-3 shrink-0" />
                            {position}{position && employer ? " · " : ""}{employer}
                          </p>
                        )}

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

                    {bio && (
                      <div className="px-4 pb-3">
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{bio}</p>
                      </div>
                    )}

                    <div className="border-t bg-muted/20 px-4 py-2 flex items-center gap-2 flex-wrap">
                      {isHeadJudge && (
                        <Badge className="text-[9px] h-5 gap-0.5 bg-amber-500/10 text-amber-600 border-amber-300">
                          <Crown className="h-2.5 w-2.5" />
                          {isAr ? "رئيس" : "Chairman"}
                        </Badge>
                      )}
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
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.type === "appoint"
                ? (isAr ? "تعيين رئيس لجنة التحكيم" : "Appoint Head Judge")
                : (isAr ? "إزالة رئيس لجنة التحكيم" : "Remove Head Judge")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.type === "appoint"
                ? (isAr
                    ? `هل تريد تعيين "${confirmDialog?.judgeName}" كرئيس لجنة التحكيم؟ سيحصل على صلاحيات الموافقة على الشهادات والتعيينات والتحكم في صلاحيات لجنة التحكيم لهذه المسابقة.`
                    : `Appoint "${confirmDialog?.judgeName}" as Head Judge? They will have authority to approve certificates, manage appointments, control committee powers, and accept/reject matters for this competition.`)
                : (isAr
                    ? `هل تريد إزالة "${confirmDialog?.judgeName}" من رئاسة لجنة التحكيم؟`
                    : `Remove "${confirmDialog?.judgeName}" from the Head Judge position?`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog?.type === "appoint") {
                  appointHeadJudgeMutation.mutate({ judgeId: confirmDialog.judgeId });
                } else {
                  removeHeadJudgeMutation.mutate();
                }
                setConfirmDialog(null);
              }}
              className={confirmDialog?.type === "remove" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirmDialog?.type === "appoint"
                ? (isAr ? "تعيين" : "Appoint")
                : (isAr ? "إزالة" : "Remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
