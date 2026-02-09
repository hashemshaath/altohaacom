import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import type { Database } from "@/integrations/supabase/types";

type NotificationChannel = Database["public"]["Enums"]["notification_channel"];

interface NotificationPreference {
  id: string;
  channel: NotificationChannel;
  enabled: boolean;
}

const CHANNELS: { channel: NotificationChannel; label: string; desc: string }[] = [
  { channel: "in_app", label: "In-App Notifications", desc: "Receive notifications within the Altohaa platform" },
  { channel: "email", label: "Email", desc: "Get important updates delivered to your email" },
  { channel: "sms", label: "SMS", desc: "Receive text messages for urgent notifications" },
  { channel: "whatsapp", label: "WhatsApp", desc: "Get messages through WhatsApp" },
  { channel: "push", label: "Push Notifications", desc: "Receive notifications on your devices" },
];

export default function NotificationPreferences() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
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

      // Initialize preferences for all channels if they don't exist
      const existingChannels = new Set(data?.map((p) => p.channel) || []);
      const allPreferences: NotificationPreference[] = [];

      // Add existing preferences
      if (data) {
        allPreferences.push(...data);
      }

      // Add missing channels with default values
      for (const channelConfig of CHANNELS) {
        if (!existingChannels.has(channelConfig.channel)) {
          allPreferences.push({
            id: `new_${channelConfig.channel}`,
            channel: channelConfig.channel,
            enabled: channelConfig.channel === "in_app", // Default: in_app is enabled
          });
        }
      }

      setPreferences(allPreferences.sort((a, b) => {
        const aIndex = CHANNELS.findIndex((c) => c.channel === a.channel);
        const bIndex = CHANNELS.findIndex((c) => c.channel === b.channel);
        return aIndex - bIndex;
      }));
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
                  toast({
                    title: "Error",
                    description: "Failed to load preferences",
                    variant: "destructive",
                  });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (channel: NotificationChannel, enabled: boolean) => {
    setSaving(channel);
    try {
      const existingPref = preferences.find((p) => p.channel === channel);

      if (existingPref && !existingPref.id.startsWith("new_")) {
        // Update existing preference
        const { error } = await supabase
          .from("notification_preferences")
          .update({ enabled })
          .eq("id", existingPref.id)
          .eq("user_id", user?.id);

        if (error) throw error;
      } else {
        // Create new preference
        const { error } = await supabase
          .from("notification_preferences")
          .insert({
            user_id: user?.id,
            channel,
            enabled,
          });

        if (error) throw error;
      }

      // Update local state
      setPreferences((prev) =>
        prev.map((p) =>
          p.channel === channel
            ? { ...p, id: `saved_${channel}`, enabled }
            : p
        )
      );

      toast({
        title: "Success",
        description: "Preferences updated successfully",
      });
    } catch (error) {
      console.error("Error updating notification preference:", error);
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <div className="mx-auto max-w-2xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold">{t("notificationPreferences")}</h1>
              <p className="mt-2 text-muted-foreground">
                {t("manageNotificationChannels")}
              </p>
            </div>

            {/* Preferences Card */}
            <Card className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-6">
                  {preferences.map((pref) => {
                    const channelConfig = CHANNELS.find(
                      (c) => c.channel === pref.channel
                    );
                    if (!channelConfig) return null;

                    return (
                      <div
                        key={pref.channel}
                        className="flex items-center justify-between rounded-lg border border-border/50 p-4 transition-colors hover:bg-accent/5"
                      >
                        <div className="flex-1">
                          <Label className="text-base font-semibold cursor-pointer">
                            {channelConfig.label}
                          </Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {channelConfig.desc}
                          </p>
                        </div>
                        <Switch
                          checked={pref.enabled}
                          onCheckedChange={(enabled) =>
                            handleToggle(pref.channel, enabled)
                          }
                          disabled={saving === pref.channel}
                          className="ml-4"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Info Box */}
            <div className="mt-8 rounded-lg border border-border/50 bg-accent/5 p-4">
              <h3 className="font-semibold">{t("notificationInfo")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("notificationInfoDesc")}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
