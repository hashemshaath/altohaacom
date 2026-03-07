import { useState, useMemo, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, Trophy, MapPin, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import { deriveCompetitionStatus } from "@/lib/competitionStatus";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  endDate?: Date;
  type: "competition" | "exhibition" | "registration_deadline";
  status: string;
  link: string;
  isRegistered: boolean;
  urgent: boolean;
}

export function EventsCalendarWidget() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState(new Date());

  // Fetch competitions user registered for + upcoming ones
  const { data: competitions = [], isLoading: compsLoading } = useQuery({
    queryKey: ["calendar-competitions", user?.id],
    queryFn: async () => {
      // Get user's registered competitions
      let registeredIds: string[] = [];
      if (user) {
        const { data: regs } = await supabase
          .from("competition_registrations")
          .select("competition_id")
          .eq("participant_id", user.id);
        registeredIds = (regs || []).map((r) => r.competition_id);
      }

      const { data } = await supabase
        .from("competitions")
        .select("id, title, title_ar, competition_start, competition_end, registration_start, registration_end, status, city, is_virtual")
        .in("status", ["upcoming", "registration_open", "registration_closed", "in_progress", "judging"])
        .order("competition_start", { ascending: true })
        .limit(50);

      return (data || []).map((c: any) => ({
        ...c,
        isRegistered: registeredIds.includes(c.id),
      }));
    },
  });

  // Build calendar events
  const events: CalendarEvent[] = useMemo(() => {
    const result: CalendarEvent[] = [];
    for (const comp of competitions) {
      const derived = deriveCompetitionStatus({
        registrationStart: comp.registration_start,
        registrationEnd: comp.registration_end,
        competitionStart: comp.competition_start,
        competitionEnd: comp.competition_end,
        dbStatus: comp.status,
      });

      if (comp.competition_start) {
        result.push({
          id: comp.id,
          title: isAr && comp.title_ar ? comp.title_ar : comp.title,
          date: new Date(comp.competition_start),
          endDate: comp.competition_end ? new Date(comp.competition_end) : undefined,
          type: "competition",
          status: derived.status,
          link: `/competitions/${comp.id}`,
          isRegistered: comp.isRegistered,
          urgent: derived.urgent,
        });
      }

      // Add registration deadline as separate event
      if (comp.registration_end) {
        const regEnd = new Date(comp.registration_end);
        const daysLeft = Math.ceil((regEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0 && daysLeft <= 14) {
          result.push({
            id: `${comp.id}-reg`,
            title: `${isAr ? "آخر موعد تسجيل:" : "Reg. Deadline:"} ${isAr && comp.title_ar ? comp.title_ar : comp.title}`,
            date: regEnd,
            type: "registration_deadline",
            status: "registration_closing_soon",
            link: `/competitions/${comp.id}`,
            isRegistered: comp.isRegistered,
            urgent: daysLeft <= 3,
          });
        }
      }
    }
    return result;
  }, [competitions, isAr]);

  // Events for selected date
  const selectedEvents = selectedDate
    ? events.filter((e) => isSameDay(e.date, selectedDate))
    : [];

  // Dates that have events (for highlighting in calendar)
  const eventDates = events.map((e) => e.date);

  const modifiers = {
    hasEvent: (date: Date) => eventDates.some((d) => isSameDay(d, date)),
    urgent: (date: Date) =>
      events.some((e) => isSameDay(e.date, date) && e.urgent),
  };

  const modifiersStyles = {
    hasEvent: {
      fontWeight: "bold" as const,
    },
  };

  if (compsLoading) {
    return (
      <Card>
        <div className="border-b bg-muted/30 px-4 py-3">
          <Skeleton className="h-5 w-48" />
        </div>
        <CardContent className="p-4">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md border-border/50">
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
          </div>
          {isAr ? "تقويم الفعاليات" : "Events Calendar"}
        </h3>
        {events.filter((e) => e.urgent).length > 0 && (
          <Badge className="bg-chart-4/10 text-chart-4 text-[10px]">
            {events.filter((e) => e.urgent).length} {isAr ? "عاجل" : "urgent"}
          </Badge>
        )}
      </div>
      <CardContent className="p-3">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          month={month}
          onMonthChange={setMonth}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          modifiersClassNames={{
            hasEvent: "bg-primary/10 text-primary font-bold rounded-md",
            urgent: "bg-chart-4/10 text-chart-4 font-bold rounded-md ring-1 ring-chart-4/30",
          }}
          className="w-full"
        />

        {/* Selected date events */}
        {selectedDate && (
          <div className="mt-3 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {format(selectedDate, "EEEE, MMM d, yyyy")}
            </p>
            {selectedEvents.length > 0 ? (
              <div className="space-y-2">
                {selectedEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={event.link}
                    className="flex items-start gap-2.5 rounded-xl border p-2.5 transition-all hover:bg-muted/50 hover:shadow-sm group"
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl",
                        event.type === "registration_deadline"
                          ? "bg-chart-4/10"
                          : "bg-primary/10"
                      )}
                    >
                      {event.type === "registration_deadline" ? (
                        <Clock className="h-3.5 w-3.5 text-chart-4" />
                      ) : (
                        <Trophy className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {event.isRegistered && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0">
                            {isAr ? "مسجل" : "Registered"}
                          </Badge>
                        )}
                        {event.urgent && (
                          <Badge className="bg-chart-4/10 text-chart-4 text-[9px] px-1 py-0">
                            {isAr ? "عاجل" : "Urgent"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-3">
                {isAr ? "لا توجد فعاليات في هذا اليوم" : "No events on this date"}
              </p>
            )}
          </div>
        )}

        {/* Upcoming deadlines summary */}
        {events.filter((e) => e.urgent).length > 0 && (
          <div className="mt-3 rounded-xl border border-chart-4/20 bg-chart-4/5 p-2.5">
            <p className="text-[10px] font-semibold text-chart-4 uppercase tracking-wider mb-1.5">
              {isAr ? "مواعيد نهائية قريبة" : "Upcoming Deadlines"}
            </p>
            {events
              .filter((e) => e.urgent)
              .slice(0, 3)
              .map((e) => (
                <Link
                  key={e.id}
                  to={e.link}
                  className="flex items-center justify-between py-1 text-xs hover:text-primary transition-colors"
                >
                  <span className="line-clamp-1">{e.title}</span>
                  <span className="shrink-0 ms-2 text-chart-4 font-medium">
                    {format(e.date, "MMM d")}
                  </span>
                </Link>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
