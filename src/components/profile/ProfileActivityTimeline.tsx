import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, GraduationCap, FileCheck, Clock } from "lucide-react";
import { format } from "date-fns";

interface ProfileActivityTimelineProps {
  userId: string;
}

interface TimelineEvent {
  id: string;
  type: "registration" | "certificate" | "badge" | "enrollment";
  title: string;
  date: string;
  icon: typeof Trophy;
  color: string;
}

export function ProfileActivityTimeline({ userId }: ProfileActivityTimelineProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: events, isLoading } = useQuery({
    queryKey: ["profile-activity-timeline", userId],
    queryFn: async () => {
      const timeline: TimelineEvent[] = [];

      // Recent registrations
      const { data: regs } = await supabase
        .from("competition_registrations")
        .select("id, registered_at, competition_id, competitions(title, title_ar)")
        .eq("participant_id", userId)
        .order("registered_at", { ascending: false })
        .limit(5);

      (regs || []).forEach((r: any) => {
        const title = isAr && r.competitions?.title_ar ? r.competitions.title_ar : r.competitions?.title;
        timeline.push({
          id: `reg-${r.id}`,
          type: "registration",
          title: `${isAr ? "تسجيل في" : "Registered for"} ${title || ""}`,
          date: r.registered_at,
          icon: Trophy,
          color: "text-primary",
        });
      });

      // Recent certificates
      const { data: certs } = await supabase
        .from("certificates")
        .select("id, issued_at, event_name, event_name_ar")
        .eq("recipient_id", userId)
        .order("issued_at", { ascending: false })
        .limit(3);

      (certs || []).forEach((c) => {
        const name = isAr && c.event_name_ar ? c.event_name_ar : c.event_name;
        timeline.push({
          id: `cert-${c.id}`,
          type: "certificate",
          title: `${isAr ? "شهادة من" : "Certificate from"} ${name || ""}`,
          date: c.issued_at || "",
          icon: Award,
          color: "text-chart-4",
        });
      });

      // Recent enrollments
      const { data: enrollments } = await supabase
        .from("masterclass_enrollments")
        .select("id, enrolled_at, masterclass_id, masterclasses(title, title_ar)")
        .eq("user_id", userId)
        .order("enrolled_at", { ascending: false })
        .limit(3);

      (enrollments || []).forEach((e: any) => {
        const title = isAr && e.masterclasses?.title_ar ? e.masterclasses.title_ar : e.masterclasses?.title;
        timeline.push({
          id: `enroll-${e.id}`,
          type: "enrollment",
          title: `${isAr ? "التحق بدورة" : "Enrolled in"} ${title || ""}`,
          date: e.enrolled_at,
          icon: GraduationCap,
          color: "text-chart-3",
        });
      });

      // Sort by date descending
      return timeline
        .filter((e) => e.date)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading || !events?.length) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <Clock className="h-3.5 w-3.5 text-primary" />
          </div>
          {isAr ? "النشاط الأخير" : "Recent Activity"}
        </h3>
      </div>
      <CardContent className="p-4">
        <div className="relative space-y-0">
          {/* Timeline line */}
          <div className="absolute start-[15px] top-2 bottom-2 w-px bg-border" />

          {events.map((event, i) => (
            <div key={event.id} className="relative flex gap-3 pb-4 last:pb-0 group">
              <div className="relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border bg-card transition-all duration-200 group-hover:shadow-sm group-hover:scale-110">
                <event.icon className={`h-3.5 w-3.5 ${event.color}`} />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm leading-snug group-hover:text-foreground transition-colors">{event.title}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {format(new Date(event.date), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
