import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Bell, MessageSquare, Trophy, Users, Calendar, ShoppingBag, Heart, Settings2, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const STORAGE_KEY = "altoha_notification_prefs";

interface NotifPrefs {
  push_enabled: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_start: string;
  quiet_end: string;
  categories: Record<string, boolean>;
}

const DEFAULT_PREFS: NotifPrefs = {
  push_enabled: true,
  sound_enabled: true,
  vibration_enabled: true,
  quiet_hours_enabled: false,
  quiet_start: "22:00",
  quiet_end: "07:00",
  categories: {
    messages: true,
    follows: true,
    competitions: true,
    exhibitions: true,
    orders: true,
    reactions: true,
    system: true,
    support: true,
  },
};

const CATEGORY_CONFIG = [
  { key: "messages", icon: MessageSquare, label: "Messages", labelAr: "الرسائل", color: "text-blue-500" },
  { key: "follows", icon: Users, label: "Follows", labelAr: "المتابعات", color: "text-pink-500" },
  { key: "competitions", icon: Trophy, label: "Competitions", labelAr: "المسابقات", color: "text-amber-500" },
  { key: "exhibitions", icon: Calendar, label: "Events", labelAr: "الفعاليات", color: "text-purple-500" },
  { key: "orders", icon: ShoppingBag, label: "Orders", labelAr: "الطلبات", color: "text-green-500" },
  { key: "reactions", icon: Heart, label: "Reactions", labelAr: "التفاعلات", color: "text-red-500" },
  { key: "system", icon: Settings2, label: "System", labelAr: "النظام", color: "text-slate-500" },
  { key: "support", icon: Bell, label: "Support", labelAr: "الدعم", color: "text-teal-500" },
];

export function NotificationPreferences() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(saved) });
    } catch {}
  }, []);

  const update = (key: keyof NotifPrefs, value: any) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  const updateCategory = (key: string, value: boolean) => {
    setPrefs(prev => ({ ...prev, categories: { ...prev.categories, [key]: value } }));
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    toast({ title: isAr ? "تم حفظ التفضيلات" : "Preferences saved" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            {isAr ? "الإعدادات العامة" : "General Settings"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">{isAr ? "إشعارات الدفع" : "Push Notifications"}</Label>
            <Switch checked={prefs.push_enabled} onCheckedChange={v => update("push_enabled", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">{isAr ? "الأصوات" : "Sound"}</Label>
            <Switch checked={prefs.sound_enabled} onCheckedChange={v => update("sound_enabled", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">{isAr ? "الاهتزاز" : "Vibration"}</Label>
            <Switch checked={prefs.vibration_enabled} onCheckedChange={v => update("vibration_enabled", v)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label className="text-sm">{isAr ? "ساعات الهدوء" : "Quiet Hours"}</Label>
            <Switch checked={prefs.quiet_hours_enabled} onCheckedChange={v => update("quiet_hours_enabled", v)} />
          </div>
          {prefs.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{isAr ? "من" : "From"}</Label>
                <Select value={prefs.quiet_start} onValueChange={v => update("quiet_start", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`).map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{isAr ? "إلى" : "To"}</Label>
                <Select value={prefs.quiet_end} onValueChange={v => update("quiet_end", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`).map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            {isAr ? "تصنيفات الإشعارات" : "Notification Categories"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {CATEGORY_CONFIG.map(cat => {
            const Icon = cat.icon;
            return (
              <div key={cat.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${cat.color}`} />
                  <Label className="text-sm">{isAr ? cat.labelAr : cat.label}</Label>
                </div>
                <Switch checked={prefs.categories[cat.key] ?? true} onCheckedChange={v => updateCategory(cat.key, v)} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Button onClick={save} className="w-full gap-2">
        <Save className="h-4 w-4" />
        {isAr ? "حفظ التفضيلات" : "Save Preferences"}
      </Button>
    </div>
  );
}
