import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Palette, Type, Monitor, Moon, Sun, Smartphone, Eye, Zap, Globe, Shield, Save, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";

const STORAGE_KEY = "altoha_user_settings";

interface UserSettings {
  theme: "light" | "dark" | "system";
  compact_mode: boolean;
  font_size: number;
  animations_enabled: boolean;
  reduce_motion: boolean;
  auto_play_videos: boolean;
  default_language: string;
  high_contrast: boolean;
}

const DEFAULTS: UserSettings = {
  theme: "system",
  compact_mode: false,
  font_size: 100,
  animations_enabled: true,
  reduce_motion: false,
  auto_play_videos: true,
  default_language: "en",
  high_contrast: false,
};

export function UserSettingsPanel() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [settings, setSettings] = useState<UserSettings>(DEFAULTS);
  const [activeTab, setActiveTab] = useState("appearance");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSettings({ ...DEFAULTS, ...JSON.parse(saved) });
    } catch {}
  }, []);

  const update = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    if (settings.theme === "dark") document.documentElement.classList.add("dark");
    else if (settings.theme === "light") document.documentElement.classList.remove("dark");
    document.documentElement.style.fontSize = `${settings.font_size}%`;
    toast({ title: isAr ? "تم حفظ الإعدادات" : "Settings saved" });
  };

  const reset = () => {
    setSettings(DEFAULTS);
    localStorage.removeItem(STORAGE_KEY);
    document.documentElement.style.fontSize = "";
    toast({ title: isAr ? "تم إعادة التعيين" : "Settings reset" });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">{isAr ? "الإعدادات" : "Settings"}</h3>
            <p className="text-xs text-muted-foreground">{isAr ? "تخصيص تجربتك على المنصة" : "Customize your platform experience"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset} className="gap-1.5 rounded-xl h-9 text-xs">
            <RotateCcw className="h-3.5 w-3.5" />
            {isAr ? "إعادة تعيين" : "Reset"}
          </Button>
          <Button size="sm" onClick={save} className="gap-1.5 rounded-xl h-9 text-xs shadow-sm">
            <Save className="h-3.5 w-3.5" />
            {isAr ? "حفظ" : "Save"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full rounded-xl h-11 bg-muted/40 p-1">
          <TabsTrigger value="appearance" className="gap-1.5 rounded-lg text-xs font-semibold data-[state=active]:shadow-sm">
            <Palette className="h-3.5 w-3.5" />{isAr ? "المظهر" : "Appearance"}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 rounded-lg text-xs font-semibold data-[state=active]:shadow-sm">
            <Shield className="h-3.5 w-3.5" />{isAr ? "الإشعارات" : "Notifications"}
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="gap-1.5 rounded-lg text-xs font-semibold data-[state=active]:shadow-sm">
            <Eye className="h-3.5 w-3.5" />{isAr ? "إمكانية الوصول" : "Accessibility"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="mt-5 space-y-4">
          <Card className="rounded-2xl border-border/30 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/20">
              <CardTitle className="text-sm flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/8">
                  <Monitor className="h-3.5 w-3.5 text-primary" />
                </div>
                {isAr ? "المظهر والسمة" : "Theme & Display"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              <div className="space-y-2.5">
                <Label className="text-sm font-semibold">{isAr ? "السمة" : "Theme"}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "light", icon: Sun, label: isAr ? "فاتح" : "Light" },
                    { value: "dark", icon: Moon, label: isAr ? "داكن" : "Dark" },
                    { value: "system", icon: Monitor, label: isAr ? "تلقائي" : "System" },
                  ].map(opt => {
                    const Icon = opt.icon;
                    const isActive = settings.theme === opt.value;
                    return (
                      <button
                        key={opt.value}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-semibold transition-all duration-200 ${
                          isActive
                            ? "border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10"
                            : "border-border/30 hover:border-primary/20 hover:bg-muted/20 text-muted-foreground"
                        }`}
                        onClick={() => update("theme", opt.value)}
                      >
                        <Icon className="h-5 w-5" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Separator className="bg-border/20" />
              <div className="flex items-center justify-between rounded-xl bg-muted/10 p-3 border border-border/15">
                <div>
                  <Label className="text-sm font-semibold">{isAr ? "الوضع المضغوط" : "Compact Mode"}</Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{isAr ? "تقليل المسافات بين العناصر" : "Reduce spacing between elements"}</p>
                </div>
                <Switch checked={settings.compact_mode} onCheckedChange={v => update("compact_mode", v)} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/30 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/20">
              <CardTitle className="text-sm flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/8">
                  <Type className="h-3.5 w-3.5 text-primary" />
                </div>
                {isAr ? "حجم الخط" : "Font Size"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-muted-foreground font-medium">A</span>
                <Slider value={[settings.font_size]} onValueChange={([v]) => update("font_size", v)} min={80} max={130} step={5} className="mx-4 flex-1" />
                <span className="text-lg font-black">A</span>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="text-xs font-bold tabular-nums rounded-lg">{settings.font_size}%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/30 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/20">
              <CardTitle className="text-sm flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/8">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                </div>
                {isAr ? "اللغة" : "Language"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Select value={settings.default_language} onValueChange={v => update("default_language", v)}>
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-5">
          <NotificationPreferences />
        </TabsContent>

        <TabsContent value="accessibility" className="mt-5 space-y-4">
          <Card className="rounded-2xl border-border/30 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/20">
              <CardTitle className="text-sm flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/8">
                  <Eye className="h-3.5 w-3.5 text-primary" />
                </div>
                {isAr ? "إمكانية الوصول" : "Accessibility"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pt-4">
              {[
                { key: "animations_enabled" as const, icon: Zap, label: isAr ? "الحركات" : "Animations", desc: isAr ? "تشغيل تأثيرات الحركة" : "Enable motion effects" },
                { key: "reduce_motion" as const, icon: Eye, label: isAr ? "تقليل الحركة" : "Reduce Motion", desc: isAr ? "إيقاف الحركات غير الضرورية" : "Minimize unnecessary animations" },
              ].map(({ key, icon: Icon, label, desc }) => (
                <div key={key} className="flex items-center justify-between rounded-xl p-3 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/30">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">{label}</Label>
                      <p className="text-[11px] text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <Switch checked={settings[key]} onCheckedChange={v => update(key, v)} />
                </div>
              ))}
              <Separator className="bg-border/20 my-2" />
              {[
                { key: "high_contrast" as const, icon: Eye, label: isAr ? "تباين عالي" : "High Contrast", desc: isAr ? "زيادة تباين الألوان" : "Increase color contrast" },
                { key: "auto_play_videos" as const, icon: Monitor, label: isAr ? "تشغيل الفيديو تلقائياً" : "Auto-play Videos", desc: isAr ? "تشغيل مقاطع الفيديو تلقائياً" : "Auto-play video content" },
              ].map(({ key, icon: Icon, label, desc }) => (
                <div key={key} className="flex items-center justify-between rounded-xl p-3 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/30">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">{label}</Label>
                      <p className="text-[11px] text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <Switch checked={settings[key]} onCheckedChange={v => update(key, v)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
