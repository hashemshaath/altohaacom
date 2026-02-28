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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Ticket className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{t("My Tickets", "تذاكري")} ({tickets.length})</h3>
      </div>

      {tickets.map((ticket: any) => {
        const isConfirmed = ticket.status === "confirmed";
        const isCheckedIn = !!ticket.checked_in_at;

        return (
          <Card key={ticket.id} className="overflow-hidden border-border/50">
            {/* Ticket Header */}
            <div className={`px-4 py-3 ${isCheckedIn ? "bg-chart-3/10" : isConfirmed ? "bg-primary/5" : "bg-chart-4/10"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isCheckedIn ? (
                    <CheckCircle2 className="h-4 w-4 text-chart-3" />
                  ) : (
                    <Shield className="h-4 w-4 text-primary" />
                  )}
                  <span className="text-sm font-bold">{ticket.ticket_number}</span>
                </div>
                <Badge className={`text-[9px] ${isCheckedIn ? "bg-chart-3/15 text-chart-3" : isConfirmed ? "bg-primary/15 text-primary" : "bg-chart-4/15 text-chart-4"}`}>
                  {isCheckedIn ? t("Checked In", "تم الدخول") : isConfirmed ? t("Confirmed", "مؤكدة") : t("Pending", "معلقة")}
                </Badge>
              </div>
            </div>

            {/* Perforated edge */}
            <div className="relative mx-4">
              <div className="absolute -start-6 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-background" />
              <div className="absolute -end-6 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-background" />
              <Separator className="border-dashed" />
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Event Info */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold">{exhibitionTitle}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                  {exhibitionDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" />
                      {format(new Date(exhibitionDate), "MMM d, yyyy")}
                    </span>
                  )}
                  {exhibitionVenue && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      {exhibitionVenue}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {t("Booked", "الحجز")}: {format(new Date(ticket.created_at), "MMM d, HH:mm")}
                  </span>
                </div>
              </div>

              {/* QR Code */}
              {ticket.qr_code && isConfirmed && (
                <div className="flex justify-center py-2">
                  <QRCodeDisplay code={ticket.qr_code} label={t("Entry Pass", "بطاقة الدخول")} size={160} compact={false} />
                </div>
              )}

              {/* Attendee Details */}
              {(ticket.attendee_name || ticket.attendee_email) && (
                <div className="rounded-lg bg-muted/30 p-2.5 text-[11px] space-y-0.5">
                  {ticket.attendee_name && <p><span className="text-muted-foreground">{t("Name", "الاسم")}:</span> {ticket.attendee_name}</p>}
                  {ticket.attendee_email && <p><span className="text-muted-foreground">{t("Email", "البريد")}:</span> {ticket.attendee_email}</p>}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => handleShare(ticket)}>
                  <Share2 className="me-1.5 h-3 w-3" />
                  {t("Share", "مشاركة")}
                </Button>
              </div>

              {isCheckedIn && (
                <p className="text-center text-[10px] text-chart-3">
                  ✓ {t("Checked in at", "تم الدخول في")} {format(new Date(ticket.checked_in_at), "MMM d, HH:mm")}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
