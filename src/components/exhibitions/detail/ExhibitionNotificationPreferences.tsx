import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, CalendarClock, Ticket, Users, Star, Radio, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

interface NotifPrefs {
  schedule_changes: boolean;
  new_sessions: boolean;
  ticket_updates: boolean;
  reviews: boolean;
  live_sessions: boolean;
  announcements: boolean;
  booth_updates: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  schedule_changes: true,
  new_sessions: true,
  ticket_updates: true,
  reviews: true,
  live_sessions: true,
  announcements: true,
  booth_updates: true,
};

const STORAGE_KEY = (exhibitionId: string) => `altoha_exhibition_notif_prefs_${exhibitionId}`;

export function ExhibitionNotificationPreferences({ exhibitionId, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [allEnabled, setAllEnabled] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY(exhibitionId));
      if (stored) setPrefs(JSON.parse(stored));
    } catch {}
  }, [exhibitionId]);

  const updatePref = (key: keyof NotifPrefs, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    localStorage.setItem(STORAGE_KEY(exhibitionId), JSON.stringify(updated));
    toast.success(t("Preferences saved", "تم حفظ التفضيلات"));
  };

  const toggleAll = (enabled: boolean) => {
    setAllEnabled(enabled);
    const updated = Object.fromEntries(Object.keys(prefs).map(k => [k, enabled])) as unknown as NotifPrefs;
    setPrefs(updated);
    localStorage.setItem(STORAGE_KEY(exhibitionId), JSON.stringify(updated));
    toast.success(enabled ? t("All notifications enabled", "تم تفعيل جميع الإشعارات") : t("All notifications disabled", "تم تعطيل جميع الإشعارات"));
  };

  if (!user) return null;

  const items: { key: keyof NotifPrefs; label: string; labelAr: string; desc: string; descAr: string; icon: any }[] = [
    { key: "schedule_changes", label: "Schedule Changes", labelAr: "تغييرات الجدول", desc: "Get notified about schedule updates", descAr: "إشعارات عن تحديثات الجدول", icon: CalendarClock },
    { key: "new_sessions", label: "New Sessions", labelAr: "جلسات جديدة", desc: "When new sessions are added", descAr: "عند إضافة جلسات جديدة", icon: Radio },
    { key: "ticket_updates", label: "Ticket Updates", labelAr: "تحديثات التذاكر", desc: "Booking and check-in alerts", descAr: "تنبيهات الحجز والدخول", icon: Ticket },
    { key: "reviews", label: "Reviews", labelAr: "التقييمات", desc: "New reviews and ratings", descAr: "التقييمات والمراجعات الجديدة", icon: Star },
    { key: "live_sessions", label: "Live Cooking", labelAr: "الطهي المباشر", desc: "When cooking sessions go live", descAr: "عند بدء جلسات الطهي المباشرة", icon: Radio },
    { key: "announcements", label: "Announcements", labelAr: "الإعلانات", desc: "Important event announcements", descAr: "إعلانات الفعالية المهمة", icon: MessageCircle },
    { key: "booth_updates", label: "Booth Updates", labelAr: "تحديثات الأجنحة", desc: "Booth assignment and availability", descAr: "تعيينات وتوفر الأجنحة", icon: Users },
  ];

  return (
    <Card className="border-border/40">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-primary" />
            {t("Notification Preferences", "تفضيلات الإشعارات")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label className="text-[10px] text-muted-foreground">{t("All", "الكل")}</Label>
            <Switch checked={allEnabled} onCheckedChange={toggleAll} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {items.map((item, i) => (
          <div key={item.key} className={`flex items-center justify-between px-4 py-2.5 ${i < items.length - 1 ? "border-b border-border/30" : ""}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-muted/60 shrink-0">
                <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium">{isAr ? item.labelAr : item.label}</p>
                <p className="text-[9px] text-muted-foreground">{isAr ? item.descAr : item.desc}</p>
              </div>
            </div>
            <Switch
              checked={prefs[item.key]}
              onCheckedChange={(v) => updatePref(item.key, v)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
