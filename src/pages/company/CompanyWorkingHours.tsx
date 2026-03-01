import { useState, useEffect } from "react";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, Save, Copy, RotateCcw, CalendarDays } from "lucide-react";

const DAYS = [
  { en: "Monday", ar: "الاثنين" },
  { en: "Tuesday", ar: "الثلاثاء" },
  { en: "Wednesday", ar: "الأربعاء" },
  { en: "Thursday", ar: "الخميس" },
  { en: "Friday", ar: "الجمعة" },
  { en: "Saturday", ar: "السبت" },
  { en: "Sunday", ar: "الأحد" },
];

interface DaySchedule {
  open: string;
  close: string;
  enabled: boolean;
}

type WeekSchedule = Record<string, DaySchedule>;

const defaultSchedule: WeekSchedule = Object.fromEntries(
  DAYS.map((d) => [d.en.toLowerCase(), { open: "09:00", close: "17:00", enabled: d.en !== "Friday" && d.en !== "Saturday" }])
);

const PRESETS = [
  {
    en: "Business (Sun–Thu)",
    ar: "عمل (أحد–خميس)",
    apply: (): WeekSchedule => Object.fromEntries(
      DAYS.map((d) => [d.en.toLowerCase(), {
        open: "08:00", close: "17:00",
        enabled: !["friday", "saturday"].includes(d.en.toLowerCase()),
      }])
    ),
  },
  {
    en: "Retail (All Week)",
    ar: "تجزئة (كل الأسبوع)",
    apply: (): WeekSchedule => Object.fromEntries(
      DAYS.map((d) => [d.en.toLowerCase(), { open: "10:00", close: "22:00", enabled: true }])
    ),
  },
  {
    en: "Restaurant",
    ar: "مطعم",
    apply: (): WeekSchedule => Object.fromEntries(
      DAYS.map((d) => [d.en.toLowerCase(), { open: "12:00", close: "23:00", enabled: true }])
    ),
  },
];

export default function CompanyWorkingHours() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [schedule, setSchedule] = useState<WeekSchedule>(defaultSchedule);
  const [copySource, setCopySource] = useState<string | null>(null);

  const { data: company, isLoading } = useQuery({
    queryKey: ["companyWorkingHours", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("working_hours")
        .eq("id", companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  useEffect(() => {
    if (company?.working_hours && typeof company.working_hours === "object") {
      setSchedule({ ...defaultSchedule, ...(company.working_hours as unknown as WeekSchedule) });
    }
  }, [company]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No company");
      const { error } = await supabase
        .from("companies")
        .update({ working_hours: schedule as any })
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyWorkingHours"] });
      toast({ title: isAr ? "تم الحفظ" : "Saved successfully" });
    },
    onError: () => toast({ variant: "destructive", title: isAr ? "فشل الحفظ" : "Failed to save" }),
  });

  const updateDay = (day: string, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const handleCopy = (dayKey: string) => {
    if (copySource === null) {
      setCopySource(dayKey);
      toast({ title: isAr ? "اختر اليوم للصق" : "Click another day to paste hours" });
    } else {
      const src = schedule[copySource];
      setSchedule((prev) => ({ ...prev, [dayKey]: { ...src } }));
      setCopySource(null);
      toast({ title: isAr ? "تم نسخ الساعات" : "Hours copied" });
    }
  };

  const openDays = DAYS.filter((d) => schedule[d.en.toLowerCase()]?.enabled);
  const closedDays = DAYS.filter((d) => !schedule[d.en.toLowerCase()]?.enabled);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            {isAr ? "ساعات العمل" : "Working Hours"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isAr ? "إدارة ساعات عمل الشركة" : "Manage company operating hours"}
          </p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="me-2 h-4 w-4" />
          {saveMutation.isPending ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save")}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-s-[3px] border-s-chart-5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-chart-5/10 p-2.5">
              <CalendarDays className="h-5 w-5 text-chart-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "أيام العمل" : "Working Days"}</p>
              <p className="text-lg font-bold">{openDays.length} {isAr ? "أيام" : "days"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-muted-foreground">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-muted p-2.5">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "أيام الإغلاق" : "Closed Days"}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {closedDays.length > 0 ? closedDays.map((d) => (
                  <Badge key={d.en} variant="secondary" className="text-xs">
                    {isAr ? d.ar : d.en}
                  </Badge>
                )) : (
                  <span className="text-sm text-muted-foreground">{isAr ? "لا يوجد" : "None"}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Presets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {isAr ? "قوالب سريعة" : "Quick Presets"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {PRESETS.map((p, i) => (
            <Button key={i} variant="outline" size="sm" onClick={() => {
              setSchedule(p.apply());
              toast({ title: isAr ? "تم تطبيق القالب" : "Preset applied" });
            }}>
              <RotateCcw className="me-2 h-3 w-3" />
              {isAr ? p.ar : p.en}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isAr ? "الجدول الأسبوعي" : "Weekly Schedule"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAYS.map((day) => {
            const key = day.en.toLowerCase();
            const s = schedule[key] || defaultSchedule[key];
            const isCopyTarget = copySource !== null && copySource !== key;
            return (
              <div
                key={key}
                className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${
                  isCopyTarget ? "border-primary/50 bg-primary/5 cursor-pointer" : ""
                } ${copySource === key ? "border-primary bg-primary/10" : ""}`}
                onClick={isCopyTarget ? () => handleCopy(key) : undefined}
              >
                <Switch
                  checked={s.enabled}
                  onCheckedChange={(val) => updateDay(key, "enabled", val)}
                />
                <div className="w-28 font-medium">
                  {isAr ? day.ar : day.en}
                </div>
                {s.enabled ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={s.open}
                      onChange={(e) => updateDay(key, "open", e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">—</span>
                    <Input
                      type="time"
                      value={s.close}
                      onChange={(e) => updateDay(key, "close", e.target.value)}
                      className="w-32"
                    />
                    <Button
                      variant={copySource === key ? "default" : "ghost"}
                      size="icon"
                      className="ms-auto h-8 w-8 shrink-0"
                      onClick={(e) => { e.stopPropagation(); handleCopy(key); }}
                      title={isAr ? "نسخ الساعات" : "Copy hours"}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {isAr ? "مغلق" : "Closed"}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
