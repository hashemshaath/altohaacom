import { useState } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CertificateDesigner } from "@/components/certificates/CertificateDesigner";
import {
  Award, FileText, Users, Send, Download, Search, Plus, Edit, Trash2, Eye,
  CheckCircle, XCircle, Clock, ChevronLeft, Save, X, Copy, Palette,
  LayoutTemplate, PenTool, Sparkles, Trophy, Mail, Printer, RefreshCw,
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
  { value: "participation", label: "Participation", labelAr: "مشاركة", color: "bg-blue-500" },
  { value: "winner_gold", label: "Gold Winner", labelAr: "فائز ذهبي", color: "bg-yellow-500" },
  { value: "winner_silver", label: "Silver Winner", labelAr: "فائز فضي", color: "bg-gray-400" },
  { value: "winner_bronze", label: "Bronze Winner", labelAr: "فائز برونزي", color: "bg-orange-600" },
  { value: "appreciation", label: "Appreciation", labelAr: "تقدير", color: "bg-purple-500" },
  { value: "organizer", label: "Organizer", labelAr: "منظم", color: "bg-emerald-500" },
  { value: "judge", label: "Judge", labelAr: "حكم", color: "bg-red-500" },
  { value: "sponsor", label: "Sponsor", labelAr: "راعي", color: "bg-indigo-500" },
  { value: "volunteer", label: "Volunteer", labelAr: "متطوع", color: "bg-pink-500" },
];

