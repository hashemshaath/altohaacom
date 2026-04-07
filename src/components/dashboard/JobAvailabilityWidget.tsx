import { memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Briefcase, Eye, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const JobAvailabilityWidget = memo(function JobAvailabilityWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["job-availability-widget", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_open_to_work, job_availability_visibility")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const toggle = useMutation({
    mutationFn: async (newValue: boolean) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_open_to_work: newValue } as any)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: (_, newValue) => {
      qc.invalidateQueries({ queryKey: ["job-availability-widget"] });
      qc.invalidateQueries({ queryKey: ["job-availability"] });
      toast({
        title: newValue
          ? (isAr ? "أنت الآن متاح للعمل ✓" : "You're now open to work ✓")
          : (isAr ? "تم إخفاء حالة التوظيف" : "Job status hidden"),
      });
    },
  });

  if (!profile) return null;

  const visLabel = profile.job_availability_visibility === "public"
    ? (isAr ? "عام" : "Public")
    : profile.job_availability_visibility === "connections"
    ? (isAr ? "المتابعون" : "Connections")
    : (isAr ? "خاص" : "Private");

  return (
    <Card className="rounded-2xl border-border/20 overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${profile.is_open_to_work ? "bg-chart-2/15" : "bg-muted/10"}`}>
              <Briefcase className={`h-4 w-4 ${profile.is_open_to_work ? "text-chart-2" : "text-muted-foreground/50"}`} />
            </div>
            <div>
              <p className="text-sm font-semibold">{isAr ? "متاح للعمل" : "Open to Work"}</p>
              <div className="flex items-center gap-1 text-[12px] text-muted-foreground/60">
                <Eye className="h-2.5 w-2.5" />
                {visLabel}
              </div>
            </div>
          </div>
          <Switch
            checked={profile.is_open_to_work || false}
            onCheckedChange={(v) => toggle.mutate(v)}
            disabled={toggle.isPending}
          />
        </div>
        <Link
          to="/profile?tab=edit"
          className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          {isAr ? "إدارة التفضيلات" : "Manage preferences"}
          <ChevronRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
});
