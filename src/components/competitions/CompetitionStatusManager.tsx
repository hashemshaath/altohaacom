import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowRight,
  FileEdit,
  Calendar,
  CalendarCheck,
  CalendarX,
  PlayCircle,
  Scale,
  Trophy,
  XCircle,
  CheckCircle,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type CompetitionStatus = Database["public"]["Enums"]["competition_status"];

interface StatusConfig {
  label: string;
  labelAr: string;
  icon: React.ElementType;
  color: string;
  description: string;
  descriptionAr: string;
}

const STATUS_CONFIG: Record<CompetitionStatus, StatusConfig> = {
  draft: {
    label: "Draft",
    labelAr: "مسودة",
    icon: FileEdit,
    color: "bg-muted text-muted-foreground",
    description: "Competition is being prepared. Not visible to participants.",
    descriptionAr: "المسابقة قيد التحضير. غير مرئية للمشاركين.",
  },
  upcoming: {
    label: "Upcoming",
    labelAr: "قادمة",
    icon: Calendar,
    color: "bg-accent/20 text-accent-foreground",
    description: "Competition is announced but registration hasn't opened yet.",
    descriptionAr: "تم الإعلان عن المسابقة ولكن التسجيل لم يفتح بعد.",
  },
  registration_open: {
    label: "Registration Open",
    labelAr: "التسجيل مفتوح",
    icon: CalendarCheck,
    color: "bg-primary/20 text-primary",
    description: "Participants can register for this competition.",
    descriptionAr: "يمكن للمشاركين التسجيل في هذه المسابقة.",
  },
  registration_closed: {
    label: "Registration Closed",
    labelAr: "التسجيل مغلق",
    icon: CalendarX,
    color: "bg-muted text-muted-foreground",
    description: "Registration period has ended.",
    descriptionAr: "انتهت فترة التسجيل.",
  },
  in_progress: {
    label: "In Progress",
    labelAr: "جارية",
    icon: PlayCircle,
    color: "bg-chart-3/20 text-chart-3",
    description: "Competition is currently running.",
    descriptionAr: "المسابقة قيد التنفيذ حالياً.",
  },
  judging: {
    label: "Judging",
    labelAr: "التحكيم",
    icon: Scale,
    color: "bg-chart-4/20 text-chart-4",
    description: "Judges are evaluating participants.",
    descriptionAr: "الحكام يقومون بتقييم المشاركين.",
  },
  completed: {
    label: "Completed",
    labelAr: "مكتملة",
    icon: Trophy,
    color: "bg-chart-5/20 text-chart-5",
    description: "Competition has finished. Results are final.",
    descriptionAr: "انتهت المسابقة. النتائج نهائية.",
  },
  cancelled: {
    label: "Cancelled",
    labelAr: "ملغاة",
    icon: XCircle,
    color: "bg-destructive/20 text-destructive",
    description: "Competition has been cancelled.",
    descriptionAr: "تم إلغاء المسابقة.",
  },
};

// Define allowed status transitions
const STATUS_TRANSITIONS: Record<CompetitionStatus, CompetitionStatus[]> = {
  draft: ["upcoming", "registration_open", "cancelled"],
  upcoming: ["registration_open", "cancelled"],
  registration_open: ["registration_closed", "in_progress", "cancelled"],
  registration_closed: ["in_progress", "cancelled"],
  in_progress: ["judging", "completed", "cancelled"],
  judging: ["completed", "cancelled"],
  completed: [], // Terminal state
  cancelled: ["draft"], // Can restore to draft
};

interface CompetitionStatusManagerProps {
  competitionId: string;
  currentStatus: CompetitionStatus;
  competitionTitle: string;
}

