import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

type NotificationChannel = Database["public"]["Enums"]["notification_channel"];

export interface NotificationPreference {
  id: string;
  channel: NotificationChannel;
  enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  digest_frequency: string | null;
  muted_types: string[] | null;
}

const CHANNELS: NotificationChannel[] = ["in_app", "email", "sms", "whatsapp", "push"];

async function fetchPreferences(userId: string): Promise<NotificationPreference[]> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("id, channel, enabled, quiet_hours_start, quiet_hours_end, digest_frequency, muted_types")
    .eq("user_id", userId);
  if (error) throw handleSupabaseError(error);

  const existingChannels = new Set(data?.map((p) => p.channel) || []);
  const allPreferences: NotificationPreference[] = [...(data as NotificationPreference[] || [])];

  for (const channel of CHANNELS) {
    if (!existingChannels.has(channel)) {
      allPreferences.push({
        id: `new_${channel}`,
        channel,
        enabled: channel === "in_app",
        quiet_hours_start: null,
        quiet_hours_end: null,
        digest_frequency: null,
        muted_types: null,
      });
    }
  }

  const channelOrder = new Map(CHANNELS.map((c, i) => [c, i]));
  return allPreferences.sort((a, b) => (channelOrder.get(a.channel) ?? 0) - (channelOrder.get(b.channel) ?? 0));
}

export function useNotificationPreferencesData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["notification-preferences", user?.id];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchPreferences(user!.id),
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const toggleChannel = useMutation({
    mutationFn: async ({ channel, enabled }: { channel: NotificationChannel; enabled: boolean }) => {
      const prefs = query.data || [];
      const existing = prefs.find((p) => p.channel === channel);
      if (existing && !existing.id.startsWith("new_")) {
        const { error } = await supabase.from("notification_preferences").update({ enabled }).eq("id", existing.id).eq("user_id", user?.id);
        if (error) throw handleSupabaseError(error);
      } else {
        const { error } = await supabase.from("notification_preferences").insert({ user_id: user?.id, channel, enabled });
        if (error) throw handleSupabaseError(error);
      }
    },
    onMutate: async ({ channel, enabled }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<NotificationPreference[]>(queryKey);
      queryClient.setQueryData<NotificationPreference[]>(queryKey, old =>
        old?.map(p => p.channel === channel ? { ...p, enabled } : p)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateQuietHours = useMutation({
    mutationFn: async ({ start, end, enabled }: { start: string; end: string; enabled: boolean }) => {
      const prefs = query.data || [];
      const inApp = prefs.find(p => p.channel === "in_app" && !p.id.startsWith("new_"));
      if (inApp) {
        await supabase.from("notification_preferences").update({
          quiet_hours_start: enabled ? start : null,
          quiet_hours_end: enabled ? end : null,
        }).eq("id", inApp.id).eq("user_id", user?.id);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateDigest = useMutation({
    mutationFn: async (frequency: string) => {
      const prefs = query.data || [];
      const emailPref = prefs.find(p => p.channel === "email" && !p.id.startsWith("new_"));
      if (emailPref) {
        await supabase.from("notification_preferences").update({ digest_frequency: frequency }).eq("id", emailPref.id).eq("user_id", user?.id);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateMutedTypes = useMutation({
    mutationFn: async (mutedTypes: string[]) => {
      const prefs = query.data || [];
      const inApp = prefs.find(p => p.channel === "in_app" && !p.id.startsWith("new_"));
      if (inApp) {
        await supabase.from("notification_preferences").update({ muted_types: mutedTypes }).eq("id", inApp.id).eq("user_id", user?.id);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  // Derived values from server state
  const preferences = query.data || [];
  const quietHours = (() => {
    const first = preferences.find(p => p.quiet_hours_start);
    return {
      enabled: !!first?.quiet_hours_start,
      start: (first as any)?.quiet_hours_start || "22:00",
      end: (first as any)?.quiet_hours_end || "08:00",
    };
  })();
  const digestFrequency = preferences.find(p => (p as any).digest_frequency)?.digest_frequency || "realtime";
  const mutedTypes = new Set<string>(preferences.find(p => p.muted_types?.length)?.muted_types || []);

  return {
    preferences,
    isLoading: query.isLoading,
    quietHours,
    digestFrequency,
    mutedTypes,
    toggleChannel: useCallback(
      (channel: NotificationChannel, enabled: boolean) => toggleChannel.mutate({ channel, enabled }),
      [toggleChannel]
    ),
    updateQuietHours: useCallback(
      (start: string, end: string, enabled: boolean) => updateQuietHours.mutate({ start, end, enabled }),
      [updateQuietHours]
    ),
    updateDigest: useCallback(
      (frequency: string) => updateDigest.mutate(frequency),
      [updateDigest]
    ),
    toggleCategory: useCallback(
      (categoryKey: string, enabled: boolean) => {
        const newMuted = new Set(mutedTypes);
        if (enabled) newMuted.delete(categoryKey);
        else newMuted.add(categoryKey);
        updateMutedTypes.mutate(Array.from(newMuted));
      },
      [mutedTypes, updateMutedTypes]
    ),
    saving: toggleChannel.isPending || updateQuietHours.isPending || updateDigest.isPending || updateMutedTypes.isPending,
  };
}
