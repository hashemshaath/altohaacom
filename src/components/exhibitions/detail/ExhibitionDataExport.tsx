import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { downloadCSV } from "@/lib/exportUtils";
import { toast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, Users, Ticket, LayoutGrid, CalendarClock } from "lucide-react";
import { format } from "date-fns";

interface Props {
  exhibitionId: string;
  exhibitionTitle: string;
  isAr: boolean;
}

type ExportType = "attendees" | "booths" | "schedule" | "ticket-types";

export function ExhibitionDataExport({ exhibitionId, exhibitionTitle, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const [exporting, setExporting] = useState(false);

  const exportData = async (type: ExportType) => {
    setExporting(true);
    try {
      const dateStr = format(new Date(), "yyyy-MM-dd");

      if (type === "attendees") {
        const { data, error } = await supabase
          .from("exhibition_tickets")
          .select("ticket_number, attendee_name, attendee_email, checked_in_at, created_at, ticket_type_id, price_paid, currency")
          .eq("exhibition_id", exhibitionId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        downloadCSV(
          (data || []).map((t: any) => ({
            ticket_number: t.ticket_number,
            name: t.attendee_name || "",
            email: t.attendee_email || "",
            status: t.checked_in_at ? "Checked In" : "Pending",
            checked_in: t.checked_in_at ? format(new Date(t.checked_in_at), "yyyy-MM-dd HH:mm") : "",
            booked: format(new Date(t.created_at), "yyyy-MM-dd HH:mm"),
            price: t.price_paid || 0,
            currency: t.currency || "SAR",
          })),
          `${exhibitionTitle}-attendees-${dateStr}`,
          [
            { key: "ticket_number", label: t("Ticket #", "رقم التذكرة") },
            { key: "name", label: t("Name", "الاسم") },
            { key: "email", label: t("Email", "البريد") },
            { key: "status", label: t("Status", "الحالة") },
            { key: "checked_in", label: t("Check-in Time", "وقت الحضور") },
            { key: "booked", label: t("Booked At", "تاريخ الحجز") },
            { key: "price", label: t("Price", "السعر") },
            { key: "currency", label: t("Currency", "العملة") },
          ]
        );
      } else if (type === "booths") {
        const { data, error } = await supabase
          .from("exhibition_booths")
          .select("booth_number, name, name_ar, category, hall, status, contact_name, contact_email, contact_phone, size_sqm, price")
          .eq("exhibition_id", exhibitionId)
          .order("booth_number");
        if (error) throw error;
        downloadCSV(
          (data || []).map((b: any) => ({
            booth_number: b.booth_number,
            name: isAr ? (b.name_ar || b.name) : b.name,
            category: b.category || "",
            hall: b.hall || "",
            status: b.status || "available",
            contact: b.contact_name || "",
            email: b.contact_email || "",
            phone: b.contact_phone || "",
            size: b.size_sqm || "",
            price: b.price || "",
          })),
          `${exhibitionTitle}-booths-${dateStr}`,
          [
            { key: "booth_number", label: t("Booth #", "رقم الجناح") },
            { key: "name", label: t("Name", "الاسم") },
            { key: "category", label: t("Category", "الفئة") },
            { key: "hall", label: t("Hall", "القاعة") },
            { key: "status", label: t("Status", "الحالة") },
            { key: "contact", label: t("Contact", "جهة الاتصال") },
            { key: "email", label: t("Email", "البريد") },
            { key: "phone", label: t("Phone", "الهاتف") },
            { key: "size", label: t("Size (sqm)", "المساحة") },
            { key: "price", label: t("Price", "السعر") },
          ]
        );
      } else if (type === "schedule") {
        const { data, error } = await supabase
          .from("exhibition_schedule_items")
          .select("title, title_ar, category, speaker_name, location, start_time, end_time, max_attendees, is_featured")
          .eq("exhibition_id", exhibitionId)
          .order("start_time");
        if (error) throw error;
        downloadCSV(
          (data || []).map((s: any) => ({
            title: isAr ? (s.title_ar || s.title) : s.title,
            category: s.category,
            speaker: s.speaker_name || "",
            location: s.location || "",
            start: format(new Date(s.start_time), "yyyy-MM-dd HH:mm"),
            end: format(new Date(s.end_time), "HH:mm"),
            max_attendees: s.max_attendees || "∞",
            featured: s.is_featured ? "Yes" : "No",
          })),
          `${exhibitionTitle}-schedule-${dateStr}`,
          [
            { key: "title", label: t("Title", "العنوان") },
            { key: "category", label: t("Category", "النوع") },
            { key: "speaker", label: t("Speaker", "المتحدث") },
            { key: "location", label: t("Location", "الموقع") },
            { key: "start", label: t("Start", "البدء") },
            { key: "end", label: t("End", "الانتهاء") },
            { key: "max_attendees", label: t("Max", "الحد الأقصى") },
            { key: "featured", label: t("Featured", "مميز") },
          ]
        );
      } else if (type === "ticket-types") {
        const { data, error } = await supabase
          .from("exhibition_ticket_types")
          .select("name, name_ar, price, currency, max_quantity, sold_count, is_active")
          .eq("exhibition_id", exhibitionId)
          .order("sort_order");
        if (error) throw error;
        downloadCSV(
          (data || []).map((tt: any) => ({
            name: isAr ? (tt.name_ar || tt.name) : tt.name,
            price: tt.price,
            currency: tt.currency,
            max: tt.max_quantity || "∞",
            sold: tt.sold_count,
            remaining: tt.max_quantity ? tt.max_quantity - tt.sold_count : "∞",
            active: tt.is_active ? "Yes" : "No",
          })),
          `${exhibitionTitle}-ticket-types-${dateStr}`,
          [
            { key: "name", label: t("Type", "النوع") },
            { key: "price", label: t("Price", "السعر") },
            { key: "currency", label: t("Currency", "العملة") },
            { key: "max", label: t("Max Qty", "الحد الأقصى") },
            { key: "sold", label: t("Sold", "المباع") },
            { key: "remaining", label: t("Remaining", "المتبقي") },
            { key: "active", label: t("Active", "فعال") },
          ]
        );
      }

      toast({ title: t("Export complete ✅", "تم التصدير ✅") });
    } catch (err) {
      toast({ title: t("Export failed", "فشل التصدير"), variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const exportOptions = [
    { value: "attendees" as ExportType, icon: Users, label: t("Attendees", "الحضور"), desc: t("Names, emails, check-in status", "الأسماء والبريد والحضور") },
    { value: "booths" as ExportType, icon: LayoutGrid, label: t("Booths", "الأجنحة"), desc: t("Booth details, contacts, status", "تفاصيل الأجنحة وجهات الاتصال") },
    { value: "schedule" as ExportType, icon: CalendarClock, label: t("Schedule", "الجدول"), desc: t("Sessions, speakers, times", "الجلسات والمتحدثين والأوقات") },
    { value: "ticket-types" as ExportType, icon: Ticket, label: t("Ticket Types", "أنواع التذاكر"), desc: t("Types, pricing, sales", "الأنواع والأسعار والمبيعات") },
  ];

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          {t("Export Data", "تصدير البيانات")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {exportOptions.map(opt => (
            <Button
              key={opt.value}
              variant="outline"
              className="h-auto py-3 px-4 justify-start gap-3 text-start"
              disabled={exporting}
              onClick={() => exportData(opt.value)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <opt.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold">{opt.label}</p>
                <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
              </div>
              <Download className="h-3.5 w-3.5 ms-auto text-muted-foreground shrink-0" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
