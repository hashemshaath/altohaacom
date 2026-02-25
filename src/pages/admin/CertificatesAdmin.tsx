import { useState, useRef, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CertificateDesigner } from "@/components/certificates/CertificateDesigner";
import { CertificateViewPanel } from "@/components/certificates/CertificateViewPanel";
import { CandidateSelector } from "@/components/certificates/CandidateSelector";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  Award, FileText, Users, Send, Download, Search, Plus, Edit, Trash2, Eye,
  CheckCircle, XCircle, Clock, ChevronLeft, Save, X, Copy, Palette,
  LayoutTemplate, PenTool, Sparkles, Trophy, Printer, RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

type CertificateType = "participation" | "winner_gold" | "winner_silver" | "winner_bronze" | "appreciation" | "organizer" | "judge" | "sponsor" | "volunteer";
type CertificateStatus = "draft" | "pending_signature" | "signed" | "issued" | "revoked";

interface Certificate {
  id: string;
  certificate_number: string;
  verification_code: string;
  recipient_name: string;
  recipient_name_ar: string | null;
  recipient_email: string | null;
  recipient_id: string | null;
  type: CertificateType;
  status: CertificateStatus;
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

const certificateTypes: { value: CertificateType; label: string; labelAr: string; color: string }[] = [
  { value: "participation", label: "Participation", labelAr: "مشاركة", color: "bg-primary" },
  { value: "winner_gold", label: "Gold Winner", labelAr: "فائز ذهبي", color: "bg-chart-4" },
  { value: "winner_silver", label: "Silver Winner", labelAr: "فائز فضي", color: "bg-muted-foreground" },
  { value: "winner_bronze", label: "Bronze Winner", labelAr: "فائز برونزي", color: "bg-chart-2" },
  { value: "appreciation", label: "Appreciation", labelAr: "تقدير", color: "bg-chart-3" },
  { value: "organizer", label: "Organizer", labelAr: "منظم", color: "bg-chart-5" },
  { value: "judge", label: "Judge", labelAr: "حكم", color: "bg-destructive" },
  { value: "sponsor", label: "Sponsor", labelAr: "راعي", color: "bg-chart-1" },
  { value: "volunteer", label: "Volunteer", labelAr: "متطوع", color: "bg-accent-foreground" },
];

const statusColors: Record<CertificateStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_signature: "bg-chart-4/20 text-chart-4",
  signed: "bg-primary/20 text-primary",
  issued: "bg-chart-5/20 text-chart-5",
  revoked: "bg-destructive/20 text-destructive",
};

