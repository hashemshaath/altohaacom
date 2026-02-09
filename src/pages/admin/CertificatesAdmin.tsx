import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CertificateDesigner } from "@/components/certificates/CertificateDesigner";
import {
  Award,
  FileText,
  Settings,
  Users,
  Send,
  Download,
  Printer,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Image,
  ChevronLeft,
  Save,
  X,
  Copy,
  Palette,
  LayoutTemplate,
  UserCheck,
} from "lucide-react";
import { format } from "date-fns";

type CertificateType = 
  | "participation"
  | "winner_gold"
  | "winner_silver"
  | "winner_bronze"
  | "appreciation"
  | "organizer"
  | "judge"
  | "sponsor"
  | "volunteer";

type CertificateStatus = "draft" | "pending_signature" | "signed" | "issued" | "revoked";

interface Certificate {
  id: string;
  certificate_number: string;
  verification_code: string;
  recipient_name: string;
  recipient_name_ar: string | null;
  recipient_email: string | null;
  type: CertificateType;
  status: CertificateStatus;
  event_name: string | null;
  event_date: string | null;
  issued_at: string | null;
  created_at: string;
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("certificates");
  const [searchQuery, setSearchQuery] = useState("");
  
  // View states
  const [showDesigner, setShowDesigner] = useState(false);
  const [showCertificateForm, setShowCertificateForm] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);
  const [bulkIssueMode, setBulkIssueMode] = useState(false);

  // Form states
  const [certificateForm, setCertificateForm] = useState({
    recipient_name: "",
    recipient_name_ar: "",
    recipient_email: "",
    type: "participation" as CertificateType,
    event_name: "",
    event_name_ar: "",
    event_location: "",
    event_location_ar: "",
    event_date: "",
    achievement: "",
    achievement_ar: "",
  });

  // Bulk recipients
  const [bulkRecipients, setBulkRecipients] = useState<Array<{
    name: string;
    nameAr: string;
    email: string;
    type: CertificateType;
  }>>([]);

  // Fetch certificates
  const { data: certificates = [], isLoading: loadingCertificates } = useQuery({
    queryKey: ["certificates", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("certificates")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (searchQuery) {
        query = query.or(`recipient_name.ilike.%${searchQuery}%,certificate_number.ilike.%${searchQuery}%,verification_code.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Certificate[];
    },
  });

  // Fetch templates for dropdown
  const { data: templates = [] } = useQuery({
    queryKey: ["certificate-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificate_templates")
        .select("id, name, name_ar, type, is_active")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Create certificate mutation
  const createCertificateMutation = useMutation({
    mutationFn: async (data: typeof certificateForm) => {
      // Find matching template by type, or use first available
      let templateId = templates.find(t => t.type === data.type)?.id || templates[0]?.id;
      
      if (!templateId) {
        // Auto-create a default template
        const { data: newTemplate, error: tplErr } = await supabase
          .from("certificate_templates")
          .insert({
            name: "Default Template",
            name_ar: "القالب الافتراضي",
            type: data.type,
            title_text: "Certificate",
            body_template: "This certifies that {{recipient_name}} has participated.",
            body_template_ar: "نشهد بأن {{recipient_name}} قد شارك.",
            is_active: true,
          })
          .select("id")
          .single();
        if (tplErr) throw tplErr;
        templateId = newTemplate.id;
      }

      const { data: verifyCode } = await supabase.rpc("generate_verification_code");
      
      const { error } = await supabase.from("certificates").insert({
        ...data,
        template_id: templateId,
        certificate_number: "",
        verification_code: verifyCode,
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
      setShowCertificateForm(false);
      resetCertificateForm();
      toast({ title: language === "ar" ? "تم إنشاء الشهادة" : "Certificate created" });
    },
    onError: (err: any) => {
      toast({ title: language === "ar" ? "فشل في إنشاء الشهادة" : "Failed to create certificate", variant: "destructive", description: err.message });
    },
  });

  // Issue certificate mutation
  const issueCertificateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("certificates")
        .update({ status: "issued", issued_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast({ title: language === "ar" ? "تم إصدار الشهادة" : "Certificate issued" });
    },
  });

  // Revoke certificate mutation
  const revokeCertificateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("certificates")
        .update({ status: "revoked", revoked_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast({ title: language === "ar" ? "تم إلغاء الشهادة" : "Certificate revoked" });
    },
  });

  const resetCertificateForm = () => {
    setCertificateForm({
      recipient_name: "",
      recipient_name_ar: "",
      recipient_email: "",
      type: "participation",
      event_name: "",
      event_name_ar: "",
      event_location: "",
      event_location_ar: "",
      event_date: "",
      achievement: "",
      achievement_ar: "",
    });
  };

  const getTypeLabel = (type: CertificateType) => {
    const t = certificateTypes.find(ct => ct.value === type);
    return language === "ar" ? t?.labelAr : t?.label;
  };

  const getStatusLabel = (status: CertificateStatus) => {
    const labels: Record<CertificateStatus, { en: string; ar: string }> = {
      draft: { en: "Draft", ar: "مسودة" },
      pending_signature: { en: "Pending Signature", ar: "بانتظار التوقيع" },
      signed: { en: "Signed", ar: "موقعة" },
      issued: { en: "Issued", ar: "صادرة" },
      revoked: { en: "Revoked", ar: "ملغاة" },
    };
    return language === "ar" ? labels[status].ar : labels[status].en;
  };

  const addBulkRecipient = () => {
    setBulkRecipients([
      ...bulkRecipients,
      { name: "", nameAr: "", email: "", type: "participation" },
    ]);
  };

  const updateBulkRecipient = (index: number, updates: Partial<typeof bulkRecipients[0]>) => {
    setBulkRecipients(prev => prev.map((r, i) => i === index ? { ...r, ...updates } : r));
  };

  const removeBulkRecipient = (index: number) => {
    setBulkRecipients(prev => prev.filter((_, i) => i !== index));
  };

  // Stats
  const stats = {
    total: certificates.length,
    issued: certificates.filter(c => c.status === "issued").length,
    pending: certificates.filter(c => c.status === "draft" || c.status === "pending_signature").length,
    revoked: certificates.filter(c => c.status === "revoked").length,
  };

  // Show designer view
  if (showDesigner) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowDesigner(false)}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            {language === "ar" ? "رجوع" : "Back"}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {language === "ar" ? "مصمم الشهادات" : "Certificate Designer"}
            </h1>
            <p className="text-muted-foreground">
              {language === "ar" ? "تصميم وتخصيص قوالب الشهادات" : "Design and customize certificate templates"}
            </p>
          </div>
        </div>
        
        <CertificateDesigner
          onSave={async (design) => {
            try {
              const { error } = await supabase.from("certificate_templates").insert({
                name: design.titleText || "Custom Template",
                name_ar: design.titleTextAr || null,
                type: "participation",
                title_text: design.titleText,
                title_text_ar: design.titleTextAr,
                body_template: design.bodyTemplate,
                body_template_ar: design.bodyTemplateAr,
                background_color: design.backgroundColor,
                border_color: design.borderColor,
                border_style: design.borderStyle,
                title_font: design.titleFont,
                body_font: design.bodyFont,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" />
            {language === "ar" ? "مركز الشهادات" : "Certificate Center"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "ar" 
              ? "إدارة وإصدار الشهادات للمشاركين والفائزين والمنظمين"
              : "Manage and issue certificates for participants, winners, and organizers"}
          </p>
        </div>
        <Button onClick={() => setShowDesigner(true)} variant="outline">
          <Palette className="h-4 w-4 mr-2" />
          {language === "ar" ? "مصمم الشهادات" : "Certificate Designer"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "إجمالي الشهادات" : "Total Certificates"}
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "صادرة" : "Issued"}
                </p>
                <p className="text-2xl font-bold text-emerald-600">{stats.issued}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "قيد الانتظار" : "Pending"}
                </p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "ملغاة" : "Revoked"}
                </p>
                <p className="text-2xl font-bold text-red-600">{stats.revoked}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            {language === "ar" ? "الشهادات" : "Certificates"}
          </TabsTrigger>
          <TabsTrigger value="issue" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {language === "ar" ? "إصدار جديد" : "Issue New"}
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {language === "ar" ? "إصدار جماعي" : "Bulk Issue"}
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4" />
            {language === "ar" ? "القوالب" : "Templates"}
          </TabsTrigger>
        </TabsList>

        {/* Certificates List Tab */}
        <TabsContent value="certificates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "جميع الشهادات" : "All Certificates"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === "ar" ? "بحث بالاسم أو رقم الشهادة..." : "Search by name or certificate number..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "ar" ? "رقم الشهادة" : "Certificate #"}</TableHead>
                      <TableHead>{language === "ar" ? "المستلم" : "Recipient"}</TableHead>
                      <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
                      <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{language === "ar" ? "تاريخ الإنشاء" : "Created"}</TableHead>
                      <TableHead>{language === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-mono text-sm">{cert.certificate_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{cert.recipient_name}</p>
                            {cert.recipient_email && (
                              <p className="text-sm text-muted-foreground">{cert.recipient_email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={certificateTypes.find(t => t.value === cert.type)?.color}>
                            {getTypeLabel(cert.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[cert.status]}>
                            {getStatusLabel(cert.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(cert.created_at), "yyyy-MM-dd")}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCertificate(cert.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {language === "ar" ? "عرض" : "View"}
                            </Button>
                            {cert.status === "draft" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => issueCertificateMutation.mutate(cert.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1 text-emerald-600" />
                                {language === "ar" ? "إصدار" : "Issue"}
                              </Button>
                            )}
                            {cert.status === "issued" && (
                              <>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4 mr-1" />
                                  PDF
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Send className="h-4 w-4 mr-1" />
                                  {language === "ar" ? "إرسال" : "Send"}
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                navigator.clipboard.writeText(cert.verification_code);
                                toast({ title: language === "ar" ? "تم نسخ كود التحقق" : "Verification code copied" });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {certificates.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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

        {/* Issue New Certificate Tab */}
        <TabsContent value="issue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "إصدار شهادة جديدة" : "Issue New Certificate"}</CardTitle>
              <CardDescription>
                {language === "ar" 
                  ? "أدخل بيانات المستلم لإنشاء شهادة جديدة"
                  : "Enter recipient details to create a new certificate"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "نوع الشهادة" : "Certificate Type"}</Label>
                  <Select
                    value={certificateForm.type}
                    onValueChange={(v) => setCertificateForm({ ...certificateForm, type: v as CertificateType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {certificateTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${type.color}`} />
                            {language === "ar" ? type.labelAr : type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "اسم المستلم (إنجليزي)" : "Recipient Name (English)"} *</Label>
                  <Input
                    value={certificateForm.recipient_name}
                    onChange={(e) => setCertificateForm({ ...certificateForm, recipient_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "اسم المستلم (عربي)" : "Recipient Name (Arabic)"}</Label>
                  <Input
                    value={certificateForm.recipient_name_ar}
                    onChange={(e) => setCertificateForm({ ...certificateForm, recipient_name_ar: e.target.value })}
                    placeholder="جون دو"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{language === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
                <Input
                  type="email"
                  value={certificateForm.recipient_email}
                  onChange={(e) => setCertificateForm({ ...certificateForm, recipient_email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "اسم الحدث (إنجليزي)" : "Event Name (English)"}</Label>
                  <Input
                    value={certificateForm.event_name}
                    onChange={(e) => setCertificateForm({ ...certificateForm, event_name: e.target.value })}
                    placeholder="International Culinary Championship"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "اسم الحدث (عربي)" : "Event Name (Arabic)"}</Label>
                  <Input
                    value={certificateForm.event_name_ar}
                    onChange={(e) => setCertificateForm({ ...certificateForm, event_name_ar: e.target.value })}
                    placeholder="بطولة الطهي الدولية"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "موقع الحدث (إنجليزي)" : "Event Location (English)"}</Label>
                  <Input
                    value={certificateForm.event_location}
                    onChange={(e) => setCertificateForm({ ...certificateForm, event_location: e.target.value })}
                    placeholder="Riyadh, Saudi Arabia"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "موقع الحدث (عربي)" : "Event Location (Arabic)"}</Label>
                  <Input
                    value={certificateForm.event_location_ar}
                    onChange={(e) => setCertificateForm({ ...certificateForm, event_location_ar: e.target.value })}
                    placeholder="الرياض، المملكة العربية السعودية"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{language === "ar" ? "تاريخ الحدث" : "Event Date"}</Label>
                <Input
                  type="date"
                  value={certificateForm.event_date}
                  onChange={(e) => setCertificateForm({ ...certificateForm, event_date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "الإنجاز (إنجليزي)" : "Achievement (English)"}</Label>
                  <Input
                    value={certificateForm.achievement}
                    onChange={(e) => setCertificateForm({ ...certificateForm, achievement: e.target.value })}
                    placeholder="Gold Medal Winner"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "الإنجاز (عربي)" : "Achievement (Arabic)"}</Label>
                  <Input
                    value={certificateForm.achievement_ar}
                    onChange={(e) => setCertificateForm({ ...certificateForm, achievement_ar: e.target.value })}
                    placeholder="الفائز بالميدالية الذهبية"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => createCertificateMutation.mutate(certificateForm)}
                  disabled={!certificateForm.recipient_name}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {language === "ar" ? "إنشاء الشهادة" : "Create Certificate"}
                </Button>
                <Button variant="outline" onClick={resetCertificateForm}>
                  <X className="h-4 w-4 mr-2" />
                  {language === "ar" ? "مسح" : "Clear"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Issue Tab */}
        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{language === "ar" ? "إصدار جماعي للشهادات" : "Bulk Certificate Issuance"}</CardTitle>
                  <CardDescription>
                    {language === "ar" 
                      ? "إنشاء شهادات لمجموعة من المستلمين دفعة واحدة"
                      : "Create certificates for multiple recipients at once"}
                  </CardDescription>
                </div>
                <Button onClick={addBulkRecipient}>
                  <Plus className="h-4 w-4 mr-2" />
                  {language === "ar" ? "إضافة مستلم" : "Add Recipient"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Common Event Details */}
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-4">{language === "ar" ? "بيانات الحدث المشتركة" : "Common Event Details"}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>{language === "ar" ? "اسم الحدث" : "Event Name"}</Label>
                        <Input placeholder="International Culinary Championship 2025" />
                      </div>
                      <div className="space-y-2">
                        <Label>{language === "ar" ? "الموقع" : "Location"}</Label>
                        <Input placeholder="Riyadh, Saudi Arabia" />
                      </div>
                      <div className="space-y-2">
                        <Label>{language === "ar" ? "التاريخ" : "Date"}</Label>
                        <Input type="date" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recipients List */}
                {bulkRecipients.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>{language === "ar" ? "الاسم (إنجليزي)" : "Name (EN)"}</TableHead>
                        <TableHead>{language === "ar" ? "الاسم (عربي)" : "Name (AR)"}</TableHead>
                        <TableHead>{language === "ar" ? "البريد" : "Email"}</TableHead>
                        <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bulkRecipients.map((recipient, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Input
                              value={recipient.name}
                              onChange={(e) => updateBulkRecipient(index, { name: e.target.value })}
                              placeholder="John Doe"
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={recipient.nameAr}
                              onChange={(e) => updateBulkRecipient(index, { nameAr: e.target.value })}
                              placeholder="جون دو"
                              dir="rtl"
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={recipient.email}
                              onChange={(e) => updateBulkRecipient(index, { email: e.target.value })}
                              placeholder="email@example.com"
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={recipient.type}
                              onValueChange={(v) => updateBulkRecipient(index, { type: v as CertificateType })}
                            >
                              <SelectTrigger className="h-8 w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {certificateTypes.map(type => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {language === "ar" ? type.labelAr : type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeBulkRecipient(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === "ar" ? "لم تتم إضافة مستلمين بعد" : "No recipients added yet"}</p>
                    <Button variant="link" onClick={addBulkRecipient}>
                      {language === "ar" ? "إضافة أول مستلم" : "Add first recipient"}
                    </Button>
                  </div>
                )}

                {bulkRecipients.length > 0 && (
                  <div className="flex gap-2">
                    <Button disabled={bulkRecipients.some(r => !r.name)}>
                      <Award className="h-4 w-4 mr-2" />
                      {language === "ar" ? `إنشاء ${bulkRecipients.length} شهادة` : `Create ${bulkRecipients.length} Certificates`}
                    </Button>
                    <Button variant="outline" onClick={() => setBulkRecipients([])}>
                      {language === "ar" ? "مسح الكل" : "Clear All"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{language === "ar" ? "قوالب الشهادات" : "Certificate Templates"}</CardTitle>
                  <CardDescription>
                    {language === "ar" 
                      ? "إدارة وتخصيص قوالب الشهادات"
                      : "Manage and customize certificate templates"}
                  </CardDescription>
                </div>
                <Button onClick={() => setShowDesigner(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {language === "ar" ? "إنشاء قالب" : "Create Template"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.length > 0 ? (
                  templates.map((template) => (
                    <Card key={template.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowDesigner(true)}>
                      <div 
                        className="h-32 flex items-center justify-center bg-muted/30"
                      >
                        <Award className="h-12 w-12 text-primary" />
                      </div>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {language === "ar" && template.name_ar ? template.name_ar : template.name}
                            </h3>
                            <Badge variant="outline" className="mt-1">
                              {getTypeLabel(template.type as CertificateType)}
                            </Badge>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <LayoutTemplate className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === "ar" ? "لا توجد قوالب بعد" : "No templates yet"}</p>
                    <Button variant="link" onClick={() => setShowDesigner(true)}>
                      {language === "ar" ? "إنشاء أول قالب" : "Create your first template"}
                    </Button>
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
