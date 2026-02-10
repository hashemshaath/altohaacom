import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { useAllCountries } from "@/hooks/useCountries";
import { countryFlag } from "@/lib/countryFlag";
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
  Building2,
  Users,
  Package,
  FileText,
  Send,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  ChevronLeft,
  Save,
  X,
  Truck,
  DollarSign,
  Star,
  Image,
  CalendarCheck,
  MessageSquare,
  Filter,
  MoreHorizontal,
  UserPlus,
  Building,
  CreditCard,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";

type CompanyType = "sponsor" | "supplier" | "partner" | "vendor";
type CompanyStatus = "active" | "inactive" | "pending" | "suspended";

interface Company {
  id: string;
  name: string;
  name_ar: string | null;
  type: CompanyType;
  status: CompanyStatus;
  company_number: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  operating_countries: string[] | null;
  logo_url: string | null;
  created_at: string;
}

const companyTypes: { value: CompanyType; label: string; labelAr: string }[] = [
  { value: "sponsor", label: "Sponsor", labelAr: "راعي" },
  { value: "supplier", label: "Supplier", labelAr: "مورد" },
  { value: "partner", label: "Partner", labelAr: "شريك" },
  { value: "vendor", label: "Vendor", labelAr: "بائع" },
];

const statusColors: Record<CompanyStatus, string> = {
  active: "bg-green-500",
  inactive: "bg-gray-500",
  pending: "bg-yellow-500",
  suspended: "bg-red-500",
};

