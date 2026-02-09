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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
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
  Signature,
  Building,
  Shield,
  Copy,
  ExternalLink,
  ChevronLeft,
  Save,
  X,
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

interface CertificateTemplate {
  id: string;
  name: string;
  name_ar: string | null;
  type: CertificateType;
  title_text: string;
  title_text_ar: string | null;
  body_template: string;
  body_template_ar: string | null;
  background_color: string;
  border_color: string;
  border_style: string;
  is_active: boolean;
}

interface CertificateSignature {
  id: string;
  name: string;
  name_ar: string | null;
  title: string;
  title_ar: string | null;
  organization: string | null;
  signature_image_url: string | null;
  is_active: boolean;
}

interface CertificateLogo {
  id: string;
  name: string;
  name_ar: string | null;
  logo_url: string;
  organization: string | null;
  is_sponsor: boolean;
  sort_order: number;
  is_active: boolean;
}

const certificateTypes: { value: CertificateType; label: string; labelAr: string; color: string }[] = [
  { value: "participation", label: "Participation", labelAr: "مشاركة", color: "bg-blue-500" },
  { value: "winner_gold", label: "Gold Winner", labelAr: "فائز ذهبي", color: "bg-yellow-500" },
  { value: "winner_silver", label: "Silver Winner", labelAr: "فائز فضي", color: "bg-gray-400" },
  { value: "winner_bronze", label: "Bronze Winner", labelAr: "فائز برونزي", color: "bg-orange-600" },
  { value: "appreciation", label: "Appreciation", labelAr: "تقدير", color: "bg-purple-500" },
  { value: "organizer", label: "Organizer", labelAr: "منظم", color: "bg-green-500" },
  { value: "judge", label: "Judge", labelAr: "حكم", color: "bg-red-500" },
  { value: "sponsor", label: "Sponsor", labelAr: "راعي", color: "bg-indigo-500" },
  { value: "volunteer", label: "Volunteer", labelAr: "متطوع", color: "bg-pink-500" },
];

const statusColors: Record<CertificateStatus, string> = {
  draft: "bg-gray-500",
  pending_signature: "bg-yellow-500",
  signed: "bg-blue-500",
  issued: "bg-green-500",
  revoked: "bg-red-500",
};

