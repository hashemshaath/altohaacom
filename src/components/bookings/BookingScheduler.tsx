import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, CheckCircle, XCircle, CalendarDays, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  establishmentId?: string;
}

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, "0");
  return [`${h}:00`, `${h}:30`];
}).flat();

const bookingTypes = [
  { value: "table_reservation", en: "Table Reservation", ar: "حجز طاولة" },
  { value: "consultation", en: "Consultation", ar: "استشارة" },
  { value: "event", en: "Private Event", ar: "فعالية خاصة" },
  { value: "tasting", en: "Tasting Session", ar: "جلسة تذوق" },
];

export default function BookingScheduler({ establishmentId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [bookingType, setBookingType] = useState("table_reservation");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("19:00");
  const [partySize, setPartySize] = useState("2");
  const [notes, setNotes] = useState("");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["my-bookings", user?.id, establishmentId],
    queryFn: async () => {
      let query = supabase
        .from("bookings")
        .select("*, establishments(name, name_ar, logo_url)")
        .eq("user_id", user!.id)
        .order("booking_date", { ascending: true });

      if (establishmentId) query = query.eq("establishment_id", establishmentId);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createBooking = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!date) throw new Error("Select a date");

      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        establishment_id: establishmentId || null,
        booking_type: bookingType,
        booking_date: date,
        start_time: startTime,
        party_size: parseInt(partySize),
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      setShowForm(false);
      setDate(""); setNotes("");
      toast({ title: isAr ? "تم الحجز بنجاح" : "Booking created successfully" });
    },
    onError: (err: any) => {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const cancelBooking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bookings").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      toast({ title: isAr ? "تم إلغاء الحجز" : "Booking cancelled" });
    },
  });

  const upcoming = bookings.filter(b => b.status !== "cancelled" && new Date(b.booking_date) >= new Date());
  const past = bookings.filter(b => b.status === "cancelled" || new Date(b.booking_date) < new Date());

  const statusConfig: Record<string, { label: string; labelAr: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pending", labelAr: "قيد الانتظار", variant: "secondary" },
    confirmed: { label: "Confirmed", labelAr: "مؤكد", variant: "default" },
    cancelled: { label: "Cancelled", labelAr: "ملغي", variant: "destructive" },
    completed: { label: "Completed", labelAr: "مكتمل", variant: "outline" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{isAr ? "الحجوزات والمواعيد" : "Bookings & Appointments"}</h3>
          <p className="text-sm text-muted-foreground">{isAr ? "إدارة حجوزاتك ومواعيدك" : "Manage your bookings and appointments"}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {isAr ? "حجز جديد" : "New Booking"}
        </Button>
      </div>

      {/* Booking Form */}
      {showForm && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isAr ? "حجز جديد" : "New Booking"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{isAr ? "نوع الحجز" : "Type"}</label>
                <Select value={bookingType} onValueChange={setBookingType}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {bookingTypes.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{isAr ? "عدد الأشخاص" : "Party Size"}</label>
                <Input type="number" min="1" max="50" value={partySize} onChange={e => setPartySize(e.target.value)} className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{isAr ? "التاريخ" : "Date"}</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="h-9" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{isAr ? "الوقت" : "Time"}</label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-48">
                    {timeSlots.filter(t => t >= "09:00" && t <= "23:00").map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Textarea placeholder={isAr ? "ملاحظات إضافية..." : "Additional notes..."} value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
            <div className="flex gap-2">
              <Button onClick={() => createBooking.mutate()} disabled={createBooking.isPending || !date}>
                {isAr ? "تأكيد الحجز" : "Confirm Booking"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming */}
      <div>
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          {isAr ? "الحجوزات القادمة" : "Upcoming"} ({upcoming.length})
        </h4>
        {!upcoming.length ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Calendar className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">{isAr ? "لا توجد حجوزات قادمة" : "No upcoming bookings"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {upcoming.map(b => (
              <BookingCard key={b.id} booking={b} isAr={isAr} statusConfig={statusConfig} onCancel={() => cancelBooking.mutate(b.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">{isAr ? "السابقة" : "Past"} ({past.length})</h4>
          <div className="space-y-2 opacity-70">
            {past.slice(0, 5).map(b => (
              <BookingCard key={b.id} booking={b} isAr={isAr} statusConfig={statusConfig} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking: b, isAr, statusConfig, onCancel }: any) {
  const sc = statusConfig[b.status] || statusConfig.pending;
  const typeLabel = bookingTypes.find(t => t.value === b.booking_type);

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
          <span className="text-xs font-bold">{format(new Date(b.booking_date), "dd")}</span>
          <span className="text-[10px]">{format(new Date(b.booking_date), "MMM", { locale: isAr ? ar : undefined })}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{isAr && typeLabel ? typeLabel.ar : typeLabel?.en || b.booking_type}</p>
            <Badge variant={sc.variant} className="text-[10px]">{isAr ? sc.labelAr : sc.label}</Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {b.start_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{b.start_time}</span>}
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{b.party_size}</span>
            {b.confirmation_code && <span className="font-mono">#{b.confirmation_code}</span>}
          </div>
        </div>
        {onCancel && b.status === "pending" && (
          <Button variant="ghost" size="sm" className="text-destructive" onClick={onCancel}>
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
