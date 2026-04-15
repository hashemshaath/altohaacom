import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MessageSquare, Bell, Ticket, Mail, Zap } from "lucide-react";
import { CACHE } from "@/lib/queryConfig";

const NAV_ITEMS = [
  { href: "/admin/support-tickets", icon: Ticket, labelEn: "Support", labelAr: "الدعم", countKey: "tickets" },
  { href: "/admin/notifications", icon: Bell, labelEn: "Notifications", labelAr: "الإشعارات" },
  { href: "/admin/live-chat", icon: MessageSquare, labelEn: "Live Chat", labelAr: "المحادثات", countKey: "chats" },
  { href: "/admin/communications", icon: Mail, labelEn: "Templates", labelAr: "القوالب" },
  { href: "/admin/marketing-automation", icon: Zap, labelEn: "Automation", labelAr: "الأتمتة" },
];

export const CommunicationsQuickNav = memo(function CommunicationsQuickNav() {
  const isAr = useIsAr();
  const location = useLocation();

  const { data: counts } = useQuery({
    queryKey: ["comms-nav-counts"],
    queryFn: async () => {
      const [ticketsRes, chatsRes] = await Promise.allSettled([
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
        supabase.from("chat_session_messages").select("id", { count: "exact", head: true }),
      ]);
      return {
        tickets: ticketsRes.status === "fulfilled" ? ticketsRes.value.count || 0 : 0,
        chats: chatsRes.status === "fulfilled" ? chatsRes.value.count || 0 : 0,
      };
    },
    staleTime: CACHE.short.staleTime,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.href;
        const count = item.countKey && counts ? counts[item.countKey as keyof typeof counts] ?? 0 : 0;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200 shrink-0",
              isActive
                ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                : "border-border/40 bg-card hover:border-border/70 hover:bg-muted/40 text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{isAr ? item.labelAr : item.labelEn}</span>
            {count > 0 && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs px-1.5 py-0 h-4 min-w-[18px] justify-center",
                  isActive ? "bg-primary/20 text-primary" : ""
                )}
              >
                {count}
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );
});
