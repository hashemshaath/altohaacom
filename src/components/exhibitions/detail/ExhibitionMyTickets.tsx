import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { Ticket, CheckCircle2, Shield, Download, Share2, Calendar, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface Props {
  exhibitionId: string;
  exhibitionTitle: string;
  exhibitionDate?: string;
  exhibitionVenue?: string;
  isAr: boolean;
}

export function ExhibitionMyTickets({ exhibitionId, exhibitionTitle, exhibitionDate, exhibitionVenue, isAr }: Props) {
  const { user } = useAuth();
  const t = (en: string, ar: string) => isAr ? ar : en;

  const { data: tickets = [] } = useQuery({
    queryKey: ["my-exhibition-tickets", exhibitionId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("exhibition_tickets")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  if (tickets.length === 0) return null;

  const handleShare = async (ticket: any) => {
    const text = `${exhibitionTitle}\n${t("Ticket", "تذكرة")}: ${ticket.ticket_number}\n${exhibitionDate ? format(new Date(exhibitionDate), "MMM d, yyyy") : ""}`;
    if (navigator.share) {
      try { await navigator.share({ title: exhibitionTitle, text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: t("Copied to clipboard", "تم النسخ") });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
          <Ticket className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold">{t("My Tickets", "تذاكري")}</h3>
          <p className="text-[10px] text-muted-foreground">{tickets.length} {t("ticket(s)", "تذكرة")}</p>
        </div>
      </div>

      {tickets.map((ticket: any, idx: number) => {
        const isConfirmed = ticket.status === "confirmed";
        const isCheckedIn = !!ticket.checked_in_at;

        return (
          <Card
            key={ticket.id}
            className="overflow-hidden border-border/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            {/* Ticket Header with gradient */}
            <div className={`px-5 py-4 ${isCheckedIn ? "bg-gradient-to-r from-chart-3/15 to-chart-3/5" : isConfirmed ? "bg-gradient-to-r from-primary/10 to-primary/5" : "bg-gradient-to-r from-chart-4/10 to-chart-4/5"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ring-2 ${isCheckedIn ? "bg-chart-3/15 ring-chart-3/10" : isConfirmed ? "bg-primary/15 ring-primary/10" : "bg-chart-4/15 ring-chart-4/10"}`}>
                    {isCheckedIn ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-chart-3" />
                    ) : (
                      <Shield className="h-4.5 w-4.5 text-primary" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-bold font-mono tracking-wide">{ticket.ticket_number}</span>
                    <p className="text-[10px] text-muted-foreground">{exhibitionTitle}</p>
                  </div>
                </div>
                <Badge className={`text-[9px] font-semibold uppercase tracking-wider ${isCheckedIn ? "bg-chart-3/15 text-chart-3 border-chart-3/25" : isConfirmed ? "bg-primary/15 text-primary border-primary/25" : "bg-chart-4/15 text-chart-4 border-chart-4/25"}`}>
                  {isCheckedIn ? t("Checked In", "تم الدخول") : isConfirmed ? t("Confirmed", "مؤكدة") : t("Pending", "معلقة")}
                </Badge>
              </div>
            </div>

            {/* Perforated edge */}
            <div className="relative mx-5">
              <div className="absolute -start-7 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-background" />
              <div className="absolute -end-7 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-background" />
              <Separator className="border-dashed" />
            </div>

            <CardContent className="p-5 space-y-4">
              {/* Event Details */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
                {exhibitionDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(exhibitionDate), "MMM d, yyyy")}
                  </span>
                )}
                {exhibitionVenue && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    {exhibitionVenue}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {t("Booked", "الحجز")}: {format(new Date(ticket.created_at), "MMM d, HH:mm")}
                </span>
              </div>

              {/* QR Code - prominent */}
              {ticket.qr_code && isConfirmed && (
                <div className="flex justify-center py-3 rounded-xl bg-muted/20">
                  <QRCodeDisplay code={ticket.qr_code} label={t("Entry Pass", "بطاقة الدخول")} size={180} compact={false} />
                </div>
              )}

              {/* Attendee Details */}
              {(ticket.attendee_name || ticket.attendee_email) && (
                <div className="rounded-xl bg-muted/30 p-3 text-[11px] space-y-1 border border-border/30">
                  {ticket.attendee_name && <p><span className="text-muted-foreground font-medium">{t("Name", "الاسم")}:</span> {ticket.attendee_name}</p>}
                  {ticket.attendee_email && <p><span className="text-muted-foreground font-medium">{t("Email", "البريد")}:</span> {ticket.attendee_email}</p>}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs h-9 rounded-xl transition-all hover:shadow-md" onClick={() => handleShare(ticket)}>
                  <Share2 className="me-1.5 h-3.5 w-3.5" />
                  {t("Share", "مشاركة")}
                </Button>
              </div>

              {isCheckedIn && (
                <div className="text-center rounded-xl bg-chart-3/5 py-2 border border-chart-3/15">
                  <p className="text-[11px] text-chart-3 font-medium">
                    ✓ {t("Checked in at", "تم الدخول في")} {format(new Date(ticket.checked_in_at), "MMM d, HH:mm")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
