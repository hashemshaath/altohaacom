import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { History, Search, User, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";

interface AuditEntry {
  id: string;
  country_code: string;
  action: string;
  changed_by: string | null;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  summary: string | null;
  summary_ar: string | null;
  created_at: string;
}

const actionColors: Record<string, string> = {
  created: "bg-chart-3/10 text-chart-3",
  updated: "bg-chart-2/10 text-chart-2",
  deleted: "bg-destructive/10 text-destructive",
  activated: "bg-chart-3/10 text-chart-3",
  deactivated: "bg-muted text-muted-foreground",
  imported: "bg-primary/10 text-primary",
  bulk_activated: "bg-chart-3/10 text-chart-3",
  bulk_deactivated: "bg-muted text-muted-foreground",
};

export function CountryAuditLog({ countryCode }: { countryCode?: string }) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["country-audit-log", countryCode],
    queryFn: async () => {
      let query = supabase
        .from("country_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (countryCode) {
        query = query.eq("country_code", countryCode);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AuditEntry[];
    },
  });

  const filtered = useMemo(() => {
    if (!search || !logs) return logs || [];
    const q = search.toLowerCase();
    return logs.filter(l =>
      l.country_code.toLowerCase().includes(q) ||
      l.action.includes(q) ||
      (l.summary || "").toLowerCase().includes(q)
    );
  }, [logs, search]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5 space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            {isAr ? "سجل التغييرات" : "Activity Log"}
          </CardTitle>
          <Badge variant="outline">{filtered.length} {isAr ? "إدخال" : "entries"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isAr ? "بحث في السجل..." : "Search log..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ps-10 h-8 text-sm"
          />
        </div>

        <ScrollArea className="h-[400px]">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              {isAr ? "لا توجد سجلات بعد" : "No log entries yet"}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(entry => (
                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-xl border hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono text-[10px]">{entry.country_code}</Badge>
                      <Badge className={`text-[10px] ${actionColors[entry.action] || "bg-muted"}`}>
                        {entry.action}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1">{isAr ? entry.summary_ar || entry.summary : entry.summary}</p>
                    {entry.changes && Object.keys(entry.changes).length > 0 && (
                      <div className="mt-1.5 space-y-0.5">
                        {Object.entries(entry.changes).slice(0, 4).map(([field, change]) => (
                          <p key={field} className="text-[10px] text-muted-foreground">
                            <span className="font-medium">{field}</span>: {String(change.old ?? "—")} → {String(change.new ?? "—")}
                          </p>
                        ))}
                        {Object.keys(entry.changes).length > 4 && (
                          <p className="text-[10px] text-muted-foreground">
                            +{Object.keys(entry.changes).length - 4} {isAr ? "تغييرات أخرى" : "more changes"}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-end shrink-0">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(entry.created_at), "MMM dd, HH:mm")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
