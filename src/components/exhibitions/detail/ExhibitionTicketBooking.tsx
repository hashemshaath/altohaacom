import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { toast } from "@/hooks/use-toast";
import { Ticket, CheckCircle2, Sparkles, Shield, ChevronDown, ChevronUp, User, Mail, Phone, CreditCard } from "lucide-react";
import { MoyasarPaymentForm } from "./MoyasarPaymentForm";

interface Props {
  exhibitionId: string;
  exhibitionTitle: string;
  isFree?: boolean | null;
  ticketPrice?: string | null;
  hasEnded: boolean;
  isAr: boolean;
}

export function ExhibitionTicketBooking({ exhibitionId, exhibitionTitle, isFree, ticketPrice, hasEnded, isAr }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingTicketId, setPendingTicketId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const { data: existingTicket, isLoading } = useQuery({
    queryKey: ["exhibition-ticket", exhibitionId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("exhibition_tickets")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .eq("user_id", user.id)
        .eq("status", "confirmed")
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const bookTicket = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { data: qrCode } = await supabase.rpc("generate_qr_code", { p_prefix: "ETK" });
      const isPaid = !isFree && ticketPrice;
      const { data, error } = await supabase
        .from("exhibition_tickets")
        .insert({
          exhibition_id: exhibitionId,
          user_id: user.id,
          attendee_name: name || undefined,
          attendee_email: email || user.email || undefined,
          attendee_phone: phone || undefined,
          qr_code: qrCode as string,
          status: isPaid ? "pending" : "confirmed",
          payment_status: isPaid ? "pending" : "free",
        })
        .select()
        .single();
      if (error) throw error;
      await supabase.from("qr_codes").insert({
        code: qrCode as string,
        entity_type: "participant",
        entity_id: data.id,
        category: "exhibition_ticket",
        created_by: user.id,
      });
      return data;
    },
    onSuccess: (data) => {
      if (!isFree && ticketPrice) {
        // Show payment form for paid tickets
        setPendingTicketId(data.id);
        setShowPayment(true);
        setExpanded(false);
      } else {
        queryClient.invalidateQueries({ queryKey: ["exhibition-ticket", exhibitionId] });
        setExpanded(false);
        toast({
          title: isAr ? "تم حجز التذكرة! 🎟️" : "Ticket Booked! 🎟️",
          description: isAr ? "يمكنك عرض تذكرتك مع رمز QR" : "You can view your ticket with QR code",
        });
      }
    },
    onError: () => {
      toast({ title: isAr ? "خطأ" : "Error", description: isAr ? "فشل في حجز التذكرة" : "Failed to book ticket", variant: "destructive" });
    },
  });

  // Parse price from string
  const parsedPrice = ticketPrice ? parseFloat(ticketPrice.replace(/[^\d.]/g, "")) : 0;

  if (hasEnded || isLoading) return null;

  // Already has ticket - show confirmed inline
  if (existingTicket) {
    return (
      <Card className="overflow-hidden border-chart-3/20 shadow-lg">
        <div className="relative overflow-hidden bg-gradient-to-r from-chart-3/15 via-chart-3/10 to-chart-3/5 px-4 py-4">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "20px 20px" }} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-chart-3/15 ring-2 ring-chart-3/10">
                <CheckCircle2 className="h-4 w-4 text-chart-3" />
              </div>
              <div>
                <p className="text-sm font-bold">{isAr ? "تذكرتك مؤكدة" : "Ticket Confirmed"}</p>
                <p className="text-[10px] text-muted-foreground">{isAr ? "جاهز للدخول" : "Ready for entry"}</p>
              </div>
            </div>
            <Badge className="bg-chart-3/15 text-chart-3 border-chart-3/25 font-semibold text-[10px] uppercase tracking-wider">
              <Shield className="me-1 h-2.5 w-2.5" />
              {isAr ? "مؤكدة" : "Valid"}
            </Badge>
          </div>
        </div>

        <div className="relative mx-4">
          <div className="absolute -start-6 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-background" />
          <div className="absolute -end-6 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-background" />
          <Separator className="border-dashed" />
        </div>

        <CardContent className="p-4 space-y-4">
          <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">{isAr ? "رقم التذكرة" : "Ticket Number"}</p>
            <p className="font-mono text-base font-bold tracking-widest text-foreground">{existingTicket.ticket_number}</p>
          </div>
          
          {existingTicket.qr_code && (
            <div className="flex justify-center">
              <QRCodeDisplay code={existingTicket.qr_code} label={isAr ? "رمز الدخول" : "Entry Pass"} size={140} compact={false} />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show Moyasar payment form
  if (showPayment && pendingTicketId) {
    return (
      <MoyasarPaymentForm
        exhibitionId={exhibitionId}
        exhibitionTitle={exhibitionTitle}
        ticketId={pendingTicketId}
        amount={parsedPrice || 50}
        isAr={isAr}
        onSuccess={() => {
          setShowPayment(false);
          setPendingTicketId(null);
          queryClient.invalidateQueries({ queryKey: ["exhibition-ticket", exhibitionId] });
          toast({
            title: isAr ? "تم الدفع والحجز! 🎟️" : "Payment & Booking Complete! 🎟️",
            description: isAr ? "تذكرتك جاهزة" : "Your ticket is ready",
          });
        }}
        onCancel={() => {
          setShowPayment(false);
          setPendingTicketId(null);
        }}
      />
    );
  }

  // Inline booking form (no dialog)
  return (
    <Card className={`overflow-hidden transition-all ${expanded ? "border-primary/30 shadow-xl shadow-primary/10" : "border-primary/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"}`}>
      <CardContent className="p-0">
        {/* Header / CTA - always visible */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-3 p-4 text-start transition-colors hover:bg-primary/5"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 ring-2 ring-primary/10 shrink-0">
            <Ticket className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">
              {isFree ? (isAr ? "احجز تذكرة مجانية" : "Book Free Ticket") : (isAr ? "احجز تذكرتك" : "Book Your Ticket")}
            </p>
            {!isFree && ticketPrice && (
              <p className="text-xs font-semibold text-primary">{ticketPrice}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">{isAr ? "احصل على رمز QR للدخول السريع" : "Get a QR code for quick entry"}</p>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>

        {/* Expanded inline form */}
        {expanded && (
          <div className="border-t border-border/40 px-4 pb-4 pt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <p className="text-xs font-medium text-muted-foreground">{exhibitionTitle}</p>
            
            <div className="space-y-2.5">
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isAr ? "الاسم (اختياري)" : "Name (optional)"}
                  className="ps-9 h-10 rounded-xl"
                />
              </div>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={user?.email || "email@example.com"}
                  className="ps-9 h-10 rounded-xl"
                />
              </div>
              <div className="relative">
                <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={isAr ? "رقم الهاتف (اختياري)" : "Phone (optional)"}
                  className="ps-9 h-10 rounded-xl"
                />
              </div>
            </div>

            <Separator className="my-1" />

            <Button
              className="w-full h-11 font-semibold shadow-lg shadow-primary/15 rounded-xl"
              onClick={() => bookTicket.mutate()}
              disabled={bookTicket.isPending || !user}
            >
              {bookTicket.isPending ? (
                <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 animate-pulse" />{isAr ? "جاري الحجز..." : "Booking..."}</span>
              ) : (
                <span className="flex items-center gap-2"><Ticket className="h-4 w-4" />{isAr ? "تأكيد الحجز" : "Confirm Booking"}</span>
              )}
            </Button>
            {!user && <p className="text-center text-xs text-muted-foreground">{isAr ? "يجب تسجيل الدخول أولاً" : "Please sign in first"}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
