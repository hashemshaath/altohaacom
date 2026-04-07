import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useOfflineJudging } from "@/hooks/useOfflineJudging";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Download, RefreshCw, WifiOff, Wifi, Cloud, Clock, Trophy, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ar as arLocale } from "date-fns/locale";

interface OfflineJudgingPanelProps {
  onSelectCachedCompetition?: (competitionId: string) => void;
}

export const OfflineJudgingPanel = memo(function OfflineJudgingPanel({ onSelectCachedCompetition }: OfflineJudgingPanelProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const {
    cachedCompetitions,
    pendingCount,
    isSyncing,
    isOnline,
    lastSync,
    downloadJudgingData,
    syncPendingScores,
  } = useOfflineJudging();

  const lastSyncText = lastSync
    ? formatDistanceToNow(new Date(lastSync), { addSuffix: true, locale: isAr ? arLocale : undefined })
    : isAr ? "لم يتم المزامنة بعد" : "Not synced yet";

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-chart-2" />
            ) : (
              <WifiOff className="h-4 w-4 text-destructive" />
            )}
            {isAr ? "التحكيم بدون اتصال" : "Offline Judging"}
          </CardTitle>
          <Badge variant={isOnline ? "secondary" : "destructive"} className="text-[12px]">
            {isOnline ? (isAr ? "متصل" : "Online") : (isAr ? "غير متصل" : "Offline")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border/50 p-2.5 text-center">
            <Trophy className="h-4 w-4 mx-auto text-primary mb-1" />
            <AnimatedCounter value={cachedCompetitions.length} className="text-lg font-bold" />
            <p className="text-[12px] text-muted-foreground">{isAr ? "مخزنة" : "Cached"}</p>
          </div>
          <div className="rounded-xl border border-border/50 p-2.5 text-center">
            <Cloud className={cn("h-4 w-4 mx-auto mb-1", pendingCount > 0 ? "text-chart-4" : "text-muted-foreground")} />
            <AnimatedCounter value={pendingCount} className="text-lg font-bold" />
            <p className="text-[12px] text-muted-foreground">{isAr ? "بانتظار المزامنة" : "Pending"}</p>
          </div>
          <div className="rounded-xl border border-border/50 p-2.5 text-center">
            <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs font-medium mt-0.5 leading-tight">{lastSyncText}</p>
            <p className="text-[12px] text-muted-foreground">{isAr ? "آخر مزامنة" : "Last sync"}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs"
            onClick={downloadJudgingData}
            disabled={isSyncing || !isOnline}
          >
            <Download className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
            {isSyncing
              ? (isAr ? "جاري التحميل..." : "Downloading...")
              : (isAr ? "تحميل البيانات" : "Download Data")}
          </Button>
          {pendingCount > 0 && isOnline && (
            <Button
              size="sm"
              className="flex-1 gap-1.5 text-xs"
              onClick={syncPendingScores}
              disabled={isSyncing}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
              {isAr ? "مزامنة الدرجات" : "Sync Scores"}
            </Button>
          )}
        </div>

        {/* Pending warning */}
        {pendingCount > 0 && !isOnline && (
          <div className="flex items-start gap-2 rounded-lg bg-chart-4/10 border border-chart-4/20 p-3">
            <AlertCircle className="h-4 w-4 text-chart-4 mt-0.5 shrink-0" />
            <p className="text-xs text-chart-4">
              {isAr
                ? `لديك ${pendingCount} تقييم بانتظار المزامنة. ستتم المزامنة تلقائياً عند الاتصال بالإنترنت.`
                : `You have ${pendingCount} score${pendingCount > 1 ? "s" : ""} pending sync. They'll sync automatically when you're back online.`}
            </p>
          </div>
        )}

        {/* Cached Competitions List */}
        {cachedCompetitions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">
              {isAr ? "المسابقات المخزنة" : "Cached Competitions"}
            </h4>
            {cachedCompetitions.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectCachedCompetition?.(item.id)}
                className="w-full flex items-center gap-3 rounded-xl border border-border/50 p-3 text-start transition-all hover:bg-accent/50 hover:border-primary/20 active:scale-[0.98]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Trophy className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {isAr ? (item.competition.title_ar || item.competition.title) : item.competition.title}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {item.registrations.length} {isAr ? "مشارك" : "participant"}{item.registrations.length !== 1 ? "s" : ""} · {item.criteria.length} {isAr ? "معيار" : "criteria"}
                  </p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-chart-2 shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {cachedCompetitions.length === 0 && (
          <div className="text-center py-4">
            <WifiOff className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "اضغط 'تحميل البيانات' لتخزين بيانات التحكيم للاستخدام بدون اتصال."
                : "Click 'Download Data' to cache judging data for offline use."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
