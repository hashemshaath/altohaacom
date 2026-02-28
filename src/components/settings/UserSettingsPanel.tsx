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
    // Apply theme
    if (settings.theme === "dark") document.documentElement.classList.add("dark");
    else if (settings.theme === "light") document.documentElement.classList.remove("dark");
    // Apply font size
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          {isAr ? "الإعدادات" : "Settings"}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset} className="gap-1">
            <RotateCcw className="h-3.5 w-3.5" />
            {isAr ? "إعادة تعيين" : "Reset"}
          </Button>
          <Button size="sm" onClick={save} className="gap-1">
            <Save className="h-3.5 w-3.5" />
            {isAr ? "حفظ" : "Save"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="appearance" className="gap-1"><Palette className="h-3.5 w-3.5" />{isAr ? "المظهر" : "Appearance"}</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1"><Shield className="h-3.5 w-3.5" />{isAr ? "الإشعارات" : "Notifications"}</TabsTrigger>
          <TabsTrigger value="accessibility" className="gap-1"><Eye className="h-3.5 w-3.5" />{isAr ? "إمكانية الوصول" : "Accessibility"}</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                {isAr ? "المظهر والسمة" : "Theme & Display"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">{isAr ? "السمة" : "Theme"}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "light", icon: Sun, label: isAr ? "فاتح" : "Light" },
                    { value: "dark", icon: Moon, label: isAr ? "داكن" : "Dark" },
                    { value: "system", icon: Monitor, label: isAr ? "تلقائي" : "System" },
                  ].map(opt => {
                    const Icon = opt.icon;
                    return (
                      <Button
                        key={opt.value}
                        variant={settings.theme === opt.value ? "default" : "outline"}
                        className="gap-1.5 h-10"
                        onClick={() => update("theme", opt.value)}
                      >
                        <Icon className="h-4 w-4" />
                        {opt.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">{isAr ? "الوضع المضغوط" : "Compact Mode"}</Label>
                  <p className="text-xs text-muted-foreground">{isAr ? "تقليل المسافات بين العناصر" : "Reduce spacing between elements"}</p>
                </div>
                <Switch checked={settings.compact_mode} onCheckedChange={v => update("compact_mode", v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Type className="h-4 w-4" />
                {isAr ? "حجم الخط" : "Font Size"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">A</span>
                <Slider value={[settings.font_size]} onValueChange={([v]) => update("font_size", v)} min={80} max={130} step={5} className="mx-4 flex-1" />
                <span className="text-lg font-bold">A</span>
              </div>
              <p className="text-center text-sm text-muted-foreground">{settings.font_size}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {isAr ? "اللغة" : "Language"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={settings.default_language} onValueChange={v => update("default_language", v)}>
                <SelectTrigger>
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

        <TabsContent value="notifications" className="mt-4">
          <NotificationPreferences />
        </TabsContent>

        <TabsContent value="accessibility" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {isAr ? "إمكانية الوصول" : "Accessibility"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">{isAr ? "الحركات" : "Animations"}</Label>
                  <p className="text-xs text-muted-foreground">{isAr ? "تشغيل تأثيرات الحركة" : "Enable motion effects"}</p>
                </div>
                <Switch checked={settings.animations_enabled} onCheckedChange={v => update("animations_enabled", v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">{isAr ? "تقليل الحركة" : "Reduce Motion"}</Label>
                  <p className="text-xs text-muted-foreground">{isAr ? "إيقاف الحركات غير الضرورية" : "Minimize unnecessary animations"}</p>
                </div>
                <Switch checked={settings.reduce_motion} onCheckedChange={v => update("reduce_motion", v)} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">{isAr ? "تباين عالي" : "High Contrast"}</Label>
                  <p className="text-xs text-muted-foreground">{isAr ? "زيادة تباين الألوان" : "Increase color contrast"}</p>
                </div>
                <Switch checked={settings.high_contrast} onCheckedChange={v => update("high_contrast", v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">{isAr ? "تشغيل الفيديو تلقائياً" : "Auto-play Videos"}</Label>
                  <p className="text-xs text-muted-foreground">{isAr ? "تشغيل مقاطع الفيديو تلقائياً" : "Auto-play video content"}</p>
                </div>
                <Switch checked={settings.auto_play_videos} onCheckedChange={v => update("auto_play_videos", v)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
