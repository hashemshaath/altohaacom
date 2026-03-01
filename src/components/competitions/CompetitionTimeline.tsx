import { useLanguage } from "@/i18n/LanguageContext";
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
    <div className="overflow-hidden rounded-3xl border border-border/30 bg-card shadow-sm transition-shadow duration-300 hover:shadow-md">
      <div className="border-b border-border/20 bg-gradient-to-r from-primary/[0.05] to-transparent px-5 py-4">
        <h3 className="flex items-center gap-3 font-bold text-[15px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          {isAr ? "الجدول الزمني" : "Timeline"}
        </h3>
      </div>
      <div className="p-5 sm:p-6">
        <div className="relative">
          {/* Vertical connector line with gradient */}
          <div className="absolute start-5 top-5 bottom-5 w-0.5 bg-gradient-to-b from-primary/30 via-primary/10 to-border/20 rounded-full" />

          <div className="space-y-0">
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
                <div key={index} className={cn(
                  "group relative flex items-start gap-4 py-4 transition-all duration-200",
                  index === 0 && "pt-0",
                  index === events.length - 1 && "pb-0",
                )}>
                  {/* Node */}
                  <div
                    className={cn(
                      "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105",
                      isCurrent
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : isPast
                        ? "bg-muted/60 text-muted-foreground"
                        : "bg-primary/8 text-primary ring-1 ring-primary/15"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {isCurrent && (
                      <div className="absolute -inset-1 rounded-xl bg-primary/15 animate-pulse -z-10" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn(
                        "text-sm font-semibold transition-colors",
                        isPast && !isCurrent ? "text-muted-foreground" : "text-foreground"
                      )}>
                        {isAr ? event.labelAr : event.label}
                      </p>
                      {isCurrent && (
                        <Badge className="bg-primary/10 text-primary text-[10px] px-2 py-0 font-bold rounded-lg">
                          {isAr ? "الآن" : "Now"}
                        </Badge>
                      )}
                      {isUrgent && (
                        <Badge className="bg-chart-4/10 text-chart-4 text-[10px] px-2 py-0 font-bold animate-pulse rounded-lg">
                          {isAr ? `${daysUntil} أيام` : `${daysUntil}d left`}
                        </Badge>
                      )}
                      {isPast && !isCurrent && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0 border-muted text-muted-foreground rounded-lg">
                          {isAr ? "مكتمل" : "Done"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-1.5">
                      {format(new Date(event.date), "EEEE, MMM d, yyyy • h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
