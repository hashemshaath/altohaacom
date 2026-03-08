import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNotificationPrefs } from "@/hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Moon, Volume2, VolumeX, Clock, Mail } from "lucide-react";

const MUTED_CATS_KEY = "altoha_muted_categories";
const DIGEST_KEY = "altoha_digest_frequency";
const QUIET_START_KEY = "altoha_quiet_start";
const QUIET_END_KEY = "altoha_quiet_end";

const CATEGORIES = [
  { key: "follow", labelEn: "Follows", labelAr: "المتابعات" },
  { key: "reaction", labelEn: "Reactions", labelAr: "التفاعلات" },
  { key: "competition", labelEn: "Competitions", labelAr: "المسابقات" },
  { key: "exhibition", labelEn: "Exhibitions", labelAr: "المعارض" },
  { key: "schedule", labelEn: "Schedule", labelAr: "الجدول" },
  { key: "supplier", labelEn: "Suppliers", labelAr: "الموردين" },
];

export function NotificationPreferencesWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { soundEnabled, setSoundEnabled, dndMode, setDndMode } = useNotificationPrefs();

  const [mutedCats, setMutedCats] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(MUTED_CATS_KEY) || "[]"); } catch { return []; }
  });
  const [digest, setDigest] = useState(() => localStorage.getItem(DIGEST_KEY) || "instant");
  const [quietStart, setQuietStart] = useState(() => localStorage.getItem(QUIET_START_KEY) || "22:00");
  const [quietEnd, setQuietEnd] = useState(() => localStorage.getItem(QUIET_END_KEY) || "07:00");

  const toggleCategory = (cat: string) => {
    const next = mutedCats.includes(cat) ? mutedCats.filter((c) => c !== cat) : [...mutedCats, cat];
    setMutedCats(next);
    localStorage.setItem(MUTED_CATS_KEY, JSON.stringify(next));
  };

  const updateDigest = (v: string) => {
    setDigest(v);
    localStorage.setItem(DIGEST_KEY, v);
  };

  const updateQuietHours = (start: string, end: string) => {
    setQuietStart(start);
    setQuietEnd(end);
    localStorage.setItem(QUIET_START_KEY, start);
    localStorage.setItem(QUIET_END_KEY, end);
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          {isAr ? "تفضيلات الإشعارات" : "Notification Preferences"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sound & DND toggles */}
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-xs cursor-pointer">
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-chart-5" /> : <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />}
            {isAr ? "صوت الإشعارات" : "Sound"}
          </Label>
          <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-xs cursor-pointer">
            {dndMode ? <BellOff className="h-3.5 w-3.5 text-chart-4" /> : <Moon className="h-3.5 w-3.5 text-muted-foreground" />}
            {isAr ? "عدم الإزعاج" : "Do Not Disturb"}
          </Label>
          <Switch checked={dndMode} onCheckedChange={setDndMode} />
        </div>

        {/* Quiet Hours */}
        <div className="rounded-xl bg-muted/30 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <Clock className="h-3.5 w-3.5 text-primary" />
            {isAr ? "ساعات الهدوء" : "Quiet Hours"}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={quietStart}
              onChange={(e) => updateQuietHours(e.target.value, quietEnd)}
              className="flex-1 rounded-md border bg-background px-2 py-1 text-xs"
            />
            <span className="text-xs text-muted-foreground">→</span>
            <input
              type="time"
              value={quietEnd}
              onChange={(e) => updateQuietHours(quietStart, e.target.value)}
              className="flex-1 rounded-md border bg-background px-2 py-1 text-xs"
            />
          </div>
        </div>

        {/* Digest Frequency */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold">
            <Mail className="h-3.5 w-3.5 text-primary" />
            {isAr ? "تكرار الملخص" : "Digest Frequency"}
          </Label>
          <Select value={digest} onValueChange={updateDigest}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instant">{isAr ? "فوري" : "Instant"}</SelectItem>
              <SelectItem value="hourly">{isAr ? "كل ساعة" : "Hourly"}</SelectItem>
              <SelectItem value="daily">{isAr ? "يومي" : "Daily"}</SelectItem>
              <SelectItem value="weekly">{isAr ? "أسبوعي" : "Weekly"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Muting */}
        <div className="space-y-2">
          <p className="text-xs font-semibold">{isAr ? "كتم الفئات" : "Mute Categories"}</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => {
              const muted = mutedCats.includes(cat.key);
              return (
                <Badge
                  key={cat.key}
                  variant={muted ? "secondary" : "outline"}
                  className={`cursor-pointer text-[10px] transition-all ${muted ? "opacity-50 line-through" : "hover:bg-primary/10"}`}
                  onClick={() => toggleCategory(cat.key)}
                >
                  {isAr ? cat.labelAr : cat.labelEn}
                </Badge>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}