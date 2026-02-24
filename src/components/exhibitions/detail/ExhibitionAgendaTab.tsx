import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Clock, MapPin, Star, StarOff, User, Sparkles } from "lucide-react";
import { format, parseISO, isToday } from "date-fns";

interface Props {
  exhibitionId: string;
  startDate: string;
  endDate: string;
  isAr: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  session: "bg-primary/10 text-primary border-primary/20",
  workshop: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  keynote: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  panel: "bg-accent/10 text-accent-foreground border-accent/20",
  networking: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  break: "bg-muted text-muted-foreground border-border",
};

const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  session: { en: "Session", ar: "جلسة" },
  workshop: { en: "Workshop", ar: "ورشة" },
  keynote: { en: "Keynote", ar: "كلمة رئيسية" },
  panel: { en: "Panel", ar: "حلقة نقاش" },
  networking: { en: "Networking", ar: "تواصل" },
  break: { en: "Break", ar: "استراحة" },
};

export function ExhibitionAgendaTab({ exhibitionId, startDate, endDate, isAr }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: agendaItems = [], isLoading } = useQuery({
    queryKey: ["exhibition-agenda", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_agenda_items")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .order("day_date", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["exhibition-agenda-favorites", exhibitionId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("exhibition_agenda_favorites")
        .select("agenda_item_id")
        .eq("user_id", user.id);
      return (data || []).map((f) => f.agenda_item_id);
    },
    enabled: !!user,
  });

  const toggleFavorite = useMutation({
    mutationFn: async (itemId: string) => {
      if (!user) throw new Error("Not authenticated");
      const isFav = favorites.includes(itemId);
      if (isFav) {
        await supabase.from("exhibition_agenda_favorites").delete().eq("user_id", user.id).eq("agenda_item_id", itemId);
      } else {
        await supabase.from("exhibition_agenda_favorites").insert({ user_id: user.id, agenda_item_id: itemId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-agenda-favorites", exhibitionId] });
    },
  });

  // Group by date
  const days = useMemo(() => {
    const map = new Map<string, typeof agendaItems>();
    agendaItems.forEach((item) => {
      const key = item.day_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return Array.from(map.entries());
  }, [agendaItems]);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const activeDay = selectedDay || days[0]?.[0] || null;
  const activeDayItems = days.find(([d]) => d === activeDay)?.[1] || [];
  const filteredItems = showFavoritesOnly 
    ? activeDayItems.filter((i) => favorites.includes(i.id)) 
    : activeDayItems;

  if (isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>;
  }

  if (days.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{isAr ? "لم يتم إضافة جدول أعمال بعد" : "No agenda items added yet"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Day selector */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {days.map(([day, items]) => {
            const d = parseISO(day);
            const active = day === activeDay;
            const today = isToday(d);
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex flex-col items-center rounded-xl border px-4 py-2.5 transition-all shrink-0 min-w-[72px] ${
                  active 
                    ? "border-primary bg-primary/10 shadow-sm" 
                    : "border-border hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {format(d, "EEE")}
                </span>
                <span className={`text-lg font-bold ${active ? "text-primary" : "text-foreground"}`}>
                  {format(d, "d")}
                </span>
                <span className="text-[9px] text-muted-foreground">{format(d, "MMM")}</span>
                {today && <div className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive" />}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Filters */}
      {user && (
        <div className="flex gap-2">
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="sm"
            className="text-xs"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Star className="me-1.5 h-3 w-3" />
            {isAr ? "المفضلة فقط" : "Favorites Only"}
            {favorites.length > 0 && (
              <Badge variant="secondary" className="ms-1.5 h-4 px-1 text-[9px]">{favorites.length}</Badge>
            )}
          </Button>
        </div>
      )}

      {/* Timeline */}
      <div className="relative space-y-3">
        {filteredItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {showFavoritesOnly 
              ? (isAr ? "لم تضف أي فعالية للمفضلة في هذا اليوم" : "No favorites for this day") 
              : (isAr ? "لا فعاليات في هذا اليوم" : "No events for this day")}
          </p>
        ) : (
          filteredItems.map((item) => {
            const isFav = favorites.includes(item.id);
            const catStyle = CATEGORY_COLORS[item.category || "session"] || CATEGORY_COLORS.session;
            const catLabel = CATEGORY_LABELS[item.category || "session"] || CATEGORY_LABELS.session;

            return (
              <Card key={item.id} className={`overflow-hidden transition-all hover:shadow-md ${item.is_highlighted ? "border-chart-4/30 ring-1 ring-chart-4/10" : ""}`}>
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Time column */}
                    <div className="flex w-20 shrink-0 flex-col items-center justify-center border-e bg-muted/30 px-2 py-3">
                      <span className="text-xs font-bold text-primary">{item.start_time?.slice(0, 5)}</span>
                      {item.end_time && (
                        <span className="text-[10px] text-muted-foreground">{item.end_time.slice(0, 5)}</span>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${catStyle}`}>
                              {isAr ? catLabel.ar : catLabel.en}
                            </Badge>
                            {item.is_highlighted && (
                              <Sparkles className="h-3 w-3 text-chart-4" />
                            )}
                          </div>
                          <p className="text-sm font-semibold leading-tight">
                            {isAr && item.title_ar ? item.title_ar : item.title}
                          </p>
                          {(item.description || item.description_ar) && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                              {isAr && item.description_ar ? item.description_ar : item.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            {(item.speaker_name || item.speaker_name_ar) && (
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <User className="h-3 w-3" />
                                {isAr && item.speaker_name_ar ? item.speaker_name_ar : item.speaker_name}
                              </span>
                            )}
                            {(item.location || item.location_ar) && (
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {isAr && item.location_ar ? item.location_ar : item.location}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {user && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => toggleFavorite.mutate(item.id)}
                          >
                            {isFav ? (
                              <Star className="h-4 w-4 fill-chart-4 text-chart-4" />
                            ) : (
                              <StarOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
