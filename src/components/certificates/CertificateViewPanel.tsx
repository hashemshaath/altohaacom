import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CertificatePreview } from "./CertificatePreview";
import { defaultDesign } from "./types";
import {
  PenTool, CheckCircle, Send, Download, Printer, Copy,
  XCircle, X, Award,
} from "lucide-react";
import { format } from "date-fns";
import { useRef, useCallback } from "react";

interface Certificate {
  id: string;
  certificate_number: string;
  verification_code: string;
  recipient_name: string;
  recipient_name_ar: string | null;
  recipient_email: string | null;
  recipient_id: string | null;
  type: string;
  status: string;
  event_name: string | null;
  event_name_ar: string | null;
  event_date: string | null;
  event_location: string | null;
  event_location_ar: string | null;
  achievement: string | null;
  achievement_ar: string | null;
  issued_at: string | null;
  signed_at: string | null;
  signed_by: string | null;
  sent_at: string | null;
  created_at: string;
  competition_id: string | null;
}

interface CertificateViewPanelProps {
  certificate: Certificate;
  onClose: () => void;
}

const typeLabels: Record<string, { en: string; ar: string }> = {
  participation: { en: "Participation", ar: "مشاركة" },
  winner_gold: { en: "Gold Winner", ar: "فائز ذهبي" },
  winner_silver: { en: "Silver Winner", ar: "فائز فضي" },
  winner_bronze: { en: "Bronze Winner", ar: "فائز برونزي" },
  appreciation: { en: "Appreciation", ar: "تقدير" },
  organizer: { en: "Organizer", ar: "منظم" },
  judge: { en: "Judge", ar: "حكم" },
  sponsor: { en: "Sponsor", ar: "راعي" },
  volunteer: { en: "Volunteer", ar: "متطوع" },
};

const statusLabels: Record<string, { en: string; ar: string }> = {
  draft: { en: "Draft", ar: "مسودة" },
  pending_signature: { en: "Pending Signature", ar: "بانتظار التوقيع" },
  signed: { en: "Signed", ar: "موقعة" },
  issued: { en: "Issued", ar: "صادرة" },
  revoked: { en: "Revoked", ar: "ملغاة" },
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_signature: "bg-chart-4/20 text-chart-4",
  signed: "bg-primary/20 text-primary",
  issued: "bg-chart-5/20 text-chart-5",
  revoked: "bg-destructive/20 text-destructive",
};

