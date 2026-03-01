import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import {
  Bell, Mail, MessageSquare, Smartphone, Megaphone,
  Trophy, FileText, Users, ShieldCheck, Settings2, Info,
  Moon, Clock, Zap, Volume2, VolumeX, BellOff, BellRing,
  CheckCircle2, AlertTriangle, Globe, Palette, ToggleLeft,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type NotificationChannel = Database["public"]["Enums"]["notification_channel"];

interface NotificationPreference {
  id: string;
  channel: NotificationChannel;
  enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  digest_frequency: string | null;
  muted_types: string[] | null;
}

const CHANNELS: { channel: NotificationChannel; label: string; labelAr: string; desc: string; descAr: string; icon: React.ElementType; color: string }[] = [
  { channel: "in_app", label: "In-App Notifications", labelAr: "إشعارات التطبيق", desc: "Real-time alerts inside the platform", descAr: "تنبيهات فورية داخل المنصة", icon: Bell, color: "text-primary" },
  { channel: "email", label: "Email Notifications", labelAr: "إشعارات البريد الإلكتروني", desc: "Important updates delivered to your inbox", descAr: "تحديثات مهمة تصل إلى بريدك", icon: Mail, color: "text-chart-2" },
  { channel: "sms", label: "SMS Notifications", labelAr: "الرسائل النصية", desc: "Urgent notifications via text message", descAr: "إشعارات عاجلة عبر الرسائل النصية", icon: Smartphone, color: "text-chart-3" },
  { channel: "whatsapp", label: "WhatsApp", labelAr: "واتساب", desc: "Receive messages through WhatsApp", descAr: "استقبال الرسائل عبر واتساب", icon: MessageSquare, color: "text-chart-4" },
  { channel: "push", label: "Push Notifications", labelAr: "إشعارات الدفع", desc: "Browser and device push notifications", descAr: "إشعارات المتصفح والأجهزة", icon: Megaphone, color: "text-chart-5" },
];

const NOTIFICATION_CATEGORIES = [
  { key: "competitions", label: "Competitions & Events", labelAr: "المسابقات والفعاليات", desc: "Registration, results, and status updates", descAr: "التسجيل والنتائج وتحديثات الحالة", icon: Trophy, priority: "high" },
  { key: "invoices", label: "Billing & Payments", labelAr: "الفواتير والمدفوعات", desc: "Invoices, receipts, and payment confirmations", descAr: "الفواتير والإيصالات وتأكيدات الدفع", icon: FileText, priority: "high" },
  { key: "community", label: "Community & Social", labelAr: "المجتمع والتواصل", desc: "Posts, comments, mentions, and group activity", descAr: "المنشورات والتعليقات والإشارات", icon: Users, priority: "medium" },
  { key: "security", label: "Security & Account", labelAr: "الأمان والحساب", desc: "Login alerts, password changes, and sessions", descAr: "تنبيهات الدخول وتغيير كلمة المرور", icon: ShieldCheck, priority: "critical" },
  { key: "exhibitions", label: "Exhibitions & Trade Shows", labelAr: "المعارض والأحداث التجارية", desc: "Exhibition updates, booth assignments, schedules", descAr: "تحديثات المعارض والأجنحة والجداول", icon: Globe, priority: "medium" },
  { key: "orders", label: "Orders & Shipping", labelAr: "الطلبات والشحن", desc: "Order confirmations, tracking, and delivery", descAr: "تأكيدات الطلبات والتتبع والتسليم", icon: FileText, priority: "high" },
];

const DIGEST_OPTIONS = [
  { value: "realtime", label: "Real-time", labelAr: "فوري", desc: "Get notified instantly", descAr: "إشعار فوري لكل حدث" },
  { value: "hourly", label: "Hourly digest", labelAr: "ملخص كل ساعة", desc: "Bundled every hour", descAr: "تجميع كل ساعة" },
  { value: "daily", label: "Daily digest", labelAr: "ملخص يومي", desc: "One summary per day", descAr: "ملخص واحد يومياً" },
  { value: "weekly", label: "Weekly digest", labelAr: "ملخص أسبوعي", desc: "Weekly roundup", descAr: "ملخص أسبوعي شامل" },
];

export default function NotificationPreferences() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [mutedTypes, setMutedTypes] = useState<Set<string>>(new Set());
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("08:00");
  const [quietEnabled, setQuietEnabled] = useState(false);
  const [digestFrequency, setDigestFrequency] = useState("realtime");
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("altoha_sound_enabled") !== "false");
  const [dndMode, setDndMode] = useState(() => localStorage.getItem("altoha_dnd") === "true");

  useEffect(() => {
    if (!user) return;
    fetchPreferences();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user?.id);
      if (error) throw error;

      const existingChannels = new Set(data?.map((p) => p.channel) || []);
      const allPreferences: NotificationPreference[] = [];
      if (data) allPreferences.push(...(data as NotificationPreference[]));

      for (const ch of CHANNELS) {
        if (!existingChannels.has(ch.channel)) {
          allPreferences.push({ id: `new_${ch.channel}`, channel: ch.channel, enabled: ch.channel === "in_app", quiet_hours_start: null, quiet_hours_end: null, digest_frequency: null, muted_types: null });
        }
      }

      const firstExisting = data?.find(p => p.quiet_hours_start);
      if (firstExisting) {
        setQuietStart((firstExisting as any).quiet_hours_start || "22:00");
        setQuietEnd((firstExisting as any).quiet_hours_end || "08:00");
        setQuietEnabled(true);
      }
      const digestPref = data?.find(p => (p as any).digest_frequency);
      if (digestPref) setDigestFrequency((digestPref as any).digest_frequency || "realtime");

      const mutedPref = data?.find(p => (p as any).muted_types?.length > 0);
      if (mutedPref) setMutedTypes(new Set((mutedPref as any).muted_types || []));

      setPreferences(allPreferences.sort((a, b) => {
        const aIdx = CHANNELS.findIndex((c) => c.channel === a.channel);
        const bIdx = CHANNELS.findIndex((c) => c.channel === b.channel);
        return aIdx - bIdx;
      }));
    } catch {
      toast({ title: t("Error", "خطأ"), description: t("Failed to load preferences", "فشل تحميل الإعدادات"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (channel: NotificationChannel, enabled: boolean) => {
    setSaving(channel);
    try {
      const existingPref = preferences.find((p) => p.channel === channel);
      if (existingPref && !existingPref.id.startsWith("new_")) {
        const { error } = await supabase.from("notification_preferences").update({ enabled }).eq("id", existingPref.id).eq("user_id", user?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("notification_preferences").insert({ user_id: user?.id, channel, enabled });
        if (error) throw error;
      }
      setPreferences((prev) => prev.map((p) => p.channel === channel ? { ...p, id: `saved_${channel}`, enabled } : p));
      toast({ title: t("Saved", "تم الحفظ") });
    } catch {
      toast({ title: t("Error", "خطأ"), description: t("Update failed", "فشل التحديث"), variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const handleQuietHoursChange = async (enabled: boolean) => {
    setQuietEnabled(enabled);
    setSaving("quiet");
    try {
      const inAppPref = preferences.find(p => p.channel === "in_app" && !p.id.startsWith("new_"));
      if (inAppPref) {
        await supabase.from("notification_preferences").update({
          quiet_hours_start: enabled ? quietStart : null,
          quiet_hours_end: enabled ? quietEnd : null,
        }).eq("id", inAppPref.id).eq("user_id", user?.id);
      }
      toast({ title: t("Saved", "تم الحفظ") });
    } catch {
      toast({ title: t("Error", "خطأ"), variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const handleQuietTimeUpdate = async (field: "start" | "end", value: string) => {
    if (field === "start") setQuietStart(value);
    else setQuietEnd(value);
    if (!quietEnabled) return;
    const inAppPref = preferences.find(p => p.channel === "in_app" && !p.id.startsWith("new_"));
    if (inAppPref) {
      await supabase.from("notification_preferences").update({
        quiet_hours_start: field === "start" ? value : quietStart,
        quiet_hours_end: field === "end" ? value : quietEnd,
      }).eq("id", inAppPref.id).eq("user_id", user?.id);
    }
  };

  const handleDigestChange = async (value: string) => {
    setDigestFrequency(value);
    setSaving("digest");
    try {
      const emailPref = preferences.find(p => p.channel === "email" && !p.id.startsWith("new_"));
      if (emailPref) {
        await supabase.from("notification_preferences").update({ digest_frequency: value }).eq("id", emailPref.id).eq("user_id", user?.id);
      }
      toast({ title: t("Saved", "تم الحفظ") });
    } catch {
      toast({ title: t("Error", "خطأ"), variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const handleCategoryToggle = async (categoryKey: string, enabled: boolean) => {
    const newMuted = new Set(mutedTypes);
    if (enabled) newMuted.delete(categoryKey);
    else newMuted.add(categoryKey);
    setMutedTypes(newMuted);
    try {
      const inAppPref = preferences.find(p => p.channel === "in_app" && !p.id.startsWith("new_"));
      if (inAppPref) {
        await supabase.from("notification_preferences").update({
          muted_types: Array.from(newMuted),
        }).eq("id", inAppPref.id).eq("user_id", user?.id);
      }
    } catch {
      toast({ title: t("Error", "خطأ"), variant: "destructive" });
    }
  };

  const toggleSound = (v: boolean) => {
    setSoundEnabled(v);
    localStorage.setItem("altoha_sound_enabled", String(v));
  };

  const toggleDnd = (v: boolean) => {
    setDndMode(v);
    localStorage.setItem("altoha_dnd", String(v));
  };

  const enabledCount = preferences.filter((p) => p.enabled).length;
  const activeCategories = NOTIFICATION_CATEGORIES.length - mutedTypes.size;
  const completionScore = Math.round(
    ((enabledCount > 0 ? 25 : 0) + (quietEnabled ? 25 : 0) + (digestFrequency !== "realtime" ? 25 : 0) + (activeCategories > 0 ? 25 : 0))
  );

  return (
    <PageShell
      title={t("Notification Preferences", "تفضيلات الإشعارات")}
      description={t("Manage your notification channels and categories", "تحكم بقنوات وفئات الإشعارات")}
      container={false}
      padding="none"
    >
      {/* Hero */}
      <section className="border-b border-border/20 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background">
        <div className="container py-8 md:py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-primary/8 px-3.5 py-1.5 ring-1 ring-primary/15">
                <Settings2 className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {t("Settings", "إعدادات")}
                </span>
              </div>
              <h1 className="text-2xl font-black md:text-3xl tracking-tight">
                {t("Notification Preferences", "تفضيلات الإشعارات")}
              </h1>
              <p className="text-muted-foreground/70 text-sm leading-relaxed max-w-lg">
                {t(
                  "Choose the channels and categories that matter to you — stay informed without the noise.",
                  "اختر القنوات والفئات التي تناسبك لتلقي الإشعارات المهمة فقط."
                )}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="flex flex-wrap gap-3 shrink-0">
              <div className="flex items-center gap-3 rounded-2xl border border-border/20 bg-card/60 backdrop-blur-sm px-4 py-3.5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <BellRing className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-black leading-none tabular-nums">{loading ? "—" : enabledCount}</p>
                  <p className="text-[9px] text-muted-foreground/60 mt-0.5 font-bold uppercase tracking-widest">{t("Active channels", "قنوات مفعّلة")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border/20 bg-card/60 backdrop-blur-sm px-4 py-3.5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-2/10">
                  <ToggleLeft className="h-4 w-4 text-chart-2" />
                </div>
                <div>
                  <p className="text-xl font-black leading-none tabular-nums">{activeCategories}</p>
                  <p className="text-[9px] text-muted-foreground/60 mt-0.5 font-bold uppercase tracking-widest">{t("Active categories", "فئات نشطة")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Setup Progress */}
          {!loading && (
            <div className="mt-6 rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-4">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-bold">{t("Setup completion", "اكتمال الإعداد")}</p>
                <Badge variant={completionScore === 100 ? "default" : "secondary"} className="text-[10px] rounded-lg">
                  {completionScore}%
                </Badge>
              </div>
              <Progress value={completionScore} className="h-1.5" />
            </div>
          )}
        </div>
      </section>

      <main className="container flex-1 py-6 md:py-8">
        <div className="mx-auto max-w-3xl">
          <Tabs defaultValue="channels" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-12 rounded-2xl bg-muted/30 p-1">
              <TabsTrigger value="channels" className="text-xs gap-1.5 rounded-xl data-[state=active]:shadow-sm">
                <Bell className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("Channels", "القنوات")}</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="text-xs gap-1.5 rounded-xl data-[state=active]:shadow-sm">
                <Palette className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("Categories", "الفئات")}</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="text-xs gap-1.5 rounded-xl data-[state=active]:shadow-sm">
                <Clock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("Schedule", "الجدولة")}</span>
              </TabsTrigger>
              <TabsTrigger value="general" className="text-xs gap-1.5 rounded-xl data-[state=active]:shadow-sm">
                <Settings2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("General", "عام")}</span>
              </TabsTrigger>
            </TabsList>

            {/* ─── CHANNELS TAB ─── */}
            <TabsContent value="channels" className="space-y-4">
              {/* DND Banner */}
              {dndMode && (
                <div className="flex items-center gap-3 rounded-2xl border border-chart-4/20 bg-chart-4/[0.03] p-4">
                  <BellOff className="h-5 w-5 text-chart-4 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-chart-4">{t("Do Not Disturb is ON", "وضع عدم الإزعاج مفعّل")}</p>
                    <p className="text-xs text-muted-foreground/60">{t("You won't receive any notifications until you turn this off", "لن تتلقى أي إشعارات حتى إيقاف هذا الوضع")}</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => toggleDnd(false)}>{t("Turn Off", "إيقاف")}</Button>
                </div>
              )}

              <Card className="rounded-2xl border-border/20 bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        {t("Delivery Channels", "قنوات التوصيل")}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {t("Select how you'd like to receive notifications", "حدد الطرق المفضلة لاستقبال الإشعارات")}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                      {enabledCount}/{CHANNELS.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-0">
                  {loading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
                    </div>
                  ) : (
                    preferences.map((pref, idx) => {
                      const config = CHANNELS.find((c) => c.channel === pref.channel);
                      if (!config) return null;
                      const Icon = config.icon;
                      return (
                        <div key={pref.channel}>
                          {idx > 0 && <Separator />}
                          <label className="flex items-center justify-between py-4 cursor-pointer group" htmlFor={`ch-${pref.channel}`}>
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${pref.enabled ? "bg-primary/10 shadow-sm" : "bg-muted"}`}>
                                <Icon className={`h-4.5 w-4.5 transition-colors ${pref.enabled ? config.color : "text-muted-foreground"}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold">{isAr ? config.labelAr : config.label}</p>
                                  {pref.enabled && (
                                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-primary/5 text-primary">
                                      {t("Active", "مفعّل")}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{isAr ? config.descAr : config.desc}</p>
                              </div>
                            </div>
                            <Switch
                              id={`ch-${pref.channel}`}
                              checked={pref.enabled}
                              onCheckedChange={(enabled) => handleToggle(pref.channel, enabled)}
                              disabled={saving === pref.channel}
                            />
                          </label>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── CATEGORIES TAB ─── */}
            <TabsContent value="categories" className="space-y-4">
              <Card className="rounded-2xl border-border/20 bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Palette className="h-4 w-4 text-primary" />
                        {t("Notification Categories", "فئات الإشعارات")}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {t("Control the types of notifications you receive", "تحكم في أنواع الإشعارات التي تتلقاها")}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        if (mutedTypes.size === 0) {
                          const allKeys = NOTIFICATION_CATEGORIES.filter(c => c.priority !== "critical").map(c => c.key);
                          setMutedTypes(new Set(allKeys));
                        } else {
                          setMutedTypes(new Set());
                        }
                      }}
                    >
                      {mutedTypes.size === 0 ? t("Mute All", "كتم الكل") : t("Enable All", "تفعيل الكل")}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-0">
                  {NOTIFICATION_CATEGORIES.map((cat, idx) => {
                    const Icon = cat.icon;
                    const isMuted = mutedTypes.has(cat.key);
                    const isCritical = cat.priority === "critical";
                    return (
                      <div key={cat.key}>
                        {idx > 0 && <Separator />}
                        <label className="flex items-center justify-between py-4 cursor-pointer" htmlFor={`cat-${cat.key}`}>
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${!isMuted ? "bg-primary/10" : "bg-muted"}`}>
                              <Icon className={`h-4.5 w-4.5 transition-colors ${!isMuted ? "text-primary" : "text-muted-foreground"}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold">{isAr ? cat.labelAr : cat.label}</p>
                                {isCritical && (
                                  <Badge variant="destructive" className="text-[9px] h-4 px-1.5">
                                    {t("Required", "مطلوب")}
                                  </Badge>
                                )}
                                {cat.priority === "high" && !isMuted && (
                                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-chart-4/10 text-chart-4">
                                    {t("Important", "مهم")}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{isAr ? cat.descAr : cat.desc}</p>
                            </div>
                          </div>
                          <Switch
                            id={`cat-${cat.key}`}
                            checked={!isMuted}
                            onCheckedChange={(enabled) => handleCategoryToggle(cat.key, enabled)}
                            disabled={isCritical}
                          />
                        </label>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Security Note */}
              <div className="flex items-start gap-3 rounded-2xl border border-chart-4/15 bg-chart-4/[0.03] p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-chart-4" />
                <div>
                  <p className="text-sm font-medium">{t("Security Notice", "ملاحظة أمنية")}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    {t(
                      "Security and administrative notifications are always delivered regardless of your preferences to ensure account safety.",
                      "الإشعارات الأمنية والإدارية ستصلك دائماً بغض النظر عن تفضيلاتك لضمان حماية حسابك."
                    )}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* ─── SCHEDULE TAB ─── */}
            <TabsContent value="schedule" className="space-y-4">
              {/* Quiet Hours */}
              <Card className="rounded-2xl border-border/20 bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Moon className="h-4 w-4 text-primary" />
                    {t("Quiet Hours", "ساعات الهدوء")}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t("Pause notifications during a set time period", "إيقاف الإشعارات مؤقتاً خلال فترة محددة")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${quietEnabled ? "bg-primary/10" : "bg-muted"}`}>
                        <Clock className={`h-4.5 w-4.5 transition-colors ${quietEnabled ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{t("Enable Quiet Hours", "تفعيل ساعات الهدوء")}</p>
                        <p className="text-xs text-muted-foreground">{t("No notifications during this period", "لن تتلقى إشعارات خلال هذه الفترة")}</p>
                      </div>
                    </div>
                    <Switch checked={quietEnabled} onCheckedChange={handleQuietHoursChange} disabled={saving === "quiet"} />
                  </div>
                  {quietEnabled && (
                    <div className="grid grid-cols-2 gap-4 ps-[52px] animate-in fade-in-50 slide-in-from-top-2 duration-300">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">{t("From", "من")}</Label>
                        <Input type="time" value={quietStart} onChange={(e) => handleQuietTimeUpdate("start", e.target.value)} className="h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">{t("To", "إلى")}</Label>
                        <Input type="time" value={quietEnd} onChange={(e) => handleQuietTimeUpdate("end", e.target.value)} className="h-10" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Digest Frequency */}
              <Card className="rounded-2xl border-border/20 bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    {t("Digest Frequency", "تردد الملخصات")}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t("How often should we send email digests?", "كيف تريد تلقي ملخصات الإشعارات عبر البريد؟")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {DIGEST_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleDigestChange(opt.value)}
                        disabled={saving === "digest"}
                        className={`rounded-2xl border p-4 text-start transition-all duration-200 ${
                          digestFrequency === opt.value
                            ? "border-primary/30 bg-primary/5 ring-1 ring-primary/15 shadow-sm"
                            : "border-border/20 hover:border-border/40 hover:bg-muted/20"
                        }`}
                      >
                        <p className={`text-sm font-medium ${digestFrequency === opt.value ? "text-primary" : ""}`}>
                          {isAr ? opt.labelAr : opt.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{isAr ? opt.descAr : opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── GENERAL TAB ─── */}
            <TabsContent value="general" className="space-y-4">
              <Card className="rounded-2xl border-border/20 bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    {t("General Settings", "إعدادات عامة")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  {/* Sound */}
                  <label className="flex items-center justify-between py-4 cursor-pointer" htmlFor="sound-toggle">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${soundEnabled ? "bg-chart-5/10" : "bg-muted"}`}>
                        {soundEnabled ? <Volume2 className="h-4.5 w-4.5 text-chart-5" /> : <VolumeX className="h-4.5 w-4.5 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{t("Notification Sound", "صوت الإشعارات")}</p>
                        <p className="text-xs text-muted-foreground">{t("Play sound when a new notification arrives", "تشغيل صوت عند وصول إشعار جديد")}</p>
                      </div>
                    </div>
                    <Switch id="sound-toggle" checked={soundEnabled} onCheckedChange={toggleSound} />
                  </label>

                  <Separator />

                  {/* DND */}
                  <label className="flex items-center justify-between py-4 cursor-pointer" htmlFor="dnd-toggle">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${dndMode ? "bg-chart-4/10" : "bg-muted"}`}>
                        {dndMode ? <BellOff className="h-4.5 w-4.5 text-chart-4" /> : <Moon className="h-4.5 w-4.5 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{t("Do Not Disturb", "وضع عدم الإزعاج")}</p>
                        <p className="text-xs text-muted-foreground">{t("Temporarily pause all notifications", "إيقاف جميع الإشعارات مؤقتاً")}</p>
                      </div>
                    </div>
                    <Switch id="dnd-toggle" checked={dndMode} onCheckedChange={toggleDnd} />
                  </label>
                </CardContent>
              </Card>

              {/* Info Note */}
              <div className="flex items-start gap-3 rounded-2xl border border-border/20 bg-muted/15 p-4">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("Important Note", "ملاحظة مهمة")}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    {t(
                      "Your preferences are saved automatically on each change. Local settings like sound and DND are saved in your browser.",
                      "يتم حفظ تفضيلاتك تلقائياً عند كل تغيير. الإعدادات المحلية مثل الصوت وعدم الإزعاج تُحفظ في متصفحك."
                    )}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </PageShell>
  );
}
