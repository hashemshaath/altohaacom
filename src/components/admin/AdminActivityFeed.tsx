import { memo } from "react";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, UserPlus, Flag, Trophy, Shield, Package, Ticket } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface FeedItem {
  id: string;
  type: "user" | "report" | "order" | "action" | "competition" | "article" | "ticket" | "message";
  title: string;
  time: string;
  icon: typeof Activity;
  color: string;
}

interface ProfileRow { user_id: string; full_name: string | null; display_name: string | null; created_at: string }
interface ReportRow { id: string; reason: string | null; created_at: string }
interface OrderRow { id: string; order_number: string | null; created_at: string }
interface ActionRow { id: string; action_type: string; created_at: string }
interface RegRow { id: string; registration_number: string | null; registered_at: string }
interface TicketRow { id: string; ticket_number: string | null; subject: string | null; created_at: string }

export const AdminActivityFeed = memo(function AdminActivityFeed() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: feed = [] } = useQuery({
    queryKey: ["admin-activity-feed"],
    queryFn: async () => {
      const now = new Date();
      const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const [users, reports, orders, actions, competitions, tickets] = await Promise.allSettled([
        supabase.from("profiles").select("user_id, full_name, display_name, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(5),
        supabase.from("content_reports").select("id, reason, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(5),
        supabase.from("company_orders").select("id, order_number, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(5),
        supabase.from("admin_actions").select("id, action_type, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(5),
        supabase.from("competition_registrations").select("id, registration_number, registered_at").gte("registered_at", since).order("registered_at", { ascending: false }).limit(5),
        supabase.from("support_tickets").select("id, ticket_number, subject, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(5),
      ]);

      const items: FeedItem[] = [];

      function getData<T>(r: PromiseSettledResult<{ data: T[] | null }>): T[] {
        return r.status === "fulfilled" ? (r.value?.data || []) : [];
      }

      getData<ProfileRow>(users).forEach((u) => items.push({
        id: `u-${u.user_id}`, type: "user",
        title: isAr ? `${u.display_name || u.full_name || "مستخدم"} انضم` : `${u.display_name || u.full_name || "User"} joined`,
        time: u.created_at, icon: UserPlus, color: "text-primary",
      }));

      getData<ReportRow>(reports).forEach((r) => items.push({
        id: `r-${r.id}`, type: "report",
        title: isAr ? `بلاغ جديد: ${r.reason || "محتوى"}` : `New report: ${r.reason || "content"}`,
        time: r.created_at, icon: Flag, color: "text-destructive",
      }));

      getData<OrderRow>(orders).forEach((o) => items.push({
        id: `o-${o.id}`, type: "order",
        title: isAr ? `طلب ${o.order_number}` : `Order ${o.order_number}`,
        time: o.created_at, icon: Package, color: "text-chart-3",
      }));

      getData<ActionRow>(actions).forEach((a) => items.push({
        id: `a-${a.id}`, type: "action",
        title: isAr ? `إجراء: ${a.action_type.replace(/_/g, " ")}` : `Action: ${a.action_type.replace(/_/g, " ")}`,
        time: a.created_at, icon: Shield, color: "text-chart-4",
      }));

      getData<RegRow>(competitions).forEach((c) => items.push({
        id: `c-${c.id}`, type: "competition",
        title: isAr ? `تسجيل مسابقة ${c.registration_number || ""}` : `Competition reg ${c.registration_number || ""}`,
        time: c.registered_at, icon: Trophy, color: "text-chart-5",
      }));

      getData<TicketRow>(tickets).forEach((t) => items.push({
        id: `t-${t.id}`, type: "ticket",
        title: isAr ? `تذكرة: ${t.subject || t.ticket_number}` : `Ticket: ${t.subject || t.ticket_number}`,
        time: t.created_at, icon: Ticket, color: "text-chart-1",
      }));

      return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 15);
    },
    staleTime: 1000 * 30,
    refetchInterval: useVisibleRefetchInterval(1000 * 60),
  });

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-chart-2/10">
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
              {feed.map((item, idx) => {
                const isRecent = Date.now() - new Date(item.time).getTime() < 5 * 60 * 1000;
                return (
                  <div key={item.id} className={`flex items-center gap-3 rounded-xl border p-2.5 transition-all duration-200 hover:bg-accent/30 hover:border-border/50 hover:shadow-sm group/item ${isRecent ? "border-primary/30 bg-primary/5" : "border-border/30"}`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover/item:scale-110 ${isRecent ? "bg-primary/10" : "bg-muted/60"}`}>
                      <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(item.time), { addSuffix: true, ...(isAr ? { locale: ar } : {}) })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isRecent && (
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chart-3 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-chart-3" />
                        </span>
                      )}
                      <Badge variant="outline" className="text-[9px] transition-colors group-hover/item:border-primary/30">
                        {item.type}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
});
