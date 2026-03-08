import { useState, useMemo, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MessageSquare, ArrowRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export function MessageSearchWidget() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["message-search", query, user?.id],
    queryFn: async () => {
      if (!user || !query || query.length < 2) return [];
      
      const { data } = await supabase
        .from("messages")
        .select("id, content, sender_id, receiver_id, created_at, is_read")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .ilike("content", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(10);

      return data || [];
    },
    enabled: !!user && query.length >= 2,
    staleTime: 15000,
  });

  const { data: profiles } = useQuery({
    queryKey: ["message-search-profiles", results.map(r => r.sender_id + r.receiver_id).join(",")],
    queryFn: async () => {
      if (!user || results.length === 0) return {};
      const ids = new Set<string>();
      results.forEach(r => {
        if (r.sender_id !== user.id) ids.add(r.sender_id);
        if (r.receiver_id !== user.id) ids.add(r.receiver_id);
      });
      const { data } = await supabase.from("profiles").select("user_id, full_name, full_name_ar, avatar_url").in("user_id", Array.from(ids));
      const map: Record<string, { name: string; avatar?: string }> = {};
      data?.forEach(p => {
        map[p.user_id] = { name: isAr && p.full_name_ar ? p.full_name_ar : p.full_name || "", avatar: p.avatar_url || undefined };
      });
      return map;
    },
    enabled: results.length > 0,
  });

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          {isAr ? "بحث في الرسائل" : "Search Messages"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-3">
          <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder={isAr ? "ابحث في محادثاتك..." : "Search your conversations..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 ps-9 pe-8 text-xs rounded-xl"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute end-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {query.length >= 2 && (
          <ScrollArea className="h-[200px]">
            {isFetching ? (
              <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                {isAr ? "جاري البحث..." : "Searching..."}
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                {isAr ? "لا توجد نتائج" : "No messages found"}
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((msg) => {
                  const otherUserId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
                  const profile = profiles?.[otherUserId];
                  const isSent = msg.sender_id === user?.id;

                  return (
                    <button
                      key={msg.id}
                      onClick={() => navigate("/messages")}
                      className="w-full flex items-start gap-2 rounded-xl p-2 hover:bg-muted/50 transition-colors text-start group"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <MessageSquare className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium truncate">
                            {profile?.name || (isAr ? "مستخدم" : "User")}
                          </span>
                          <Badge variant="secondary" className="text-[8px] px-1 h-3.5">
                            {isSent ? (isAr ? "مرسل" : "Sent") : (isAr ? "مستلم" : "Received")}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                          {msg.content}
                        </p>
                        <span className="text-[9px] text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: isAr ? ar : enUS })}
                        </span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180 shrink-0 mt-2" />
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        )}

        {!query && (
          <Button variant="ghost" size="sm" className="w-full text-xs gap-1.5" onClick={() => navigate("/messages")}>
            <MessageSquare className="h-3.5 w-3.5" />
            {isAr ? "فتح الرسائل" : "Open Messages"}
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
