import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type NotificationChannel = Database["public"]["Enums"]["notification_channel"];

interface NotificationPreference {
  id: string;
  channel: NotificationChannel;
  enabled: boolean;
}

const CHANNELS: { channel: NotificationChannel; label: string; labelAr: string; desc: string; descAr: string; icon: any }[] = [
  { channel: "in_app", label: "In-App Notifications", labelAr: "إشعارات داخل التطبيق", desc: "Receive notifications within the platform", descAr: "تلقي الإشعارات داخل المنصة", icon: Bell },
  { channel: "email", label: "Email", labelAr: "البريد الإلكتروني", desc: "Get important updates delivered to your email", descAr: "تلقي التحديثات المهمة عبر البريد", icon: Mail },
  { channel: "sms", label: "SMS", labelAr: "رسائل نصية", desc: "Receive text messages for urgent notifications", descAr: "تلقي رسائل نصية للإشعارات العاجلة", icon: Smartphone },
  { channel: "whatsapp", label: "WhatsApp", labelAr: "واتساب", desc: "Get messages through WhatsApp", descAr: "تلقي الرسائل عبر واتساب", icon: MessageSquare },
  { channel: "push", label: "Push Notifications", labelAr: "إشعارات الدفع", desc: "Receive notifications on your devices", descAr: "تلقي الإشعارات على أجهزتك", icon: Megaphone },
];

const NOTIFICATION_CATEGORIES = [
  {
    key: "competitions",
    label: "Competitions",
    labelAr: "المسابقات",
    desc: "Registration approvals, status changes, results",
    descAr: "الموافقة على التسجيل، تغييرات الحالة، النتائج",
    icon: Trophy,
  },
  {
    key: "invoices",
    label: "Billing & Invoices",
    labelAr: "الفواتير والمالية",
    desc: "New invoices, payments, account updates",
    descAr: "فواتير جديدة، مدفوعات، تحديثات الحساب",
    icon: FileText,
  },
  {
    key: "community",
    label: "Community",
    labelAr: "المجتمع",
    desc: "Posts, comments, and group activity",
    descAr: "المنشورات والتعليقات ونشاط المجموعات",
    icon: Users,
  },
  {
    key: "security",
    label: "Security & Account",
    labelAr: "الأمان والحساب",
    desc: "Login alerts, password changes, account activity",
    descAr: "تنبيهات تسجيل الدخول، تغيير كلمة المرور",
    icon: ShieldCheck,
  },
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
  }, [user]);

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

      for (const channelConfig of CHANNELS) {
        if (!existingChannels.has(channelConfig.channel)) {
          allPreferences.push({
            id: `new_${channelConfig.channel}`,
            channel: channelConfig.channel,
            enabled: channelConfig.channel === "in_app",
          });
        }
      }

      setPreferences(allPreferences.sort((a, b) => {
        const aIdx = CHANNELS.findIndex((c) => c.channel === a.channel);
        const bIdx = CHANNELS.findIndex((c) => c.channel === b.channel);
        return aIdx - bIdx;
      }));
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
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
        const { error } = await supabase
          .from("notification_preferences")
          .update({ enabled })
          .eq("id", existingPref.id)
          .eq("user_id", user?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("notification_preferences")
          .insert({ user_id: user?.id, channel, enabled });
        if (error) throw error;
      }

      setPreferences((prev) =>
        prev.map((p) => p.channel === channel ? { ...p, id: `saved_${channel}`, enabled } : p)
      );

      toast({ title: isAr ? "تم التحديث" : "Updated" });
    } catch (error) {
      console.error("Error updating notification preference:", error);
      toast({ title: isAr ? "خطأ" : "Error", description: isAr ? "فشل التحديث" : "Failed to update", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const enabledCount = preferences.filter((p) => p.enabled).length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title={isAr ? "تفضيلات الإشعارات" : "Notification Preferences"}
        description={isAr ? "تحكم في إعدادات الإشعارات" : "Manage your notification settings"}
      />
      <Header />

      {/* Hero Section */}
      <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
        <div className="container py-8 md:py-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 ring-1 ring-primary/20">
                <Bell className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {isAr ? "الإعدادات" : "Settings"}
                </span>
              </div>
              <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
                {isAr ? "تفضيلات الإشعارات" : "Notification Preferences"}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {isAr ? "تحكم في كيفية تلقي الإشعارات والتنبيهات." : "Control how you receive notifications and alerts."}
              </p>
            </div>

            {/* Summary badge */}
            <Badge variant="secondary" className="text-sm px-4 py-2 self-start md:self-auto">
              <Bell className="h-3.5 w-3.5 me-1.5 text-primary" />
              {loading ? "—" : enabledCount} / {CHANNELS.length} {isAr ? "مفعّل" : "Active"}
            </Badge>
          </div>
        </div>
      </section>

      <main className="container flex-1 py-6 md:py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Channel Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isAr ? "قنوات الإشعارات" : "Notification Channels"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {preferences.map((pref) => {
                    const config = CHANNELS.find((c) => c.channel === pref.channel);
                    if (!config) return null;
                    const Icon = config.icon;
                    return (
                      <div
                        key={pref.channel}
                        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`rounded-lg p-2 ${pref.enabled ? "bg-primary/10" : "bg-muted"}`}>
                            <Icon className={`h-4 w-4 ${pref.enabled ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {isAr ? config.labelAr : config.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {isAr ? config.descAr : config.desc}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={pref.enabled}
                          onCheckedChange={(enabled) => handleToggle(pref.channel, enabled)}
                          disabled={saving === pref.channel}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isAr ? "فئات الإشعارات" : "Notification Categories"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {NOTIFICATION_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.key} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {isAr ? cat.labelAr : cat.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isAr ? cat.descAr : cat.desc}
                        </p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Info */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <h3 className="font-medium text-sm">
              {isAr ? "ملاحظة" : "Note"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {isAr
                ? "سيتم إرسال الإشعارات الأمنية والإدارية بغض النظر عن تفضيلاتك."
                : "Security and administrative notifications will always be sent regardless of your preferences."}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
