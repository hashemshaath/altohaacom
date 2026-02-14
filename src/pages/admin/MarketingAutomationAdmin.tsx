import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { toEnglishDigits } from "@/lib/formatNumber";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  Zap, Play, Clock, CheckCircle2, AlertCircle, ShoppingCart,
  UserPlus, Mail, Trophy, Bell, RotateCcw, Settings2, Activity,
  TrendingUp, BarChart3,
} from "lucide-react";

const CAMPAIGNS = [
  { action: "welcome", icon: UserPlus, labelEn: "Welcome Series", labelAr: "سلسلة الترحيب", descEn: "Welcome email + notification for new users (24h)", descAr: "بريد ترحيبي + إشعار للمستخدمين الجدد (24 ساعة)" },
  { action: "cart_abandonment", icon: ShoppingCart, labelEn: "Cart Abandonment", labelAr: "سلال مهجورة", descEn: "Email + notification for abandoned carts (1h+)", descAr: "بريد + إشعار للسلال المهجورة (ساعة+)" },
  { action: "inactivity", icon: RotateCcw, labelEn: "Inactivity Re-engagement", labelAr: "إعادة التفاعل", descEn: "Reach users inactive > 7 days", descAr: "إعادة التفاعل مع المستخدمين غير النشطين > 7 أيام" },
  { action: "milestones", icon: Trophy, labelEn: "Points Milestones", labelAr: "مراحل النقاط", descEn: "Congratulate users at 100/500/1K/5K/10K points", descAr: "تهنئة المستخدمين عند 100/500/1000/5000/10000 نقطة" },
];