export function CompetitionStatusManager({
  competitionId,
  currentStatus,
  competitionTitle,
}: CompetitionStatusManagerProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmStatus, setConfirmStatus] = useState<CompetitionStatus | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: CompetitionStatus) => {
      const { error } = await supabase
        .from("competitions")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", competitionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition", competitionId] });
      queryClient.invalidateQueries({ queryKey: ["competitions"] });
      toast({
        title: language === "ar" ? "تم تحديث الحالة" : "Status Updated",
        description:
          language === "ar"
            ? `تم تحديث حالة المسابقة إلى ${STATUS_CONFIG[confirmStatus!].labelAr}`
            : `Competition status updated to ${STATUS_CONFIG[confirmStatus!].label}`,
      });
      setConfirmStatus(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: language === "ar" ? "فشل التحديث" : "Update Failed",
        description: error.message,
      });
    },
  });

  const availableTransitions = STATUS_TRANSITIONS[currentStatus];
  const currentConfig = STATUS_CONFIG[currentStatus];
  const CurrentIcon = currentConfig.icon;

  const handleStatusChange = (newStatus: CompetitionStatus) => {
    setConfirmStatus(newStatus);
  };

  const confirmStatusChange = () => {
    if (confirmStatus) {
      updateStatusMutation.mutate(confirmStatus);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CurrentIcon className="h-5 w-5" />
            {language === "ar" ? "إدارة الحالة" : "Status Management"}
          </CardTitle>
          <CardDescription>
            {language === "ar" ? currentConfig.descriptionAr : currentConfig.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {language === "ar" ? "الحالة الحالية:" : "Current Status:"}
            </span>
            <Badge className={currentConfig.color}>
              {language === "ar" ? currentConfig.labelAr : currentConfig.label}
            </Badge>
          </div>

          {/* Status Flow Visualization */}
          <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/30 p-3 text-xs">
            {(Object.keys(STATUS_CONFIG) as CompetitionStatus[])
              .filter((s) => s !== "cancelled")
              .map((flowStatus, index, arr) => {
                const config = STATUS_CONFIG[flowStatus];
                const isActive = flowStatus === currentStatus;
                const currentIndex = (arr as CompetitionStatus[]).indexOf(currentStatus);
                const isPast =
                  currentIndex > index ||
                  (currentStatus === "cancelled" && flowStatus === "draft");

                return (
                  <div key={flowStatus} className="flex items-center gap-1">
                    <div
                      className={`flex items-center gap-1 rounded px-2 py-1 ${
                        isActive
                          ? config.color
                          : isPast
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {isPast && !isActive && <CheckCircle className="h-3 w-3" />}
                      <span>{language === "ar" ? config.labelAr : config.label}</span>
                    </div>
                    {index < arr.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                    )}
                  </div>
                );
              })}
          </div>

          {/* Available Actions */}
          {availableTransitions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {language === "ar" ? "الإجراءات المتاحة:" : "Available Actions:"}
              </p>
              <div className="flex flex-wrap gap-2">
          {availableTransitions.map((nextStatus) => {
                  const config = STATUS_CONFIG[nextStatus];
                  const StatusIcon = config.icon;
                  const isDestructive = nextStatus === "cancelled";

                  return (
                    <Button
                      key={nextStatus}
                      variant={isDestructive ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => handleStatusChange(nextStatus)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <StatusIcon className="mr-1 h-4 w-4" />
                      {language === "ar" ? config.labelAr : config.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {language === "ar"
                ? "هذه المسابقة في حالتها النهائية."
                : "This competition is in its final state."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmStatus} onOpenChange={(open) => !open && setConfirmStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ar" ? "تأكيد تغيير الحالة" : "Confirm Status Change"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {language === "ar"
                  ? `هل أنت متأكد أنك تريد تغيير حالة "${competitionTitle}" إلى`
                  : `Are you sure you want to change the status of "${competitionTitle}" to`}{" "}
                <strong>
                  {confirmStatus &&
                    (language === "ar"
                      ? STATUS_CONFIG[confirmStatus].labelAr
                      : STATUS_CONFIG[confirmStatus].label)}
                </strong>
                ?
              </p>
              {confirmStatus && (
                <p className="text-sm">
                  {language === "ar"
                    ? STATUS_CONFIG[confirmStatus].descriptionAr
                    : STATUS_CONFIG[confirmStatus].description}
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "ar" ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              className={confirmStatus === "cancelled" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {updateStatusMutation.isPending
                ? language === "ar"
                  ? "جاري التحديث..."
                  : "Updating..."
                : language === "ar"
                ? "تأكيد"
                : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
