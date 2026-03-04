import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Plus, Send, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface Props {
  competitionId: string;
}

export function JudgeDeliberationPanel({ competitionId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newTopic, setNewTopic] = useState("");
  const [activeDeliberation, setActiveDeliberation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const { data: deliberations, isLoading } = useQuery({
    queryKey: ["deliberations", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("judge_deliberations")
        .select("id, competition_id, topic, status, created_by, resolved_at, created_at")
        .eq("competition_id", competitionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["deliberation-messages", activeDeliberation],
    queryFn: async () => {
      if (!activeDeliberation) return [];
      const { data, error } = await supabase
        .from("deliberation_messages")
        .select("id, deliberation_id, sender_id, message, created_at")
        .eq("deliberation_id", activeDeliberation)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!activeDeliberation,
  });

  const createDeliberation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("judge_deliberations").insert({
        competition_id: competitionId,
        topic: newTopic,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliberations", competitionId] });
      setNewTopic("");
      toast({ title: isAr ? "تم إنشاء المناقشة" : "Discussion created" });
    },
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!user || !activeDeliberation) return;
      const { error } = await supabase.from("deliberation_messages").insert({
        deliberation_id: activeDeliberation,
        sender_id: user.id,
        message: newMessage,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliberation-messages", activeDeliberation] });
      setNewMessage("");
    },
  });

  const resolveDeliberation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("judge_deliberations")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliberations", competitionId] });
      toast({ title: isAr ? "تم الحل" : "Resolved" });
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">{isAr ? "مداولات الحكام" : "Judge Deliberations"}</h3>
          <p className="text-xs text-muted-foreground">{isAr ? "مناقشة وتنسيق بين الحكام" : "Discussion & coordination between judges"}</p>
        </div>
      </div>

      {/* New topic */}
      <div className="flex gap-2">
        <Input
          value={newTopic}
          onChange={e => setNewTopic(e.target.value)}
          placeholder={isAr ? "موضوع مناقشة جديد..." : "New discussion topic..."}
          className="flex-1"
          onKeyDown={e => { if (e.key === "Enter" && newTopic.trim()) createDeliberation.mutate(); }}
        />
        <Button size="sm" onClick={() => createDeliberation.mutate()} disabled={!newTopic.trim() || createDeliberation.isPending}>
          <Plus className="me-1 h-4 w-4" />{isAr ? "إنشاء" : "Create"}
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Topics list */}
        <div className="space-y-2">
          {!deliberations?.length ? (
            <Card className="border-dashed border-2 border-border/50">
              <CardContent className="py-8 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{isAr ? "لا توجد مناقشات" : "No discussions yet"}</p>
              </CardContent>
            </Card>
          ) : (
            deliberations.map(d => (
              <Card
                key={d.id}
                className={`cursor-pointer transition-all hover:shadow-sm ${activeDeliberation === d.id ? "border-primary/40 bg-primary/5" : "border-border/50"}`}
                onClick={() => setActiveDeliberation(d.id)}
              >
                <CardContent className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{d.topic}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {format(new Date(d.created_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <Badge className={`text-[10px] shrink-0 ${d.status === "resolved" ? "bg-chart-5/10 text-chart-5" : "bg-chart-4/10 text-chart-4"}`}>
                      {d.status === "resolved" ? <CheckCircle className="h-2.5 w-2.5 me-1" /> : <Clock className="h-2.5 w-2.5 me-1" />}
                      {d.status === "resolved" ? (isAr ? "محلول" : "Resolved") : (isAr ? "مفتوح" : "Open")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Messages */}
        {activeDeliberation && (
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium">{isAr ? "الرسائل" : "Messages"}</span>
                {deliberations?.find(d => d.id === activeDeliberation)?.status === "open" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={() => resolveDeliberation.mutate(activeDeliberation)}
                  >
                    <CheckCircle className="me-1 h-3 w-3" />{isAr ? "حل" : "Resolve"}
                  </Button>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
                {!messages?.length ? (
                  <p className="text-xs text-muted-foreground text-center py-4">{isAr ? "لا توجد رسائل" : "No messages yet"}</p>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`rounded-xl p-2.5 ${msg.sender_id === user?.id ? "bg-primary/10 ms-6" : "bg-muted/50 me-6"}`}>
                      <p className="text-xs">{msg.message}</p>
                      <p className="text-[9px] text-muted-foreground mt-1">{format(new Date(msg.created_at), "h:mm a")}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={isAr ? "اكتب رسالة..." : "Type a message..."}
                  className="flex-1 h-9 text-xs"
                  onKeyDown={e => { if (e.key === "Enter" && newMessage.trim()) sendMessage.mutate(); }}
                />
                <Button size="sm" className="h-9" onClick={() => sendMessage.mutate()} disabled={!newMessage.trim()}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
