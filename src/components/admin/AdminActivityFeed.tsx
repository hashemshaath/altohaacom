import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, UserPlus, Flag, Trophy, FileText, Shield, Package, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface FeedItem {
  id: string;
  type: "user" | "report" | "order" | "action" | "competition" | "article";
  title: string;
  time: string;
  icon: typeof Activity;
  color: string;
}

export function AdminActivityFeed() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: feed = [] } = useQuery({
    queryKey: ["admin-activity-feed"],
    queryFn: async () => {
      const now = new Date();
      const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const [users, reports, orders, actions] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, display_name, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(5),
        supabase.from("content_reports").select("id, reason, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(5),
        supabase.from("company_orders").select("id, order_number, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(5),
        supabase.from("admin_actions").select("id, action_type, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(5),
      ]);

      const items: FeedItem[] = [];

      (users.data || []).forEach((u: any) => items.push({
        id: `u-${u.user_id}`, type: "user",
        title: isAr ? `${u.display_name || u.full_name || "مستخدم"} انضم` : `${u.display_name || u.full_name || "User"} joined`,
        time: u.created_at, icon: UserPlus, color: "text-primary",
      }));

      (reports.data || []).forEach((r: any) => items.push({
        id: `r-${r.id}`, type: "report",
        title: isAr ? `بلاغ جديد: ${r.reason || "محتوى"}` : `New report: ${r.reason || "content"}`,
        time: r.created_at, icon: Flag, color: "text-destructive",
      }));

      (orders.data || []).forEach((o: any) => items.push({
        id: `o-${o.id}`, type: "order",
        title: isAr ? `طلب ${o.order_number}` : `Order ${o.order_number}`,
        time: o.created_at, icon: Package, color: "text-chart-3",
      }));

      (actions.data || []).forEach((a: any) => items.push({
        id: `a-${a.id}`, type: "action",
        title: isAr ? `إجراء: ${a.action_type.replace(/_/g, " ")}` : `Action: ${a.action_type.replace(/_/g, " ")}`,
        time: a.created_at, icon: Shield, color: "text-chart-4",
      }));

      return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 15);
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-2/10">
            <Activity className="h-3.5 w-3.5 text-chart-2" />
          </div>
          {isAr ? "آخر الأنشطة (24 ساعة)" : "Activity Feed (24h)"}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/audit">
            {isAr ? "السجل الكامل" : "Full Log"} <ArrowRight className="ms-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {feed.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {isAr ? "لا توجد أنشطة حديثة" : "No recent activity"}
          </p>
        ) : (
          <ScrollArea className="h-[320px]">
            <div className="space-y-1.5 pe-3">
              {feed.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border/30 p-2.5 transition-colors hover:bg-accent/30">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                    <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(item.time), { addSuffix: true, ...(isAr ? { locale: ar } : {}) })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[9px] shrink-0">
                    {item.type}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
