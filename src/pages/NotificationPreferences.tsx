import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Megaphone,
  Trophy,
  FileText,
  Users,
  ShieldCheck,
  Settings2,
  Info,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type NotificationChannel = Database["public"]["Enums"]["notification_channel"];

interface NotificationPreference {
  id: string;
  channel: NotificationChannel;
  enabled: boolean;
}

const CHANNELS: { channel: NotificationChannel; label: string; labelAr: string; desc: string; descAr: string; icon: React.ElementType }[] = [
  { channel: "in_app", label: "In-App", labelAr: "داخل التطبيق", desc: "Real-time alerts inside the platform", descAr: "تنبيهات فورية داخل المنصة", icon: Bell },
  { channel: "email", label: "Email", labelAr: "البريد الإلكتروني", desc: "Important updates delivered to your inbox", descAr: "تحديثات مهمة تصل إلى بريدك", icon: Mail },
  { channel: "sms", label: "SMS", labelAr: "رسائل نصية", desc: "Urgent notifications via text message", descAr: "إشعارات عاجلة عبر الرسائل النصية", icon: Smartphone },
  { channel: "whatsapp", label: "WhatsApp", labelAr: "واتساب", desc: "Receive messages through WhatsApp", descAr: "استقبال الرسائل عبر واتساب", icon: MessageSquare },
  { channel: "push", label: "Push", labelAr: "إشعارات الدفع", desc: "Browser and device push notifications", descAr: "إشعارات المتصفح والأجهزة", icon: Megaphone },
];

const NOTIFICATION_CATEGORIES = [
  { key: "competitions", label: "Competitions & Events", labelAr: "المسابقات والفعاليات", desc: "Registration, results, and status updates", descAr: "التسجيل والنتائج وتحديثات الحالة", icon: Trophy },
  { key: "invoices", label: "Billing & Payments", labelAr: "الفواتير والمدفوعات", desc: "Invoices, receipts, and payment confirmations", descAr: "الفواتير والإيصالات وتأكيدات الدفع", icon: FileText },
  { key: "community", label: "Community & Social", labelAr: "المجتمع والتواصل", desc: "Posts, comments, mentions, and group activity", descAr: "المنشورات والتعليقات والإشارات", icon: Users },
  { key: "security", label: "Security & Account", labelAr: "الأمان والحساب", desc: "Login alerts, password changes, and sessions", descAr: "تنبيهات الدخول وتغيير كلمة المرور", icon: ShieldCheck },
];

export default function NotificationPreferences() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

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
      if (data) allPreferences.push(...data);

      for (const ch of CHANNELS) {
        if (!existingChannels.has(ch.channel)) {
          allPreferences.push({ id: `new_${ch.channel}`, channel: ch.channel, enabled: ch.channel === "in_app" });
        }
      }

      setPreferences(allPreferences.sort((a, b) => {
        const aIdx = CHANNELS.findIndex((c) => c.channel === a.channel);
        const bIdx = CHANNELS.findIndex((c) => c.channel === b.channel);
        return aIdx - bIdx;
      }));
    } catch {
      toast({ title: isAr ? "خطأ" : "Error", description: isAr ? "فشل تحميل الإعدادات" : "Failed to load preferences", variant: "destructive" });
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
      toast({ title: isAr ? "تم الحفظ" : "Saved" });
    } catch {
      toast({ title: isAr ? "خطأ" : "Error", description: isAr ? "فشل التحديث" : "Update failed", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const enabledCount = preferences.filter((p) => p.enabled).length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title={isAr ? "تفضيلات الإشعارات | Altohaa" : "Notification Preferences | Altohaa"}
        description={isAr ? "تحكم بقنوات وفئات الإشعارات الخاصة بك على منصة الطهاة" : "Manage your notification channels and categories on the culinary platform"}
      />
      <Header />

      {/* Hero */}
      <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background" aria-labelledby="notif-heading">
        <div className="container py-8 md:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 ring-1 ring-primary/20">
                <Settings2 className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {isAr ? "إعدادات" : "Settings"}
                </span>
              </div>
              <h1 id="notif-heading" className="font-serif text-2xl font-bold tracking-tight md:text-3xl">
                {isAr ? "تفضيلات الإشعارات" : "Notification Preferences"}
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                {isAr ? "اختر القنوات والفئات التي تناسبك لتلقي الإشعارات المهمة فقط." : "Choose the channels and categories that matter to you — stay informed without the noise."}
              </p>
            </div>
            <Badge variant="secondary" className="text-sm px-4 py-2 self-start sm:self-auto gap-1.5">
              <Bell className="h-3.5 w-3.5 text-primary" />
              {loading ? "—" : enabledCount} / {CHANNELS.length} {isAr ? "مفعّل" : "active"}
            </Badge>
          </div>
        </div>
      </section>

      <main className="container flex-1 py-6 md:py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Delivery Channels */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                {isAr ? "قنوات التوصيل" : "Delivery Channels"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr ? "حدد الطرق المفضلة لاستقبال الإشعارات" : "Select how you'd like to receive notifications"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
                </div>
              ) : (
                preferences.map((pref, idx) => {
                  const config = CHANNELS.find((c) => c.channel === pref.channel);
                  if (!config) return null;
                  const Icon = config.icon;
                  return (
                    <div key={pref.channel}>
                      {idx > 0 && <Separator />}
                      <label className="flex items-center justify-between py-3.5 cursor-pointer group" htmlFor={`ch-${pref.channel}`}>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${pref.enabled ? "bg-primary/10" : "bg-muted"}`}>
                            <Icon className={`h-4 w-4 transition-colors ${pref.enabled ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{isAr ? config.labelAr : config.label}</p>
                            <p className="text-xs text-muted-foreground">{isAr ? config.descAr : config.desc}</p>
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

          {/* Notification Categories */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                {isAr ? "فئات الإشعارات" : "Notification Categories"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr ? "تحكم في أنواع الإشعارات التي تتلقاها" : "Control the types of notifications you receive"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              {NOTIFICATION_CATEGORIES.map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.key}>
                    {idx > 0 && <Separator />}
                    <label className="flex items-center justify-between py-3.5 cursor-pointer" htmlFor={`cat-${cat.key}`}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{isAr ? cat.labelAr : cat.label}</p>
                          <p className="text-xs text-muted-foreground">{isAr ? cat.descAr : cat.desc}</p>
                        </div>
                      </div>
                      <Switch id={`cat-${cat.key}`} defaultChecked />
                    </label>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Info Note */}
          <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{isAr ? "ملاحظة مهمة" : "Important Note"}</p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                {isAr
                  ? "الإشعارات الأمنية والإدارية ستصلك دائماً بغض النظر عن تفضيلاتك لضمان حماية حسابك."
                  : "Security and administrative notifications are always delivered regardless of your preferences to ensure account safety."}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
