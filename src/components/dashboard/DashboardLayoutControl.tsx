import { useState, useCallback, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings2, Eye, EyeOff, GripVertical, RotateCcw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const LAYOUT_KEY = "altoha_dashboard_layout";

export interface WidgetConfig {
  id: string;
  labelEn: string;
  labelAr: string;
  visible: boolean;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "quick-stats", labelEn: "Quick Stats", labelAr: "إحصائيات سريعة", visible: true },
  { id: "achievements", labelEn: "Achievements", labelAr: "الإنجازات", visible: true },
  { id: "competitions", labelEn: "Competitions", labelAr: "المسابقات", visible: true },
  { id: "exhibitions", labelEn: "Exhibitions", labelAr: "المعارض", visible: true },
  { id: "masterclass", labelEn: "Masterclass", labelAr: "الدورات", visible: true },
  { id: "profile-insights", labelEn: "Profile Insights", labelAr: "رؤى الملف", visible: true },
  { id: "engagement", labelEn: "Engagement", labelAr: "التفاعل", visible: true },
  { id: "notification-activity", labelEn: "Notification Activity", labelAr: "نشاط الإشعارات", visible: true },
  { id: "content-stats", labelEn: "Content Stats", labelAr: "إحصائيات المحتوى", visible: true },
  { id: "progress-report", labelEn: "Progress Report", labelAr: "تقرير التقدم", visible: true },
  { id: "referral", labelEn: "Referrals", labelAr: "الإحالات", visible: true },
  { id: "chef-schedule", labelEn: "Chef Schedule", labelAr: "جدول الشيف", visible: true },
  { id: "events-calendar", labelEn: "Events Calendar", labelAr: "تقويم الأحداث", visible: true },
  { id: "notification-prefs", labelEn: "Notification Preferences", labelAr: "تفضيلات الإشعارات", visible: true },
  { id: "notifications", labelEn: "Notifications", labelAr: "الإشعارات", visible: true },
  { id: "activity", labelEn: "Live Activity", labelAr: "النشاط المباشر", visible: true },
];

export function useDashboardLayout() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as WidgetConfig[];
        // Merge with defaults to pick up any new widgets
        const ids = new Set(parsed.map((w) => w.id));
        return [...parsed, ...DEFAULT_WIDGETS.filter((w) => !ids.has(w.id))];
      }
    } catch {}
    return DEFAULT_WIDGETS;
  });

  const toggleWidget = useCallback((id: string) => {
    setWidgets((prev) => {
      const next = prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const moveWidget = useCallback((id: string, direction: "up" | "down") => {
    setWidgets((prev) => {
      const idx = prev.findIndex((w) => w.id === id);
      if (idx < 0) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetLayout = useCallback(() => {
    localStorage.removeItem(LAYOUT_KEY);
    setWidgets(DEFAULT_WIDGETS);
  }, []);

  const isVisible = useCallback((id: string) => {
    return widgets.find((w) => w.id === id)?.visible !== false;
  }, [widgets]);

  return { widgets, toggleWidget, moveWidget, resetLayout, isVisible };
}

export const DashboardLayoutControl = memo(function DashboardLayoutControl({ widgets, toggleWidget, resetLayout }: {
  widgets: WidgetConfig[];
  toggleWidget: (id: string) => void;
  resetLayout: () => void;
}) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7">
          <Settings2 className="h-3.5 w-3.5" />
          {isAr ? "تخصيص" : "Customize"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-xs font-semibold">{isAr ? "الويدجتات" : "Widgets"}</p>
          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={resetLayout}>
            <RotateCcw className="h-3 w-3" />
            {isAr ? "إعادة تعيين" : "Reset"}
          </Button>
        </div>
        <ScrollArea className="h-72">
          <div className="p-2 space-y-0.5">
            {widgets.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
              >
                <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                {w.visible ? (
                  <Eye className="h-3 w-3 text-chart-5 shrink-0" />
                ) : (
                  <EyeOff className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                )}
                <Label className="flex-1 text-xs cursor-pointer truncate" onClick={() => toggleWidget(w.id)}>
                  {isAr ? w.labelAr : w.labelEn}
                </Label>
                <Switch
                  checked={w.visible}
                  onCheckedChange={() => toggleWidget(w.id)}
                  className="scale-75"
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}