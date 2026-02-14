import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { History, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { format } from "date-fns";

interface HistoryEntry {
  id: string;
  user_id: string;
  previous_tier: string | null;
  new_tier: string;
  reason: string | null;
  changed_by: string | null;
  created_at: string;
}

export default function MembershipHistoryTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: history, isLoading } = useQuery({
    queryKey: ["membership-history-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as HistoryEntry[];
    },
  });

  const tierOrder: Record<string, number> = { basic: 0, professional: 1, enterprise: 2 };
  const tierLabels: Record<string, string> = isAr
    ? { basic: "أساسي", professional: "احترافي", enterprise: "مؤسسي" }
    : { basic: "Basic", professional: "Professional", enterprise: "Enterprise" };

  const getChangeIcon = (prev: string | null, next: string) => {
    const prevOrder = tierOrder[prev || "basic"] ?? 0;
    const nextOrder = tierOrder[next] ?? 0;
    if (nextOrder > prevOrder) return <ArrowUp className="h-4 w-4 text-primary" />;
    if (nextOrder < prevOrder) return <ArrowDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  // Summary stats
  const totalChanges = history?.length || 0;
  const upgrades = history?.filter(h => (tierOrder[h.new_tier] || 0) > (tierOrder[h.previous_tier || "basic"] || 0)).length || 0;
  const downgrades = history?.filter(h => (tierOrder[h.new_tier] || 0) < (tierOrder[h.previous_tier || "basic"] || 0)).length || 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{totalChanges}</p>
            <p className="text-sm text-muted-foreground">{isAr ? "إجمالي التغييرات" : "Total Changes"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-primary">{upgrades}</p>
            <p className="text-sm text-muted-foreground">{isAr ? "ترقيات" : "Upgrades"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-destructive">{downgrades}</p>
            <p className="text-sm text-muted-foreground">{isAr ? "تخفيضات" : "Downgrades"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {isAr ? "سجل التغييرات" : "Change History"}
          </CardTitle>
          <CardDescription>{isAr ? "جميع تغييرات مستويات العضوية" : "All membership tier changes"}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : history?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{isAr ? "لا يوجد سجل بعد" : "No history yet"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? "التغيير" : "Change"}</TableHead>
                  <TableHead>{isAr ? "من" : "From"}</TableHead>
                  <TableHead>{isAr ? "إلى" : "To"}</TableHead>
                  <TableHead>{isAr ? "السبب" : "Reason"}</TableHead>
                  <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history?.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{getChangeIcon(entry.previous_tier, entry.new_tier)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tierLabels[entry.previous_tier || "basic"] || entry.previous_tier}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{tierLabels[entry.new_tier] || entry.new_tier}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {entry.reason || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(entry.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