export default function CompaniesAdmin() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("companies");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // View states
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companyDetailTab, setCompanyDetailTab] = useState("overview");
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  // Form state
  const [companyForm, setCompanyForm] = useState({
    name: "",
    name_ar: "",
    type: "supplier" as CompanyType,
    registration_number: "",
    tax_number: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    address_ar: "",
    city: "",
    country: "",
    country_code: "",
    postal_code: "",
    description: "",
    description_ar: "",
    credit_limit: 0,
    payment_terms: 30,
    currency: "SAR",
  });

  const { data: allCountries = [] } = useAllCountries();

  // Fetch companies
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies", searchQuery, typeFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter as CompanyType);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as CompanyStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Company[];
    },
  });

  // Fetch selected company details
  const { data: companyDetails } = useQuery({
    queryKey: ["company", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", selectedCompany)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  // Fetch company contacts
  const { data: contacts = [] } = useQuery({
    queryKey: ["company-contacts", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase
        .from("company_contacts")
        .select("*")
        .eq("company_id", selectedCompany)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  // Fetch company branches
  const { data: branches = [] } = useQuery({
    queryKey: ["company-branches", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase
        .from("company_branches")
        .select("*")
        .eq("company_id", selectedCompany)
        .order("is_headquarters", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  // Fetch company orders
  const { data: orders = [] } = useQuery({
    queryKey: ["company-orders", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase
        .from("company_orders")
        .select("*")
        .eq("company_id", selectedCompany)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  // Fetch company transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ["company-transactions", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase
        .from("company_transactions")
        .select("*")
        .eq("company_id", selectedCompany)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  // Fetch company invitations
  const { data: invitations = [] } = useQuery({
    queryKey: ["company-invitations", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase
        .from("company_invitations")
        .select("*")
        .eq("company_id", selectedCompany)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  // Fetch company evaluations
  const { data: evaluations = [] } = useQuery({
    queryKey: ["company-evaluations", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase
        .from("company_evaluations")
        .select("*")
        .eq("company_id", selectedCompany)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  // Fetch company catalog
  const { data: catalogItems = [] } = useQuery({
    queryKey: ["company-catalog", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase
        .from("company_catalog")
        .select("*")
        .eq("company_id", selectedCompany)
        .order("category")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  // Fetch company drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ["company-drivers", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase
        .from("company_drivers")
        .select("*")
        .eq("company_id", selectedCompany)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  // Fetch company communications
  const { data: communications = [] } = useQuery({
    queryKey: ["company-communications", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase
        .from("company_communications")
        .select("*")
        .eq("company_id", selectedCompany)
        .is("parent_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });


  const replyMutation = useMutation({
    mutationFn: async ({ parentId, message }: { parentId: string; message: string }) => {
      if (!selectedCompany) throw new Error("No company");
      const parent = communications.find(c => c.id === parentId);
      const { error } = await supabase.from("company_communications").insert({
        company_id: selectedCompany,
        sender_id: (await supabase.auth.getUser()).data.user?.id || "",
        subject: `Re: ${parent?.subject || ""}`,
        message,
        direction: "incoming",
        priority: parent?.priority || "normal",
        parent_id: parentId,
        status: "unread",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-communications"] });
      setReplyDialogOpen(false);
      setReplyMessage("");
      setReplyTarget(null);
      toast({ title: language === "ar" ? "تم إرسال الرد" : "Reply sent" });
    },
    onError: () => {
      toast({ title: language === "ar" ? "فشل الإرسال" : "Failed to send", variant: "destructive" });
    },
  });

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (data: typeof companyForm) => {
      const { country_code, ...rest } = data;
      const { error } = await supabase.from("companies").insert({
        ...rest,
        country_code: country_code || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setShowCompanyForm(false);
      resetForm();
      toast({ title: language === "ar" ? "تم إنشاء الشركة" : "Company created" });
    },
    onError: () => {
      toast({ title: language === "ar" ? "فشل في إنشاء الشركة" : "Failed to create company", variant: "destructive" });
    },
  });

  // Update company status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CompanyStatus }) => {
      const { error } = await supabase
        .from("companies")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["company", selectedCompany] });
      toast({ title: language === "ar" ? "تم تحديث الحالة" : "Status updated" });
    },
  });

  const resetForm = () => {
    setCompanyForm({
      name: "",
      name_ar: "",
      type: "supplier",
      registration_number: "",
      tax_number: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      address_ar: "",
      city: "",
      country: "",
      country_code: "",
      postal_code: "",
      description: "",
      description_ar: "",
      credit_limit: 0,
      payment_terms: 30,
      currency: "SAR",
    });
  };

  const getTypeLabel = (type: CompanyType) => {
    const t = companyTypes.find(ct => ct.value === type);
    return language === "ar" ? t?.labelAr : t?.label;
  };

  const getStatusLabel = (status: CompanyStatus) => {
    const labels: Record<CompanyStatus, { en: string; ar: string }> = {
      active: { en: "Active", ar: "نشط" },
      inactive: { en: "Inactive", ar: "غير نشط" },
      pending: { en: "Pending", ar: "قيد الانتظار" },
      suspended: { en: "Suspended", ar: "معلق" },
    };
    return language === "ar" ? labels[status].ar : labels[status].en;
  };

  // Calculate stats
  const stats = {
    total: companies.length,
    active: companies.filter(c => c.status === "active").length,
    pending: companies.filter(c => c.status === "pending").length,
    sponsors: companies.filter(c => c.type === "sponsor").length,
    suppliers: companies.filter(c => c.type === "supplier").length,
  };

  // Calculate company balance
  const companyBalance = transactions.reduce((acc, t) => {
    if (t.type === "payment" || t.type === "credit" || t.type === "refund") {
      return acc + Number(t.amount);
    }
    if (t.type === "invoice" || t.type === "debit") {
      return acc - Number(t.amount);
    }
    return acc + Number(t.amount);
  }, 0);

  if (selectedCompany && companyDetails) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCompany(null)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-4">
              {companyDetails.logo_url ? (
                <img src={companyDetails.logo_url} alt={companyDetails.name} className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{companyDetails.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge className={statusColors[companyDetails.status as CompanyStatus]}>
                    {getStatusLabel(companyDetails.status)}
                  </Badge>
                  <Badge variant="outline">{getTypeLabel(companyDetails.type)}</Badge>
                  {companyDetails.country_code && (
                    <Badge variant="outline">
                      {countryFlag(companyDetails.country_code)} {companyDetails.country || companyDetails.country_code}
                    </Badge>
                  )}
                </div>
                {companyDetails.operating_countries && (companyDetails.operating_countries as string[]).length > 0 && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    <span className="text-xs text-muted-foreground">{language === "ar" ? "يعمل في:" : "Operates in:"}</span>
                    {(companyDetails.operating_countries as string[]).map((cc: string) => (
                      <Badge key={cc} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {countryFlag(cc)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {companyDetails.status === "pending" && (
              <Button onClick={() => updateStatusMutation.mutate({ id: companyDetails.id, status: "active" })}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {language === "ar" ? "تفعيل" : "Activate"}
              </Button>
            )}
            {companyDetails.status === "active" && (
              <Button variant="outline" onClick={() => updateStatusMutation.mutate({ id: companyDetails.id, status: "suspended" })}>
                <XCircle className="h-4 w-4 mr-2" />
                {language === "ar" ? "تعليق" : "Suspend"}
              </Button>
            )}
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              {language === "ar" ? "تعديل" : "Edit"}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "الرصيد" : "Balance"}</p>
                  <p className={`text-xl font-bold ${companyBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {companyBalance.toLocaleString()} {companyDetails.currency || "SAR"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "الطلبات" : "Orders"}</p>
                  <p className="text-xl font-bold">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <CalendarCheck className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "الدعوات" : "Invitations"}</p>
                  <p className="text-xl font-bold">{invitations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "التقييم" : "Rating"}</p>
                  <p className="text-xl font-bold">
                    {evaluations.length > 0
                      ? (evaluations.reduce((a, e) => a + Number(e.overall_rating || 0), 0) / evaluations.length).toFixed(1)
                      : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detail Tabs */}
        <Tabs value={companyDetailTab} onValueChange={setCompanyDetailTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">{language === "ar" ? "نظرة عامة" : "Overview"}</TabsTrigger>
            <TabsTrigger value="contacts">{language === "ar" ? "جهات الاتصال" : "Contacts"}</TabsTrigger>
            <TabsTrigger value="branches">{language === "ar" ? "الفروع" : "Branches"}</TabsTrigger>
            <TabsTrigger value="orders">{language === "ar" ? "الطلبات" : "Orders"}</TabsTrigger>
            <TabsTrigger value="transactions">{language === "ar" ? "الحساب" : "Account"}</TabsTrigger>
            <TabsTrigger value="invitations">{language === "ar" ? "الدعوات" : "Invitations"}</TabsTrigger>
            <TabsTrigger value="evaluations">{language === "ar" ? "التقييمات" : "Evaluations"}</TabsTrigger>
            <TabsTrigger value="catalog">{language === "ar" ? "الكتالوج" : "Catalog"}</TabsTrigger>
            <TabsTrigger value="drivers">{language === "ar" ? "السائقون" : "Drivers"}</TabsTrigger>
            <TabsTrigger value="communications">{language === "ar" ? "التواصل" : "Communications"}</TabsTrigger>
            <TabsTrigger value="media">{language === "ar" ? "الوسائط" : "Media"}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{language === "ar" ? "معلومات الشركة" : "Company Information"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {companyDetails.name_ar && (
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</p>
                      <p className="font-medium" dir="rtl">{companyDetails.name_ar}</p>
                    </div>
                  )}
                  {companyDetails.registration_number && (
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "رقم السجل" : "Registration #"}</p>
                      <p className="font-medium">{companyDetails.registration_number}</p>
                    </div>
                  )}
                  {companyDetails.tax_number && (
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "الرقم الضريبي" : "Tax Number"}</p>
                      <p className="font-medium">{companyDetails.tax_number}</p>
                    </div>
                  )}
                  {companyDetails.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "الوصف" : "Description"}</p>
                      <p>{companyDetails.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{language === "ar" ? "معلومات الاتصال" : "Contact Information"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {companyDetails.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{companyDetails.email}</span>
                    </div>
                  )}
                  {companyDetails.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{companyDetails.phone}</span>
                    </div>
                  )}
                  {companyDetails.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={companyDetails.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {companyDetails.website}
                      </a>
                    </div>
                  )}
                  {companyDetails.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p>{companyDetails.address}</p>
                        <p className="text-sm text-muted-foreground">
                          {[companyDetails.city, companyDetails.country].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{language === "ar" ? "الإعدادات المالية" : "Financial Settings"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "حد الائتمان" : "Credit Limit"}</p>
                      <p className="font-medium">{Number(companyDetails.credit_limit || 0).toLocaleString()} {companyDetails.currency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "شروط الدفع" : "Payment Terms"}</p>
                      <p className="font-medium">{companyDetails.payment_terms || 30} {language === "ar" ? "يوم" : "days"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{language === "ar" ? "ساعات العمل" : "Working Hours"}</CardTitle>
                </CardHeader>
                <CardContent>
                  {companyDetails.working_hours && Object.keys(companyDetails.working_hours).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(companyDetails.working_hours).map(([day, hours]: [string, any]) => (
                        <div key={day} className="flex justify-between">
                          <span className="capitalize">{day}</span>
                          <span className="text-muted-foreground">{hours}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{language === "ar" ? "لم يتم تحديد ساعات العمل" : "No working hours set"}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{language === "ar" ? "جهات الاتصال" : "Contacts"}</h3>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                {language === "ar" ? "إضافة جهة اتصال" : "Add Contact"}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact: any) => (
                <Card key={contact.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.title}</p>
                        <Badge variant="outline" className="mt-1">{contact.department}</Badge>
                      </div>
                      {contact.is_primary && (
                        <Badge className="bg-primary">{language === "ar" ? "أساسي" : "Primary"}</Badge>
                      )}
                    </div>
                    <Separator className="my-3" />
                    <div className="space-y-2 text-sm">
                      {contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                    </div>
                    {contact.can_login && (
                      <Badge variant="secondary" className="mt-3">
                        {language === "ar" ? "يمكنه تسجيل الدخول" : "Can login"}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
              {contacts.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{language === "ar" ? "لا توجد جهات اتصال" : "No contacts found"}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Branches Tab */}
          <TabsContent value="branches" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{language === "ar" ? "الفروع" : "Branches"}</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {language === "ar" ? "إضافة فرع" : "Add Branch"}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branches.map((branch: any) => (
                <Card key={branch.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{branch.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {[branch.city, branch.country].filter(Boolean).join(", ")}
                        </p>
                      </div>
                      {branch.is_headquarters && (
                        <Badge className="bg-primary">{language === "ar" ? "المقر الرئيسي" : "HQ"}</Badge>
                      )}
                    </div>
                    {branch.address && (
                      <p className="text-sm mt-2">{branch.address}</p>
                    )}
                    {branch.manager_name && (
                      <>
                        <Separator className="my-3" />
                        <div>
                          <p className="text-sm text-muted-foreground">{language === "ar" ? "مدير الفرع" : "Branch Manager"}</p>
                          <p className="font-medium">{branch.manager_name}</p>
                          {branch.manager_phone && <p className="text-sm">{branch.manager_phone}</p>}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
              {branches.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{language === "ar" ? "لا توجد فروع" : "No branches found"}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{language === "ar" ? "الطلبات" : "Orders"}</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {language === "ar" ? "طلب جديد" : "New Order"}
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "ar" ? "رقم الطلب" : "Order #"}</TableHead>
                      <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
                      <TableHead>{language === "ar" ? "الاتجاه" : "Direction"}</TableHead>
                      <TableHead>{language === "ar" ? "الفئة" : "Category"}</TableHead>
                      <TableHead>{language === "ar" ? "المبلغ" : "Amount"}</TableHead>
                      <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono">{order.order_number}</TableCell>
                        <TableCell>{order.title}</TableCell>
                        <TableCell>
                          <Badge variant={order.direction === "incoming" ? "default" : "secondary"}>
                            {order.direction === "incoming" 
                              ? (language === "ar" ? "وارد" : "Incoming")
                              : (language === "ar" ? "صادر" : "Outgoing")}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.category}</TableCell>
                        <TableCell>{Number(order.total_amount).toLocaleString()} {order.currency}</TableCell>
                        <TableCell>
                          <Badge>{order.status}</Badge>
                        </TableCell>
                        <TableCell>{format(new Date(order.created_at), "yyyy-MM-dd")}</TableCell>
                      </TableRow>
                    ))}
                    {orders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {language === "ar" ? "لا توجد طلبات" : "No orders found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{language === "ar" ? "كشف الحساب" : "Account Statement"}</h3>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "الرصيد الحالي:" : "Current Balance:"} 
                  <span className={`font-bold mx-2 ${companyBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {companyBalance.toLocaleString()} {companyDetails?.currency || "SAR"}
                  </span>
                </p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {language === "ar" ? "معاملة جديدة" : "New Transaction"}
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "ar" ? "رقم المعاملة" : "Transaction #"}</TableHead>
                      <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
                      <TableHead>{language === "ar" ? "الوصف" : "Description"}</TableHead>
                      <TableHead>{language === "ar" ? "المبلغ" : "Amount"}</TableHead>
                      <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono">{t.transaction_number}</TableCell>
                        <TableCell>
                          <Badge variant={["payment", "credit", "refund"].includes(t.type) ? "default" : "secondary"}>
                            {t.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{t.description || "-"}</TableCell>
                        <TableCell className={["payment", "credit", "refund"].includes(t.type) ? "text-green-600" : "text-red-600"}>
                          {["payment", "credit", "refund"].includes(t.type) ? "+" : "-"}{Number(t.amount).toLocaleString()} {t.currency}
                        </TableCell>
                        <TableCell>{format(new Date(t.created_at), "yyyy-MM-dd")}</TableCell>
                      </TableRow>
                    ))}
                    {transactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {language === "ar" ? "لا توجد معاملات" : "No transactions found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{language === "ar" ? "الدعوات" : "Invitations"}</h3>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                {language === "ar" ? "دعوة جديدة" : "New Invitation"}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invitations.map((inv: any) => (
                <Card key={inv.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{inv.title}</p>
                        <p className="text-sm text-muted-foreground">{inv.invitation_type}</p>
                      </div>
                      <Badge className={
                        inv.status === "accepted" ? "bg-green-500" :
                        inv.status === "declined" ? "bg-red-500" :
                        inv.status === "expired" ? "bg-gray-500" : "bg-yellow-500"
                      }>
                        {inv.status}
                      </Badge>
                    </div>
                    {inv.description && (
                      <p className="text-sm mt-2">{inv.description}</p>
                    )}
                    <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                      <span>{format(new Date(inv.created_at), "yyyy-MM-dd")}</span>
                      {inv.expires_at && (
                        <span>{language === "ar" ? "ينتهي:" : "Expires:"} {format(new Date(inv.expires_at), "yyyy-MM-dd")}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {invitations.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <CalendarCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{language === "ar" ? "لا توجد دعوات" : "No invitations found"}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Evaluations Tab */}
          <TabsContent value="evaluations" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{language === "ar" ? "التقييمات" : "Evaluations"}</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {language === "ar" ? "تقييم جديد" : "New Evaluation"}
              </Button>
            </div>
            <div className="space-y-4">
              {evaluations.map((ev: any) => (
                <Card key={ev.id}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">{language === "ar" ? "الجودة" : "Quality"}</p>
                        <p className="text-2xl font-bold">{ev.quality_rating}/5</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">{language === "ar" ? "التوصيل" : "Delivery"}</p>
                        <p className="text-2xl font-bold">{ev.delivery_rating}/5</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">{language === "ar" ? "التواصل" : "Communication"}</p>
                        <p className="text-2xl font-bold">{ev.communication_rating}/5</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">{language === "ar" ? "القيمة" : "Value"}</p>
                        <p className="text-2xl font-bold">{ev.value_rating}/5</p>
                      </div>
                    </div>
                    {ev.review && (
                      <>
                        <Separator className="my-4" />
                        <p>{ev.review}</p>
                      </>
                    )}
                    <p className="text-sm text-muted-foreground mt-4">
                      {format(new Date(ev.created_at), "yyyy-MM-dd")}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {evaluations.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{language === "ar" ? "لا توجد تقييمات" : "No evaluations found"}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Catalog Tab */}
          <TabsContent value="catalog" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{language === "ar" ? "كتالوج المنتجات" : "Product Catalog"}</h3>
            </div>
            {catalogItems.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "ar" ? "المنتج" : "Product"}</TableHead>
                        <TableHead>{language === "ar" ? "الفئة" : "Category"}</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>{language === "ar" ? "السعر" : "Price"}</TableHead>
                        <TableHead>{language === "ar" ? "الكمية" : "Qty"}</TableHead>
                        <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {catalogItems.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.name_ar && <p className="text-xs text-muted-foreground" dir="rtl">{item.name_ar}</p>}
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                          <TableCell className="font-mono text-xs">{item.sku || "-"}</TableCell>
                          <TableCell>
                            {item.unit_price != null ? `${Number(item.unit_price).toLocaleString()} ${item.currency || "SAR"}` : "-"}
                            {item.unit && <span className="text-xs text-muted-foreground"> / {item.unit}</span>}
                          </TableCell>
                          <TableCell>{item.quantity_available ?? "-"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Badge variant={item.is_active ? "default" : "secondary"}>
                                {item.is_active ? (language === "ar" ? "نشط" : "Active") : (language === "ar" ? "غير نشط" : "Inactive")}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{language === "ar" ? "لا توجد منتجات في الكتالوج" : "No catalog items"}</p>
              </div>
            )}
          </TabsContent>

          {/* Drivers Tab */}
          <TabsContent value="drivers" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{language === "ar" ? "السائقون" : "Drivers"}</h3>
            </div>
            {drivers.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "ar" ? "الاسم" : "Name"}</TableHead>
                        <TableHead>{language === "ar" ? "الهاتف" : "Phone"}</TableHead>
                        <TableHead>{language === "ar" ? "نوع المركبة" : "Vehicle"}</TableHead>
                        <TableHead>{language === "ar" ? "لوحة المركبة" : "Plate"}</TableHead>
                        <TableHead>{language === "ar" ? "رقم الرخصة" : "License #"}</TableHead>
                        <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drivers.map((driver: any) => (
                        <TableRow key={driver.id}>
                          <TableCell className="font-medium">{driver.name}</TableCell>
                          <TableCell>{driver.phone}</TableCell>
                          <TableCell>{driver.vehicle_type || "-"}</TableCell>
                          <TableCell>{driver.vehicle_plate || "-"}</TableCell>
                          <TableCell className="font-mono text-xs">{driver.license_number || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={driver.is_available ? "default" : "secondary"}>
                              {driver.is_available
                                ? (language === "ar" ? "متاح" : "Available")
                                : (language === "ar" ? "غير متاح" : "Unavailable")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{language === "ar" ? "لا يوجد سائقون" : "No drivers found"}</p>
              </div>
            )}
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{language === "ar" ? "مكتبة الوسائط" : "Media Library"}</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {language === "ar" ? "رفع ملف" : "Upload File"}
              </Button>
            </div>
            <div className="text-center py-12 text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{language === "ar" ? "لا توجد ملفات" : "No files found"}</p>
            </div>
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent value="communications" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {language === "ar" ? "رسائل الشركة" : "Company Messages"}
                {communications.filter(c => c.direction === "outgoing" && c.status === "unread").length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {communications.filter(c => c.direction === "outgoing" && c.status === "unread").length}
                  </Badge>
                )}
              </h3>
            </div>
            {communications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{language === "ar" ? "لا توجد رسائل" : "No messages"}</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "ar" ? "الاتجاه" : "Direction"}</TableHead>
                      <TableHead>{language === "ar" ? "الموضوع" : "Subject"}</TableHead>
                      <TableHead>{language === "ar" ? "الأولوية" : "Priority"}</TableHead>
                      <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {communications.map((msg) => (
                      <TableRow key={msg.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {msg.direction === "outgoing"
                              ? language === "ar" ? "من الشركة" : "From Company"
                              : language === "ar" ? "من الإدارة" : "From Admin"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{msg.subject}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[300px]">{msg.message}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {msg.priority === "urgent" ? (
                            <Badge variant="destructive">{language === "ar" ? "عاجل" : "Urgent"}</Badge>
                          ) : msg.priority === "high" ? (
                            <Badge className="bg-orange-500">{language === "ar" ? "مرتفع" : "High"}</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">{msg.priority}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={msg.status === "unread" ? "default" : "secondary"}>
                            {msg.status === "unread"
                              ? language === "ar" ? "غير مقروءة" : "Unread"
                              : language === "ar" ? "مقروءة" : "Read"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{format(new Date(msg.created_at), "yyyy-MM-dd HH:mm")}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReplyTarget(msg.id);
                              setReplyDialogOpen(true);
                            }}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            {language === "ar" ? "رد" : "Reply"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}

            {/* Reply Dialog */}
            {replyDialogOpen && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-base">{language === "ar" ? "رد على الرسالة" : "Reply to Message"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={4}
                    placeholder={language === "ar" ? "اكتب ردك هنا..." : "Type your reply here..."}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => { setReplyDialogOpen(false); setReplyMessage(""); setReplyTarget(null); }}>
                      {language === "ar" ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button
                      disabled={!replyMessage || replyMutation.isPending}
                      onClick={() => replyTarget && replyMutation.mutate({ parentId: replyTarget, message: replyMessage })}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {replyMutation.isPending ? (language === "ar" ? "جارٍ الإرسال..." : "Sending...") : (language === "ar" ? "إرسال" : "Send")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          {language === "ar" ? "إدارة الشركات" : "Company Management"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === "ar"
            ? "إدارة الرعاة والموردين والشركاء"
            : "Manage sponsors, suppliers, and partners"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "إجمالي الشركات" : "Total Companies"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "نشطة" : "Active"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "قيد الانتظار" : "Pending"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.sponsors}</p>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "رعاة" : "Sponsors"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.suppliers}</p>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "موردين" : "Suppliers"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {showCompanyForm ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => { setShowCompanyForm(false); resetForm(); }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle>{language === "ar" ? "إضافة شركة جديدة" : "Add New Company"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "ar" ? "اسم الشركة (إنجليزي)" : "Company Name (English)"} *</Label>
                <Input
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  placeholder="Company Name"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "اسم الشركة (عربي)" : "Company Name (Arabic)"}</Label>
                <Input
                  value={companyForm.name_ar}
                  onChange={(e) => setCompanyForm({ ...companyForm, name_ar: e.target.value })}
                  placeholder="اسم الشركة"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{language === "ar" ? "نوع الشركة" : "Company Type"} *</Label>
                <Select
                  value={companyForm.type}
                  onValueChange={(v) => setCompanyForm({ ...companyForm, type: v as CompanyType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {companyTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {language === "ar" ? type.labelAr : type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "رقم السجل التجاري" : "Registration Number"}</Label>
                <Input
                  value={companyForm.registration_number}
                  onChange={(e) => setCompanyForm({ ...companyForm, registration_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "الرقم الضريبي" : "Tax Number"}</Label>
                <Input
                  value={companyForm.tax_number}
                  onChange={(e) => setCompanyForm({ ...companyForm, tax_number: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{language === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
                <Input
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "الهاتف" : "Phone"}</Label>
                <Input
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "الموقع الإلكتروني" : "Website"}</Label>
                <Input
                  value={companyForm.website}
                  onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "ar" ? "العنوان (إنجليزي)" : "Address (English)"}</Label>
                <Textarea
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "العنوان (عربي)" : "Address (Arabic)"}</Label>
                <Textarea
                  value={companyForm.address_ar}
                  onChange={(e) => setCompanyForm({ ...companyForm, address_ar: e.target.value })}
                  rows={2}
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{language === "ar" ? "المدينة" : "City"}</Label>
                <Input
                  value={companyForm.city}
                  onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                />
              </div>
              <CountrySelector
                value={companyForm.country_code}
                onChange={(code, country) => {
                  const name = language === "ar" ? (country?.name_ar || country?.name || "") : (country?.name || "");
                  setCompanyForm({ ...companyForm, country_code: code, country: name, currency: country?.currency_code || companyForm.currency });
                }}
                label={language === "ar" ? "الدولة (المقر الرئيسي)" : "Country (Home)"}
                required
              />
              <div className="space-y-2">
                <Label>{language === "ar" ? "الرمز البريدي" : "Postal Code"}</Label>
                <Input
                  value={companyForm.postal_code}
                  onChange={(e) => setCompanyForm({ ...companyForm, postal_code: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{language === "ar" ? "حد الائتمان" : "Credit Limit"}</Label>
                <Input
                  type="number"
                  value={companyForm.credit_limit}
                  onChange={(e) => setCompanyForm({ ...companyForm, credit_limit: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "شروط الدفع (أيام)" : "Payment Terms (days)"}</Label>
                <Input
                  type="number"
                  value={companyForm.payment_terms}
                  onChange={(e) => setCompanyForm({ ...companyForm, payment_terms: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "العملة" : "Currency"}</Label>
                <Select
                  value={companyForm.currency}
                  onValueChange={(v) => setCompanyForm({ ...companyForm, currency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">SAR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "ar" ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
                <Textarea
                  value={companyForm.description}
                  onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                <Textarea
                  value={companyForm.description_ar}
                  onChange={(e) => setCompanyForm({ ...companyForm, description_ar: e.target.value })}
                  rows={3}
                  dir="rtl"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => createCompanyMutation.mutate(companyForm)} disabled={!companyForm.name}>
                <Save className="h-4 w-4 mr-2" />
                {language === "ar" ? "حفظ الشركة" : "Save Company"}
              </Button>
              <Button variant="outline" onClick={() => { setShowCompanyForm(false); resetForm(); }}>
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
              <CardTitle>{language === "ar" ? "جميع الشركات" : "All Companies"}</CardTitle>
              <Button onClick={() => setShowCompanyForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {language === "ar" ? "شركة جديدة" : "New Company"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === "ar" ? "بحث بالاسم أو البريد..." : "Search by name or email..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={language === "ar" ? "النوع" : "Type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "ar" ? "جميع الأنواع" : "All Types"}</SelectItem>
                  {companyTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {language === "ar" ? type.labelAr : type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={language === "ar" ? "الحالة" : "Status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "ar" ? "جميع الحالات" : "All Status"}</SelectItem>
                  <SelectItem value="active">{language === "ar" ? "نشط" : "Active"}</SelectItem>
                  <SelectItem value="pending">{language === "ar" ? "قيد الانتظار" : "Pending"}</SelectItem>
                  <SelectItem value="inactive">{language === "ar" ? "غير نشط" : "Inactive"}</SelectItem>
                  <SelectItem value="suspended">{language === "ar" ? "معلق" : "Suspended"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "الشركة" : "Company"}</TableHead>
                    <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
                    <TableHead>{language === "ar" ? "الاتصال" : "Contact"}</TableHead>
                    <TableHead>{language === "ar" ? "الموقع" : "Location"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedCompany(company.id)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {company.logo_url ? (
                            <img src={company.logo_url} alt={company.name} className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{company.name}</p>
                            {company.company_number && <p className="text-xs text-muted-foreground font-mono">{company.company_number}</p>}
                            {!company.company_number && company.name_ar && <p className="text-sm text-muted-foreground" dir="rtl">{company.name_ar}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTypeLabel(company.type)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {company.email && <p>{company.email}</p>}
                          {company.phone && <p className="text-muted-foreground">{company.phone}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.country_code ? `${countryFlag(company.country_code)} ` : ""}{[company.city, company.country].filter(Boolean).join(", ") || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[company.status]}>
                          {getStatusLabel(company.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(company.created_at), "yyyy-MM-dd")}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {companies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>{language === "ar" ? "لا توجد شركات" : "No companies found"}</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
