import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Heart, Trophy, Landmark } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Link } from "react-router-dom";

interface Props {
  userId: string;
  isAr: boolean;
}

export function PublicProfileComments({ userId, isAr }: Props) {
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["public-profile-comments", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_comments")
        .select("id, content, event_type, event_id, likes_count, created_at")
        .eq("user_id", userId)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error || !data || data.length === 0) return [];

      // Fetch event titles
      const compIds = data.filter(c => c.event_type === "competition").map(c => c.event_id);
      const exhIds = data.filter(c => c.event_type === "exhibition").map(c => c.event_id);

      const [compsRes, exhsRes] = await Promise.all([
        compIds.length > 0 ? supabase.from("competitions").select("id, title, title_ar, slug").in("id", compIds) : { data: [] },
        exhIds.length > 0 ? supabase.from("exhibitions").select("id, title, title_ar, slug").in("id", exhIds) : { data: [] },
      ]);

      const eventMap = new Map<string, any>();
      (compsRes.data || []).forEach((c: any) => eventMap.set(c.id, { ...c, type: "competition" }));
      (exhsRes.data || []).forEach((e: any) => eventMap.set(e.id, { ...e, type: "exhibition" }));

      return data.map(c => ({ ...c, event: eventMap.get(c.event_id) })).filter(c => c.event);
    },
    enabled: !!userId,
  });

  if (isLoading || comments.length === 0) return null;

  return (
    <Card className="rounded-2xl border-border/25">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs flex items-center gap-2">
          <MessageCircle className="h-3.5 w-3.5 text-chart-2" />
          {isAr ? "التعليقات الأخيرة" : "Recent Comments"}
          <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{comments.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {comments.map((c: any) => {
          const isComp = c.event_type === "competition";
          const href = isComp ? `/competitions/${c.event.slug}` : `/exhibitions/${c.event.slug}`;
          return (
            <Link key={c.id} to={href} className="block rounded-xl p-2.5 hover:bg-muted/40 transition-colors border border-border/20">
              <div className="flex items-center gap-1.5 mb-1">
                {isComp ? <Trophy className="h-3 w-3 text-primary" /> : <Landmark className="h-3 w-3 text-chart-5" />}
                <span className="text-[10px] font-medium truncate">{isAr ? c.event.title_ar || c.event.title : c.event.title}</span>
              </div>
              <p className="text-[11px] text-foreground/80 line-clamp-2">{c.content}</p>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                {c.likes_count > 0 && <span className="flex items-center gap-0.5"><Heart className="h-2.5 w-2.5" />{c.likes_count}</span>}
                <span>{formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: isAr ? ar : enUS })}</span>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
