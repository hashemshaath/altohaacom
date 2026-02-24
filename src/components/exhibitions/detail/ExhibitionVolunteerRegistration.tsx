import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HandHeart, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

export function ExhibitionVolunteerRegistration({ exhibitionId, isAr }: Props) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [skills, setSkills] = useState("");
  const [notes, setNotes] = useState("");

  const { data: existing, isLoading } = useQuery({
    queryKey: ["volunteer-reg", exhibitionId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("exhibition_volunteers")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const register = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("exhibition_volunteers").insert({
        exhibition_id: exhibitionId,
        user_id: user.id,
        skills: skills ? skills.split(",").map((s) => s.trim()).filter(Boolean) : null,
        notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("Registered as volunteer!", "تم التسجيل كمتطوع!"));
      queryClient.invalidateQueries({ queryKey: ["volunteer-reg", exhibitionId] });
    },
    onError: () => toast.error(t("Registration failed", "فشل التسجيل")),
  });

  if (isLoading) return null;

  if (existing) {
    const statusMap: Record<string, { icon: React.ReactNode; label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { icon: <Clock className="h-3.5 w-3.5" />, label: t("Pending Review", "قيد المراجعة"), variant: "outline" },
      approved: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: t("Approved", "مقبول"), variant: "default" },
      rejected: { icon: <XCircle className="h-3.5 w-3.5" />, label: t("Rejected", "مرفوض"), variant: "destructive" },
      checked_in: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: t("Active", "نشط"), variant: "default" },
    };
    const s = statusMap[existing.status] || statusMap.pending;

    return (
      <Card className="border-primary/20">
        <CardContent className="p-4 flex items-center gap-3">
          <HandHeart className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">{t("You're registered as a volunteer", "أنت مسجل كمتطوع")}</p>
            {existing.role_title && <p className="text-xs text-muted-foreground">{isAr ? existing.role_title_ar || existing.role_title : existing.role_title}</p>}
          </div>
          <Badge variant={s.variant} className="gap-1">
            {s.icon} {s.label}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  if (!user) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <HandHeart className="h-4.5 w-4.5 text-primary" />
          {t("Volunteer for this Event", "تطوع في هذه الفعالية")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder={t("Skills (comma-separated)", "المهارات (مفصولة بفاصلة)")}
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />
        <Textarea
          placeholder={t("Additional notes...", "ملاحظات إضافية...")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
        <Button onClick={() => register.mutate()} disabled={register.isPending} className="w-full">
          <HandHeart className="h-4 w-4 me-2" />
          {register.isPending ? t("Submitting...", "جارٍ الإرسال...") : t("Apply as Volunteer", "التقديم كمتطوع")}
        </Button>
      </CardContent>
    </Card>
  );
}
