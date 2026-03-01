import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, Flag, Package, Ticket,
  UserCheck, FileText, Building2, ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PendingItem {
  label: string;
  labelAr: string;
  count: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  link: string;
  urgent?: boolean;
}

export function AdminPendingActionsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-pending-actions"],
    queryFn: async (): Promise<{ pendingReports: number; pendingOrders: number; pendingTickets: number; pendingCompanies: number; pendingPosts: number }> => {
      const [r1, r2, r3, r4, r5] = await Promise.all([
        supabase.from("content_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("company_orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("companies").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("moderation_status", "pending"),
      ] as const);

      return {
        pendingReports: r1.count || 0,
        pendingOrders: r2.count || 0,
        pendingTickets: r3.count || 0,
        pendingCompanies: r4.count || 0,
        pendingPosts: r5.count || 0,
      };
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });

  const items: PendingItem[] = [
    {
      label: "Reports", labelAr: "بلاغات",
      count: data?.pendingReports || 0,
      icon: Flag, color: "text-destructive", bg: "bg-destructive/10",
      link: "/admin/moderation", urgent: (data?.pendingReports || 0) > 0,
    },
    {
      label: "Tickets", labelAr: "تذاكر",
      count: data?.pendingTickets || 0,
      icon: Ticket, color: "text-chart-4", bg: "bg-chart-4/10",
      link: "/admin/tickets", urgent: (data?.pendingTickets || 0) > 3,
    },
    {
      label: "Orders", labelAr: "طلبات",
      count: data?.pendingOrders || 0,
      icon: Package, color: "text-chart-3", bg: "bg-chart-3/10",
      link: "/admin/orders",
    },
    {
      label: "Companies", labelAr: "شركات",
      count: data?.pendingCompanies || 0,
      icon: Building2, color: "text-chart-5", bg: "bg-chart-5/10",
      link: "/admin/companies",
    },
    {
      label: "Posts", labelAr: "منشورات",
      count: data?.pendingPosts || 0,
      icon: ClipboardCheck, color: "text-primary", bg: "bg-primary/10",
      link: "/admin/moderation",
    },
  ];

  const totalPending = items.reduce((sum, i) => sum + i.count, 0);

  return (
    <Card className={cn(
      "border-border/50",
      totalPending > 0 && "border-chart-4/30"
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className={cn(
             "flex h-7 w-7 items-center justify-center rounded-xl",
            totalPending > 0 ? "bg-chart-4/10" : "bg-chart-2/10"
          )}>
            {totalPending > 0 ? (
              <AlertTriangle className="h-3.5 w-3.5 text-chart-4" />
            ) : (
              <ClipboardCheck className="h-3.5 w-3.5 text-chart-2" />
            )}
          </div>
          {isAr ? "إجراءات معلقة" : "Pending Actions"}
          {totalPending > 0 && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
              {totalPending}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalPending === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm font-medium text-chart-2">
              {isAr ? "لا توجد إجراءات معلقة ✨" : "All caught up! ✨"}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.filter(i => i.count > 0).map((item) => (
              <Link key={item.label} to={item.link}>
                <div className={cn(
                  "flex items-center justify-between rounded-xl border border-border/30 p-2.5 transition-all duration-300 hover:bg-accent/30 hover:shadow-sm hover:-translate-y-0.5",
                  item.urgent && "border-destructive/20 bg-destructive/5"
                )}>
                  <div className="flex items-center gap-2.5">
                    <div className={cn("flex h-7 w-7 items-center justify-center rounded-xl", item.bg)}>
                      <item.icon className={cn("h-3.5 w-3.5", item.color)} />
                    </div>
                    <span className="text-xs font-medium">
                      {isAr ? item.labelAr : item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.urgent ? "destructive" : "secondary"} className="text-[10px] h-5 px-1.5">
                      {item.count}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
