import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import {
  Zap, Trophy, FileText, Users, ShoppingBag,
  MessageSquare, ArrowRight, Flame, TrendingUp, Clock,
} from "lucide-react";

interface QuickAction {
  icon: React.ElementType;
  label: string;
  labelAr: string;
  href: string;
  color: string;
  bg: string;
  badge?: string;
  badgeAr?: string;
}

export const QuickActionsWidget = memo(function QuickActionsWidget() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  const { data: pending } = useQuery({
    queryKey: ["quick-actions-pending", user?.id],
    queryFn: async () => {
      if (!user) return { unreadMessages: 0, pendingRegs: 0, newPosts: 0 };

      const [msgRes, regRes] = await Promise.all([
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("receiver_id", user.id)
          .eq("is_read", false),
        supabase
          .from("competition_registrations")
          .select("id", { count: "exact", head: true })
          .eq("participant_id", user.id)
          .eq("status", "pending"),
      ]);

      return {
        unreadMessages: msgRes.count || 0,
        pendingRegs: regRes.count || 0,
        newPosts: 0,
      };
    },
    enabled: !!user,
    staleTime: 60000,
  });

  const actions: QuickAction[] = [
    {
      icon: Trophy,
      label: "Join Competition",
      labelAr: "انضم لمسابقة",
      href: "/competitions",
      color: "text-primary",
      bg: "bg-primary/10",
      badge: pending?.pendingRegs ? `${pending.pendingRegs} pending` : undefined,
      badgeAr: pending?.pendingRegs ? `${pending.pendingRegs} معلق` : undefined,
    },
    {
      icon: FileText,
      label: "Create Post",
      labelAr: "أنشئ منشور",
      href: "/community",
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      icon: MessageSquare,
      label: "Messages",
      labelAr: "الرسائل",
      href: "/messages",
      color: "text-chart-3",
      bg: "bg-chart-3/10",
      badge: pending?.unreadMessages ? `${pending.unreadMessages} new` : undefined,
      badgeAr: pending?.unreadMessages ? `${pending.unreadMessages} جديد` : undefined,
    },
    {
      icon: ShoppingBag,
      label: "Browse Shop",
      labelAr: "تصفح المتجر",
      href: "/shop",
      color: "text-chart-4",
      bg: "bg-chart-4/10",
    },
    {
      icon: Users,
      label: "Find Chefs",
      labelAr: "ابحث عن طهاة",
      href: "/explore",
      color: "text-chart-5",
      bg: "bg-chart-5/10",
    },
    {
      icon: TrendingUp,
      label: "My Analytics",
      labelAr: "تحليلاتي",
      href: "/profile?tab=analytics",
      color: "text-chart-1",
      bg: "bg-chart-1/10",
    },
  ];

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          {isAr ? "إجراءات سريعة" : "Quick Actions"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {actions.map((action) => (
          <Button
            key={action.href}
            variant="ghost"
            className="w-full justify-start gap-3 h-10 px-3 text-xs font-medium hover:bg-muted/60 group"
            asChild
          >
            <Link to={action.href}>
              <div className={`flex h-7 w-7 items-center justify-center rounded-xl ${action.bg} shrink-0 transition-transform group-hover:scale-110`}>
                <action.icon className={`h-3.5 w-3.5 ${action.color}`} />
              </div>
              <span className="flex-1 text-start truncate">
                {isAr ? action.labelAr : action.label}
              </span>
              {(isAr ? action.badgeAr : action.badge) && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0">
                  {isAr ? action.badgeAr : action.badge}
                </Badge>
              )}
              <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
});
