import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { toast } from "@/hooks/use-toast";
import { Ticket, CheckCircle2, Download, QrCode } from "lucide-react";

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
  const [dialogOpen, setDialogOpen] = useState(false);
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
      
      // Generate QR code
      const { data: qrCode } = await supabase.rpc("generate_qr_code", { p_prefix: "ETK" });
      
      const { data, error } = await supabase
        .from("exhibition_tickets")
        .insert({
          exhibition_id: exhibitionId,
          user_id: user.id,
          attendee_name: name || undefined,
          attendee_email: email || user.email || undefined,
          attendee_phone: phone || undefined,
          qr_code: qrCode as string,
        })
        .select()
        .single();
      if (error) throw error;
      
      // Also create QR code entry
      await supabase.from("qr_codes").insert({
        code: qrCode as string,
        entity_type: "participant",
        entity_id: data.id,
        category: "exhibition_ticket",
        created_by: user.id,
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-ticket", exhibitionId] });
      setDialogOpen(false);
      toast({
        title: isAr ? "تم حجز التذكرة! 🎟️" : "Ticket Booked! 🎟️",
        description: isAr ? "يمكنك عرض تذكرتك مع رمز QR" : "You can view your ticket with QR code",
      });
    },
    onError: () => {
      toast({ title: isAr ? "خطأ" : "Error", description: isAr ? "فشل في حجز التذكرة" : "Failed to book ticket", variant: "destructive" });
    },
  });

  if (hasEnded) return null;
  if (isLoading) return null;

  // Already has ticket - show it
  if (existingTicket) {
    return (
      <Card className="overflow-hidden border-chart-3/30 shadow-md">
        <div className="border-b bg-gradient-to-r from-chart-3/10 via-chart-3/5 to-transparent px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-3/15">
              <CheckCircle2 className="h-3.5 w-3.5 text-chart-3" />
            </div>
            {isAr ? "تذكرتك" : "Your Ticket"}
          </h3>
        </div>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "رقم التذكرة" : "Ticket #"}</p>
              <p className="font-mono text-sm font-bold">{existingTicket.ticket_number}</p>
            </div>
            <Badge className="bg-chart-3/15 text-chart-3 border-chart-3/20">
              {isAr ? "مؤكدة" : "Confirmed"}
            </Badge>
          </div>
          
          {existingTicket.qr_code && (
            <QRCodeDisplay code={existingTicket.qr_code} label={isAr ? "رمز الدخول" : "Entry Pass"} size={120} compact={false} />
          )}
        </CardContent>
      </Card>
    );
  }

  // No ticket yet - show booking button
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full shadow-lg shadow-primary/20" disabled={!user}>
          <Ticket className="me-2 h-4 w-4" />
          {isAr ? "احجز تذكرة مجانية" : isFree ? "Book Free Ticket" : `Book Ticket ${ticketPrice ? `- ${ticketPrice}` : ""}`}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            {isAr ? "حجز تذكرة" : "Book Ticket"}
          </DialogTitle>
          <DialogDescription>
            {exhibitionTitle}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{isAr ? "الاسم (اختياري)" : "Name (optional)"}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={isAr ? "اسمك الكامل" : "Your full name"} />
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={user?.email || "email@example.com"} />
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "رقم الهاتف (اختياري)" : "Phone (optional)"}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966..." />
          </div>
          <Button className="w-full" onClick={() => bookTicket.mutate()} disabled={bookTicket.isPending}>
            {bookTicket.isPending ? (isAr ? "جاري الحجز..." : "Booking...") : (isAr ? "تأكيد الحجز" : "Confirm Booking")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
