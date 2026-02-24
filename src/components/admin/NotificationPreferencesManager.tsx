import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bell, BellOff, Mail, Smartphone, Monitor, Clock, Volume2 } from "lucide-react";

const CHANNELS = [
  { value: "in_app" as const, label: "In-App", labelAr: "التطبيق", icon: Monitor },
  { value: "email" as const, label: "Email", labelAr: "البريد", icon: Mail },
  { value: "push" as const, label: "Push", labelAr: "Push", icon: Smartphone },
];

const NOTIFICATION_TYPES = [
  { value: "order", label: "Orders", labelAr: "الطلبات" },
  { value: "invoice", label: "Invoices", labelAr: "الفواتير" },
  { value: "competition", label: "Competitions", labelAr: "المسابقات" },
  { value: "exhibition", label: "Exhibitions", labelAr: "المعارض" },
  { value: "follow", label: "Follows", labelAr: "المتابعات" },
  { value: "reaction", label: "Reactions", labelAr: "التفاعلات" },
  { value: "message", label: "Messages", labelAr: "الرسائل" },
  { value: "system", label: "System", labelAr: "النظام" },
];

type ChannelType = "in_app" | "email" | "push";

export function NotificationPreferencesManager() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: prefs = [], isLoading } = useQuery({
    queryKey: ["notificationPrefs", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getChannelPref = (channel: ChannelType) => prefs.find(p => p.channel === channel);

  const upsertChannel = useMutation({
    mutationFn: async ({ channel, updates }: { channel: ChannelType; updates: Record<string, any> }) => {
      if (!user?.id) throw new Error("No user");
      const existing = getChannelPref(channel);
      if (existing) {
        const { error } = await supabase
          .from("notification_preferences")
          .update(updates)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("notification_preferences")
          .insert({ user_id: user.id, channel, enabled: true, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationPrefs"] });
      toast.success(isAr ? "تم الحفظ" : "Saved");
    },
    onError: () => toast.error(isAr ? "فشل" : "Failed"),
  });

  // Use in_app channel for global settings like muted_types, quiet_hours, digest
  const globalPref = getChannelPref("in_app");
  const mutedTypes = (globalPref?.muted_types as string[]) || [];

  const toggleMutedType = (type: string) => {
    const updated = mutedTypes.includes(type)
      ? mutedTypes.filter(t => t !== type)
      : [...mutedTypes, type];
    upsertChannel.mutate({ channel: "in_app", updates: { muted_types: updated } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{isAr ? "تفضيلات الإشعارات" : "Notification Preferences"}</h3>
      </div>

      {/* Channels */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isAr ? "قنوات الإشعارات" : "Notification Channels"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {CHANNELS.map(ch => {
            const pref = getChannelPref(ch.value);
            return (
              <div key={ch.value} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ch.icon className="h-4 w-4 text-muted-foreground" />
                  <Label>{isAr ? ch.labelAr : ch.label}</Label>
                </div>
                <Switch
                  checked={pref?.enabled ?? true}
                  onCheckedChange={v => upsertChannel.mutate({ channel: ch.value, updates: { enabled: v } })}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Digest Frequency */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isAr ? "تكرار الملخص" : "Digest Frequency"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={globalPref?.digest_frequency ?? "instant"}
            onValueChange={v => upsertChannel.mutate({ channel: "in_app", updates: { digest_frequency: v } })}
          >
            <SelectTrigger>
              <Volume2 className="h-3.5 w-3.5 me-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instant">{isAr ? "فوري" : "Instant"}</SelectItem>
              <SelectItem value="daily">{isAr ? "ملخص يومي" : "Daily Digest"}</SelectItem>
              <SelectItem value="weekly">{isAr ? "ملخص أسبوعي" : "Weekly Digest"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {isAr ? "ساعات الهدوء" : "Quiet Hours"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="text-xs">{isAr ? "من" : "From"}</Label>
              <Input
                type="time"
                value={globalPref?.quiet_hours_start || ""}
                onChange={e => upsertChannel.mutate({ channel: "in_app", updates: { quiet_hours_start: e.target.value || null } })}
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs">{isAr ? "إلى" : "To"}</Label>
              <Input
                type="time"
                value={globalPref?.quiet_hours_end || ""}
                onChange={e => upsertChannel.mutate({ channel: "in_app", updates: { quiet_hours_end: e.target.value || null } })}
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {isAr ? "لن تتلقى إشعارات خلال ساعات الهدوء" : "No notifications during quiet hours"}
          </p>
        </CardContent>
      </Card>

      {/* Muted Types */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <BellOff className="h-4 w-4" />
            {isAr ? "كتم أنواع الإشعارات" : "Muted Notification Types"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {NOTIFICATION_TYPES.map(t => (
              <Badge
                key={t.value}
                variant={mutedTypes.includes(t.value) ? "destructive" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleMutedType(t.value)}
              >
                {mutedTypes.includes(t.value) && <BellOff className="h-3 w-3 me-0.5" />}
                {isAr ? t.labelAr : t.label}
              </Badge>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {isAr ? "اضغط لكتم/تفعيل نوع الإشعار" : "Click to mute/unmute notification type"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
