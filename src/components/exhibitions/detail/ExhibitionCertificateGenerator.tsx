import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Award, Loader2, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Props {
  exhibitionId: string;
  exhibitionTitle: string;
  isAr: boolean;
}

export function ExhibitionCertificateGenerator({ exhibitionId, exhibitionTitle, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [certType, setCertType] = useState<string>("participation");

  // Get templates
  const { data: templates = [] } = useQuery({
    queryKey: ["cert-templates-exhibition"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificate_templates")
        .select("id, name, name_ar, type")
        .eq("is_active", true)
        .in("type", ["participation", "appreciation", "organizer", "volunteer"]);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // Get checked-in attendees
  const { data: checkedInTickets = [] } = useQuery({
    queryKey: ["exhibition-checked-in", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_tickets")
        .select("id, user_id, attendee_name, attendee_email, checked_in_at")
        .eq("exhibition_id", exhibitionId)
        .not("checked_in_at", "is", null);
      if (error) throw error;
      return data || [];
    },
  });

  // Get already issued certificates for this exhibition
  const { data: existingCerts = [] } = useQuery({
    queryKey: ["exhibition-certs", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("id, recipient_id, type, status, certificate_number")
        .eq("event_name", exhibitionTitle)
        .not("status", "eq", "revoked");
      if (error) throw error;
      return data || [];
    },
  });

  const issuedUserIds = new Set(existingCerts.map((c: any) => c.recipient_id));
  const eligibleAttendees = checkedInTickets.filter((t: any) => t.user_id && !issuedUserIds.has(t.user_id));

  const generateCertificates = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const template = templates.find((t: any) => t.type === certType);
      if (!template) throw new Error("No template found for this type");

      const certs = eligibleAttendees.map((ticket: any) => ({
        template_id: template.id,
        type: certType as "participation" | "appreciation" | "organizer" | "volunteer",
        status: "issued" as const,
        recipient_id: ticket.user_id,
        recipient_name: ticket.attendee_name || "Attendee",
        recipient_email: ticket.attendee_email,
        event_name: exhibitionTitle,
        event_date: ticket.checked_in_at ? format(new Date(ticket.checked_in_at), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        achievement: certType === "participation" ? "Exhibition Attendance" : "Exhibition Contribution",
        achievement_ar: certType === "participation" ? "حضور المعرض" : "مساهمة في المعرض",
        issued_by: user.id,
        issued_at: new Date().toISOString(),
        verification_code: "",
      }));

      if (certs.length === 0) throw new Error("No eligible attendees");

      const { error } = await supabase.from("certificates").insert(certs as any);
      if (error) throw error;
      return certs.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-certs", exhibitionId] });
      toast({ title: t(`${count} certificates issued! 🎉`, `تم إصدار ${count} شهادة! 🎉`) });
    },
    onError: (err: any) => {
      toast({ title: t("Failed to generate", "فشل الإنشاء"), description: err.message, variant: "destructive" });
    },
  });

  return (
    <Card className="border-border/40">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-4/10">
              <Award className="h-4 w-4 text-chart-4" />
            </div>
            <div>
              <CardTitle className="text-sm">{t("Exhibition Certificates", "شهادات المعرض")}</CardTitle>
              <p className="text-[10px] text-muted-foreground">{t("Auto-generate for checked-in attendees", "إنشاء تلقائي للحضور المسجلين")}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px]">{existingCerts.length} {t("issued", "صادرة")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Stats */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[10px] gap-1">
            <CheckCircle2 className="h-2.5 w-2.5 text-chart-3" />
            {checkedInTickets.length} {t("checked in", "حضور مسجل")}
          </Badge>
          <Badge variant="outline" className="text-[10px] gap-1">
            <Award className="h-2.5 w-2.5 text-chart-4" />
            {existingCerts.length} {t("certificates issued", "شهادة صادرة")}
          </Badge>
          {eligibleAttendees.length > 0 && (
            <Badge className="bg-primary/10 text-primary text-[10px] gap-1">
              <AlertCircle className="h-2.5 w-2.5" />
              {eligibleAttendees.length} {t("eligible for new certificates", "مؤهل لشهادة جديدة")}
            </Badge>
          )}
        </div>

        {/* Certificate type selector + Generate button */}
        {eligibleAttendees.length > 0 && templates.length > 0 && (
          <div className="flex gap-2">
            <Select value={certType} onValueChange={setCertType}>
              <SelectTrigger className="h-9 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templates.map((tmpl: any) => (
                  <SelectItem key={tmpl.id} value={tmpl.type} className="text-xs">
                    {isAr && tmpl.name_ar ? tmpl.name_ar : tmpl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => generateCertificates.mutate()}
              disabled={generateCertificates.isPending}
              className="rounded-xl text-xs"
            >
              {generateCertificates.isPending ? <Loader2 className="me-2 h-3.5 w-3.5 animate-spin" /> : <Download className="me-2 h-3.5 w-3.5" />}
              {t("Generate", "إنشاء")} ({eligibleAttendees.length})
            </Button>
          </div>
        )}

        {templates.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            {t("No certificate templates available. Create templates in admin settings first.", "لا توجد قوالب شهادات. أنشئ قوالب في إعدادات الإدارة أولاً.")}
          </p>
        )}

        {eligibleAttendees.length === 0 && checkedInTickets.length > 0 && (
          <p className="text-xs text-chart-3 text-center py-2">
            <CheckCircle2 className="inline me-1 h-3 w-3" />
            {t("All checked-in attendees already have certificates!", "جميع الحضور لديهم شهادات بالفعل!")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
