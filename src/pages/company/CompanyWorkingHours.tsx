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
import { useToast } from "@/hooks/use-toast";
import { Clock, Save } from "lucide-react";

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

export default function CompanyWorkingHours() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [schedule, setSchedule] = useState<WeekSchedule>(defaultSchedule);

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
      toast({ title: language === "ar" ? "تم الحفظ" : "Saved successfully" });
    },
    onError: () => toast({ variant: "destructive", title: language === "ar" ? "فشل الحفظ" : "Failed to save" }),
  });

  const updateDay = (day: string, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

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
            {language === "ar" ? "ساعات العمل" : "Working Hours"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {language === "ar" ? "إدارة ساعات عمل الشركة" : "Manage company operating hours"}
          </p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {saveMutation.isPending ? (language === "ar" ? "جارٍ الحفظ..." : "Saving...") : (language === "ar" ? "حفظ" : "Save")}
        </Button>
      </div>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === "ar" ? "الجدول الأسبوعي" : "Weekly Schedule"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day) => {
            const key = day.en.toLowerCase();
            const s = schedule[key] || defaultSchedule[key];
            return (
              <div key={key} className="flex items-center gap-4 rounded-lg border p-4">
                <Switch
                  checked={s.enabled}
                  onCheckedChange={(val) => updateDay(key, "enabled", val)}
                />
                <div className="w-28 font-medium">
                  {language === "ar" ? day.ar : day.en}
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
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" ? "مغلق" : "Closed"}
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
