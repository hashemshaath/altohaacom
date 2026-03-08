import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, GraduationCap, FileCheck, Clock, MessageCircle, Heart, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

export const ProfileActivityTimeline = memo(function ProfileActivityTimeline({ userId }: ProfileActivityTimelineProps) {
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

      // Recent community posts
      const { data: posts } = await supabase
        .from("posts")
        .select("id, content, created_at")
        .eq("author_id", userId)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false })
        .limit(5);

      (posts || []).forEach((p) => {
        timeline.push({
          id: `post-${p.id}`,
          type: "registration",
          title: `${isAr ? "نشر في المجتمع:" : "Posted:"} ${p.content?.slice(0, 60)}${(p.content?.length || 0) > 60 ? "..." : ""}`,
          date: p.created_at,
          icon: MessageCircle,
          color: "text-chart-2",
        });
      });

      // Sort by date descending
      return timeline
        .filter((e) => e.date)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading || !events?.length) {
    return null;
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-border/40">
      <div className="border-b border-border/30 bg-muted/20 px-4 py-3">
        <h3 className="flex items-center gap-2.5 text-sm font-semibold">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
            <Clock className="h-3.5 w-3.5 text-primary" />
          </div>
          {isAr ? "النشاط الأخير" : "Recent Activity"}
          <Badge variant="secondary" className="ms-auto text-[9px] h-5 px-2">{events.length}</Badge>
        </h3>
      </div>
      <CardContent className="p-4">
        <div className="relative space-y-0">
          {/* Timeline line */}
          <div className="absolute start-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/30 via-border to-transparent" />

          {events.map((event, i) => (
            <div key={event.id} className="relative flex gap-3 pb-4 last:pb-0 group animate-in fade-in-50 slide-in-from-start-2" style={{ animationDelay: `${i * 50}ms` }}>
              <div className={cn(
                "relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-border/50 bg-card transition-all duration-300",
                "group-hover:shadow-md group-hover:scale-110 group-hover:border-primary/30"
              )}>
                <event.icon className={`h-3.5 w-3.5 ${event.color} transition-colors`} />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-[13px] leading-snug text-foreground/90 group-hover:text-foreground transition-colors">{event.title}</p>
                <p className="mt-1 text-[10px] text-muted-foreground font-medium" dir="ltr">
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
