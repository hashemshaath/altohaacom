import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Bookmark, BookmarkCheck, Trophy, Landmark, Calendar, MapPin, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export function FanEventWatchlist() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");

  const { data: watchlist = [], isLoading } = useQuery({
    queryKey: ["fan-watchlist", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("event_watchlist")
        .select("id, user_id, event_id, event_type, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!data || data.length === 0) return [];

      const compIds = data.filter((w: any) => w.event_type === "competition").map((w: any) => w.event_id);
      const exhIds = data.filter((w: any) => w.event_type === "exhibition").map((w: any) => w.event_id);

      const [compsRes, exhsRes] = await Promise.all([
        compIds.length > 0
          ? supabase.from("competitions").select("id, title, title_ar, start_date, country_code, slug").in("id", compIds)
          : { data: [] },
        exhIds.length > 0
          ? supabase.from("exhibitions").select("id, title, title_ar, start_date, city, slug").in("id", exhIds)
          : { data: [] },
      ]);

      const compMap = new Map((compsRes.data || []).map((c: any) => [c.id, c]));
      const exhMap = new Map((exhsRes.data || []).map((e: any) => [e.id, e]));

      return data.map((w: any) => ({
        ...w,
        event: w.event_type === "competition" ? compMap.get(w.event_id) : exhMap.get(w.event_id),
      })).filter((w: any) => w.event);
    },
    enabled: !!user,
  });

  const removeFromWatchlist = async (id: string) => {
    await supabase.from("event_watchlist").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["fan-watchlist"] });
    toast({ title: isAr ? "تمت الإزالة" : "Removed from watchlist" });
  };

  const filtered = tab === "all" ? watchlist : watchlist.filter((w: any) => w.event_type === (tab === "competitions" ? "competition" : "exhibition"));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-chart-5/10">
            <Eye className="h-3.5 w-3.5 text-chart-5" />
          </div>
          {isAr ? "قائمة المتابعة" : "Event Watchlist"}
          {watchlist.length > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{watchlist.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-7 w-full bg-muted/50 p-0.5">
            <TabsTrigger value="all" className="text-[10px] h-6 flex-1">{isAr ? "الكل" : "All"}</TabsTrigger>
            <TabsTrigger value="competitions" className="text-[10px] h-6 flex-1">{isAr ? "مسابقات" : "Competitions"}</TabsTrigger>
            <TabsTrigger value="exhibitions" className="text-[10px] h-6 flex-1">{isAr ? "معارض" : "Exhibitions"}</TabsTrigger>
          </TabsList>

          <div className="mt-3">
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-muted/50 animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8">
                <Bookmark className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">{isAr ? "لم تضف أحداثاً بعد" : "No events saved yet"}</p>
                <div className="flex gap-2 justify-center mt-3">
                  <Link to="/competitions"><Button variant="outline" size="sm" className="text-xs h-7 gap-1"><Trophy className="h-3 w-3" />{isAr ? "المسابقات" : "Competitions"}</Button></Link>
                  <Link to="/exhibitions"><Button variant="outline" size="sm" className="text-xs h-7 gap-1"><Landmark className="h-3 w-3" />{isAr ? "المعارض" : "Exhibitions"}</Button></Link>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filtered.map((item: any) => {
                  const e = item.event;
                  const isComp = item.event_type === "competition";
                  const href = isComp ? `/competitions/${e.slug}` : `/exhibitions/${e.slug}`;
                  return (
                    <div key={item.id} className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-muted/40 transition-colors">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isComp ? "bg-primary/10" : "bg-chart-5/10"}`}>
                        {isComp ? <Trophy className="h-3.5 w-3.5 text-primary" /> : <Landmark className="h-3.5 w-3.5 text-chart-5" />}
                      </div>
                      <Link to={href} className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{isAr ? e.title_ar || e.title : e.title}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          {e.start_date && (
                            <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{new Date(e.start_date).toLocaleDateString(isAr ? "ar" : "en", { month: "short", day: "numeric" })}</span>
                          )}
                          {(e.country_code || e.city) && (
                            <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{e.city || e.country_code}</span>
                          )}
                        </div>
                      </Link>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => removeFromWatchlist(item.id)}>
                        <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/** Reusable hook to add/remove from watchlist */
export function useEventWatchlist(eventType: "competition" | "exhibition", eventId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: isWatched = false } = useQuery({
    queryKey: ["event-watched", eventType, eventId, user?.id],
    queryFn: async () => {
      if (!user || !eventId) return false;
      const { data } = await supabase
        .from("event_watchlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("event_type", eventType)
        .eq("event_id", eventId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!eventId,
  });

  const toggle = async () => {
    if (!user || !eventId) return;
    if (isWatched) {
      await supabase.from("event_watchlist").delete().eq("user_id", user.id).eq("event_type", eventType).eq("event_id", eventId);
      toast({ title: isAr ? "تمت الإزالة من القائمة" : "Removed from watchlist" });
    } else {
      await supabase.from("event_watchlist").insert({ user_id: user.id, event_type: eventType, event_id: eventId });
      toast({ title: isAr ? "✅ تمت الإضافة للقائمة" : "✅ Added to watchlist" });
    }
    queryClient.invalidateQueries({ queryKey: ["event-watched", eventType, eventId] });
    queryClient.invalidateQueries({ queryKey: ["fan-watchlist"] });
  };

  return { isWatched, toggle };
}
