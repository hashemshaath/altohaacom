import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  UserPlus,
  UserMinus,
  Search,
  Loader2,
  Scale,
} from "lucide-react";

interface JudgeAssignmentPanelProps {
  competitionId: string;
}

interface Judge {
  id: string;
  judge_id: string;
  assigned_at: string;
  profile: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
  } | null;
}

interface AvailableJudge {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
}

export const JudgeAssignmentPanel = memo(function JudgeAssignmentPanel({ competitionId }: JudgeAssignmentPanelProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [judgeToRemove, setJudgeToRemove] = useState<Judge | null>(null);

  // Fetch assigned judges
  const { data: assignedJudges, isLoading: loadingJudges } = useQuery({
    queryKey: ["competition-judges", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_judges")
        .select("id, judge_id, assigned_at")
        .eq("competition_id", competitionId)
        .order("assigned_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles for assigned judges
      const judgeIds = data.map((j) => j.judge_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username")
        .in("user_id", judgeIds);

      return data.map((judge) => ({
        ...judge,
        profile: profiles?.find((p) => p.user_id === judge.judge_id) || null,
      })) as Judge[];
    },
  });

  // Fetch available judges (users with judge role)
  const { data: availableJudges, isLoading: loadingAvailable } = useQuery({
    queryKey: ["available-judges", competitionId, searchQuery],
    queryFn: async () => {
      // Get users with judge role
      const { data: judgeRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "judge");

      if (rolesError) throw rolesError;
      if (!judgeRoles?.length) return [];

      const judgeUserIds = judgeRoles.map((r) => r.user_id);
      const assignedIds = assignedJudges?.map((j) => j.judge_id) || [];

      // Filter out already assigned judges
      const unassignedIds = judgeUserIds.filter((id) => !assignedIds.includes(id));
      if (!unassignedIds.length) return [];

      // Get profiles
      let query = supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username")
        .in("user_id", unassignedIds);

      if (searchQuery.trim()) {
        query = query.or(
          `full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`
        );
      }

      const { data: profiles, error: profilesError } = await query.limit(20);

      if (profilesError) throw profilesError;
      return profiles as AvailableJudge[];
    },
    enabled: addDialogOpen,
  });

  const assignMutation = useMutation({
    mutationFn: async (judgeId: string) => {
      const { error } = await supabase.from("competition_judges").insert({
        competition_id: competitionId,
        judge_id: judgeId,
        assigned_by: user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-judges", competitionId] });
      queryClient.invalidateQueries({ queryKey: ["available-judges", competitionId] });
      toast({
        title: language === "ar" ? "تم تعيين الحكم!" : "Judge assigned!",
        description: language === "ar"
          ? "تم إضافة الحكم إلى المسابقة"
          : "The judge has been added to the competition.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: language === "ar" ? "فشل التعيين" : "Assignment failed",
        description: error.message,
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("competition_judges")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-judges", competitionId] });
      queryClient.invalidateQueries({ queryKey: ["available-judges", competitionId] });
      setRemoveDialogOpen(false);
      setJudgeToRemove(null);
      toast({
        title: language === "ar" ? "تم إزالة الحكم" : "Judge removed",
        description: language === "ar"
          ? "تم إزالة الحكم من المسابقة"
          : "The judge has been removed from the competition.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: language === "ar" ? "فشلت الإزالة" : "Removal failed",
        description: error.message,
      });
    },
  });

  if (loadingJudges) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {language === "ar" ? "إدارة الحكام" : "Manage Judges"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === "ar"
              ? "قم بتعيين الحكام لتقييم المشاركين"
              : "Assign judges to evaluate participants"}
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <UserPlus className="me-2 h-4 w-4" />
          {language === "ar" ? "إضافة حكم" : "Add Judge"}
        </Button>
      </div>

      {/* Assigned Judges List */}
      {assignedJudges && assignedJudges.length > 0 ? (
        <div className="space-y-3">
          {assignedJudges.map((judge) => (
            <Card key={judge.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={judge.profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h4 className="font-medium">
                    {judge.profile?.full_name ||
                      judge.profile?.username ||
                      (language === "ar" ? "حكم" : "Judge")}
                  </h4>
                  {judge.profile?.username && (
                    <p className="text-sm text-muted-foreground">
                      @{judge.profile.username}
                    </p>
                  )}
                </div>

                <Badge variant="outline" className="gap-1">
                  <Scale className="h-3 w-3" />
                  {language === "ar" ? "حكم" : "Judge"}
                </Badge>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setJudgeToRemove(judge);
                    setRemoveDialogOpen(true);
                  }}
                >
                  <UserMinus className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Scale className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              {language === "ar"
                ? "لم يتم تعيين أي حكام بعد"
                : "No judges assigned yet"}
            </p>
            <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
              <UserPlus className="me-2 h-4 w-4" />
              {language === "ar" ? "إضافة أول حكم" : "Add First Judge"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Judge Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === "ar" ? "إضافة حكم" : "Add Judge"}
            </DialogTitle>
            <DialogDescription>
              {language === "ar"
                ? "ابحث عن الحكام المتاحين وقم بتعيينهم للمسابقة"
                : "Search for available judges and assign them to the competition"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={
                  language === "ar" ? "ابحث عن حكم..." : "Search judges..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>

            {loadingAvailable ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : availableJudges && availableJudges.length > 0 ? (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {availableJudges.map((judge) => (
                  <div
                    key={judge.user_id}
                    className="flex items-center gap-3 rounded-xl border p-3"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={judge.avatar_url || undefined} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <p className="font-medium">
                        {judge.full_name ||
                          judge.username ||
                          (language === "ar" ? "حكم" : "Judge")}
                      </p>
                      {judge.username && (
                        <p className="text-sm text-muted-foreground">
                          @{judge.username}
                        </p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => assignMutation.mutate(judge.user_id)}
                      disabled={assignMutation.isPending}
                    >
                      {assignMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-muted-foreground">
                {language === "ar"
                  ? "لا يوجد حكام متاحين"
                  : "No available judges found"}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Judge Confirmation Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "ar" ? "إزالة الحكم" : "Remove Judge"}
            </DialogTitle>
            <DialogDescription>
              {language === "ar"
                ? "هل أنت متأكد من إزالة هذا الحكم من المسابقة؟"
                : "Are you sure you want to remove this judge from the competition?"}
            </DialogDescription>
          </DialogHeader>

          {judgeToRemove && (
            <div className="flex items-center gap-3 rounded-xl border p-3">
              <Avatar>
                <AvatarImage src={judgeToRemove.profile?.avatar_url || undefined} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {judgeToRemove.profile?.full_name ||
                    judgeToRemove.profile?.username ||
                    (language === "ar" ? "حكم" : "Judge")}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => judgeToRemove && removeMutation.mutate(judgeToRemove.id)}
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <UserMinus className="me-2 h-4 w-4" />
              )}
              {language === "ar" ? "إزالة" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
