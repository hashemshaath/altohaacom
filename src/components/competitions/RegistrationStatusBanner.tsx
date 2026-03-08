/**
 * Shows registration status for the current user on a competition detail page.
 * Displays pending/approved/rejected state with contextual messaging.
 */
import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, XCircle, Trophy, Calendar, Hash, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toEnglishDigits } from "@/lib/formatNumber";

interface RegistrationStatusBannerProps {
  registration: {
    id: string;
    status: string;
    registration_number?: string | null;
    registered_at?: string;
    category_name?: string | null;
    category_name_ar?: string | null;
  } | null;
  competitionStatus: string;
}

const statusStyles = {
  pending: {
    icon: Clock,
    bg: "bg-gradient-to-r from-chart-4/12 to-chart-4/4",
    border: "border-chart-4/25",
    text: "text-chart-4",
    dot: "bg-chart-4",
    iconBg: "bg-chart-4/15",
  },
  approved: {
    icon: CheckCircle,
    bg: "bg-gradient-to-r from-chart-5/12 to-chart-5/4",
    border: "border-chart-5/25",
    text: "text-chart-5",
    dot: "bg-chart-5",
    iconBg: "bg-chart-5/15",
  },
  rejected: {
    icon: XCircle,
    bg: "bg-gradient-to-r from-destructive/12 to-destructive/4",
    border: "border-destructive/25",
    text: "text-destructive",
    dot: "bg-destructive",
    iconBg: "bg-destructive/15",
  },
  waitlisted: {
    icon: Clock,
    bg: "bg-gradient-to-r from-chart-4/12 to-chart-4/4",
    border: "border-chart-4/25",
    text: "text-chart-4",
    dot: "bg-chart-4",
    iconBg: "bg-chart-4/15",
  },
};

const statusLabels: Record<string, { en: string; ar: string }> = {
  pending: { en: "Registration Pending", ar: "التسجيل قيد المراجعة" },
  approved: { en: "Registration Approved", ar: "تم قبول التسجيل" },
  rejected: { en: "Registration Rejected", ar: "تم رفض التسجيل" },
  waitlisted: { en: "On Waitlist", ar: "في قائمة الانتظار" },
};

export const RegistrationStatusBanner = memo(function RegistrationStatusBanner({ registration, competitionStatus }: RegistrationStatusBannerProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (!registration) return null;

  const status = registration.status || "pending";
  const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.pending;
  const label = statusLabels[status] || statusLabels.pending;
  const Icon = style.icon;

  return (
    <Card className={cn("overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-md", style.border)}>
      <CardContent className={cn("relative p-4 sm:p-5", style.bg)}>
        {/* Decorative glow */}
        {status === "approved" && (
          <div className="pointer-events-none absolute -end-8 -top-8 h-24 w-24 rounded-full bg-chart-5/8 blur-[40px]" />
        )}

        <div className="relative flex items-start gap-3 sm:gap-4">
          <div className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 hover:scale-105",
            style.iconBg
          )}>
            <Icon className={cn("h-5 w-5", style.text)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={cn("text-sm font-bold", style.text)}>
                {isAr ? label.ar : label.en}
              </h4>
              <Badge variant="outline" className={cn("text-[10px] rounded-xl px-2 py-0.5", style.text, style.border)}>
                <div className={cn("h-1.5 w-1.5 rounded-full me-1.5 animate-pulse", style.dot)} />
                {status}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 text-xs text-muted-foreground">
              {registration.registration_number && (
                <span className="flex items-center gap-1.5 bg-background/60 rounded-xl px-2 py-0.5">
                  <Hash className="h-3 w-3" />
                  {toEnglishDigits(registration.registration_number)}
                </span>
              )}
              {registration.registered_at && (
                <span className="flex items-center gap-1.5 bg-background/60 rounded-xl px-2 py-0.5">
                  <Calendar className="h-3 w-3" />
                  {toEnglishDigits(format(new Date(registration.registered_at), "MMM d, yyyy", { locale: isAr ? ar : enUS }))}
                </span>
              )}
              {(registration.category_name || registration.category_name_ar) && (
                <span className="flex items-center gap-1.5 bg-background/60 rounded-xl px-2 py-0.5">
                  <Trophy className="h-3 w-3" />
                  {isAr && registration.category_name_ar ? registration.category_name_ar : registration.category_name}
                </span>
              )}
            </div>

            {status === "approved" && (
              <p className="flex items-center gap-1.5 text-xs text-chart-5/80 mt-2.5 font-medium">
                <Sparkles className="h-3 w-3" />
                {isAr ? "أنت مسجل بنجاح. حظاً موفقاً! 🎉" : "You're successfully registered. Good luck! 🎉"}
              </p>
            )}
            {status === "pending" && (
              <p className="text-xs text-chart-4/80 mt-2.5">
                {isAr ? "طلبك قيد المراجعة من قبل المنظمين." : "Your application is being reviewed by organizers."}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
