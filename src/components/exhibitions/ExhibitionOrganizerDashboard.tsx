import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Ticket, Star, TrendingUp, CheckCircle2, Clock, BarChart3, LayoutGrid, ClipboardList, Award, CalendarClock, Tags, Download, HandHeart, ChefHat, Bell, Megaphone } from "lucide-react";
import { format } from "date-fns";
import { ExhibitionTicketCheckin } from "./detail/ExhibitionTicketCheckin";
import { ExhibitionOrganizerAnalytics } from "./detail/ExhibitionOrganizerAnalytics";
import { ExhibitionBoothManagement } from "./detail/ExhibitionBoothManagement";
import { ExhibitionBoothRequests } from "./detail/ExhibitionBoothRequests";
import { ExhibitionCertificateGenerator } from "./detail/ExhibitionCertificateGenerator";
import { ExhibitionScheduleManager } from "./detail/ExhibitionScheduleManager";
import { ExhibitionTicketTypeManager } from "./detail/ExhibitionTicketTypeManager";
import { ExhibitionDataExport } from "./detail/ExhibitionDataExport";
import { ExhibitionVolunteerManager } from "./detail/ExhibitionVolunteerManager";
import { ExhibitionCookingSessionManager } from "./detail/ExhibitionCookingSessionManager";
import { ExhibitionNotificationPreferences } from "./detail/ExhibitionNotificationPreferences";
import { ExhibitionOrganizerQuickActions } from "./detail/ExhibitionOrganizerQuickActions";
import { ExhibitionRealtimeStats } from "./detail/ExhibitionRealtimeStats";
import { ExhibitionDiscountCodes } from "./detail/ExhibitionDiscountCodes";
import { ExhibitionOrganizerMessaging } from "./detail/ExhibitionOrganizerMessaging";
import { ExhibitionSurveyManager } from "./detail/ExhibitionSurveyManager";
import { ExhibitionAnalyticsDashboard } from "./detail/ExhibitionAnalyticsDashboard";
interface Props {
  exhibitionId: string;
  exhibitionTitle: string;
  isAr: boolean;
}

