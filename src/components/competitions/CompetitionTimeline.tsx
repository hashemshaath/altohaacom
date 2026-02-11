import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, CalendarX, PlayCircle, Trophy, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  date: string | null;
  label: string;
  labelAr: string;
  icon: React.ElementType;
}

interface CompetitionTimelineProps {
  registrationStart?: string | null;
  registrationEnd?: string | null;
  competitionStart?: string | null;
  competitionEnd?: string | null;
}

export function CompetitionTimeline({
  registrationStart,
  registrationEnd,
  competitionStart,
  competitionEnd,
}: CompetitionTimelineProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const now = Date.now();

  const events: TimelineEvent[] = [
    { date: registrationStart, label: "Registration Opens", labelAr: "فتح التسجيل", icon: CalendarCheck },
    { date: registrationEnd, label: "Registration Closes", labelAr: "إغلاق التسجيل", icon: CalendarX },
    { date: competitionStart, label: "Competition Starts", labelAr: "بداية المسابقة", icon: PlayCircle },
    { date: competitionEnd, label: "Competition Ends", labelAr: "نهاية المسابقة", icon: Trophy },
  ].filter((e) => e.date);

  if (events.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-gradient-to-r from-primary/5 via-transparent to-primary/5 px-4 py-3">
        <h3 className="flex items-center gap-2 font-semibold text-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          {isAr ? "الجدول الزمني" : "Timeline"}
        </h3>
      </div>
      <CardContent className="p-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute start-[15px] top-2 bottom-2 w-0.5 bg-border" />

          <div className="space-y-4">
            {events.map((event, index) => {
              if (!event.date) return null;
              const eventTime = new Date(event.date).getTime();
              const isPast = now > eventTime;
              const isCurrent = index < events.length - 1 && events[index + 1]?.date
                ? now >= eventTime && now < new Date(events[index + 1].date!).getTime()
                : now >= eventTime && index === events.length - 1;

              const Icon = event.icon;
              const daysUntil = Math.ceil((eventTime - now) / (1000 * 60 * 60 * 24));
              const isUrgent = !isPast && daysUntil <= 3 && daysUntil > 0;

              return (
                <div key={index} className="relative flex items-start gap-3 ps-0">
                  <div
                    className={cn(
                      "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : isPast
                        ? "border-chart-5 bg-chart-5/10 text-chart-5"
                        : "border-border bg-background text-muted-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn("text-sm font-medium", isPast && "text-muted-foreground")}>
                        {isAr ? event.labelAr : event.label}
                      </p>
                      {isCurrent && (
                        <Badge className="bg-primary/10 text-primary text-[10px] px-1.5 py-0">
                          {isAr ? "الآن" : "Now"}
                        </Badge>
                      )}
                      {isUrgent && (
                        <Badge className="bg-chart-4/10 text-chart-4 text-[10px] px-1.5 py-0 animate-pulse">
                          {isAr ? `${daysUntil} أيام` : `${daysUntil}d left`}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(event.date), "EEEE, MMM d, yyyy • h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
