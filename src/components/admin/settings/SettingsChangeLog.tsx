import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Settings, Palette, Shield, Globe, Layout } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const CATEGORY_ICONS: Record<string, any> = {
  appearance: Palette,
  security: Shield,
  general: Settings,
  branding: Globe,
  layout: Layout,
};

export const SettingsChangeLog = memo(function SettingsChangeLog() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: logs = [] } = useQuery({
    queryKey: ["settings-changelog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, category, updated_at")
        .order("updated_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          {isAr ? "سجل التغييرات" : "Change Log"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[260px] px-4 pb-4">
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              {isAr ? "لا توجد تغييرات بعد" : "No changes recorded yet"}
            </p>
          ) : (
            <div className="space-y-2">
              {logs.map((log: any, i: number) => {
                const Icon = CATEGORY_ICONS[log.category] || Settings;
                const timeAgo = log.updated_at
                  ? formatDistanceToNow(new Date(log.updated_at), {
                      addSuffix: true,
                      locale: isAr ? ar : enUS,
                    })
                  : "";
                return (
                  <div
                    key={`${log.key}-${i}`}
                    className="flex items-center gap-3 rounded-xl border border-border/30 p-2.5 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted shrink-0">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate capitalize">
                        {log.key?.replace(/_/g, " ") || "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] shrink-0">
                      {log.category || "general"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
