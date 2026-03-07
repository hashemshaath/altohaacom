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
  ChefHat, Clock, Users, Radio, Send, MessageCircle,
  CalendarClock, UserPlus, Check, Utensils,
} from "lucide-react";
import { format } from "date-fns";
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

/* ---- Hooks ---- */
function useCookingData(exhibitionId: string, userId?: string) {
  const { data: sessions = [] } = useQuery({
    queryKey: ["cooking-sessions", exhibitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibition_cooking_sessions")
        .select("id, title, title_ar, description, description_ar, chef_id, scheduled_start, scheduled_end, status, max_participants, current_participants, cover_image_url, is_live")
        .eq("exhibition_id", exhibitionId)
        .order("scheduled_start", { ascending: true });
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
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
    queryKey: ["cs-my-regs", exhibitionId, userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("exhibition_session_registrations")
        .select("session_id")
        .eq("user_id", userId);
      return (data || []).map((r: any) => r.session_id);
    },
    enabled: !!userId,
  });

  return { sessions, profiles, myRegs };
}

function useSessionInteractions(sessionId: string | null) {
  const queryClient = useQueryClient();

  const { data: interactions = [] } = useQuery({
    queryKey: ["cs-interactions", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data } = await supabase
        .from("exhibition_session_interactions")
        .select("id, user_id, interaction_type, content, emoji, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(100);
      return data || [];
    },
    enabled: !!sessionId,
    refetchInterval: sessionId ? 5000 : false,
  });

  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "exhibition_session_interactions", filter: `session_id=eq.${sessionId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["cs-interactions", sessionId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId, queryClient]);

  return interactions;
}

/* ---- Helpers ---- */
function getStatus(s: any, t: (en: string, ar: string) => string) {
  if (s.status === "live") return { label: t("LIVE", "مباشر"), cls: "bg-destructive text-destructive-foreground animate-pulse", icon: <Radio className="h-3 w-3" /> };
  if (s.status === "completed") return { label: t("Ended", "انتهى"), cls: "bg-muted text-muted-foreground", icon: <Check className="h-3 w-3" /> };
  if (s.status === "cancelled") return { label: t("Cancelled", "ملغي"), cls: "bg-destructive/20 text-destructive", icon: null };
  return { label: t("Upcoming", "قادم"), cls: "bg-primary/10 text-primary", icon: <Clock className="h-3 w-3" /> };
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const map: Record<string, string> = { beginner: "bg-chart-3/10 text-chart-3", intermediate: "bg-chart-4/10 text-chart-4", advanced: "bg-destructive/10 text-destructive" };
  return <Badge className={`${map[difficulty] || map.intermediate} text-[9px]`}>{difficulty}</Badge>;
}

/* ---- Session Detail View ---- */
function SessionDetailView({ session, profiles, interactions, isAr, onBack }: {
  session: any; profiles: Record<string, any>; interactions: any[]; isAr: boolean; onBack: () => void;
}) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState("");

  const sendInteraction = useMutation({
    mutationFn: async ({ type, content, emoji }: { type: string; content?: string; emoji?: string }) => {
      if (!user || !session.id) throw new Error("Missing context");
      const { error } = await supabase.from("exhibition_session_interactions").insert({
        session_id: session.id, user_id: user.id, type, content: content || null, emoji: emoji || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setQuestion("");
      queryClient.invalidateQueries({ queryKey: ["cs-interactions", session.id] });
    },
  });

  const chef = profiles[session.chef_id];
  const st = getStatus(session, t);
  const questions = interactions.filter((i: any) => i.type === "question");
  const reactionCounts: Record<string, number> = {};
  interactions.filter((i: any) => i.type === "reaction").forEach((i: any) => {
    reactionCounts[i.emoji] = (reactionCounts[i.emoji] || 0) + 1;
  });

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-xs">
        ← {t("Back to sessions", "العودة للجلسات")}
      </Button>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Badge className={`${st.cls} text-[10px] gap-1 mb-2`}>{st.icon}{st.label}</Badge>
              <CardTitle className="text-lg">{isAr ? session.title_ar || session.title : session.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(session.scheduled_start), "MMM d, HH:mm")} — {format(new Date(session.scheduled_end), "HH:mm")}
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
          {session.description && <p className="text-sm text-muted-foreground">{isAr ? session.description_ar || session.description : session.description}</p>}

          {session.ingredients?.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1.5 flex items-center gap-1"><Utensils className="h-3 w-3" /> {t("Ingredients", "المكونات")}</p>
              <div className="flex flex-wrap gap-1">
                {session.ingredients.map((i: string) => <Badge key={i} variant="outline" className="text-[9px]">{i}</Badge>)}
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
                disabled={!user || session.status !== "live"}
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

/* ---- Session Card ---- */
function SessionCard({ session, profiles, isRegistered, isAr, onSelect, onRegister }: {
  session: any; profiles: Record<string, any>; isRegistered: boolean; isAr: boolean;
  onSelect: () => void; onRegister: () => void;
}) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const { user } = useAuth();
  const chef = profiles[session.chef_id];
  const st = getStatus(session, t);

  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${session.status === "live" ? "border-destructive/50 ring-1 ring-destructive/20" : "border-border/40"}`} onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Badge className={`${st.cls} text-[10px] gap-1`}>{st.icon}{st.label}</Badge>
          {session.difficulty && <DifficultyBadge difficulty={session.difficulty} />}
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
              <Button size="sm" variant="outline" className="h-6 text-[9px]" onClick={(e) => { e.stopPropagation(); onRegister(); }}>
                <UserPlus className="h-2.5 w-2.5 me-1" />{t("Join", "انضم")}
              </Button>
            )}
            {isRegistered && <Badge variant="outline" className="text-[9px] text-chart-3"><Check className="h-2.5 w-2.5 me-0.5" />{t("Joined", "مسجل")}</Badge>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---- Session Group ---- */
function SessionGroup({ title, icon, sessions, profiles, myRegs, isAr, onSelect, onRegister }: {
  title: string; icon: React.ReactNode; sessions: any[]; profiles: Record<string, any>;
  myRegs: string[]; isAr: boolean; onSelect: (id: string) => void; onRegister: (id: string) => void;
}) {
  if (sessions.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">{icon}{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {sessions.map((s: any) => (
          <SessionCard
            key={s.id} session={s} profiles={profiles}
            isRegistered={myRegs.includes(s.id)} isAr={isAr}
            onSelect={() => onSelect(s.id)}
            onRegister={() => onRegister(s.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ---- Main Component ---- */
export function ExhibitionCookingSessions({ exhibitionId, isAr }: Props) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const { sessions, profiles, myRegs } = useCookingData(exhibitionId, user?.id);
  const interactions = useSessionInteractions(selectedSession);

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

  const selected = sessions.find((s: any) => s.id === selectedSession);

  if (selectedSession && selected) {
    return (
      <SessionDetailView
        session={selected} profiles={profiles as Record<string, any>}
        interactions={interactions} isAr={isAr}
        onBack={() => setSelectedSession(null)}
      />
    );
  }

  const liveSessions = sessions.filter((s: any) => s.status === "live");
  const upcomingSessions = sessions.filter((s: any) => s.status === "scheduled");
  const pastSessions = sessions.filter((s: any) => s.status === "completed");

  return (
    <div className="space-y-6">
      <SessionGroup
        title={t("Live Now", "مباشر الآن")}
        icon={<Radio className="h-4 w-4 text-destructive animate-pulse" />}
        sessions={liveSessions} profiles={profiles as Record<string, any>}
        myRegs={myRegs} isAr={isAr}
        onSelect={setSelectedSession}
        onRegister={(id) => registerMut.mutate(id)}
      />

      <SessionGroup
        title={t("Upcoming", "قادم")}
        icon={<CalendarClock className="h-4 w-4 text-primary" />}
        sessions={upcomingSessions} profiles={profiles as Record<string, any>}
        myRegs={myRegs} isAr={isAr}
        onSelect={setSelectedSession}
        onRegister={(id) => registerMut.mutate(id)}
      />

      <SessionGroup
        title={t("Past Sessions", "جلسات سابقة")}
        icon={<Check className="h-4 w-4 text-muted-foreground" />}
        sessions={pastSessions} profiles={profiles as Record<string, any>}
        myRegs={myRegs} isAr={isAr}
        onSelect={setSelectedSession}
        onRegister={(id) => registerMut.mutate(id)}
      />

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
