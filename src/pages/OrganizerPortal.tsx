import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Landmark, Calendar, Plus, Users, Ticket, Star, TrendingUp, Eye, MapPin, CheckCircle2, Clock, BarChart3 } from "lucide-react";
import { format, isPast, isFuture, isWithinInterval } from "date-fns";
import { toEnglishDigits } from "@/lib/formatNumber";
import { deriveExhibitionStatus } from "@/lib/exhibitionStatus";
import { countryFlag } from "@/lib/countryFlag";

export default function OrganizerPortal() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => isAr ? ar : en;
  const [tab, setTab] = useState("all");

  const { data: exhibitions, isLoading } = useQuery({
    queryKey: ["organizer-portal", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("exhibitions")
        .select("*")
        .eq("created_by", user.id)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: ticketStats } = useQuery({
    queryKey: ["organizer-ticket-stats", user?.id],
    queryFn: async () => {
      if (!user || !exhibitions?.length) return { total: 0, checkedIn: 0, perEvent: new Map<string, number>() };
      const ids = exhibitions.map(e => e.id);
      const [total, checkedIn, perEventData] = await Promise.all([
        supabase.from("exhibition_tickets").select("id", { count: "exact", head: true }).in("exhibition_id", ids),
        supabase.from("exhibition_tickets").select("id", { count: "exact", head: true }).in("exhibition_id", ids).not("checked_in_at", "is", null),
        supabase.from("exhibition_tickets").select("exhibition_id").in("exhibition_id", ids),
      ]);
      const perEvent = new Map<string, number>();
      for (const t of perEventData.data || []) {
        perEvent.set(t.exhibition_id, (perEvent.get(t.exhibition_id) || 0) + 1);
      }
      return { total: total.count || 0, checkedIn: checkedIn.count || 0, perEvent };
    },
    enabled: !!exhibitions?.length,
  });

  const stats = useMemo(() => {
    if (!exhibitions) return { total: 0, active: 0, upcoming: 0, past: 0, views: 0 };
    const now = new Date();
    let active = 0, upcoming = 0, past = 0, views = 0;
    for (const e of exhibitions) {
      const start = new Date(e.start_date);
      const end = new Date(e.end_date);
      views += e.view_count || 0;
      try { if (isWithinInterval(now, { start, end })) { active++; continue; } } catch {}
      if (isFuture(start)) upcoming++;
      else if (isPast(end)) past++;
    }
    return { total: exhibitions.length, active, upcoming, past, views };
  }, [exhibitions]);

  const filtered = useMemo(() => {
    if (!exhibitions) return [];
    const now = new Date();
    return exhibitions.filter(e => {
      if (tab === "all") return true;
      const start = new Date(e.start_date);
      const end = new Date(e.end_date);
      if (tab === "active") try { return isWithinInterval(now, { start, end }); } catch { return false; }
      if (tab === "upcoming") return isFuture(start);
      if (tab === "past") return isPast(end);
      return true;
    });
  }, [exhibitions, tab]);

  if (!user) {
    return (
      <PageShell title={t("Organizer Portal", "بوابة المنظمين")} container>
        <EmptyState icon={Landmark} title={t("Please login", "يرجى تسجيل الدخول")} description={t("You need to login to access the organizer portal", "تحتاج لتسجيل الدخول للوصول لبوابة المنظمين")} />
      </PageShell>
    );
  }

  return (
    <PageShell title={t("Organizer Portal — Altoha", "بوابة المنظمين — الطهاة")} container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("My Events", "فعالياتي")}</h1>
            <p className="text-sm text-muted-foreground">{t("Manage your exhibitions and events from one place", "إدارة معارضك وفعالياتك من مكان واحد")}</p>
          </div>
          <Button asChild>
            <Link to="/exhibitions/create">
              <Plus className="me-1.5 h-4 w-4" />
              {t("Create Event", "إنشاء فعالية")}
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: t("Total Events", "إجمالي"), value: stats.total, icon: Landmark, color: "text-primary" },
            { label: t("Active Now", "نشطة الآن"), value: stats.active, icon: TrendingUp, color: "text-chart-3" },
            { label: t("Upcoming", "قادمة"), value: stats.upcoming, icon: Calendar, color: "text-chart-2" },
            { label: t("Total Views", "المشاهدات"), value: stats.views, icon: Eye, color: "text-chart-4" },
            { label: t("Tickets Sold", "التذاكر"), value: ticketStats?.total || 0, icon: Ticket, color: "text-primary" },
            { label: t("Check-ins", "الحضور"), value: ticketStats?.checkedIn || 0, icon: CheckCircle2, color: "text-chart-3" },
          ].map(s => (
            <Card key={s.label} className="border-border/40">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 shrink-0">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <p className={`text-lg font-bold ${s.color}`}>{toEnglishDigits(s.value)}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs & List */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/30 border border-border/30">
            <TabsTrigger value="all" className="text-xs">{t("All", "الكل")} ({stats.total})</TabsTrigger>
            <TabsTrigger value="active" className="text-xs">{t("Active", "نشطة")} ({stats.active})</TabsTrigger>
            <TabsTrigger value="upcoming" className="text-xs">{t("Upcoming", "قادمة")} ({stats.upcoming})</TabsTrigger>
            <TabsTrigger value="past" className="text-xs">{t("Past", "سابقة")} ({stats.past})</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {isLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : filtered.length === 0 ? (
              <EmptyState icon={Landmark} title={t("No events yet", "لا توجد فعاليات")} description={t("Create your first event to get started", "أنشئ فعاليتك الأولى للبدء")} />
            ) : (
              <div className="space-y-3">
                {filtered.map(ex => {
                  const derived = deriveExhibitionStatus({
                    dbStatus: ex.status,
                    startDate: ex.start_date,
                    endDate: ex.end_date,
                    registrationDeadline: ex.registration_deadline,
                  });
                  const title = isAr && ex.title_ar ? ex.title_ar : ex.title;
                  return (
                    <Link key={ex.id} to={`/exhibitions/${ex.slug}`} className="group block">
                      <Card className="border-border/40 transition-all hover:shadow-md hover:border-primary/20">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="hidden sm:block shrink-0 w-20 h-14 rounded-lg overflow-hidden bg-muted">
                            {ex.cover_image_url ? (
                              <img src={ex.cover_image_url} alt={title} className="h-full w-full object-cover" loading="lazy" />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/8 to-muted"><span className="text-xl">🏛️</span></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-bold truncate group-hover:text-primary transition-colors">{title}</h3>
                              <Badge className={`${derived.color} text-[8px] shrink-0 py-0.5 px-2`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${derived.dot} me-1`} />
                                {isAr ? derived.labelAr : derived.label}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(ex.start_date), "MMM d, yyyy")}
                              </span>
                              {ex.city && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {ex.city}{ex.country ? ` ${countryFlag(ex.country)}` : ""}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {toEnglishDigits(ex.view_count || 0)} {t("views", "مشاهدة")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Ticket className="h-3 w-3" />
                                {toEnglishDigits(ticketStats?.perEvent?.get(ex.id) || 0)} {t("tickets", "تذكرة")}
                              </span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="shrink-0 text-xs gap-1.5">
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span className="hidden md:inline">{t("Dashboard", "لوحة التحكم")}</span>
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
