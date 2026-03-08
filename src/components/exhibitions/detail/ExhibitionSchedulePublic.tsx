import { useState, useMemo, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Clock, MapPin, Star, UserPlus, UserMinus, CalendarClock, Users, Mic } from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";

interface Props {
  exhibitionId: string;
  startDate: string;
  endDate: string;
  isAr: boolean;
}

const CAT_ICONS: Record<string, any> = {
  keynote: Mic, session: Clock, workshop: Users, panel: Users, demo: Star,
  networking: Users, break: Clock,
};

const CAT_COLORS: Record<string, string> = {
  keynote: "bg-primary/10 text-primary", session: "bg-chart-1/10 text-chart-1",
  workshop: "bg-chart-2/10 text-chart-2", panel: "bg-chart-3/10 text-chart-3",
  demo: "bg-chart-4/10 text-chart-4", networking: "bg-chart-5/10 text-chart-5",
  break: "bg-muted text-muted-foreground",
};

export const ExhibitionSchedulePublic = memo(function ExhibitionSchedulePublic({ exhibitionId, startDate, endDate, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["schedule-items-public", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_schedule_items")
        .select("id, title, title_ar, description, description_ar, start_time, end_time, location, location_ar, category, speaker_name, speaker_name_ar, max_attendees, is_featured")
        .eq("exhibition_id", exhibitionId)
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: myRegistrations = [] } = useQuery({
    queryKey: ["schedule-registrations", exhibitionId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const itemIds = items.map((i: any) => i.id);
      if (itemIds.length === 0) return [];
      const { data } = await supabase
        .from("exhibition_schedule_registrations")
        .select("schedule_item_id")
        .eq("user_id", user.id)
        .in("schedule_item_id", itemIds);
      return (data || []).map((r: any) => r.schedule_item_id);
    },
    enabled: !!user && items.length > 0,
  });

  const registerMutation = useMutation({
    mutationFn: async ({ itemId, action }: { itemId: string; action: "register" | "unregister" }) => {
      if (action === "register") {
        const { error } = await supabase.from("exhibition_schedule_registrations").insert({ schedule_item_id: itemId, user_id: user!.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("exhibition_schedule_registrations").delete().eq("schedule_item_id", itemId).eq("user_id", user!.id);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["schedule-registrations", exhibitionId] });
      toast({ title: vars.action === "register" ? t("Registered ✅", "تم التسجيل ✅") : t("Unregistered", "تم إلغاء التسجيل") });
    },
  });

  // Group items by day
  const days = useMemo(() => {
    const grouped = new Map<string, any[]>();
    items.forEach((item: any) => {
      const dayKey = format(parseISO(item.start_time), "yyyy-MM-dd");
      if (!grouped.has(dayKey)) grouped.set(dayKey, []);
      grouped.get(dayKey)!.push(item);
    });
    return Array.from(grouped.entries()).map(([date, dayItems]) => ({
      date,
      label: format(parseISO(date), "EEE, MMM d"),
      items: dayItems,
    }));
  }, [items]);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const activeDay = selectedDay || days[0]?.date || null;
  const activeDayItems = days.find(d => d.date === activeDay)?.items || [];

  if (items.length === 0 && !isLoading) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
          <CalendarClock className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold">{t("Event Schedule", "جدول الفعاليات")}</h3>
        <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{items.length}</Badge>
      </div>

      {/* Day selector */}
      {days.length > 1 && (
        <ScrollArea className="w-full">
          <div className="flex gap-1.5 pb-2">
            {days.map(d => (
              <Button
                key={d.date}
                variant={activeDay === d.date ? "default" : "ghost"}
                size="sm"
                className="rounded-full text-xs h-8 px-4 shrink-0"
                onClick={() => setSelectedDay(d.date)}
              >
                {d.label}
                <Badge variant="secondary" className="ms-1.5 h-4 px-1 text-[9px] rounded-full bg-background/20 text-current">{d.items.length}</Badge>
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Timeline */}
      <div className="space-y-2">
        {activeDayItems.map((item: any) => {
          const isRegistered = myRegistrations.includes(item.id);
          const CatIcon = CAT_ICONS[item.category] || Clock;
          const catColor = CAT_COLORS[item.category] || CAT_COLORS.session;

          return (
            <Card key={item.id} className={`overflow-hidden transition-all ${item.is_featured ? "border-primary/30 bg-gradient-to-r from-primary/[0.03] to-transparent ring-1 ring-primary/10" : "border-border/60"}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3.5">
                  {/* Time column */}
                  <div className="shrink-0 text-center w-14">
                    <p className="text-xs font-bold text-primary">{format(parseISO(item.start_time), "HH:mm")}</p>
                    <p className="text-[10px] text-muted-foreground">{format(parseISO(item.end_time), "HH:mm")}</p>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Badge className={`text-[9px] h-4 px-1.5 ${catColor} border-0`}>
                        <CatIcon className="me-0.5 h-2 w-2" />
                        {item.category}
                      </Badge>
                      {item.is_featured && <Star className="h-3 w-3 text-chart-4 fill-chart-4" />}
                    </div>
                    <p className="text-sm font-semibold">{isAr && item.title_ar ? item.title_ar : item.title}</p>
                    {(item.description || item.description_ar) && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                        {isAr && item.description_ar ? item.description_ar : item.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                      {item.speaker_name && (
                        <span className="flex items-center gap-1 text-[10px] text-foreground font-medium">
                          <Mic className="h-2.5 w-2.5 text-primary" />
                          {isAr && item.speaker_name_ar ? item.speaker_name_ar : item.speaker_name}
                        </span>
                      )}
                      {item.location && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5" />
                          {isAr && item.location_ar ? item.location_ar : item.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Register button */}
                  {user && item.category !== "break" && (
                    <Button
                      variant={isRegistered ? "secondary" : "outline"}
                      size="sm"
                      className="shrink-0 h-8 text-xs gap-1"
                      onClick={() => registerMutation.mutate({ itemId: item.id, action: isRegistered ? "unregister" : "register" })}
                      disabled={registerMutation.isPending}
                    >
                      {isRegistered ? <UserMinus className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                      <span className="hidden sm:inline">{isRegistered ? t("Leave", "مغادرة") : t("Join", "انضمام")}</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
});