export default function MarketingAutomationAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();

  // Automation runs history
  const { data: runs = [], isLoading: runsLoading } = useQuery({
    queryKey: ["automation-runs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("automation_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  // Lifecycle triggers
  const { data: triggers = [] } = useQuery({
    queryKey: ["lifecycle-triggers-admin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lifecycle_triggers")
        .select("*")
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  // Run campaign manually
  const runCampaign = useMutation({
    mutationFn: async (action: string) => {
      // Log the run
      const { data: run } = await supabase
        .from("automation_runs")
        .insert({ action, status: "running", triggered_by: "manual" })
        .select("id")
        .single();

      const { data, error } = await supabase.functions.invoke("marketing-automation", {
        body: { action },
      });

      if (error) {
        if (run) await supabase.from("automation_runs").update({ status: "failed", error_message: error.message, completed_at: new Date().toISOString() }).eq("id", run.id);
        throw error;
      }

      if (run) await supabase.from("automation_runs").update({ status: "completed", results: data?.results || {}, completed_at: new Date().toISOString() }).eq("id", run.id);
      return data;
    },
    onSuccess: (data, action) => {
      queryClient.invalidateQueries({ queryKey: ["automation-runs"] });
      const results = data?.results || {};
      const count = results[action] ?? 0;
      toast({
        title: isAr ? "تم التنفيذ بنجاح ✅" : "Campaign executed ✅",
        description: isAr ? `تمت معالجة ${count} مستخدم` : `Processed ${count} users`,
      });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    },
  });

  // Run all campaigns
  const runAll = useMutation({
    mutationFn: async () => {
      const { data: run } = await supabase
        .from("automation_runs")
        .insert({ action: "all", status: "running", triggered_by: "manual" })
        .select("id")
        .single();

      const { data, error } = await supabase.functions.invoke("marketing-automation", {
        body: {},
      });

      if (error) {
        if (run) await supabase.from("automation_runs").update({ status: "failed", error_message: error.message, completed_at: new Date().toISOString() }).eq("id", run.id);
        throw error;
      }

      if (run) await supabase.from("automation_runs").update({ status: "completed", results: data?.results || {}, completed_at: new Date().toISOString() }).eq("id", run.id);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["automation-runs"] });
      toast({
        title: isAr ? "تم تنفيذ جميع الحملات ✅" : "All campaigns executed ✅",
        description: JSON.stringify(data?.results || {}),
      });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    },
  });

  // Toggle lifecycle trigger
  const toggleTrigger = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await supabase.from("lifecycle_triggers").update({ is_active }).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lifecycle-triggers-admin"] });
    },
  });

  // Stats
  const completedRuns = runs.filter(r => r.status === "completed").length;
  const failedRuns = runs.filter(r => r.status === "failed").length;
  const totalProcessed = runs
    .filter(r => r.results)
    .reduce((sum, r) => {
      const res = r.results as Record<string, number>;
      return sum + Object.values(res).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
    }, 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Zap}
        title={isAr ? "أتمتة التسويق" : "Marketing Automation"}
        description={isAr ? "إدارة الحملات التلقائية والإشعارات والبريد الإلكتروني" : "Manage automated campaigns, notifications & emails"}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-s-4 border-s-primary">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-primary/10 p-2.5"><Activity className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "إجمالي التشغيل" : "Total Runs"}</p>
              <p className="text-2xl font-bold">{toEnglishDigits(`${runs.length}`)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-4 border-s-chart-5">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-chart-5/10 p-2.5"><CheckCircle2 className="h-5 w-5 text-chart-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "ناجحة" : "Successful"}</p>
              <p className="text-2xl font-bold">{toEnglishDigits(`${completedRuns}`)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-4 border-s-chart-4">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-chart-4/10 p-2.5"><TrendingUp className="h-5 w-5 text-chart-4" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "تمت معالجتهم" : "Users Processed"}</p>
              <p className="text-2xl font-bold">{toEnglishDigits(`${totalProcessed}`)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-4 border-s-destructive">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-destructive/10 p-2.5"><AlertCircle className="h-5 w-5 text-destructive" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "فشل" : "Failed"}</p>
              <p className="text-2xl font-bold">{toEnglishDigits(`${failedRuns}`)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns" className="gap-2 text-xs">
            <Zap className="h-3.5 w-3.5" /> {isAr ? "الحملات" : "Campaigns"}
          </TabsTrigger>
          <TabsTrigger value="triggers" className="gap-2 text-xs">
            <Settings2 className="h-3.5 w-3.5" /> {isAr ? "المحفزات" : "Triggers"}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 text-xs">
            <Clock className="h-3.5 w-3.5" /> {isAr ? "السجل" : "History"}
          </TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => runAll.mutate()} disabled={runAll.isPending} className="gap-2">
                <Play className="h-4 w-4" />
                {runAll.isPending ? (isAr ? "جارٍ التنفيذ..." : "Running...") : (isAr ? "تشغيل الكل" : "Run All")}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CAMPAIGNS.map(campaign => {
                const lastRun = runs.find(r => r.action === campaign.action);
                const isRunning = runCampaign.isPending && runCampaign.variables === campaign.action;
                return (
                  <Card key={campaign.action}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <campaign.icon className="h-4 w-4 text-primary" />
                          {isAr ? campaign.labelAr : campaign.labelEn}
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => runCampaign.mutate(campaign.action)}
                          disabled={isRunning}
                        >
                          <Play className="h-3 w-3" />
                          {isRunning ? (isAr ? "تشغيل..." : "Running...") : (isAr ? "تشغيل" : "Run")}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {isAr ? campaign.descAr : campaign.descEn}
                      </p>
                      {lastRun && (
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t pt-2 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(lastRun.created_at), { addSuffix: true, locale: isAr ? ar : enUS })}
                          </span>
                          <Badge variant={lastRun.status === "completed" ? "default" : "destructive"} className="text-[10px]">
                            {lastRun.status === "completed" ? (isAr ? "ناجح" : "Success") : (isAr ? "فشل" : "Failed")}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Schedule Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  {isAr ? "الجدولة التلقائية" : "Automated Schedule"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-xs font-medium">{isAr ? "جميع الحملات" : "All Campaigns"}</p>
                      <p className="text-[10px] text-muted-foreground">{isAr ? "يومياً الساعة 8 صباحاً UTC" : "Daily at 8:00 AM UTC"}</p>
                    </div>
                    <Badge variant="default" className="text-[10px]">{isAr ? "نشط" : "Active"}</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-xs font-medium">{isAr ? "سلال مهجورة" : "Cart Abandonment"}</p>
                      <p className="text-[10px] text-muted-foreground">{isAr ? "كل ساعتين" : "Every 2 hours"}</p>
                    </div>
                    <Badge variant="default" className="text-[10px]">{isAr ? "نشط" : "Active"}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Triggers Tab */}
        <TabsContent value="triggers">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                {isAr ? "محفزات دورة حياة المستخدم" : "User Lifecycle Triggers"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {triggers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {isAr ? "لا توجد محفزات مكونة" : "No triggers configured"}
                    </p>
                  ) : (
                    triggers.map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Bell className="h-3.5 w-3.5 text-primary" />
                            <p className="text-xs font-medium">{isAr ? t.name_ar || t.name : t.name}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px]">{t.trigger_event}</Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {t.channels?.join(", ")} · {toEnglishDigits(`${t.delay_minutes}`)} {isAr ? "دقيقة" : "min"}
                            </span>
                          </div>
                        </div>
                        <Switch
                          checked={t.is_active}
                          onCheckedChange={(checked) => toggleTrigger.mutate({ id: t.id, is_active: checked })}
                        />
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                {isAr ? "سجل التشغيل" : "Execution History"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {runs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {isAr ? "لا يوجد سجل بعد" : "No history yet"}
                    </p>
                  ) : (
                    runs.map((run: any) => (
                      <div key={run.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {run.status === "completed" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-chart-5" />
                            ) : run.status === "failed" ? (
                              <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 text-chart-4 animate-pulse" />
                            )}
                            <p className="text-xs font-medium capitalize">{run.action}</p>
                            <Badge variant="secondary" className="text-[10px]">{run.triggered_by}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(run.created_at), { addSuffix: true, locale: isAr ? ar : enUS })}
                            </span>
                            {run.results && (
                              <span className="text-[10px] text-muted-foreground">
                                · {Object.entries(run.results as Record<string, number>).map(([k, v]) => `${k}: ${v}`).join(", ")}
                              </span>
                            )}
                            {run.error_message && (
                              <span className="text-[10px] text-destructive truncate max-w-[200px]">{run.error_message}</span>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={run.status === "completed" ? "default" : run.status === "failed" ? "destructive" : "secondary"}
                          className="text-[10px]"
                        >
                          {run.status === "completed" ? (isAr ? "مكتمل" : "Done") : run.status === "failed" ? (isAr ? "فشل" : "Failed") : (isAr ? "يعمل" : "Running")}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