export function CertificateViewPanel({ certificate: cert, onClose }: CertificateViewPanelProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  const signMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("certificates").update({
        status: "signed" as any, signed_at: new Date().toISOString(), signed_by: user?.id,
      }).eq("id", cert.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast({ title: language === "ar" ? "تم التوقيع على الشهادة" : "Certificate signed" });
    },
  });

  const issueMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("certificates").update({
        status: "issued" as any, issued_at: new Date().toISOString(),
      }).eq("id", cert.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast({ title: language === "ar" ? "تم إصدار الشهادة" : "Certificate issued" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("certificates").update({
        sent_at: new Date().toISOString(), sent_to_email: cert.recipient_email,
      }).eq("id", cert.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast({ title: language === "ar" ? "تم إرسال الشهادة" : "Certificate sent to recipient's account" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("certificates").update({
        status: "revoked" as any, revoked_at: new Date().toISOString(), revoked_by: user?.id,
      }).eq("id", cert.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast({ title: language === "ar" ? "تم إلغاء الشهادة" : "Certificate revoked" });
    },
  });

  const handlePrint = useCallback(() => {
    const printEl = printRef.current;
    if (!printEl) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Certificate - ${cert.certificate_number}</title>
      <style>
        @page { size: landscape; margin: 0; }
        body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      </style></head>
      <body>${printEl.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  }, [cert.certificate_number]);

  const getLabel = (map: Record<string, { en: string; ar: string }>, key: string) => {
    const item = map[key];
    return item ? (language === "ar" ? item.ar : item.en) : key;
  };

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            {language === "ar" ? "تفاصيل الشهادة" : "Certificate Details"}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">{language === "ar" ? "رقم الشهادة" : "Certificate #"}</p>
            <p className="font-mono font-medium text-xs">{cert.certificate_number}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{language === "ar" ? "كود التحقق" : "Verification Code"}</p>
            <p className="font-mono font-medium text-xs">{cert.verification_code}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{language === "ar" ? "المستلم" : "Recipient"}</p>
            <p className="font-medium">{cert.recipient_name}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{language === "ar" ? "الحالة" : "Status"}</p>
            <Badge className={`${statusColors[cert.status] || ""}`}>{getLabel(statusLabels, cert.status)}</Badge>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{language === "ar" ? "النوع" : "Type"}</p>
            <Badge variant="secondary">{getLabel(typeLabels, cert.type)}</Badge>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{language === "ar" ? "الحدث" : "Event"}</p>
            <p className="text-sm">{cert.event_name || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{language === "ar" ? "الموقع" : "Location"}</p>
            <p className="text-sm">{cert.event_location || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{language === "ar" ? "التاريخ" : "Date"}</p>
            <p className="text-sm">{cert.event_date || "—"}</p>
          </div>
          {cert.achievement && (
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs">{language === "ar" ? "الإنجاز" : "Achievement"}</p>
              <p className="font-medium">{cert.achievement}</p>
            </div>
          )}
          {cert.signed_at && (
            <div>
              <p className="text-muted-foreground text-xs">{language === "ar" ? "تاريخ التوقيع" : "Signed"}</p>
              <p className="text-sm">{format(new Date(cert.signed_at), "yyyy-MM-dd HH:mm")}</p>
            </div>
          )}
          {cert.issued_at && (
            <div>
              <p className="text-muted-foreground text-xs">{language === "ar" ? "تاريخ الإصدار" : "Issued"}</p>
              <p className="text-sm">{format(new Date(cert.issued_at), "yyyy-MM-dd HH:mm")}</p>
            </div>
          )}
          {cert.sent_at && (
            <div>
              <p className="text-muted-foreground text-xs">{language === "ar" ? "تاريخ الإرسال" : "Sent"}</p>
              <p className="text-sm">{format(new Date(cert.sent_at), "yyyy-MM-dd HH:mm")}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Certificate Preview */}
        <div>
          <p className="text-sm font-medium mb-3">{language === "ar" ? "معاينة الشهادة" : "Certificate Preview"}</p>
          <div ref={printRef} className="overflow-auto bg-muted/30 rounded-xl p-4 flex items-center justify-center">
            <CertificatePreview
              design={defaultDesign}
              zoom={45}
              previewData={{
                recipientName: cert.recipient_name,
                eventName: cert.event_name || "",
                eventLocation: cert.event_location || "",
                eventDate: cert.event_date || "",
                achievement: cert.achievement || "",
                certificateNumber: cert.certificate_number,
                verificationCode: cert.verification_code,
              }}
            />
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {cert.status === "draft" && (
            <Button size="sm" onClick={() => signMutation.mutate()} disabled={signMutation.isPending}>
              <PenTool className="h-3.5 w-3.5 me-1.5" />
              {language === "ar" ? "توقيع واعتماد (رئيس المسابقة)" : "Sign & Approve (Competition Manager)"}
            </Button>
          )}
          {cert.status === "signed" && (
            <Button size="sm" onClick={() => issueMutation.mutate()} disabled={issueMutation.isPending}>
              <CheckCircle className="h-3.5 w-3.5 me-1.5" />
              {language === "ar" ? "إصدار" : "Issue"}
            </Button>
          )}
          {cert.status === "issued" && (
            <>
              <Button size="sm" variant="outline" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending || !cert.recipient_email}>
                <Send className="h-3.5 w-3.5 me-1.5" />
                {language === "ar" ? "إرسال للمستلم" : "Send to Recipient"}
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5 me-1.5" />
                {language === "ar" ? "طباعة" : "Print"}
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={() => {
            navigator.clipboard.writeText(cert.verification_code);
            toast({ title: language === "ar" ? "تم النسخ" : "Verification code copied" });
          }}>
            <Copy className="h-3.5 w-3.5 me-1.5" />
            {language === "ar" ? "نسخ الكود" : "Copy Code"}
          </Button>
          {cert.status !== "revoked" && (
            <Button size="sm" variant="destructive" onClick={() => revokeMutation.mutate()} disabled={revokeMutation.isPending}>
              <XCircle className="h-3.5 w-3.5 me-1.5" />
              {language === "ar" ? "إلغاء" : "Revoke"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
