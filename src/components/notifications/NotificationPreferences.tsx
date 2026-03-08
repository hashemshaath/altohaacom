import { useState, useEffect, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Bell, MessageSquare, Trophy, Users, Calendar, ShoppingBag, Heart, Settings2, Save, Loader2, Smartphone, Mail, Volume2, VolumeX } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ChannelType = "in_app" | "push" | "email";

interface ChannelPrefs {
  enabled: boolean;
  muted_types: string[];
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  digest_frequency: string | null;
}

const CHANNELS: { key: ChannelType; label: string; labelAr: string; icon: typeof Bell }[] = [
  { key: "in_app", label: "In-App", labelAr: "داخل التطبيق", icon: Bell },
  { key: "push", label: "Push", labelAr: "إشعارات الدفع", icon: Smartphone },
  { key: "email", label: "Email", labelAr: "البريد", icon: Mail },
];

const NOTIFICATION_TYPES = [
  { key: "follow", label: "Follows", labelAr: "المتابعات", icon: Users, color: "text-pink-500" },
  { key: "reaction", label: "Reactions", labelAr: "التفاعلات", icon: Heart, color: "text-red-500" },
  { key: "comment", label: "Comments", labelAr: "التعليقات", icon: MessageSquare, color: "text-blue-500" },
  { key: "competition", label: "Competitions", labelAr: "المسابقات", icon: Trophy, color: "text-amber-500" },
  { key: "exhibition_update", label: "Events", labelAr: "الفعاليات", icon: Calendar, color: "text-purple-500" },
  { key: "supplier_inquiry", label: "Orders & Inquiries", labelAr: "الطلبات", icon: ShoppingBag, color: "text-green-500" },
  { key: "system", label: "System", labelAr: "النظام", icon: Settings2, color: "text-slate-500" },
];

const DEFAULT_CHANNEL: ChannelPrefs = {
  enabled: true,
  muted_types: [],
  quiet_hours_start: null,
  quiet_hours_end: null,
  digest_frequency: null,
};

