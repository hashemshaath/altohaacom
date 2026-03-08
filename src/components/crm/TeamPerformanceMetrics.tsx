import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UsersRound, Star, Ticket, MessageSquare, Clock } from "lucide-react";

interface AgentMetrics {
  userId: string;
  name: string;
  avatar?: string;
  ticketsResolved: number;
  chatsHandled: number;
  avgRating: number | null;
  avgResponseMinutes: number | null;
}

export const TeamPerformanceMetrics = memo(function TeamPerformanceMetrics() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: agents = [] } = useQuery({
    queryKey: ["crmTeamPerformance"],
    queryFn: async () => {
      // Get agents who handle chats or assigned tickets
      const [chatRes, ticketRes] = await Promise.all([
        supabase.from("chat_sessions").select("agent_id, rating, status").not("agent_id", "is", null),
        supabase.from("support_tickets").select("assigned_to, status, created_at, resolved_at").not("assigned_to", "is", null),
      ]);

      const agentMap = new Map<string, { ticketsResolved: number; chatsHandled: number; ratings: number[]; responseTimes: number[] }>();

      const ensureAgent = (id: string) => {
        if (!agentMap.has(id)) agentMap.set(id, { ticketsResolved: 0, chatsHandled: 0, ratings: [], responseTimes: [] });
        return agentMap.get(id)!;
      };

      (chatRes.data || []).forEach(c => {
        if (!c.agent_id) return;
        const a = ensureAgent(c.agent_id);
        a.chatsHandled++;
        if (c.rating) a.ratings.push(c.rating);
      });

      (ticketRes.data || []).forEach(t => {
        if (!t.assigned_to) return;
        const a = ensureAgent(t.assigned_to);
        if (t.status === "resolved" || t.status === "closed") {
          a.ticketsResolved++;
          if (t.resolved_at && t.created_at) {
            const mins = Math.round((new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / 60000);
            if (mins > 0) a.responseTimes.push(mins);
          }
        }
      });

      const agentIds = [...agentMap.keys()];
      if (agentIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", agentIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      return agentIds.map(id => {
        const m = agentMap.get(id)!;
        const profile = profileMap.get(id);
        return {
          userId: id,
          name: profile?.full_name || "Agent",
          avatar: profile?.avatar_url,
          ticketsResolved: m.ticketsResolved,
          chatsHandled: m.chatsHandled,
          avgRating: m.ratings.length ? +(m.ratings.reduce((a, b) => a + b, 0) / m.ratings.length).toFixed(1) : null,
          avgResponseMinutes: m.responseTimes.length ? Math.round(m.responseTimes.reduce((a, b) => a + b, 0) / m.responseTimes.length) : null,
        } as AgentMetrics;
      }).sort((a, b) => (b.ticketsResolved + b.chatsHandled) - (a.ticketsResolved + a.chatsHandled));
    },
    staleTime: 60000,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <UsersRound className="h-4 w-4 text-primary" />
          {isAr ? "أداء الفريق" : "Team Performance"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[320px]">
          <div className="space-y-2">
            {agents.map((agent, i) => (
              <div key={agent.userId} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-accent/50 transition-colors">
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={agent.avatar || undefined} />
                    <AvatarFallback className="text-xs">{agent.name[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {i < 3 && (
                    <div className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                      {i + 1}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{agent.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Ticket className="h-3 w-3" /> {agent.ticketsResolved}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <MessageSquare className="h-3 w-3" /> {agent.chatsHandled}
                    </span>
                    {agent.avgResponseMinutes !== null && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> {agent.avgResponseMinutes}m
                      </span>
                    )}
                  </div>
                </div>
                {agent.avgRating !== null && (
                  <Badge variant="outline" className="gap-1 text-[10px] bg-chart-5/10 text-chart-5">
                    <Star className="h-3 w-3" /> {agent.avgRating}
                  </Badge>
                )}
              </div>
            ))}
            {agents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                {isAr ? "لا توجد بيانات أداء" : "No team performance data yet"}
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});
