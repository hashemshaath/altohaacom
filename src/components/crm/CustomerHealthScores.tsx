import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { HeartPulse, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Link } from "react-router-dom";

interface CustomerHealth {
  userId: string;
  name: string;
  avatar?: string;
  score: number;
  ticketCount: number;
  chatCount: number;
  orderCount: number;
  lastActive: string | null;
  trend: "up" | "down" | "stable";
}

export function CustomerHealthScores() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: healthData = [], isLoading } = useQuery({
    queryKey: ["crmHealthScores"],
    queryFn: async () => {
      // Fetch recent active users from profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, last_login_at, created_at")
        .order("last_login_at", { ascending: false })
        .limit(20);

      if (!profiles?.length) return [];

      const userIds = profiles.map(p => p.user_id);

      // Parallel fetches
      const [ticketRes, chatRes, orderRes] = await Promise.all([
        supabase.from("support_tickets").select("user_id").in("user_id", userIds),
        supabase.from("chat_sessions").select("user_id, rating").in("user_id", userIds),
        supabase.from("shop_orders").select("buyer_id").in("buyer_id", userIds),
      ]);

      const ticketMap = new Map<string, number>();
      (ticketRes.data || []).forEach(t => ticketMap.set(t.user_id, (ticketMap.get(t.user_id) || 0) + 1));

      const chatMap = new Map<string, number>();
      const ratingMap = new Map<string, number[]>();
      (chatRes.data || []).forEach(c => {
        chatMap.set(c.user_id, (chatMap.get(c.user_id) || 0) + 1);
        if (c.rating) {
          const arr = ratingMap.get(c.user_id) || [];
          arr.push(c.rating);
          ratingMap.set(c.user_id, arr);
        }
      });

      const orderMap = new Map<string, number>();
      (orderRes.data || []).forEach(o => orderMap.set(o.buyer_id, (orderMap.get(o.buyer_id) || 0) + 1));

      return profiles.map(p => {
        const tickets = ticketMap.get(p.user_id) || 0;
        const chats = chatMap.get(p.user_id) || 0;
        const orders = orderMap.get(p.user_id) || 0;
        const ratings = ratingMap.get(p.user_id) || [];
        const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 3;

        // Health score: activity recency + low tickets + high ratings + orders
        const daysSinceLogin = p.last_login_at
          ? Math.floor((Date.now() - new Date(p.last_login_at).getTime()) / 86400000)
          : 999;
        const recencyScore = Math.max(0, 40 - daysSinceLogin * 2); // 0-40
        const ratingScore = (avgRating / 5) * 25; // 0-25
        const orderScore = Math.min(orders * 5, 20); // 0-20
        const ticketPenalty = Math.min(tickets * 3, 15); // 0-15 penalty
        const engagementScore = Math.min(chats * 3, 15); // 0-15

        const score = Math.round(Math.max(0, Math.min(100, recencyScore + ratingScore + orderScore + engagementScore - ticketPenalty)));

        const trend: "up" | "down" | "stable" = daysSinceLogin < 3 ? "up" : daysSinceLogin > 14 ? "down" : "stable";

        return {
          userId: p.user_id,
          name: p.full_name || "Unknown",
          avatar: p.avatar_url,
          score,
          ticketCount: tickets,
          chatCount: chats,
          orderCount: orders,
          lastActive: p.last_login_at,
          trend,
        } as CustomerHealth;
      }).sort((a, b) => b.score - a.score);
    },
    staleTime: 60000,
  });

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-chart-5";
    if (score >= 40) return "text-chart-3";
    return "text-destructive";
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return "bg-chart-5/10";
    if (score >= 40) return "bg-chart-3/10";
    return "bg-destructive/10";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return isAr ? "ممتاز" : "Healthy";
    if (score >= 40) return isAr ? "متوسط" : "At Risk";
    return isAr ? "منخفض" : "Critical";
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "up") return <TrendingUp className="h-3 w-3 text-chart-5" />;
    if (trend === "down") return <TrendingDown className="h-3 w-3 text-destructive" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  // Distribution stats
  const healthy = healthData.filter(h => h.score >= 70).length;
  const atRisk = healthData.filter(h => h.score >= 40 && h.score < 70).length;
  const critical = healthData.filter(h => h.score < 40).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-primary" />
          {isAr ? "صحة العملاء" : "Customer Health Scores"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Distribution */}
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-chart-5/10 text-chart-5 text-[10px]">
            {healthy} {isAr ? "ممتاز" : "Healthy"}
          </Badge>
          <Badge variant="outline" className="bg-chart-3/10 text-chart-3 text-[10px]">
            {atRisk} {isAr ? "متوسط" : "At Risk"}
          </Badge>
          <Badge variant="outline" className="bg-destructive/10 text-destructive text-[10px]">
            {critical} {isAr ? "حرج" : "Critical"}
          </Badge>
        </div>

        <ScrollArea className="max-h-[320px]">
          <div className="space-y-2">
            {healthData.slice(0, 10).map(customer => (
              <Link
                key={customer.userId}
                to={`/admin/users/${customer.userId}`}
                className="flex items-center gap-3 rounded-lg border p-2.5 hover:bg-accent/50 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={customer.avatar || undefined} />
                  <AvatarFallback className="text-xs">{customer.name[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{customer.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      🎫{customer.ticketCount} 💬{customer.chatCount} 🛒{customer.orderCount}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendIcon trend={customer.trend} />
                  <div className="text-end w-14">
                    <p className={`text-sm font-bold ${getScoreColor(customer.score)}`}>{customer.score}</p>
                    <Badge variant="outline" className={`text-[8px] px-1 py-0 ${getScoreBg(customer.score)} ${getScoreColor(customer.score)}`}>
                      {getScoreLabel(customer.score)}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
            {healthData.length === 0 && !isLoading && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isAr ? "لا توجد بيانات" : "No data available"}
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