export const NotificationPreferences = memo(function NotificationPreferences() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const [channels, setChannels] = useState<Record<ChannelType, ChannelPrefs>>({
    in_app: { ...DEFAULT_CHANNEL },
    push: { ...DEFAULT_CHANNEL },
    email: { ...DEFAULT_CHANNEL },
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeChannel, setActiveChannel] = useState<ChannelType>("in_app");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      try {
        const { data } = await supabase
          .from("notification_preferences")
          .select("id, user_id, channel, enabled, muted_types, quiet_hours_start, quiet_hours_end, digest_frequency")
          .eq("user_id", user.id);

        if (data && data.length > 0) {
          const channelMap = { ...channels };
          for (const row of data) {
            const ch = row.channel as ChannelType;
            if (channelMap[ch]) {
              channelMap[ch] = {
                enabled: row.enabled ?? true,
                muted_types: row.muted_types || [],
                quiet_hours_start: row.quiet_hours_start?.slice(0, 5) || null,
                quiet_hours_end: row.quiet_hours_end?.slice(0, 5) || null,
                digest_frequency: row.digest_frequency || null,
              };
            }
          }
          setChannels(channelMap);
        }
        setSoundEnabled(localStorage.getItem("altoha_notification_sound") !== "false");
      } catch (e) {
        console.error("Failed to load notification prefs:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const updateChannel = (channel: ChannelType, key: keyof ChannelPrefs, value: any) => {
    setChannels(prev => ({
      ...prev,
      [channel]: { ...prev[channel], [key]: value },
    }));
  };

  const toggleMutedType = (channel: ChannelType, type: string) => {
    setChannels(prev => {
      const muted = prev[channel].muted_types;
      const next = muted.includes(type) ? muted.filter(t => t !== type) : [...muted, type];
      return { ...prev, [channel]: { ...prev[channel], muted_types: next } };
    });
  };

  const save = async () => {
    localStorage.setItem("altoha_notification_sound", String(soundEnabled));

    if (!user) {
      toast({ title: isAr ? "تم حفظ التفضيلات" : "Preferences saved" });
      return;
    }

    setSaving(true);
    try {
      for (const ch of CHANNELS) {
        const prefs = channels[ch.key];
        const { error } = await supabase
          .from("notification_preferences")
          .upsert({
            user_id: user.id,
            channel: ch.key as any,
            enabled: prefs.enabled,
            muted_types: prefs.muted_types,
            quiet_hours_start: prefs.quiet_hours_start,
            quiet_hours_end: prefs.quiet_hours_end,
            digest_frequency: prefs.digest_frequency,
          }, { onConflict: "user_id,channel" });

        if (error) throw error;
      }

      toast({ title: isAr ? "تم حفظ التفضيلات ✅" : "Preferences saved ✅" });
    } catch (e) {
      console.error("Failed to save prefs:", e);
      toast({ title: isAr ? "فشل الحفظ" : "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const activePrefs = channels[activeChannel];

  return (
    <div className="space-y-4">
      {/* Sound toggle */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {soundEnabled ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
              <Label className="text-sm font-medium">{isAr ? "صوت الإشعارات" : "Notification Sound"}</Label>
            </div>
            <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Channel selector */}
      <div className="flex gap-2">
        {CHANNELS.map(ch => {
          const Icon = ch.icon;
          const isActive = activeChannel === ch.key;
          return (
            <Button
              key={ch.key}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={cn("flex-1 gap-1.5 rounded-xl", isActive && "shadow-md")}
              onClick={() => setActiveChannel(ch.key)}
            >
              <Icon className="h-3.5 w-3.5" />
              {isAr ? ch.labelAr : ch.label}
              {channels[ch.key].enabled && (
                <Badge variant="secondary" className="h-4 text-[9px] px-1 ms-0.5">
                  {isAr ? "مفعل" : "ON"}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Channel settings */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              {(() => { const Icon = CHANNELS.find(c => c.key === activeChannel)!.icon; return <Icon className="h-4 w-4 text-primary" />; })()}
              {isAr ? CHANNELS.find(c => c.key === activeChannel)!.labelAr : CHANNELS.find(c => c.key === activeChannel)!.label}
            </CardTitle>
            <Switch
              checked={activePrefs.enabled}
              onCheckedChange={v => updateChannel(activeChannel, "enabled", v)}
            />
          </div>
        </CardHeader>
        {activePrefs.enabled && (
          <CardContent className="space-y-4">
            {/* Quiet hours */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">{isAr ? "ساعات الهدوء" : "Quiet Hours"}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{isAr ? "من" : "From"}</Label>
                  <Select
                    value={activePrefs.quiet_hours_start || "none"}
                    onValueChange={v => updateChannel(activeChannel, "quiet_hours_start", v === "none" ? null : v)}
                  >
                    <SelectTrigger className="h-9"><SelectValue placeholder={isAr ? "بدون" : "None"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{isAr ? "بدون" : "None"}</SelectItem>
                      {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`).map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{isAr ? "إلى" : "To"}</Label>
                  <Select
                    value={activePrefs.quiet_hours_end || "none"}
                    onValueChange={v => updateChannel(activeChannel, "quiet_hours_end", v === "none" ? null : v)}
                  >
                    <SelectTrigger className="h-9"><SelectValue placeholder={isAr ? "بدون" : "None"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{isAr ? "بدون" : "None"}</SelectItem>
                      {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`).map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Muted types */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">{isAr ? "تصنيفات الإشعارات" : "Notification Types"}</Label>
              <div className="space-y-2.5">
                {NOTIFICATION_TYPES.map(nt => {
                  const Icon = nt.icon;
                  const isMuted = activePrefs.muted_types.includes(nt.key);
                  return (
                    <div key={nt.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", isMuted ? "text-muted-foreground" : nt.color)} />
                        <Label className={cn("text-sm", isMuted && "text-muted-foreground")}>{isAr ? nt.labelAr : nt.label}</Label>
                      </div>
                      <Switch checked={!isMuted} onCheckedChange={() => toggleMutedType(activeChannel, nt.key)} />
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Button onClick={save} className="w-full gap-2 h-11 rounded-xl" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {isAr ? "حفظ التفضيلات" : "Save Preferences"}
      </Button>
    </div>
  );
}