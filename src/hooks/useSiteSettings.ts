import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic JSON settings from DB
export type SiteSettingsMap = Record<string, Record<string, any>>;

export function useSiteSettings() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const qc = useQueryClient();
  const isAr = language === "ar";

  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value, category");
      if (error) throw handleSupabaseError(error);
      const map: SiteSettingsMap = {};
      (data || []).forEach((row) => {
        try {
          map[row.key] = typeof row.value === "string" ? JSON.parse(row.value as string) : (row.value as Record<string, any>);
        } catch {
          map[row.key] = {};
        }
      });
      return map;
    },
  });

  const saveSetting = useMutation({
    mutationFn: async ({ key, value, category }: { key: string; value: Record<string, any>; category?: string }) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({
          key,
          value: value as any,
          category: category || "general",
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" });
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: isAr ? "تم حفظ الإعدادات" : "Settings saved successfully" });
    },
    onError: () => {
      toast({ title: isAr ? "خطأ في الحفظ" : "Error saving settings", variant: "destructive" });
    },
  });

  return { settings, isLoading, saveSetting };
}
