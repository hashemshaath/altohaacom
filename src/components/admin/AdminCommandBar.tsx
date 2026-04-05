import { memo, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  Zap, Users, Trophy, FileText, AlertTriangle,
  MessageSquare, ArrowRight, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: React.ElementType;
  label: string;
  labelAr: string;
  href: string;
  color: string;
  count?: number;
  urgent?: boolean;
}

/**
 * Admin command palette with quick stats and shortcuts.
 */
export const AdminCommandBar = memo(function AdminCommandBar() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["adminCommandBarStats"],
    queryFn: async () => {
      const rReports = await supabase.from("content_reports").select("id", { count: "exact", head: true }).eq("status", "pending");
      const rUsers = await (supabase.from("profiles").select("user_id", { count: "exact", head: true }) as any).eq("status", "pending");
      const rTickets = await supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]);
      return {
        pendingReports: rReports.count ?? 0,
        pendingUsers: (rUsers as any).count ?? 0,
        openTickets: rTickets.count ?? 0,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  const actions: QuickAction[] = useMemo(() => [
    {
      icon: AlertTriangle, label: "Reports", labelAr: "البلاغات",
      href: "/admin/moderation", color: "text-destructive bg-destructive/10",
      count: data?.pendingReports, urgent: (data?.pendingReports ?? 0) > 0,
    },
    {
      icon: Users, label: "Pending Users", labelAr: "مستخدمون معلقون",
      href: "/admin/users", color: "text-chart-4 bg-chart-4/10",
      count: data?.pendingUsers, urgent: (data?.pendingUsers ?? 0) > 5,
    },
    {
      icon: MessageSquare, label: "Support", labelAr: "الدعم",
      href: "/admin/support", color: "text-primary bg-primary/10",
      count: data?.openTickets,
    },
    {
      icon: Trophy, label: "Competitions", labelAr: "المسابقات",
      href: "/admin/competitions", color: "text-chart-5 bg-chart-5/10",
    },
    {
      icon: FileText, label: "Articles", labelAr: "المقالات",
      href: "/admin/articles", color: "text-chart-2 bg-chart-2/10",
    },
  ], [data]);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          {isAr ? "إجراءات سريعة" : "Quick Actions"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {actions.map((a) => (
            <Link key={a.href} to={a.href}>
              <div className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl p-3 border border-border/30",
                "hover:border-primary/30 hover:shadow-sm transition-all active:scale-[0.97]",
                "relative group"
              )}>
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110", a.color)}>
                  <a.icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground line-clamp-1">
                  {isAr ? a.labelAr : a.label}
                </span>
                {a.count != null && a.count > 0 && (
                  <Badge
                    variant={a.urgent ? "destructive" : "secondary"}
                    className="absolute -top-1 -end-1 h-5 min-w-5 text-[9px] px-1 rounded-full"
                  >
                    <AnimatedCounter value={a.count} className="inline" />
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