export default function CertificatesAdmin() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("certificates");
  const [searchQuery, setSearchQuery] = useState("");
  
  // View states
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showSignatureForm, setShowSignatureForm] = useState(false);
  const [showLogoForm, setShowLogoForm] = useState(false);
  const [showCertificateForm, setShowCertificateForm] = useState(false);
  const [showCertificatePreview, setShowCertificatePreview] = useState<string | null>(null);
  
  // Edit states
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [editingSignature, setEditingSignature] = useState<CertificateSignature | null>(null);
  const [editingLogo, setEditingLogo] = useState<CertificateLogo | null>(null);

  // Form states
  const [templateForm, setTemplateForm] = useState({
    name: "",
    name_ar: "",
    type: "participation" as CertificateType,
    title_text: "Certificate of Participation",
    title_text_ar: "شهادة مشاركة",
    body_template: "Presented to {{recipient_name}} in recognition of their participation in {{event_name}} held at {{event_location}} on {{event_date}}.",
    body_template_ar: "تُمنح لـ {{recipient_name}} تقديراً لمشاركتهم في {{event_name}} المُقام في {{event_location}} بتاريخ {{event_date}}.",
    background_color: "#ffffff",
    border_color: "#c9a227",
    border_style: "elegant",
  });

  const [signatureForm, setSignatureForm] = useState({
    name: "",
    name_ar: "",
    title: "",
    title_ar: "",
    organization: "",
    organization_ar: "",
    signature_image_url: "",
  });

  const [logoForm, setLogoForm] = useState({
    name: "",
    name_ar: "",
    logo_url: "",
    organization: "",
    is_sponsor: false,
    sort_order: 0,
  });

  const [certificateForm, setCertificateForm] = useState({
    template_id: "",
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

  // Fetch templates
  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ["certificate-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificate_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CertificateTemplate[];
    },
  });

  // Fetch signatures
  const { data: signatures = [], isLoading: loadingSignatures } = useQuery({
    queryKey: ["certificate-signatures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificate_signatures")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CertificateSignature[];
    },
  });

  // Fetch logos
  const { data: logos = [], isLoading: loadingLogos } = useQuery({
    queryKey: ["certificate-logos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificate_logos")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CertificateLogo[];
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof templateForm) => {
      const { error } = await supabase.from("certificate_templates").insert({
        ...data,
        body_template: data.body_template,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
      setShowTemplateForm(false);
      resetTemplateForm();
      toast({ title: language === "ar" ? "تم إنشاء القالب" : "Template created" });
    },
    onError: () => {
      toast({ title: language === "ar" ? "فشل في إنشاء القالب" : "Failed to create template", variant: "destructive" });
    },
  });

  // Create signature mutation
  const createSignatureMutation = useMutation({
    mutationFn: async (data: typeof signatureForm) => {
      const { error } = await supabase.from("certificate_signatures").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificate-signatures"] });
      setShowSignatureForm(false);
      resetSignatureForm();
      toast({ title: language === "ar" ? "تم إضافة التوقيع" : "Signature added" });
    },
    onError: () => {
      toast({ title: language === "ar" ? "فشل في إضافة التوقيع" : "Failed to add signature", variant: "destructive" });
    },
  });

  // Create logo mutation
  const createLogoMutation = useMutation({
    mutationFn: async (data: typeof logoForm) => {
      const { error } = await supabase.from("certificate_logos").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificate-logos"] });
      setShowLogoForm(false);
      resetLogoForm();
      toast({ title: language === "ar" ? "تم إضافة الشعار" : "Logo added" });
    },
    onError: () => {
      toast({ title: language === "ar" ? "فشل في إضافة الشعار" : "Failed to add logo", variant: "destructive" });
    },
  });

  // Create certificate mutation
  const createCertificateMutation = useMutation({
    mutationFn: async (data: typeof certificateForm) => {
      // Generate certificate number and verification code
      const { data: certNum } = await supabase.rpc("generate_certificate_number");
      const { data: verifyCode } = await supabase.rpc("generate_verification_code");
      
      const { error } = await supabase.from("certificates").insert({
        ...data,
        certificate_number: certNum,
        verification_code: verifyCode,
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      setShowCertificateForm(false);
      resetCertificateForm();
      toast({ title: language === "ar" ? "تم إنشاء الشهادة" : "Certificate created" });
    },
    onError: () => {
      toast({ title: language === "ar" ? "فشل في إنشاء الشهادة" : "Failed to create certificate", variant: "destructive" });
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

  const resetTemplateForm = () => {
    setTemplateForm({
      name: "",
      name_ar: "",
      type: "participation",
      title_text: "Certificate of Participation",
      title_text_ar: "شهادة مشاركة",
      body_template: "Presented to {{recipient_name}} in recognition of their participation in {{event_name}} held at {{event_location}} on {{event_date}}.",
      body_template_ar: "تُمنح لـ {{recipient_name}} تقديراً لمشاركتهم في {{event_name}} المُقام في {{event_location}} بتاريخ {{event_date}}.",
      background_color: "#ffffff",
      border_color: "#c9a227",
      border_style: "elegant",
    });
    setEditingTemplate(null);
  };

  const resetSignatureForm = () => {
    setSignatureForm({
      name: "",
      name_ar: "",
      title: "",
      title_ar: "",
      organization: "",
      organization_ar: "",
      signature_image_url: "",
    });
    setEditingSignature(null);
  };

  const resetLogoForm = () => {
    setLogoForm({
      name: "",
      name_ar: "",
      logo_url: "",
      organization: "",
      is_sponsor: false,
      sort_order: 0,
    });
    setEditingLogo(null);
  };

  const resetCertificateForm = () => {
    setCertificateForm({
      template_id: "",
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

  // Stats
  const stats = {
    total: certificates.length,
    issued: certificates.filter(c => c.status === "issued").length,
    pending: certificates.filter(c => c.status === "draft" || c.status === "pending_signature").length,
    revoked: certificates.filter(c => c.status === "revoked").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
                <p className="text-2xl font-bold text-green-600">{stats.issued}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
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
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "ar" ? "الشهادات" : "Certificates"}</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "ar" ? "القوالب" : "Templates"}</span>
          </TabsTrigger>
          <TabsTrigger value="signatures" className="flex items-center gap-2">
            <Signature className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "ar" ? "التوقيعات" : "Signatures"}</span>
          </TabsTrigger>
          <TabsTrigger value="logos" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "ar" ? "الشعارات" : "Logos"}</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "ar" ? "الإعدادات" : "Settings"}</span>
          </TabsTrigger>
        </TabsList>

        {/* Certificates Tab */}
        <TabsContent value="certificates" className="space-y-4">
          {showCertificateForm ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setShowCertificateForm(false)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle>{language === "ar" ? "إنشاء شهادة جديدة" : "Create New Certificate"}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "القالب" : "Template"}</Label>
                    <Select
                      value={certificateForm.template_id}
                      onValueChange={(v) => setCertificateForm({ ...certificateForm, template_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === "ar" ? "اختر القالب" : "Select template"} />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.filter(t => t.is_active).map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {language === "ar" ? template.name_ar || template.name : template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                            {language === "ar" ? type.labelAr : type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "اسم المستلم (إنجليزي)" : "Recipient Name (English)"}</Label>
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
                  <Button onClick={() => createCertificateMutation.mutate(certificateForm)}>
                    <Save className="h-4 w-4 mr-2" />
                    {language === "ar" ? "إنشاء الشهادة" : "Create Certificate"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCertificateForm(false)}>
                    <X className="h-4 w-4 mr-2" />
                    {language === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : showCertificatePreview ? (
            <CertificatePreview 
              certificateId={showCertificatePreview} 
              onClose={() => setShowCertificatePreview(null)}
              language={language}
            />
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{language === "ar" ? "جميع الشهادات" : "All Certificates"}</CardTitle>
                  <Button onClick={() => setShowCertificateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {language === "ar" ? "شهادة جديدة" : "New Certificate"}
                  </Button>
                </div>
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
                                size="icon"
                                onClick={() => setShowCertificatePreview(cert.id)}
                                title={language === "ar" ? "عرض" : "View"}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {cert.status === "draft" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => issueCertificateMutation.mutate(cert.id)}
                                  title={language === "ar" ? "إصدار" : "Issue"}
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              {cert.status === "issued" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title={language === "ar" ? "تحميل" : "Download"}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title={language === "ar" ? "إرسال" : "Send"}
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => revokeCertificateMutation.mutate(cert.id)}
                                    title={language === "ar" ? "إلغاء" : "Revoke"}
                                  >
                                    <XCircle className="h-4 w-4 text-red-600" />
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
                                title={language === "ar" ? "نسخ كود التحقق" : "Copy verification code"}
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
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          {showTemplateForm ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { setShowTemplateForm(false); resetTemplateForm(); }}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle>
                    {editingTemplate 
                      ? (language === "ar" ? "تعديل القالب" : "Edit Template")
                      : (language === "ar" ? "إنشاء قالب جديد" : "Create New Template")}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "اسم القالب (إنجليزي)" : "Template Name (English)"}</Label>
                    <Input
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      placeholder="Participation Certificate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "اسم القالب (عربي)" : "Template Name (Arabic)"}</Label>
                    <Input
                      value={templateForm.name_ar}
                      onChange={(e) => setTemplateForm({ ...templateForm, name_ar: e.target.value })}
                      placeholder="شهادة مشاركة"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{language === "ar" ? "نوع الشهادة" : "Certificate Type"}</Label>
                  <Select
                    value={templateForm.type}
                    onValueChange={(v) => setTemplateForm({ ...templateForm, type: v as CertificateType })}
                  >
                    <SelectTrigger>
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
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "عنوان الشهادة (إنجليزي)" : "Certificate Title (English)"}</Label>
                    <Input
                      value={templateForm.title_text}
                      onChange={(e) => setTemplateForm({ ...templateForm, title_text: e.target.value })}
                      placeholder="Certificate of Participation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "عنوان الشهادة (عربي)" : "Certificate Title (Arabic)"}</Label>
                    <Input
                      value={templateForm.title_text_ar}
                      onChange={(e) => setTemplateForm({ ...templateForm, title_text_ar: e.target.value })}
                      placeholder="شهادة مشاركة"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "نص الشهادة (إنجليزي)" : "Certificate Body (English)"}</Label>
                    <Textarea
                      value={templateForm.body_template}
                      onChange={(e) => setTemplateForm({ ...templateForm, body_template: e.target.value })}
                      rows={4}
                      placeholder="Use {{recipient_name}}, {{event_name}}, {{event_location}}, {{event_date}} as placeholders"
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === "ar" 
                        ? "المتغيرات: {{recipient_name}}, {{event_name}}, {{event_location}}, {{event_date}}"
                        : "Variables: {{recipient_name}}, {{event_name}}, {{event_location}}, {{event_date}}"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "نص الشهادة (عربي)" : "Certificate Body (Arabic)"}</Label>
                    <Textarea
                      value={templateForm.body_template_ar}
                      onChange={(e) => setTemplateForm({ ...templateForm, body_template_ar: e.target.value })}
                      rows={4}
                      dir="rtl"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "لون الخلفية" : "Background Color"}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={templateForm.background_color}
                        onChange={(e) => setTemplateForm({ ...templateForm, background_color: e.target.value })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={templateForm.background_color}
                        onChange={(e) => setTemplateForm({ ...templateForm, background_color: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "لون الإطار" : "Border Color"}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={templateForm.border_color}
                        onChange={(e) => setTemplateForm({ ...templateForm, border_color: e.target.value })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={templateForm.border_color}
                        onChange={(e) => setTemplateForm({ ...templateForm, border_color: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "نمط الإطار" : "Border Style"}</Label>
                    <Select
                      value={templateForm.border_style}
                      onValueChange={(v) => setTemplateForm({ ...templateForm, border_style: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elegant">Elegant</SelectItem>
                        <SelectItem value="classic">Classic</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="simple">Simple</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => createTemplateMutation.mutate(templateForm)}>
                    <Save className="h-4 w-4 mr-2" />
                    {language === "ar" ? "حفظ القالب" : "Save Template"}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowTemplateForm(false); resetTemplateForm(); }}>
                    <X className="h-4 w-4 mr-2" />
                    {language === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{language === "ar" ? "قوالب الشهادات" : "Certificate Templates"}</CardTitle>
                  <Button onClick={() => setShowTemplateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {language === "ar" ? "قالب جديد" : "New Template"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="overflow-hidden">
                      <div 
                        className="h-32 flex items-center justify-center border-b"
                        style={{ 
                          backgroundColor: template.background_color,
                          borderColor: template.border_color,
                          borderWidth: "4px"
                        }}
                      >
                        <div className="text-center">
                          <Award className="h-8 w-8 mx-auto mb-2" style={{ color: template.border_color }} />
                          <p className="font-semibold text-sm">{template.title_text}</p>
                        </div>
                      </div>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">
                            {language === "ar" ? template.name_ar || template.name : template.name}
                          </h3>
                          <Badge className={certificateTypes.find(t => t.value === template.type)?.color}>
                            {getTypeLabel(template.type)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant={template.is_active ? "default" : "secondary"}>
                            {template.is_active 
                              ? (language === "ar" ? "نشط" : "Active")
                              : (language === "ar" ? "غير نشط" : "Inactive")}
                          </Badge>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {templates.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{language === "ar" ? "لا توجد قوالب" : "No templates found"}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Signatures Tab */}
        <TabsContent value="signatures" className="space-y-4">
          {showSignatureForm ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { setShowSignatureForm(false); resetSignatureForm(); }}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle>{language === "ar" ? "إضافة توقيع جديد" : "Add New Signature"}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "الاسم (إنجليزي)" : "Name (English)"}</Label>
                    <Input
                      value={signatureForm.name}
                      onChange={(e) => setSignatureForm({ ...signatureForm, name: e.target.value })}
                      placeholder="Yasser B. Jad"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                    <Input
                      value={signatureForm.name_ar}
                      onChange={(e) => setSignatureForm({ ...signatureForm, name_ar: e.target.value })}
                      placeholder="ياسر ب. جاد"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "المنصب (إنجليزي)" : "Title (English)"}</Label>
                    <Input
                      value={signatureForm.title}
                      onChange={(e) => setSignatureForm({ ...signatureForm, title: e.target.value })}
                      placeholder="President"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "المنصب (عربي)" : "Title (Arabic)"}</Label>
                    <Input
                      value={signatureForm.title_ar}
                      onChange={(e) => setSignatureForm({ ...signatureForm, title_ar: e.target.value })}
                      placeholder="الرئيس"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "المنظمة (إنجليزي)" : "Organization (English)"}</Label>
                    <Input
                      value={signatureForm.organization}
                      onChange={(e) => setSignatureForm({ ...signatureForm, organization: e.target.value })}
                      placeholder="Saudi Arabian Chefs Association"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "المنظمة (عربي)" : "Organization (Arabic)"}</Label>
                    <Input
                      value={signatureForm.organization_ar}
                      onChange={(e) => setSignatureForm({ ...signatureForm, organization_ar: e.target.value })}
                      placeholder="جمعية الطهاة السعودية"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{language === "ar" ? "صورة التوقيع (رابط)" : "Signature Image (URL)"}</Label>
                  <Input
                    value={signatureForm.signature_image_url}
                    onChange={(e) => setSignatureForm({ ...signatureForm, signature_image_url: e.target.value })}
                    placeholder="https://example.com/signature.png"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => createSignatureMutation.mutate(signatureForm)}>
                    <Save className="h-4 w-4 mr-2" />
                    {language === "ar" ? "حفظ التوقيع" : "Save Signature"}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowSignatureForm(false); resetSignatureForm(); }}>
                    <X className="h-4 w-4 mr-2" />
                    {language === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{language === "ar" ? "التوقيعات المعتمدة" : "Authorized Signatures"}</CardTitle>
                  <Button onClick={() => setShowSignatureForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {language === "ar" ? "توقيع جديد" : "New Signature"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {signatures.map((sig) => (
                    <Card key={sig.id}>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          {sig.signature_image_url ? (
                            <img 
                              src={sig.signature_image_url} 
                              alt={sig.name}
                              className="h-16 mx-auto mb-4 object-contain"
                            />
                          ) : (
                            <div className="h-16 flex items-center justify-center mb-4">
                              <Signature className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <p className="font-bold border-t border-foreground pt-2 inline-block px-4">
                            {language === "ar" ? sig.name_ar || sig.name : sig.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {language === "ar" ? sig.title_ar || sig.title : sig.title}
                          </p>
                          {sig.organization && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {language === "ar" ? sig.organization : sig.organization}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <Badge variant={sig.is_active ? "default" : "secondary"}>
                            {sig.is_active 
                              ? (language === "ar" ? "نشط" : "Active")
                              : (language === "ar" ? "غير نشط" : "Inactive")}
                          </Badge>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {signatures.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <Signature className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{language === "ar" ? "لا توجد توقيعات" : "No signatures found"}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Logos Tab */}
        <TabsContent value="logos" className="space-y-4">
          {showLogoForm ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { setShowLogoForm(false); resetLogoForm(); }}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle>{language === "ar" ? "إضافة شعار جديد" : "Add New Logo"}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "اسم الشعار (إنجليزي)" : "Logo Name (English)"}</Label>
                    <Input
                      value={logoForm.name}
                      onChange={(e) => setLogoForm({ ...logoForm, name: e.target.value })}
                      placeholder="SARCA Logo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "اسم الشعار (عربي)" : "Logo Name (Arabic)"}</Label>
                    <Input
                      value={logoForm.name_ar}
                      onChange={(e) => setLogoForm({ ...logoForm, name_ar: e.target.value })}
                      placeholder="شعار جمعية الطهاة"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{language === "ar" ? "رابط الشعار" : "Logo URL"}</Label>
                  <Input
                    value={logoForm.logo_url}
                    onChange={(e) => setLogoForm({ ...logoForm, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === "ar" ? "المنظمة" : "Organization"}</Label>
                  <Input
                    value={logoForm.organization}
                    onChange={(e) => setLogoForm({ ...logoForm, organization: e.target.value })}
                    placeholder="Saudi Arabian Chefs Association"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "ترتيب العرض" : "Sort Order"}</Label>
                    <Input
                      type="number"
                      value={logoForm.sort_order}
                      onChange={(e) => setLogoForm({ ...logoForm, sort_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-8">
                    <Switch
                      checked={logoForm.is_sponsor}
                      onCheckedChange={(v) => setLogoForm({ ...logoForm, is_sponsor: v })}
                    />
                    <Label>{language === "ar" ? "شعار راعي" : "Sponsor Logo"}</Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => createLogoMutation.mutate(logoForm)}>
                    <Save className="h-4 w-4 mr-2" />
                    {language === "ar" ? "حفظ الشعار" : "Save Logo"}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowLogoForm(false); resetLogoForm(); }}>
                    <X className="h-4 w-4 mr-2" />
                    {language === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{language === "ar" ? "شعارات المنظمات" : "Organization Logos"}</CardTitle>
                  <Button onClick={() => setShowLogoForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {language === "ar" ? "شعار جديد" : "New Logo"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {logos.map((logo) => (
                    <Card key={logo.id} className="overflow-hidden">
                      <div className="h-24 flex items-center justify-center p-4 bg-muted">
                        {logo.logo_url ? (
                          <img 
                            src={logo.logo_url} 
                            alt={logo.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <Building className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium truncate">
                          {language === "ar" ? logo.name_ar || logo.name : logo.name}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          {logo.is_sponsor && (
                            <Badge variant="outline" className="text-xs">
                              {language === "ar" ? "راعي" : "Sponsor"}
                            </Badge>
                          )}
                          <div className="flex gap-1 ml-auto">
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {logos.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{language === "ar" ? "لا توجد شعارات" : "No logos found"}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {language === "ar" ? "إعدادات التحقق" : "Verification Settings"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{language === "ar" ? "تفعيل التحقق العام" : "Enable Public Verification"}</Label>
                    <p className="text-sm text-muted-foreground">
                      {language === "ar" 
                        ? "السماح للجميع بالتحقق من الشهادات"
                        : "Allow anyone to verify certificates"}
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{language === "ar" ? "تسجيل عمليات التحقق" : "Log Verification Attempts"}</Label>
                    <p className="text-sm text-muted-foreground">
                      {language === "ar" 
                        ? "حفظ سجل لكل محاولة تحقق"
                        : "Keep a log of all verification attempts"}
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>{language === "ar" ? "رابط صفحة التحقق" : "Verification Page URL"}</Label>
                  <div className="flex gap-2">
                    <Input value="/verify" readOnly className="font-mono" />
                    <Button variant="outline" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  {language === "ar" ? "إعدادات الإرسال" : "Delivery Settings"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{language === "ar" ? "إرسال تلقائي عند الإصدار" : "Auto-send on Issue"}</Label>
                    <p className="text-sm text-muted-foreground">
                      {language === "ar" 
                        ? "إرسال الشهادة بالبريد تلقائياً"
                        : "Automatically email certificate on issue"}
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{language === "ar" ? "تضمين رابط التحقق" : "Include Verification Link"}</Label>
                    <p className="text-sm text-muted-foreground">
                      {language === "ar" 
                        ? "إضافة رابط للتحقق في البريد"
                        : "Add verification link in email"}
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{language === "ar" ? "إرسال نسخة PDF" : "Attach PDF Copy"}</Label>
                    <p className="text-sm text-muted-foreground">
                      {language === "ar" 
                        ? "إرفاق نسخة PDF مع البريد"
                        : "Attach PDF copy to email"}
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  {language === "ar" ? "إعدادات الطباعة" : "Print Settings"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "حجم الورق" : "Paper Size"}</Label>
                  <Select defaultValue="a4">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                      <SelectItem value="letter">Letter (8.5 × 11 in)</SelectItem>
                      <SelectItem value="a3">A3 (297 × 420 mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "الاتجاه" : "Orientation"}</Label>
                  <Select defaultValue="landscape">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landscape">{language === "ar" ? "أفقي" : "Landscape"}</SelectItem>
                      <SelectItem value="portrait">{language === "ar" ? "عمودي" : "Portrait"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "جودة الطباعة" : "Print Quality"}</Label>
                  <Select defaultValue="high">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">{language === "ar" ? "عادي (150 DPI)" : "Standard (150 DPI)"}</SelectItem>
                      <SelectItem value="high">{language === "ar" ? "عالي (300 DPI)" : "High (300 DPI)"}</SelectItem>
                      <SelectItem value="ultra">{language === "ar" ? "فائق (600 DPI)" : "Ultra (600 DPI)"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {language === "ar" ? "الترقيم التلقائي" : "Auto Numbering"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "بادئة رقم الشهادة" : "Certificate Number Prefix"}</Label>
                  <Input defaultValue="CERT" />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "تضمين السنة" : "Include Year"}</Label>
                  <Select defaultValue="yes">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">{language === "ar" ? "نعم" : "Yes"}</SelectItem>
                      <SelectItem value="no">{language === "ar" ? "لا" : "No"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "عدد أرقام التسلسل" : "Sequence Digits"}</Label>
                  <Select defaultValue="5">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 (0001)</SelectItem>
                      <SelectItem value="5">5 (00001)</SelectItem>
                      <SelectItem value="6">6 (000001)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "مثال: CERT-2026-00001" : "Example: CERT-2026-00001"}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Certificate Preview Component
function CertificatePreview({ 
  certificateId, 
  onClose,
  language 
}: { 
  certificateId: string; 
  onClose: () => void;
  language: string;
}) {
  const { data: certificate, isLoading } = useQuery({
    queryKey: ["certificate", certificateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("id", certificateId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  if (!certificate) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle>{language === "ar" ? "معاينة الشهادة" : "Certificate Preview"}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              {language === "ar" ? "طباعة" : "Print"}
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {language === "ar" ? "تحميل PDF" : "Download PDF"}
            </Button>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              {language === "ar" ? "إرسال" : "Send"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Certificate Preview */}
        <div className="border-8 border-[#c9a227] bg-white p-8 max-w-4xl mx-auto aspect-[1.414/1] flex flex-col">
          {/* Header Logos */}
          <div className="flex justify-center gap-8 mb-6">
            <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
              <Building className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif text-[#c9a227] mb-2">
              Certificate of Participation
            </h1>
            <h2 className="text-2xl font-serif text-[#c9a227]" dir="rtl">
              شهادة مشاركة
            </h2>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col justify-center text-center px-12">
            <p className="text-lg mb-4">Presented to</p>
            <p className="text-4xl font-bold text-primary mb-4">
              {certificate.recipient_name}
            </p>
            {certificate.recipient_name_ar && (
              <p className="text-2xl font-bold text-primary mb-6" dir="rtl">
                {certificate.recipient_name_ar}
              </p>
            )}
            <p className="text-lg">
              In recognition of their participation in <strong>{certificate.event_name || "the event"}</strong>
              {certificate.event_location && ` held at ${certificate.event_location}`}
              {certificate.event_date && ` on ${format(new Date(certificate.event_date), "MMMM d, yyyy")}`}.
            </p>
          </div>

          {/* Signature */}
          <div className="mt-8 text-center">
            <div className="inline-block">
              <div className="h-12 mb-2">
                <Signature className="h-8 w-8 mx-auto text-muted-foreground" />
              </div>
              <div className="border-t border-foreground pt-2 px-8">
                <p className="font-bold">President</p>
                <p className="text-sm text-muted-foreground">Organization Name</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-between items-end text-xs text-muted-foreground">
            <div>
              <p>Certificate #: {certificate.certificate_number}</p>
              <p>Verification: {certificate.verification_code}</p>
            </div>
            <div className="flex gap-4">
              {/* Footer logos placeholder */}
            </div>
          </div>
        </div>

        {/* Certificate Details */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">{language === "ar" ? "رقم الشهادة" : "Certificate #"}</p>
            <p className="font-mono font-bold">{certificate.certificate_number}</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">{language === "ar" ? "كود التحقق" : "Verification Code"}</p>
            <p className="font-mono font-bold">{certificate.verification_code}</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">{language === "ar" ? "الحالة" : "Status"}</p>
            <Badge className={statusColors[certificate.status as CertificateStatus]}>
              {certificate.status}
            </Badge>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">{language === "ar" ? "تاريخ الإنشاء" : "Created"}</p>
            <p className="font-bold">{format(new Date(certificate.created_at), "yyyy-MM-dd")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