export function ExhibitionOrganizerDashboard({ exhibitionId, exhibitionTitle, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;

  const { data: stats } = useQuery({
    queryKey: ["organizer-stats", exhibitionId],
    queryFn: async () => {
      const [tickets, checkedIn, reviews, followers, booths] = await Promise.all([
        supabase.from("exhibition_tickets").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibitionId),
        supabase.from("exhibition_tickets").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibitionId).not("checked_in_at", "is", null),
        supabase.from("exhibition_reviews").select("id, rating", { count: "exact" }).eq("exhibition_id", exhibitionId),
        supabase.from("exhibition_followers").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibitionId),
        supabase.from("exhibition_booths").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibitionId),
      ]);
      const reviewData = reviews.data || [];
      const avgRating = reviewData.length > 0 ? reviewData.reduce((s, r) => s + (r as any).rating, 0) / reviewData.length : 0;
      return {
        totalTickets: tickets.count || 0,
        checkedIn: checkedIn.count || 0,
        totalReviews: reviews.count || 0,
        avgRating,
        followers: followers.count || 0,
        booths: booths.count || 0,
      };
    },
    staleTime: 1000 * 30,
  });

  const { data: ticketsList = [] } = useQuery({
    queryKey: ["organizer-tickets", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_tickets")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60,
  });

  const statCards = [
    { label: t("Tickets", "التذاكر"), value: stats?.totalTickets || 0, icon: Ticket, color: "text-primary" },
    { label: t("Checked In", "حضور"), value: stats?.checkedIn || 0, icon: CheckCircle2, color: "text-chart-3" },
    { label: t("Check-in Rate", "معدل الحضور"), value: stats?.totalTickets ? `${Math.round((stats.checkedIn / stats.totalTickets) * 100)}%` : "0%", icon: TrendingUp, color: "text-chart-2" },
    { label: t("Reviews", "التقييمات"), value: stats?.totalReviews || 0, icon: Star, color: "text-chart-4" },
    { label: t("Avg Rating", "متوسط التقييم"), value: stats?.avgRating ? stats.avgRating.toFixed(1) : "—", icon: BarChart3, color: "text-chart-4" },
    { label: t("Followers", "المتابعين"), value: stats?.followers || 0, icon: Users, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <ExhibitionOrganizerQuickActions
        exhibitionId={exhibitionId}
        exhibitionTitle={exhibitionTitle}
        isAr={isAr}
        followerCount={stats?.followers || 0}
        ticketCount={stats?.totalTickets || 0}
      />

      {/* Realtime Stats Bar */}
      <ExhibitionRealtimeStats
        exhibitionId={exhibitionId}
        initialTickets={stats?.totalTickets || 0}
        initialCheckins={stats?.checkedIn || 0}
        isAr={isAr}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className="border-border/40 transition-all hover:shadow-md hover:border-primary/20">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60 shrink-0">
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="checkin" className="space-y-4">
        <div className="overflow-x-auto -mx-1 px-1 scrollbar-none">
          <TabsList className="w-max">
            <TabsTrigger value="checkin" className="gap-1.5 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("Check-in", "تسجيل الدخول")}</span>
              <span className="sm:hidden">{t("Check", "دخول")}</span>
            </TabsTrigger>
            <TabsTrigger value="attendees" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("Attendees", "الحضور")}</span>
              <span className="sm:hidden">{t("👥", "👥")}</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("Analytics", "التحليلات")}</span>
              <span className="sm:hidden">{t("📊", "📊")}</span>
            </TabsTrigger>
            <TabsTrigger value="booths" className="gap-1.5 text-xs">
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("Booths", "الأجنحة")}</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-1.5 text-xs">
              <ClipboardList className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("Requests", "الطلبات")}</span>
            </TabsTrigger>
            <TabsTrigger value="certificates" className="gap-1.5 text-xs">
              <Award className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("Certs", "شهادات")}</span>
            </TabsTrigger>
            <TabsTrigger value="schedule-mgmt" className="gap-1.5 text-xs">
              <CalendarClock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("Schedule", "الجدول")}</span>
            </TabsTrigger>
            <TabsTrigger value="ticket-types" className="gap-1.5 text-xs">
              <Tags className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("Tickets", "التذاكر")}</span>
            </TabsTrigger>
            <TabsTrigger value="volunteers" className="gap-1.5 text-xs">
              <HandHeart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("Volunteers", "المتطوعين")}</span>
            </TabsTrigger>
            <TabsTrigger value="cooking-mgmt" className="gap-1.5 text-xs">
              <ChefHat className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("Cooking", "الطهي")}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 text-xs">
              <Bell className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("Alerts", "التنبيهات")}</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("Export", "تصدير")}</span>
            </TabsTrigger>
            <TabsTrigger value="surveys" className="gap-1.5 text-xs">
              <ClipboardList className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("Surveys", "استبيانات")}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="checkin">
          <ExhibitionTicketCheckin exhibitionId={exhibitionId} isAr={isAr} />
        </TabsContent>

        <TabsContent value="attendees">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">{t("Registered Attendees", "الحضور المسجلون")} ({ticketsList.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">{t("Ticket #", "رقم التذكرة")}</TableHead>
                      <TableHead className="text-xs">{t("Name", "الاسم")}</TableHead>
                      <TableHead className="text-xs">{t("Email", "البريد")}</TableHead>
                      <TableHead className="text-xs">{t("Status", "الحالة")}</TableHead>
                      <TableHead className="text-xs">{t("Booked", "الحجز")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ticketsList.map((ticket: any) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-xs">{ticket.ticket_number}</TableCell>
                        <TableCell className="text-xs">{ticket.attendee_name || "—"}</TableCell>
                        <TableCell className="text-xs">{ticket.attendee_email || "—"}</TableCell>
                        <TableCell>
                          {ticket.checked_in_at ? (
                            <Badge className="bg-chart-3/10 text-chart-3 text-[10px]">
                              <CheckCircle2 className="me-1 h-2.5 w-2.5" />
                              {t("Checked In", "حاضر")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              <Clock className="me-1 h-2.5 w-2.5" />
                              {t("Pending", "بانتظار")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">{format(new Date(ticket.created_at), "MMM d, HH:mm")}</TableCell>
                      </TableRow>
                    ))}
                    {ticketsList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                          {t("No attendees yet", "لا يوجد حضور بعد")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            <ExhibitionAnalyticsDashboard exhibitionId={exhibitionId} />
            <ExhibitionOrganizerAnalytics exhibitionId={exhibitionId} isAr={isAr} />
          </div>
        </TabsContent>

        <TabsContent value="booths">
          <ExhibitionBoothManagement exhibitionId={exhibitionId} isAr={isAr} />
        </TabsContent>

        <TabsContent value="requests">
          <ExhibitionBoothRequests exhibitionId={exhibitionId} isAr={isAr} />
        </TabsContent>

        <TabsContent value="certificates">
          <ExhibitionCertificateGenerator exhibitionId={exhibitionId} exhibitionTitle={exhibitionTitle} isAr={isAr} />
        </TabsContent>

        <TabsContent value="schedule-mgmt">
          <ExhibitionScheduleManager exhibitionId={exhibitionId} isAr={isAr} />
        </TabsContent>

        <TabsContent value="ticket-types">
          <ExhibitionTicketTypeManager exhibitionId={exhibitionId} isAr={isAr} />
        </TabsContent>

        <TabsContent value="export">
          <div className="space-y-4">
            <ExhibitionDataExport exhibitionId={exhibitionId} exhibitionTitle={exhibitionTitle} isAr={isAr} />
            <ExhibitionDiscountCodes exhibitionId={exhibitionId} isAr={isAr} />
          </div>
        </TabsContent>

        <TabsContent value="volunteers">
          <ExhibitionVolunteerManager exhibitionId={exhibitionId} isAr={isAr} />
        </TabsContent>

        <TabsContent value="cooking-mgmt">
          <ExhibitionCookingSessionManager exhibitionId={exhibitionId} isAr={isAr} />
        </TabsContent>

        <TabsContent value="notifications">
          <div className="space-y-4">
            <ExhibitionOrganizerMessaging exhibitionId={exhibitionId} exhibitionTitle={exhibitionTitle} isAr={isAr} />
            <ExhibitionNotificationPreferences exhibitionId={exhibitionId} isAr={isAr} />
          </div>
        </TabsContent>

        <TabsContent value="surveys">
          <ExhibitionSurveyManager exhibitionId={exhibitionId} isAr={isAr} isOrganizer={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
