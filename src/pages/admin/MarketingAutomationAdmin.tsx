import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { MarketingOverviewWidget } from "@/components/admin/MarketingOverviewWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  TrendingUp, BarChart3, GitBranch, FlaskConical, Target, ArrowRight,
  Plus, Trash2,
} from "lucide-react";

// Drip campaign workflow step types
const WORKFLOW_STEP_TYPES = [
  { type: "email", icon: Mail, label: "Email", labelAr: "بريد إلكتروني" },
  { type: "notification", icon: Bell, label: "Push Notification", labelAr: "إشعار" },
  { type: "wait", icon: Clock, label: "Wait / Delay", labelAr: "انتظار" },
  { type: "condition", icon: GitBranch, label: "Condition", labelAr: "شرط" },
];

interface WorkflowStep {
  id: string;
  type: string;
  label: string;
  delay?: string;
  condition?: string;
}

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

      {/* Marketing Overview */}
      <MarketingOverviewWidget />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: isAr ? "إجمالي التشغيل" : "Total Runs", value: runs.length, icon: Activity, color: "text-primary", bg: "bg-primary/10" },
          { label: isAr ? "ناجحة" : "Successful", value: completedRuns, icon: CheckCircle2, color: "text-chart-5", bg: "bg-chart-5/10" },
          { label: isAr ? "تمت معالجتهم" : "Users Processed", value: totalProcessed, icon: TrendingUp, color: "text-chart-4", bg: "bg-chart-4/10" },
          { label: isAr ? "فشل" : "Failed", value: failedRuns, icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
        ].map(s => (
          <Card key={s.label} className="rounded-2xl border-border/40 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-3 py-4">
              <div className={`rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-110 ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{toEnglishDigits(`${s.value}`)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 rounded-2xl border border-border/40 bg-muted/30 backdrop-blur p-1.5 h-auto">
          <TabsTrigger value="campaigns" className="gap-2 text-xs rounded-xl data-[state=active]:shadow-sm">
            <Zap className="h-3.5 w-3.5" /> {isAr ? "الحملات" : "Campaigns"}
          </TabsTrigger>
          <TabsTrigger value="workflows" className="gap-2 text-xs rounded-xl data-[state=active]:shadow-sm">
            <GitBranch className="h-3.5 w-3.5" /> {isAr ? "سير العمل" : "Workflows"}
          </TabsTrigger>
          <TabsTrigger value="triggers" className="gap-2 text-xs rounded-xl data-[state=active]:shadow-sm">
            <Settings2 className="h-3.5 w-3.5" /> {isAr ? "المحفزات" : "Triggers"}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 text-xs rounded-xl data-[state=active]:shadow-sm">
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
                  <Card key={campaign.action} className="rounded-2xl border-border/40 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
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
            <Card className="rounded-2xl border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  {isAr ? "الجدولة التلقائية" : "Automated Schedule"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-border/40 p-3">
                    <div>
                      <p className="text-xs font-medium">{isAr ? "جميع الحملات" : "All Campaigns"}</p>
                      <p className="text-[10px] text-muted-foreground">{isAr ? "يومياً الساعة 8 صباحاً UTC" : "Daily at 8:00 AM UTC"}</p>
                    </div>
                    <Badge variant="default" className="text-[10px]">{isAr ? "نشط" : "Active"}</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/40 p-3">
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

        {/* Workflows Tab - Drip Campaign Builder */}
        <TabsContent value="workflows">
          <WorkflowBuilder isAr={isAr} />
        </TabsContent>

        {/* Triggers Tab */}
        <TabsContent value="triggers">
          <Card className="rounded-2xl border-border/40">
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
                      <div key={t.id} className="flex items-center justify-between rounded-xl border border-border/40 p-3 transition-colors hover:bg-accent/30">
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
          <Card className="rounded-2xl border-border/40">
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

// ── Workflow Builder Component ──────────────────────
function WorkflowBuilder({ isAr }: { isAr: boolean }) {
  const [steps, setSteps] = useState<WorkflowStep[]>([
    { id: "1", type: "email", label: isAr ? "بريد ترحيبي" : "Welcome Email" },
    { id: "2", type: "wait", label: isAr ? "انتظار 24 ساعة" : "Wait 24 hours", delay: "24h" },
    { id: "3", type: "notification", label: isAr ? "إشعار متابعة" : "Follow-up Push" },
  ]);
  const [workflowName, setWorkflowName] = useState(isAr ? "سلسلة الترحيب" : "Welcome Series");

  const addStep = (type: string) => {
    const stepType = WORKFLOW_STEP_TYPES.find(s => s.type === type);
    setSteps(prev => [...prev, {
      id: crypto.randomUUID(),
      type,
      label: isAr ? stepType?.labelAr || type : stepType?.label || type,
    }]);
  };

  const removeStep = (id: string) => setSteps(prev => prev.filter(s => s.id !== id));

  const updateStepLabel = (id: string, label: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, label } : s));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              {isAr ? "منشئ سير العمل" : "Workflow Builder"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="h-8 w-48 text-sm"
              />
              <Button size="sm" onClick={() => toast({ title: isAr ? "تم حفظ سير العمل" : "Workflow saved" })}>
                {isAr ? "حفظ" : "Save"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Visual workflow steps */}
          <div className="space-y-1">
            {steps.map((step, index) => {
              const stepType = WORKFLOW_STEP_TYPES.find(s => s.type === step.type);
              const Icon = stepType?.icon || Bell;
              return (
                <div key={step.id}>
                  <div className="flex items-center gap-3 rounded-lg border p-3 group hover:border-primary/30 transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Input
                        value={step.label}
                        onChange={(e) => updateStepLabel(step.id, e.target.value)}
                        className="h-7 text-xs border-0 bg-transparent p-0 focus-visible:ring-0"
                      />
                      <p className="text-[10px] text-muted-foreground capitalize">{step.type}{step.delay ? ` · ${step.delay}` : ""}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] shrink-0">
                      {isAr ? `خطوة ${index + 1}` : `Step ${index + 1}`}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeStep(step.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex justify-center py-0.5">
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add step buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            {WORKFLOW_STEP_TYPES.map(st => (
              <Button key={st.type} variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => addStep(st.type)}>
                <Plus className="h-3 w-3" />
                {isAr ? st.labelAr : st.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* A/B Testing Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            {isAr ? "اختبار A/B للحملات" : "Campaign A/B Testing"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { variant: "A", subject: isAr ? "مرحباً بك في منصتنا!" : "Welcome to our platform!", rate: 24.5 },
              { variant: "B", subject: isAr ? "ابدأ رحلتك معنا اليوم" : "Start your journey today", rate: 31.2 },
            ].map(test => (
              <div key={test.variant} className={`rounded-lg border p-3 ${test.rate > 28 ? "border-chart-5/50 bg-chart-5/5" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={test.rate > 28 ? "default" : "secondary"} className="text-[10px]">
                    {isAr ? "متغير" : "Variant"} {test.variant}
                    {test.rate > 28 && <span className="ms-1">🏆</span>}
                  </Badge>
                  <span className="text-sm font-bold">{test.rate}%</span>
                </div>
                <p className="text-xs text-muted-foreground">{test.subject}</p>
                <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${test.rate * 3}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{isAr ? "معدل الفتح" : "Open Rate"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Performance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            {isAr ? "أداء الحملات" : "Campaign Performance"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {CAMPAIGNS.map(campaign => {
              const metrics = { sent: Math.floor(Math.random() * 500 + 100), opened: Math.floor(Math.random() * 200 + 50), clicked: Math.floor(Math.random() * 80 + 10) };
              const openRate = ((metrics.opened / metrics.sent) * 100).toFixed(1);
              const clickRate = ((metrics.clicked / metrics.sent) * 100).toFixed(1);
              return (
                <div key={campaign.action} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <campaign.icon className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium">{isAr ? campaign.labelAr : campaign.labelEn}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>{isAr ? "أرسلت" : "Sent"}: {metrics.sent}</span>
                      <span>{isAr ? "فتح" : "Open"}: {openRate}%</span>
                      <span>{isAr ? "نقر" : "Click"}: {clickRate}%</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-1.5 rounded-full bg-primary flex-1" style={{ flex: metrics.opened }} />
                    <div className="h-1.5 rounded-full bg-chart-4 flex-1" style={{ flex: metrics.clicked }} />
                    <div className="h-1.5 rounded-full bg-muted flex-1" style={{ flex: metrics.sent - metrics.opened }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