const statusColors: Record<CertificateStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_signature: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  signed: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  issued: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  revoked: "bg-red-500/20 text-red-700 dark:text-red-400",
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

  const [showDesigner, setShowDesigner] = useState(false);
  const [showCertificateForm, setShowCertificateForm] = useState(false);
  const [viewCertificate, setViewCertificate] = useState<Certificate | null>(null);
  const [signDialog, setSignDialog] = useState<Certificate | null>(null);
  const [sendDialog, setSendDialog] = useState<Certificate | null>(null);

  // Auto-issue from competition
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>("");

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
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["certificate-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("certificate_templates").select("id, name, name_ar, type, is_active").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: competitions = [] } = useQuery({
    queryKey: ["competitions-for-certs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("id, title, title_ar, status, competition_end, venue, venue_ar").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Get competition results for auto-issue
  const { data: competitionResults = [] } = useQuery({
    queryKey: ["competition-results-for-auto", selectedCompetitionId],
    queryFn: async () => {
      if (!selectedCompetitionId) return [];
      const { data: registrations } = await supabase
        .from("competition_registrations")
        .select("id, participant_id, dish_name")
        .eq("competition_id", selectedCompetitionId)
        .eq("status", "approved");
      if (!registrations?.length) return [];

      const { data: criteria } = await supabase.from("judging_criteria").select("id, weight, max_score").eq("competition_id", selectedCompetitionId);
      const regIds = registrations.map(r => r.id);
      const { data: scores } = await supabase.from("competition_scores").select("registration_id, criteria_id, score").in("registration_id", regIds);
      const partIds = registrations.map(r => r.participant_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, username").in("user_id", partIds);

      return registrations.map(reg => {
        const regScores = scores?.filter(s => s.registration_id === reg.id) || [];
        const profile = profiles?.find(p => p.user_id === reg.participant_id);
        let totalScore = 0, totalWeight = 0;
        criteria?.forEach(crit => {
          const cs = regScores.filter(s => s.criteria_id === crit.id);
          if (cs.length) {
            const avg = cs.reduce((sum, s) => sum + Number(s.score), 0) / cs.length;
            totalScore += (avg / crit.max_score) * 100 * Number(crit.weight);
            totalWeight += Number(crit.weight);
          }
        });
        return {
          registrationId: reg.id,
          participantId: reg.participant_id,
          dishName: reg.dish_name,
          name: profile?.full_name || profile?.username || "Unknown",
          email: "",
          score: totalWeight > 0 ? totalScore / totalWeight : 0,
          rank: 0,
        };
      }).sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, rank: i + 1 }));
    },
    enabled: !!selectedCompetitionId,
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
        ...data, template_id: templateId, certificate_number: `CERT-${Date.now()}`,
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

  const signCertificateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("certificates").update({
        status: "signed" as any, signed_at: new Date().toISOString(), signed_by: user?.id,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      setSignDialog(null);
      toast({ title: language === "ar" ? "تم التوقيع على الشهادة" : "Certificate signed" });
    },
  });

  const issueCertificateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("certificates").update({
        status: "issued" as any, issued_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast({ title: language === "ar" ? "تم إصدار الشهادة" : "Certificate issued" });
    },
  });

  const sendCertificateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("certificates").update({
        sent_at: new Date().toISOString(), sent_to_email: sendDialog?.recipient_email,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      setSendDialog(null);
      toast({ title: language === "ar" ? "تم إرسال الشهادة" : "Certificate sent" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("certificates").update({
        status: "revoked" as any, revoked_at: new Date().toISOString(), revoked_by: user?.id,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast({ title: language === "ar" ? "تم إلغاء الشهادة" : "Certificate revoked" });
    },
  });

  const autoIssueMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCompetitionId || !competitionResults.length) throw new Error("No competition or results");
      const competition = competitions.find(c => c.id === selectedCompetitionId);
      if (!competition) throw new Error("Competition not found");

      let templateId = templates.find(t => t.type === "participation")?.id;
      if (!templateId) {
        const { data: newT, error } = await supabase.from("certificate_templates").insert({
          name: "Auto Template", name_ar: "قالب تلقائي", type: "participation",
          title_text: "Certificate", body_template: "Participated in {{event_name}}.",
          body_template_ar: "شارك في {{event_name}}.", is_active: true,
        }).select("id").single();
        if (error) throw error;
        templateId = newT.id;
      }

      const { data: existing } = await supabase.from("certificates").select("recipient_id, type").eq("competition_id", selectedCompetitionId);
      const existingSet = new Set(existing?.map(c => `${c.recipient_id}-${c.type}`) || []);

      const certs: any[] = [];
      for (const r of competitionResults) {
        const isWinner = r.rank <= 3;
        const winType = r.rank === 1 ? "winner_gold" : r.rank === 2 ? "winner_silver" : "winner_bronze";
        const rankLabel = r.rank === 1 ? "Gold" : r.rank === 2 ? "Silver" : "Bronze";
        const rankLabelAr = r.rank === 1 ? "ذهبي" : r.rank === 2 ? "فضي" : "برونزي";

        // Winner cert
        if (isWinner && !existingSet.has(`${r.participantId}-${winType}`)) {
          certs.push({
            template_id: templateId, type: winType, competition_id: selectedCompetitionId,
            recipient_id: r.participantId, recipient_name: r.name, recipient_email: r.email,
            achievement: `${rankLabel} Winner - ${competition.title}`,
            achievement_ar: `فائز ${rankLabelAr} - ${competition.title_ar || competition.title}`,
            event_name: competition.title, event_name_ar: competition.title_ar,
            event_date: competition.competition_end?.split("T")[0],
            event_location: competition.venue, event_location_ar: competition.venue_ar,
            certificate_number: `CERT-${Date.now()}-${r.rank}`,
            verification_code: crypto.randomUUID().substring(0, 8).toUpperCase(),
            status: "draft", issued_by: user?.id,
          });
        }
        // Participation cert
        if (!existingSet.has(`${r.participantId}-participation`)) {
          certs.push({
            template_id: templateId, type: "participation", competition_id: selectedCompetitionId,
            recipient_id: r.participantId, recipient_name: r.name, recipient_email: r.email,
            achievement: `Participant - ${competition.title}`,
            achievement_ar: `مشارك - ${competition.title_ar || competition.title}`,
            event_name: competition.title, event_name_ar: competition.title_ar,
            event_date: competition.competition_end?.split("T")[0],
            event_location: competition.venue, event_location_ar: competition.venue_ar,
            certificate_number: `CERT-${Date.now()}-P${r.rank}`,
            verification_code: crypto.randomUUID().substring(0, 8).toUpperCase(),
            status: "draft", issued_by: user?.id,
          });
        }
      }

      if (certs.length > 0) {
        const { error } = await supabase.from("certificates").insert(certs);
        if (error) throw error;
      }
      return certs.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast({
        title: language === "ar" ? "تم الإنشاء التلقائي" : "Auto-Generated",
        description: language === "ar" ? `تم إنشاء ${count} شهادة` : `Created ${count} certificates`,
      });
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
      toast({ title: language === "ar" ? `تم توقيع ${count} شهادة` : `Signed ${count} certificates` });
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

  // ═══ Helpers ═══
  const resetForm = () => setCertificateForm({ recipient_name: "", recipient_name_ar: "", recipient_email: "", type: "participation", event_name: "", event_name_ar: "", event_location: "", event_location_ar: "", event_date: "", achievement: "", achievement_ar: "" });
  const getTypeLabel = (type: CertificateType) => { const t = certificateTypes.find(ct => ct.value === type); return language === "ar" ? t?.labelAr : t?.label; };
  const getStatusLabel = (status: CertificateStatus) => {
    const m: Record<CertificateStatus, { en: string; ar: string }> = { draft: { en: "Draft", ar: "مسودة" }, pending_signature: { en: "Pending Signature", ar: "بانتظار التوقيع" }, signed: { en: "Signed", ar: "موقعة" }, issued: { en: "Issued", ar: "صادرة" }, revoked: { en: "Revoked", ar: "ملغاة" } };
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
            <ChevronLeft className="h-4 w-4 mr-2" />{language === "ar" ? "رجوع" : "Back"}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{language === "ar" ? "مصمم الشهادات" : "Certificate Designer"}</h1>
            <p className="text-muted-foreground text-sm">{language === "ar" ? "تصميم وتخصيص قوالب الشهادات بشكل احترافي" : "Professionally design and customize certificate templates"}</p>
          </div>
        </div>
        <CertificateDesigner
          onSave={async (design) => {
            try {
              const { error } = await supabase.from("certificate_templates").insert({
                name: design.titleText || "Custom Template", name_ar: design.titleTextAr || null,
                type: "participation", title_text: design.titleText, title_text_ar: design.titleTextAr,
                body_template: design.bodyTemplate, body_template_ar: design.bodyTemplateAr,
                background_color: design.backgroundColor, border_color: design.borderColor,
                border_style: design.borderStyle, title_font: design.titleFont, body_font: design.bodyFont,
                is_active: true,
              });
              if (error) throw error;
              queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
              toast({ title: language === "ar" ? "تم حفظ القالب" : "Template saved" });
              setShowDesigner(false);
            } catch (err: any) {
              toast({ variant: "destructive", title: "Error", description: err.message });
            }
          }}
        />
      </div>
    );
  }

  // ═══ Main View ═══
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" />
            {language === "ar" ? "مركز الشهادات" : "Certificate Center"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "ar" ? "إدارة وإصدار وتوقيع وإرسال الشهادات" : "Manage, issue, sign, and send certificates"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowDesigner(true)}>
            <Palette className="h-4 w-4 mr-2" />{language === "ar" ? "مصمم الشهادات" : "Designer"}
          </Button>
          <Button variant="outline" onClick={() => bulkSignMutation.mutate()} disabled={stats.draft === 0 || bulkSignMutation.isPending}>
            <PenTool className="h-4 w-4 mr-2" />{language === "ar" ? `توقيع الكل (${stats.draft})` : `Sign All (${stats.draft})`}
          </Button>
          <Button variant="outline" onClick={() => bulkIssueMutation.mutate()} disabled={stats.signed === 0 || bulkIssueMutation.isPending}>
            <CheckCircle className="h-4 w-4 mr-2" />{language === "ar" ? `إصدار الكل (${stats.signed})` : `Issue All (${stats.signed})`}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: language === "ar" ? "الإجمالي" : "Total", value: stats.total, icon: FileText, color: "text-muted-foreground" },
          { label: language === "ar" ? "مسودة" : "Draft", value: stats.draft, icon: Clock, color: "text-yellow-600" },
          { label: language === "ar" ? "موقعة" : "Signed", value: stats.signed, icon: PenTool, color: "text-blue-600" },
          { label: language === "ar" ? "صادرة" : "Issued", value: stats.issued, icon: CheckCircle, color: "text-emerald-600" },
          { label: language === "ar" ? "ملغاة" : "Revoked", value: stats.revoked, icon: XCircle, color: "text-red-600" },
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
          <TabsTrigger value="certificates"><Award className="h-4 w-4 mr-1.5" />{language === "ar" ? "الشهادات" : "Certificates"}</TabsTrigger>
          <TabsTrigger value="auto-issue"><Sparkles className="h-4 w-4 mr-1.5" />{language === "ar" ? "إصدار تلقائي" : "Auto-Issue"}</TabsTrigger>
          <TabsTrigger value="issue"><Plus className="h-4 w-4 mr-1.5" />{language === "ar" ? "إصدار يدوي" : "Manual Issue"}</TabsTrigger>
          <TabsTrigger value="templates"><LayoutTemplate className="h-4 w-4 mr-1.5" />{language === "ar" ? "القوالب" : "Templates"}</TabsTrigger>
        </TabsList>

        {/* ═══ Certificates List ═══ */}
        <TabsContent value="certificates" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{language === "ar" ? "جميع الشهادات" : "All Certificates"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={language === "ar" ? "بحث..." : "Search..."} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="ps-10" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder={language === "ar" ? "الحالة" : "Status"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
                    <SelectItem value="draft">{language === "ar" ? "مسودة" : "Draft"}</SelectItem>
                    <SelectItem value="signed">{language === "ar" ? "موقعة" : "Signed"}</SelectItem>
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
              </div>

              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "ar" ? "رقم" : "#"}</TableHead>
                      <TableHead>{language === "ar" ? "المستلم" : "Recipient"}</TableHead>
                      <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
                      <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{language === "ar" ? "الحدث" : "Event"}</TableHead>
                      <TableHead>{language === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.map(cert => (
                      <TableRow key={cert.id}>
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
                        <TableCell>
                          <div className="flex items-center gap-0.5">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewCertificate(cert)} title={language === "ar" ? "عرض" : "View"}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {cert.status === "draft" && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSignDialog(cert)} title={language === "ar" ? "توقيع" : "Sign"}>
                                <PenTool className="h-3.5 w-3.5 text-blue-600" />
                              </Button>
                            )}
                            {cert.status === "signed" && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => issueCertificateMutation.mutate(cert.id)} title={language === "ar" ? "إصدار" : "Issue"}>
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                              </Button>
                            )}
                            {cert.status === "issued" && (
                              <>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSendDialog(cert)} title={language === "ar" ? "إرسال" : "Send"}>
                                  <Send className="h-3.5 w-3.5 text-primary" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title={language === "ar" ? "تحميل" : "Download"}>
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(cert.verification_code); toast({ title: language === "ar" ? "تم النسخ" : "Copied" }); }}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            {cert.status !== "revoked" && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => revokeMutation.mutate(cert.id)}>
                                <XCircle className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {certificates.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                          {language === "ar" ? "لا توجد شهادات" : "No certificates found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Auto-Issue from Competition ═══ */}
        <TabsContent value="auto-issue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {language === "ar" ? "إصدار تلقائي من المسابقة" : "Auto-Issue from Competition"}
              </CardTitle>
              <CardDescription>
                {language === "ar"
                  ? "اختر مسابقة لإنشاء شهادات تلقائياً لجميع الفائزين والمشاركين بعد اعتماد النتائج من رئيس المسابقة"
                  : "Select a competition to auto-generate certificates for all winners and participants after results approval"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{language === "ar" ? "اختر المسابقة" : "Select Competition"}</Label>
                <Select value={selectedCompetitionId} onValueChange={setSelectedCompetitionId}>
                  <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر مسابقة..." : "Choose competition..."} /></SelectTrigger>
                  <SelectContent>
                    {competitions.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <Trophy className="h-3.5 w-3.5" />
                          {language === "ar" && c.title_ar ? c.title_ar : c.title}
                          <Badge variant="outline" className="text-[10px] ms-1">{c.status}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCompetitionId && competitionResults.length > 0 && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border p-3 text-center">
                      <Trophy className="mx-auto mb-1 h-5 w-5 text-yellow-500" />
                      <p className="text-lg font-bold">{competitionResults.filter(r => r.rank <= 3).length}</p>
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "فائزين" : "Winners"}</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                      <Users className="mx-auto mb-1 h-5 w-5 text-primary" />
                      <p className="text-lg font-bold">{competitionResults.length}</p>
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "مشاركين" : "Participants"}</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                      <FileText className="mx-auto mb-1 h-5 w-5 text-emerald-500" />
                      <p className="text-lg font-bold">{competitionResults.length + competitionResults.filter(r => r.rank <= 3).length}</p>
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "شهادات ستُنشأ" : "Certs to Create"}</p>
                    </div>
                  </div>

                  <ScrollArea className="h-[300px] border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{language === "ar" ? "الترتيب" : "Rank"}</TableHead>
                          <TableHead>{language === "ar" ? "الاسم" : "Name"}</TableHead>
                          <TableHead>{language === "ar" ? "الدرجة" : "Score"}</TableHead>
                          <TableHead>{language === "ar" ? "الشهادات" : "Certificates"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {competitionResults.map(r => (
                          <TableRow key={r.registrationId}>
                            <TableCell>
                              {r.rank <= 3 ? (
                                <Badge className={r.rank === 1 ? "bg-yellow-500 text-white" : r.rank === 2 ? "bg-gray-400 text-white" : "bg-orange-600 text-white"}>
                                  #{r.rank}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">#{r.rank}</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{r.name}</TableCell>
                            <TableCell>{r.score.toFixed(1)}%</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Badge variant="outline" className="text-[10px]">{language === "ar" ? "مشاركة" : "Participation"}</Badge>
                                {r.rank <= 3 && (
                                  <Badge className={`text-[10px] ${r.rank === 1 ? "bg-yellow-500" : r.rank === 2 ? "bg-gray-400" : "bg-orange-600"} text-white`}>
                                    {r.rank === 1 ? (language === "ar" ? "ذهبي" : "Gold") : r.rank === 2 ? (language === "ar" ? "فضي" : "Silver") : (language === "ar" ? "برونزي" : "Bronze")}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>

                  <Button className="w-full" onClick={() => autoIssueMutation.mutate()} disabled={autoIssueMutation.isPending}>
                    {autoIssueMutation.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    {language === "ar" ? "إنشاء الشهادات تلقائياً (تحتاج اعتماد الرئيس)" : "Generate Certificates (Requires President Approval)"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {language === "ar"
                      ? "سيتم إنشاء الشهادات كمسودة. يجب توقيعها واعتمادها من رئيس المسابقة قبل الإصدار."
                      : "Certificates will be created as drafts. They must be signed and approved by the competition president before issuance."}
                  </p>
                </>
              )}

              {selectedCompetitionId && competitionResults.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{language === "ar" ? "لا توجد نتائج لهذه المسابقة" : "No results found for this competition"}</p>
                </div>
              )}
            </CardContent>
          </Card>
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
                  <Save className="h-4 w-4 mr-2" />{language === "ar" ? "إنشاء" : "Create"}
                </Button>
                <Button variant="outline" onClick={resetForm}><X className="h-4 w-4 mr-2" />{language === "ar" ? "مسح" : "Clear"}</Button>
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
                  <Plus className="h-4 w-4 mr-2" />{language === "ar" ? "قالب جديد" : "New Template"}
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

      {/* ═══ View Certificate Dialog ═══ */}
      <Dialog open={!!viewCertificate} onOpenChange={() => setViewCertificate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "تفاصيل الشهادة" : "Certificate Details"}</DialogTitle>
          </DialogHeader>
          {viewCertificate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground text-xs">{language === "ar" ? "رقم الشهادة" : "Certificate #"}</p><p className="font-mono font-medium">{viewCertificate.certificate_number}</p></div>
                <div><p className="text-muted-foreground text-xs">{language === "ar" ? "كود التحقق" : "Verification Code"}</p><p className="font-mono font-medium">{viewCertificate.verification_code}</p></div>
                <div><p className="text-muted-foreground text-xs">{language === "ar" ? "المستلم" : "Recipient"}</p><p className="font-medium">{viewCertificate.recipient_name}</p></div>
                <div><p className="text-muted-foreground text-xs">{language === "ar" ? "النوع" : "Type"}</p><Badge className={`${certificateTypes.find(t => t.value === viewCertificate.type)?.color} text-white`}>{getTypeLabel(viewCertificate.type)}</Badge></div>
                <div><p className="text-muted-foreground text-xs">{language === "ar" ? "الحالة" : "Status"}</p><Badge className={statusColors[viewCertificate.status]}>{getStatusLabel(viewCertificate.status)}</Badge></div>
                <div><p className="text-muted-foreground text-xs">{language === "ar" ? "الحدث" : "Event"}</p><p>{viewCertificate.event_name || "—"}</p></div>
                {viewCertificate.achievement && <div className="col-span-2"><p className="text-muted-foreground text-xs">{language === "ar" ? "الإنجاز" : "Achievement"}</p><p className="font-medium">{viewCertificate.achievement}</p></div>}
                {viewCertificate.signed_at && <div><p className="text-muted-foreground text-xs">{language === "ar" ? "تاريخ التوقيع" : "Signed"}</p><p>{format(new Date(viewCertificate.signed_at), "yyyy-MM-dd HH:mm")}</p></div>}
                {viewCertificate.issued_at && <div><p className="text-muted-foreground text-xs">{language === "ar" ? "تاريخ الإصدار" : "Issued"}</p><p>{format(new Date(viewCertificate.issued_at), "yyyy-MM-dd HH:mm")}</p></div>}
                {viewCertificate.sent_at && <div><p className="text-muted-foreground text-xs">{language === "ar" ? "تاريخ الإرسال" : "Sent"}</p><p>{format(new Date(viewCertificate.sent_at), "yyyy-MM-dd HH:mm")}</p></div>}
              </div>
              <Separator />
              <div className="flex gap-2 flex-wrap">
                {viewCertificate.status === "draft" && (
                  <Button size="sm" onClick={() => { setSignDialog(viewCertificate); setViewCertificate(null); }}>
                    <PenTool className="h-3.5 w-3.5 mr-1.5" />{language === "ar" ? "توقيع" : "Sign"}
                  </Button>
                )}
                {viewCertificate.status === "signed" && (
                  <Button size="sm" onClick={() => { issueCertificateMutation.mutate(viewCertificate.id); setViewCertificate(null); }}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />{language === "ar" ? "إصدار" : "Issue"}
                  </Button>
                )}
                {viewCertificate.status === "issued" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => { setSendDialog(viewCertificate); setViewCertificate(null); }}>
                      <Send className="h-3.5 w-3.5 mr-1.5" />{language === "ar" ? "إرسال" : "Send"}
                    </Button>
                    <Button size="sm" variant="outline"><Download className="h-3.5 w-3.5 mr-1.5" />{language === "ar" ? "تحميل" : "Download"}</Button>
                    <Button size="sm" variant="outline"><Printer className="h-3.5 w-3.5 mr-1.5" />{language === "ar" ? "طباعة" : "Print"}</Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Sign Dialog ═══ */}
      <Dialog open={!!signDialog} onOpenChange={() => setSignDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><PenTool className="h-5 w-5" />{language === "ar" ? "توقيع الشهادة" : "Sign Certificate"}</DialogTitle>
            <DialogDescription>
              {language === "ar"
                ? "بالتوقيع على هذه الشهادة، تؤكد اعتمادها رسمياً"
                : "By signing, you officially approve this certificate"}
            </DialogDescription>
          </DialogHeader>
          {signDialog && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/30">
                <p className="font-medium">{signDialog.recipient_name}</p>
                <p className="text-sm text-muted-foreground">{signDialog.event_name}</p>
                <Badge className={`mt-2 ${certificateTypes.find(t => t.value === signDialog.type)?.color} text-white`}>{getTypeLabel(signDialog.type)}</Badge>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSignDialog(null)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
                <Button onClick={() => signCertificateMutation.mutate(signDialog.id)} disabled={signCertificateMutation.isPending}>
                  <PenTool className="h-4 w-4 mr-2" />{language === "ar" ? "توقيع واعتماد" : "Sign & Approve"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Send Dialog ═══ */}
      <Dialog open={!!sendDialog} onOpenChange={() => setSendDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />{language === "ar" ? "إرسال الشهادة" : "Send Certificate"}</DialogTitle>
          </DialogHeader>
          {sendDialog && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{language === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
                <Input value={sendDialog.recipient_email || ""} readOnly />
              </div>
              <div className="rounded-lg border p-3 bg-muted/30">
                <p className="text-sm font-medium">{sendDialog.recipient_name}</p>
                <p className="text-xs text-muted-foreground">{sendDialog.event_name} • {getTypeLabel(sendDialog.type)}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSendDialog(null)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
                <Button onClick={() => sendCertificateMutation.mutate(sendDialog.id)} disabled={sendCertificateMutation.isPending || !sendDialog.recipient_email}>
                  <Send className="h-4 w-4 mr-2" />{language === "ar" ? "إرسال" : "Send"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
