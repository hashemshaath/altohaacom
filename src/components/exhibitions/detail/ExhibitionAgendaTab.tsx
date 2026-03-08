import { useState, useMemo, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Clock, MapPin, Star, StarOff, User, Sparkles, CalendarDays } from "lucide-react";
import { format, parseISO, isToday } from "date-fns";

interface Props {
  exhibitionId: string;
  startDate: string;
  endDate: string;
  isAr: boolean;
}

const CATEGORY_CONFIG: Record<string, { en: string; ar: string; dot: string }> = {
  session: { en: "Session", ar: "جلسة", dot: "bg-primary" },
  workshop: { en: "Workshop", ar: "ورشة", dot: "bg-chart-3" },
  keynote: { en: "Keynote", ar: "كلمة رئيسية", dot: "bg-chart-4" },
  panel: { en: "Panel", ar: "حلقة نقاش", dot: "bg-accent-foreground" },
  networking: { en: "Networking", ar: "تواصل", dot: "bg-chart-2" },
  break: { en: "Break", ar: "استراحة", dot: "bg-muted-foreground" },
};

export function ExhibitionAgendaTab({ exhibitionId, startDate, endDate, isAr }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: agendaItems = [], isLoading } = useQuery({
    queryKey: ["exhibition-agenda", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_agenda_items")
        .select("id, title, title_ar, description, description_ar, day_date, start_time, end_time, location, location_ar, category, speaker_name, speaker_name_ar, is_highlighted, sort_order")
        .eq("exhibition_id", exhibitionId)
        .order("day_date", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["exhibition-agenda-favorites", exhibitionId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("exhibition_agenda_favorites").select("agenda_item_id").eq("user_id", user.id);
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
  const filteredItems = showFavoritesOnly ? activeDayItems.filter((i) => favorites.includes(i.id)) : activeDayItems;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 w-20 animate-pulse rounded-2xl bg-muted" />)}</div>
        {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60">
            <CalendarDays className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{isAr ? "لم يتم إضافة جدول أعمال بعد" : "No agenda items added yet"}</p>
          <p className="mt-1 text-xs text-muted-foreground/60">{isAr ? "سيتم تحديث الجدول قريباً" : "The schedule will be updated soon"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Day selector - professional pill design */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-3">
          {days.map(([day, items], idx) => {
            const d = parseISO(day);
            const active = day === activeDay;
            const today = isToday(d);
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`relative flex flex-col items-center rounded-2xl border-2 px-5 py-3 transition-all shrink-0 min-w-[80px] ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "border-border/60 bg-card hover:border-primary/40 hover:shadow-sm"
                }`}
              >
                <span className={`text-[9px] font-bold uppercase tracking-[0.15em] ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {format(d, "EEE")}
                </span>
                <span className={`text-xl font-bold mt-0.5 ${active ? "text-primary-foreground" : "text-foreground"}`}>
                  {format(d, "d")}
                </span>
                <span className={`text-[9px] font-medium ${active ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {format(d, "MMM")}
                </span>
                {today && (
                  <div className={`absolute -top-1 -end-1 h-3 w-3 rounded-full border-2 ${active ? "bg-primary-foreground border-primary" : "bg-destructive border-card"}`} />
                )}
                {/* Item count */}
                <span className={`mt-1 text-[8px] font-semibold ${active ? "text-primary-foreground/50" : "text-muted-foreground/50"}`}>
                  {items.length} {isAr ? "فعالية" : "items"}
                </span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Filters row */}
      {user && (
        <div className="flex items-center gap-3">
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="sm"
            className="rounded-full text-xs h-8 px-4"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Star className={`me-1.5 h-3 w-3 ${showFavoritesOnly ? "fill-primary-foreground" : ""}`} />
            {isAr ? "المفضلة" : "Favorites"}
            {favorites.length > 0 && (
              <Badge variant="secondary" className="ms-1.5 h-4 min-w-4 rounded-full px-1 text-[9px]">{favorites.length}</Badge>
            )}
          </Button>
          <span className="text-[10px] text-muted-foreground">
            {filteredItems.length} {isAr ? "فعالية" : "events"}
          </span>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical timeline line */}
        {filteredItems.length > 0 && (
          <div className="absolute start-[39px] top-4 bottom-4 w-px bg-gradient-to-b from-primary/20 via-border to-transparent hidden sm:block" />
        )}

        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {showFavoritesOnly
                  ? (isAr ? "لم تضف أي فعالية للمفضلة في هذا اليوم" : "No favorites for this day")
                  : (isAr ? "لا فعاليات في هذا اليوم" : "No events for this day")}
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isFav = favorites.includes(item.id);
              const cat = CATEGORY_CONFIG[item.category || "session"] || CATEGORY_CONFIG.session;

              return (
                <Card
                  key={item.id}
                  className={`group overflow-hidden transition-all hover:shadow-md ${
                    item.is_highlighted
                      ? "border-chart-4/30 bg-gradient-to-r from-chart-4/[0.03] to-transparent ring-1 ring-chart-4/10"
                      : "border-border/60"
                  }`}
                >
                  <CardContent className="p-0">
                    <div className="flex">
                      {/* Time column - elegant vertical strip */}
                      <div className="flex w-20 shrink-0 flex-col items-center justify-center border-e border-border/40 bg-muted/20 px-2 py-4">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{isAr ? "من" : "From"}</span>
                        <span className="text-sm font-bold text-primary tabular-nums">{item.start_time?.slice(0, 5)}</span>
                        {item.end_time && (
                          <>
                            <div className="my-1 h-3 w-px bg-border" />
                            <span className="text-[10px] text-muted-foreground tabular-nums">{item.end_time.slice(0, 5)}</span>
                          </>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-3.5 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            {/* Category + highlight */}
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <div className={`h-2 w-2 rounded-full ${cat.dot}`} />
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  {isAr ? cat.ar : cat.en}
                                </span>
                              </div>
                              {item.is_highlighted && (
                                <Badge variant="outline" className="h-4 px-1.5 text-[8px] border-chart-4/30 text-chart-4 gap-0.5">
                                  <Sparkles className="h-2 w-2" />
                                  {isAr ? "مميز" : "Featured"}
                                </Badge>
                              )}
                            </div>

                            {/* Title */}
                            <p className="text-sm font-semibold leading-snug text-foreground">
                              {isAr && item.title_ar ? item.title_ar : item.title}
                            </p>

                            {/* Description */}
                            {(item.description || item.description_ar) && (
                              <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                {isAr && item.description_ar ? item.description_ar : item.description}
                              </p>
                            )}

                            {/* Meta row */}
                            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                              {(item.speaker_name || item.speaker_name_ar) && (
                                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                  <User className="h-3 w-3 text-primary/60" />
                                  <span className="font-medium">{isAr && item.speaker_name_ar ? item.speaker_name_ar : item.speaker_name}</span>
                                </span>
                              )}
                              {(item.location || item.location_ar) && (
                                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                  <MapPin className="h-3 w-3 text-chart-2/60" />
                                  {isAr && item.location_ar ? item.location_ar : item.location}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Favorite button */}
                          {user && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 rounded-full opacity-60 transition-opacity hover:opacity-100"
                              onClick={() => toggleFavorite.mutate(item.id)}
                            >
                              {isFav ? (
                                <Star className="h-4 w-4 fill-chart-4 text-chart-4" />
                              ) : (
                                <StarOff className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground" />
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
    </div>
  );
}
