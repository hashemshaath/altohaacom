import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ChefHat, Clock, Users, Play, Radio, Send, Heart, MessageCircle,
  Star, Flame, ThumbsUp, Utensils, CalendarClock, UserPlus, Check,
} from "lucide-react";
import { format, isPast, isFuture, isWithinInterval } from "date-fns";
import { toast } from "sonner";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

const EMOJI_REACTIONS = [
  { emoji: "🔥", label: "fire" },
  { emoji: "❤️", label: "love" },
  { emoji: "👏", label: "bravo" },
  { emoji: "😍", label: "amazing" },
  { emoji: "👨‍🍳", label: "chef" },
];

export function ExhibitionCookingSessions({ exhibitionId, isAr }: Props) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [question, setQuestion] = useState("");

  const { data: sessions = [] } = useQuery({
    queryKey: ["cooking-sessions", exhibitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibition_cooking_sessions")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .order("scheduled_start", { ascending: true });
      return data || [];
    },
    staleTime: 1000 * 30,
  });

  const { data: profiles = {} } = useQuery({
    queryKey: ["cs-profiles", exhibitionId],
    queryFn: async () => {
      const chefIds = [...new Set(sessions.map((s: any) => s.chef_id))];
      if (!chefIds.length) return {};
      const { data } = await supabase.from("profiles").select("user_id, full_name, username, avatar_url").in("user_id", chefIds);
      const map: Record<string, any> = {};
      (data || []).forEach((p: any) => { map[p.user_id] = p; });
      return map;
    },
    enabled: sessions.length > 0,
  });

  const { data: myRegs = [] } = useQuery({
    queryKey: ["cs-my-regs", exhibitionId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("exhibition_session_registrations")
        .select("session_id")
        .eq("user_id", user.id);
      return (data || []).map((r: any) => r.session_id);
    },
    enabled: !!user,
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ["cs-interactions", selectedSession],
    queryFn: async () => {
      if (!selectedSession) return [];
      const { data } = await supabase
        .from("exhibition_session_interactions")
        .select("*")
        .eq("session_id", selectedSession)
        .order("created_at", { ascending: true })
        .limit(100);
      return data || [];
    },
    enabled: !!selectedSession,
    refetchInterval: selectedSession ? 5000 : false,
  });

  // Realtime for interactions
  useEffect(() => {
    if (!selectedSession) return;
    const channel = supabase
      .channel(`session-${selectedSession}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "exhibition_session_interactions", filter: `session_id=eq.${selectedSession}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["cs-interactions", selectedSession] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedSession, queryClient]);

  const registerMut = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("exhibition_session_registrations").insert({ session_id: sessionId, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("Registered!", "تم التسجيل!"));
      queryClient.invalidateQueries({ queryKey: ["cs-my-regs"] });
    },
  });

  const sendInteraction = useMutation({
    mutationFn: async ({ type, content, emoji }: { type: string; content?: string; emoji?: string }) => {
      if (!user || !selectedSession) throw new Error("Missing context");
      const { error } = await supabase.from("exhibition_session_interactions").insert({
        session_id: selectedSession,
        user_id: user.id,
        type,
        content: content || null,
        emoji: emoji || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setQuestion("");
      queryClient.invalidateQueries({ queryKey: ["cs-interactions", selectedSession] });
    },
  });

  const getStatus = (s: any) => {
    if (s.status === "live") return { label: t("LIVE", "مباشر"), cls: "bg-destructive text-destructive-foreground animate-pulse", icon: <Radio className="h-3 w-3" /> };
    if (s.status === "completed") return { label: t("Ended", "انتهى"), cls: "bg-muted text-muted-foreground", icon: <Check className="h-3 w-3" /> };
    if (s.status === "cancelled") return { label: t("Cancelled", "ملغي"), cls: "bg-destructive/20 text-destructive", icon: null };
    return { label: t("Upcoming", "قادم"), cls: "bg-primary/10 text-primary", icon: <Clock className="h-3 w-3" /> };
  };

  const difficultyBadge = (d: string) => {
    const map: Record<string, string> = { beginner: "bg-chart-3/10 text-chart-3", intermediate: "bg-chart-4/10 text-chart-4", advanced: "bg-destructive/10 text-destructive" };
    return <Badge className={`${map[d] || map.intermediate} text-[9px]`}>{d}</Badge>;
  };

  const selected = sessions.find((s: any) => s.id === selectedSession);

  if (selectedSession && selected) {
    const chef = (profiles as any)[selected.chef_id];
    const st = getStatus(selected);
    const questions = interactions.filter((i: any) => i.type === "question");
    const reactionCounts: Record<string, number> = {};
    interactions.filter((i: any) => i.type === "reaction").forEach((i: any) => {
      reactionCounts[i.emoji] = (reactionCounts[i.emoji] || 0) + 1;
    });

    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)} className="text-xs">
          ← {t("Back to sessions", "العودة للجلسات")}
        </Button>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Badge className={`${st.cls} text-[10px] gap-1 mb-2`}>{st.icon}{st.label}</Badge>
                <CardTitle className="text-lg">{isAr ? selected.title_ar || selected.title : selected.title}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(selected.scheduled_start), "MMM d, HH:mm")} — {format(new Date(selected.scheduled_end), "HH:mm")}
                </p>
              </div>
              {chef && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={chef.avatar_url} />
                    <AvatarFallback><ChefHat className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <div className="text-end">
                    <p className="text-sm font-medium">{chef.full_name || chef.username}</p>
                    <p className="text-[10px] text-muted-foreground">{t("Chef", "شيف")}</p>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected.description && <p className="text-sm text-muted-foreground">{isAr ? selected.description_ar || selected.description : selected.description}</p>}

            {/* Ingredients */}
            {selected.ingredients?.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-1.5 flex items-center gap-1"><Utensils className="h-3 w-3" /> {t("Ingredients", "المكونات")}</p>
                <div className="flex flex-wrap gap-1">
                  {selected.ingredients.map((i: string) => <Badge key={i} variant="outline" className="text-[9px]">{i}</Badge>)}
                </div>
              </div>
            )}

            <Separator />

            {/* Reactions */}
            <div className="flex items-center gap-2 flex-wrap">
              {EMOJI_REACTIONS.map((r) => (
                <Button
                  key={r.label}
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-sm"
                  disabled={!user || selected.status !== "live"}
                  onClick={() => sendInteraction.mutate({ type: "reaction", emoji: r.emoji })}
                >
                  {r.emoji} {reactionCounts[r.emoji] ? <span className="text-[10px] text-muted-foreground">{reactionCounts[r.emoji]}</span> : null}
                </Button>
              ))}
            </div>

            {/* Q&A */}
            <div>
              <p className="text-xs font-semibold mb-2 flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {t("Questions", "الأسئلة")} ({questions.length})</p>
              <ScrollArea className="h-48 border rounded-md p-2">
                {questions.map((q: any) => (
                  <div key={q.id} className="flex items-start gap-2 py-1.5 text-xs">
                    <MessageCircle className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                    <div className="flex-1">
                      <p>{q.content}</p>
                      <p className="text-[9px] text-muted-foreground">{format(new Date(q.created_at), "HH:mm")}</p>
                    </div>
                    {q.is_pinned && <Badge variant="outline" className="text-[8px]">📌</Badge>}
                  </div>
                ))}
                {questions.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">{t("No questions yet", "لا أسئلة بعد")}</p>}
              </ScrollArea>

              {user && (
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder={t("Ask a question...", "اطرح سؤالاً...")}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && question.trim() && sendInteraction.mutate({ type: "question", content: question.trim() })}
                    className="text-xs"
                  />
                  <Button size="sm" disabled={!question.trim() || sendInteraction.isPending} onClick={() => sendInteraction.mutate({ type: "question", content: question.trim() })}>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sessions list
  const liveSessions = sessions.filter((s: any) => s.status === "live");
  const upcomingSessions = sessions.filter((s: any) => s.status === "scheduled");
  const pastSessions = sessions.filter((s: any) => s.status === "completed");

  const SessionCard = ({ session }: { session: any }) => {
    const chef = (profiles as any)[session.chef_id];
    const st = getStatus(session);
    const isRegistered = myRegs.includes(session.id);

    return (
      <Card className={`cursor-pointer transition-all hover:shadow-md ${session.status === "live" ? "border-destructive/50 ring-1 ring-destructive/20" : "border-border/40"}`} onClick={() => setSelectedSession(session.id)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <Badge className={`${st.cls} text-[10px] gap-1`}>{st.icon}{st.label}</Badge>
            {session.difficulty && difficultyBadge(session.difficulty)}
          </div>
          <h3 className="font-semibold text-sm mb-1">{isAr ? session.title_ar || session.title : session.title}</h3>
          <p className="text-[10px] text-muted-foreground mb-3 line-clamp-2">{isAr ? session.description_ar || session.description : session.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {chef && (
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={chef.avatar_url} />
                    <AvatarFallback className="text-[8px]"><ChefHat className="h-3 w-3" /></AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] font-medium">{chef.full_name || chef.username}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {format(new Date(session.scheduled_start), "HH:mm")}
              </span>
              {session.status === "scheduled" && user && !isRegistered && (
                <Button size="sm" variant="outline" className="h-6 text-[9px]" onClick={(e) => { e.stopPropagation(); registerMut.mutate(session.id); }}>
                  <UserPlus className="h-2.5 w-2.5 me-1" />{t("Join", "انضم")}
                </Button>
              )}
              {isRegistered && <Badge variant="outline" className="text-[9px] text-chart-3"><Check className="h-2.5 w-2.5 me-0.5" />{t("Joined", "مسجل")}</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Live Now */}
      {liveSessions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Radio className="h-4 w-4 text-destructive animate-pulse" />
            {t("Live Now", "مباشر الآن")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {liveSessions.map((s: any) => <SessionCard key={s.id} session={s} />)}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcomingSessions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <CalendarClock className="h-4 w-4 text-primary" />
            {t("Upcoming", "قادم")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {upcomingSessions.map((s: any) => <SessionCard key={s.id} session={s} />)}
          </div>
        </div>
      )}

      {/* Past */}
      {pastSessions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Check className="h-4 w-4 text-muted-foreground" />
            {t("Past Sessions", "جلسات سابقة")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {pastSessions.map((s: any) => <SessionCard key={s.id} session={s} />)}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <ChefHat className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{t("No cooking sessions scheduled yet", "لا توجد جلسات طهي مجدولة بعد")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