export default function CertificatesAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("certificates");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<string>("none");
  const [showDesigner, setShowDesigner] = useState(false);
  const [viewCertificate, setViewCertificate] = useState<Certificate | null>(null);

  // Manual issue form
  const [certificateForm, setCertificateForm] = useState({
    recipient_name: "", recipient_name_ar: "", recipient_email: "",
    type: "participation" as CertificateType,
    event_name: "", event_name_ar: "", event_location: "", event_location_ar: "",
    event_date: "", achievement: "", achievement_ar: "",
  });

  // ═══ Data Queries ═══
  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["certificates", searchQuery, statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase.from("certificates").select("*").order("created_at", { ascending: false });
      if (searchQuery) query = query.or(`recipient_name.ilike.%${searchQuery}%,certificate_number.ilike.%${searchQuery}%,verification_code.ilike.%${searchQuery}%`);
      if (statusFilter !== "all") query = query.eq("status", statusFilter as any);
      if (typeFilter !== "all") query = query.eq("type", typeFilter as any);
      const { data, error } = await query;
      if (error) throw error;
      return data as Certificate[];
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["certificate-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("certificate_templates").select("id, name, name_ar, type, is_active").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: competitions = [] } = useQuery({
    queryKey: ["competitions-for-certs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("id, title, title_ar, status, competition_end, venue, venue_ar").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  // ═══ Mutations ═══
  const createCertificateMutation = useMutation({
    mutationFn: async (data: typeof certificateForm) => {
      let templateId = templates.find(t => t.type === data.type)?.id || templates[0]?.id;
      if (!templateId) {
        const { data: newT, error: tErr } = await supabase.from("certificate_templates").insert({
          name: "Default Template", name_ar: "القالب الافتراضي", type: data.type,
          title_text: "Certificate", body_template: "This certifies that {{recipient_name}} has participated.",
          body_template_ar: "نشهد بأن {{recipient_name}} قد شارك.", is_active: true,
        }).select("id").single();
        if (tErr) throw tErr;
        templateId = newT.id;
      }
      const { error } = await supabase.from("certificates").insert({
        ...data, template_id: templateId,
        verification_code: crypto.randomUUID().substring(0, 8).toUpperCase(), status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast({ title: language === "ar" ? "تم إنشاء الشهادة" : "Certificate created" });
      resetForm();
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const bulkSignMutation = useMutation({
    mutationFn: async () => {
      const draftIds = certificates.filter(c => c.status === "draft").map(c => c.id);
      if (!draftIds.length) throw new Error("No draft certificates");
      const { error } = await supabase.from("certificates").update({
        status: "signed" as any, signed_at: new Date().toISOString(), signed_by: user?.id,
      }).in("id", draftIds);
      if (error) throw error;
      return draftIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast({ title: language === "ar" ? `تم اعتماد ${count} شهادة` : `Approved ${count} certificates` });
    },
  });

  const bulkIssueMutation = useMutation({
    mutationFn: async () => {
      const signedIds = certificates.filter(c => c.status === "signed").map(c => c.id);
      if (!signedIds.length) throw new Error("No signed certificates");
      const { error } = await supabase.from("certificates").update({
        status: "issued" as any, issued_at: new Date().toISOString(),
      }).in("id", signedIds);
      if (error) throw error;
      return signedIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast({ title: language === "ar" ? `تم إصدار ${count} شهادة` : `Issued ${count} certificates` });
    },
  });

  // Print all issued certificates
  const handlePrintAll = useCallback(() => {
    const issuedCerts = certificates.filter(c => c.status === "issued");
    if (!issuedCerts.length) {
      toast({ variant: "destructive", title: language === "ar" ? "لا توجد شهادات صادرة للطباعة" : "No issued certificates to print" });
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const pages = issuedCerts.map(cert => `
      <div style="page-break-after: always; padding: 40px; text-align: center; font-family: Georgia, serif;">
        <div style="border: 6px solid #c9a227; padding: 40px; min-height: 500px; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: inset 0 0 0 8px #fff, inset 0 0 0 10px #c9a22780;">
          <h1 style="font-size: 28px; color: #1a1a1a; letter-spacing: 3px; margin-bottom: 20px;">Certificate of Achievement</h1>
          <p style="font-size: 14px; color: #4a4a4a; margin-bottom: 10px;">This is to certify that</p>
          <h2 style="font-size: 32px; color: #1a1a1a; margin-bottom: 10px;">${cert.recipient_name}</h2>
          <p style="font-size: 14px; color: #4a4a4a; margin-bottom: 10px;">has successfully participated in ${cert.event_name || ""} held at ${cert.event_location || ""} on ${cert.event_date || ""}</p>
          ${cert.achievement ? `<p style="font-size: 16px; color: #1a1a1a; font-weight: 600; margin-bottom: 20px;">${cert.achievement}</p>` : ""}
          <div style="margin-top: auto; display: flex; justify-content: space-between; width: 100%; padding-top: 30px;">
            <span style="font-size: 10px; color: #9ca3af; font-family: monospace;">${cert.certificate_number}</span>
            <span style="font-size: 10px; color: #9ca3af; font-family: monospace;">Verify: ${cert.verification_code}</span>
          </div>
        </div>
      </div>
    `).join("");
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Certificates</title>
      <style>@page { size: landscape; margin: 0; } body { margin: 0; } * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }</style>
      </head><body>${pages}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  }, [certificates, language, toast]);

  // ═══ Helpers ═══
  const resetForm = () => setCertificateForm({ recipient_name: "", recipient_name_ar: "", recipient_email: "", type: "participation", event_name: "", event_name_ar: "", event_location: "", event_location_ar: "", event_date: "", achievement: "", achievement_ar: "" });
  const getTypeLabel = (type: CertificateType) => { const t = certificateTypes.find(ct => ct.value === type); return language === "ar" ? t?.labelAr : t?.label; };
  const getStatusLabel = (status: CertificateStatus) => {
    const m: Record<CertificateStatus, { en: string; ar: string }> = { draft: { en: "Draft", ar: "مسودة" }, pending_signature: { en: "Pending", ar: "بانتظار التوقيع" }, signed: { en: "Approved", ar: "معتمدة" }, issued: { en: "Issued", ar: "صادرة" }, revoked: { en: "Revoked", ar: "ملغاة" } };
    return language === "ar" ? m[status].ar : m[status].en;
  };

  const stats = {
    total: certificates.length,
    draft: certificates.filter(c => c.status === "draft").length,
    signed: certificates.filter(c => c.status === "signed").length,
    issued: certificates.filter(c => c.status === "issued").length,
    revoked: certificates.filter(c => c.status === "revoked").length,
  };

  // ═══ Designer View ═══
  if (showDesigner) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowDesigner(false)}>
            <ChevronLeft className="h-4 w-4 me-2" />{language === "ar" ? "رجوع" : "Back"}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{language === "ar" ? "مصمم الشهادات" : "Certificate Designer"}</h1>
            <p className="text-muted-foreground text-sm">{language === "ar" ? "تصميم وتخصيص قوالب الشهادات" : "Design and customize certificate templates"}</p>
          </div>
        </div>
        <CertificateDesigner
          onSave={async (design) => {
            try {
              const titleLine = design.lines[0];
              const bodyLine = design.lines.find(l => l.isVariable && l.text.includes("{{event_name}}"));
              const { error } = await supabase.from("certificate_templates").insert({
                name: titleLine?.text || "Custom Template", name_ar: null,
                type: "participation", title_text: titleLine?.text || "Certificate",
                title_text_ar: null,
                body_template: bodyLine?.text || "",
                body_template_ar: null,
                background_color: design.backgroundColor, border_color: design.borderColor,
                border_style: design.borderStyle, title_font: titleLine?.font || "serif",
                body_font: bodyLine?.font || "sans-serif",
                is_active: true,
              });
              if (error) throw error;
              queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
              toast({ title: language === "ar" ? "تم حفظ القالب" : "Template saved successfully" });
              setShowDesigner(false);
            } catch (err: any) {
              toast({ variant: "destructive", title: "Error", description: err.message });
            }
          }}
          onPrint={() => {
            const printWindow = window.open("", "_blank");
            if (!printWindow) return;
            const previewEl = document.querySelector("[data-certificate-preview]");
            if (!previewEl) return;
            printWindow.document.write(`
              <!DOCTYPE html><html><head><title>Certificate Preview</title>
              <style>@page { size: landscape; margin: 0; } body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; } * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }</style>
              </head><body>${previewEl.innerHTML}</body></html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
          }}
        />
      </div>
    );
  }

  // ═══ Main View ═══
  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Award}
        title={language === "ar" ? "مركز الشهادات" : "Certificate Center"}
        description={language === "ar" ? "إدارة وإصدار واعتماد وإرسال الشهادات" : "Manage, issue, approve, and send certificates"}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowDesigner(true)}>
              <Palette className="h-3.5 w-3.5 me-1.5" />{language === "ar" ? "مصمم" : "Designer"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => bulkSignMutation.mutate()} disabled={stats.draft === 0 || bulkSignMutation.isPending}>
              <PenTool className="h-3.5 w-3.5 me-1.5" />{language === "ar" ? `اعتماد (${stats.draft})` : `Approve (${stats.draft})`}
            </Button>
            <Button variant="outline" size="sm" onClick={() => bulkIssueMutation.mutate()} disabled={stats.signed === 0 || bulkIssueMutation.isPending}>
              <CheckCircle className="h-3.5 w-3.5 me-1.5" />{language === "ar" ? `إصدار (${stats.signed})` : `Issue (${stats.signed})`}
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: language === "ar" ? "الإجمالي" : "Total", value: stats.total, icon: FileText, color: "text-muted-foreground" },
          { label: language === "ar" ? "مسودة" : "Draft", value: stats.draft, icon: Clock, color: "text-chart-4" },
          { label: language === "ar" ? "معتمدة" : "Approved", value: stats.signed, icon: PenTool, color: "text-primary" },
          { label: language === "ar" ? "صادرة" : "Issued", value: stats.issued, icon: CheckCircle, color: "text-chart-5" },
          { label: language === "ar" ? "ملغاة" : "Revoked", value: stats.revoked, icon: XCircle, color: "text-destructive" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
                <s.icon className={`h-7 w-7 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="certificates"><Award className="h-4 w-4 me-1.5" />{language === "ar" ? "الشهادات" : "Certificates"}</TabsTrigger>
          <TabsTrigger value="auto-issue"><Sparkles className="h-4 w-4 me-1.5" />{language === "ar" ? "إصدار تلقائي" : "Auto-Issue"}</TabsTrigger>
          <TabsTrigger value="issue"><Plus className="h-4 w-4 me-1.5" />{language === "ar" ? "إصدار يدوي" : "Manual Issue"}</TabsTrigger>
          <TabsTrigger value="templates"><LayoutTemplate className="h-4 w-4 me-1.5" />{language === "ar" ? "القوالب" : "Templates"}</TabsTrigger>
        </TabsList>

        {/* ═══ Certificates List ═══ */}
        <TabsContent value="certificates" className="space-y-4">
          {/* Inline view panel (replaces dialog) */}
          {viewCertificate && (
            <CertificateViewPanel
              certificate={viewCertificate}
              onClose={() => setViewCertificate(null)}
            />
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{language === "ar" ? "جميع الشهادات" : "All Certificates"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={language === "ar" ? "بحث بالاسم أو الرقم أو كود التحقق..." : "Search by name, number, or verification code..."} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="ps-10" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder={language === "ar" ? "الحالة" : "Status"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
                    <SelectItem value="draft">{language === "ar" ? "مسودة" : "Draft"}</SelectItem>
                    <SelectItem value="signed">{language === "ar" ? "معتمدة" : "Approved"}</SelectItem>
                    <SelectItem value="issued">{language === "ar" ? "صادرة" : "Issued"}</SelectItem>
                    <SelectItem value="revoked">{language === "ar" ? "ملغاة" : "Revoked"}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder={language === "ar" ? "النوع" : "Type"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
                    {certificateTypes.map(t => <SelectItem key={t.value} value={t.value}>{language === "ar" ? t.labelAr : t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder={language === "ar" ? "الحدث" : "Event"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "ar" ? "كل الأحداث" : "All Events"}</SelectItem>
                    {[...new Set(certificates.map(c => c.event_name).filter(Boolean))].map(ev => (
                      <SelectItem key={ev!} value={ev!}>{ev}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder={language === "ar" ? "تجميع حسب" : "Group By"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{language === "ar" ? "بدون تجميع" : "No Grouping"}</SelectItem>
                    <SelectItem value="event">{language === "ar" ? "الحدث" : "Event"}</SelectItem>
                    <SelectItem value="location">{language === "ar" ? "الموقع" : "Location"}</SelectItem>
                    <SelectItem value="date">{language === "ar" ? "التاريخ" : "Date"}</SelectItem>
                    <SelectItem value="type">{language === "ar" ? "النوع" : "Type"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(() => {
                const filtered = eventFilter === "all" ? certificates : certificates.filter(c => c.event_name === eventFilter);
                const getGroupKey = (cert: Certificate): string => {
                  switch (groupBy) {
                    case "event": return cert.event_name || (language === "ar" ? "بدون حدث" : "No Event");
                    case "location": return cert.event_location || (language === "ar" ? "بدون موقع" : "No Location");
                    case "date": return cert.event_date || (language === "ar" ? "بدون تاريخ" : "No Date");
                    case "type": return getTypeLabel(cert.type) || cert.type;
                    default: return "all";
                  }
                };
                const groups: Record<string, Certificate[]> = {};
                filtered.forEach(cert => { const key = getGroupKey(cert); if (!groups[key]) groups[key] = []; groups[key].push(cert); });
                const sortedKeys = Object.keys(groups).sort();

                const renderTable = (certs: Certificate[]) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "ar" ? "رقم" : "#"}</TableHead>
                        <TableHead>{language === "ar" ? "المستلم" : "Recipient"}</TableHead>
                        <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
                        <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                        <TableHead>{language === "ar" ? "الحدث" : "Event"}</TableHead>
                        <TableHead>{language === "ar" ? "كود التحقق" : "Verify Code"}</TableHead>
                        <TableHead>{language === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certs.map(cert => (
                        <TableRow key={cert.id} className={viewCertificate?.id === cert.id ? "bg-primary/5" : ""}>
                          <TableCell className="font-mono text-xs">{cert.certificate_number?.slice(-8) || "—"}</TableCell>
                          <TableCell>
                            <p className="font-medium text-sm">{cert.recipient_name}</p>
                            {cert.recipient_email && <p className="text-xs text-muted-foreground">{cert.recipient_email}</p>}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${certificateTypes.find(t => t.value === cert.type)?.color} text-white`}>
                              {getTypeLabel(cert.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${statusColors[cert.status]}`}>{getStatusLabel(cert.status)}</Badge>
                          </TableCell>
                          <TableCell className="text-xs max-w-[120px] truncate">{cert.event_name || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{cert.verification_code}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-0.5">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewCertificate(cert)} title={language === "ar" ? "عرض" : "View"}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(cert.verification_code); toast({ title: language === "ar" ? "تم النسخ" : "Copied" }); }}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                );

                return (
                  <ScrollArea className="h-[500px]">
                    {groupBy === "none" ? (
                      <>
                        {renderTable(filtered)}
                        {filtered.length === 0 && (
                          <div className="text-center text-muted-foreground py-12">
                            {language === "ar" ? "لا توجد شهادات" : "No certificates found"}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-4">
                        {sortedKeys.map(key => (
                          <div key={key}>
                            <div className="flex items-center gap-2 mb-2 px-1">
                              <Badge variant="secondary" className="text-xs font-medium">{key}</Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {groups[key].length} {language === "ar" ? "شهادة" : "certificates"}
                              </Badge>
                            </div>
                            {renderTable(groups[key])}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Auto-Issue from Competition ═══ */}
        <TabsContent value="auto-issue" className="space-y-4">
          <CandidateSelector competitions={competitions} templates={templates} />
        </TabsContent>

        {/* ═══ Manual Issue ═══ */}
        <TabsContent value="issue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "إصدار شهادة يدوياً" : "Issue Certificate Manually"}</CardTitle>
              <CardDescription>{language === "ar" ? "أدخل بيانات المستلم لإنشاء شهادة جديدة" : "Enter recipient details to create a new certificate"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "النوع" : "Type"} *</Label>
                  <Select value={certificateForm.type} onValueChange={v => setCertificateForm({ ...certificateForm, type: v as CertificateType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {certificateTypes.map(t => <SelectItem key={t.value} value={t.value}>{language === "ar" ? t.labelAr : t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "ربط بمسابقة" : "Link to Competition"}</Label>
                  <Select onValueChange={v => {
                    const comp = competitions.find(c => c.id === v);
                    if (comp) setCertificateForm(f => ({ ...f, event_name: comp.title, event_name_ar: comp.title_ar || "", event_location: comp.venue || "", event_location_ar: comp.venue_ar || "", event_date: comp.competition_end?.split("T")[0] || "" }));
                  }}>
                    <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختياري" : "Optional"} /></SelectTrigger>
                    <SelectContent>
                      {competitions.map(c => <SelectItem key={c.id} value={c.id}>{language === "ar" && c.title_ar ? c.title_ar : c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "اسم المستلم (EN)" : "Recipient Name (EN)"} *</Label>
                  <Input value={certificateForm.recipient_name} onChange={e => setCertificateForm({ ...certificateForm, recipient_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "اسم المستلم (AR)" : "Recipient Name (AR)"}</Label>
                  <Input value={certificateForm.recipient_name_ar} onChange={e => setCertificateForm({ ...certificateForm, recipient_name_ar: e.target.value })} dir="rtl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
                <Input type="email" value={certificateForm.recipient_email} onChange={e => setCertificateForm({ ...certificateForm, recipient_email: e.target.value })} />
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "اسم الحدث (EN)" : "Event Name (EN)"}</Label>
                  <Input value={certificateForm.event_name} onChange={e => setCertificateForm({ ...certificateForm, event_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "اسم الحدث (AR)" : "Event Name (AR)"}</Label>
                  <Input value={certificateForm.event_name_ar} onChange={e => setCertificateForm({ ...certificateForm, event_name_ar: e.target.value })} dir="rtl" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "الموقع" : "Location"}</Label>
                  <Input value={certificateForm.event_location} onChange={e => setCertificateForm({ ...certificateForm, event_location: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "الموقع (AR)" : "Location (AR)"}</Label>
                  <Input value={certificateForm.event_location_ar} onChange={e => setCertificateForm({ ...certificateForm, event_location_ar: e.target.value })} dir="rtl" />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "التاريخ" : "Date"}</Label>
                  <Input type="date" value={certificateForm.event_date} onChange={e => setCertificateForm({ ...certificateForm, event_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "الإنجاز (EN)" : "Achievement (EN)"}</Label>
                  <Input value={certificateForm.achievement} onChange={e => setCertificateForm({ ...certificateForm, achievement: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "الإنجاز (AR)" : "Achievement (AR)"}</Label>
                  <Input value={certificateForm.achievement_ar} onChange={e => setCertificateForm({ ...certificateForm, achievement_ar: e.target.value })} dir="rtl" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => createCertificateMutation.mutate(certificateForm)} disabled={!certificateForm.recipient_name || createCertificateMutation.isPending}>
                  <Save className="h-4 w-4 me-2" />{language === "ar" ? "إنشاء" : "Create"}
                </Button>
                <Button variant="outline" onClick={resetForm}><X className="h-4 w-4 me-2" />{language === "ar" ? "مسح" : "Clear"}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Templates ═══ */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{language === "ar" ? "قوالب الشهادات" : "Certificate Templates"}</CardTitle>
                  <CardDescription>{language === "ar" ? "إدارة وتخصيص قوالب الشهادات" : "Manage and customize certificate templates"}</CardDescription>
                </div>
                <Button onClick={() => setShowDesigner(true)}>
                  <Plus className="h-4 w-4 me-2" />{language === "ar" ? "قالب جديد" : "New Template"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.length > 0 ? templates.map(t => (
                  <Card key={t.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowDesigner(true)}>
                    <div className="h-28 flex items-center justify-center bg-muted/30"><Award className="h-10 w-10 text-primary" /></div>
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-sm">{language === "ar" && t.name_ar ? t.name_ar : t.name}</h3>
                          <Badge variant="outline" className="mt-1 text-[10px]">{getTypeLabel(t.type as CertificateType)}</Badge>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <LayoutTemplate className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === "ar" ? "لا توجد قوالب" : "No templates yet"}</p>
                    <Button variant="link" onClick={() => setShowDesigner(true)}>{language === "ar" ? "إنشاء أول قالب" : "Create first template"}</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
