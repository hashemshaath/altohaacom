import { useIsAr } from "@/hooks/useIsAr";
import { useState, Suspense } from "react";
import { safeLazy } from "@/lib/safeLazy";
import { EntityFormGuard } from "@/components/admin/EntityFormGuard";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTableCard } from "@/components/admin/AdminTableCard";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useTableSort } from "@/hooks/useTableSort";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useCSVExport } from "@/hooks/useCSVExport";
import { usePagination } from "@/hooks/usePagination";
import { AdminTablePagination } from "@/components/admin/AdminTablePagination";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { useAllCountries } from "@/hooks/useCountries";
import { countryFlag } from "@/lib/countryFlag";

const BulkImportPanel = safeLazy(() => import("@/components/admin/BulkImportPanel").then(m => ({ default: m.BulkImportPanel })));
const BatchDuplicateScanner = safeLazy(() => import("@/components/admin/BatchDuplicateScanner").then(m => ({ default: m.BatchDuplicateScanner })));
const CompanyFinanceWidget = safeLazy(() => import("@/components/admin/CompanyFinanceWidget").then(m => ({ default: m.CompanyFinanceWidget })));
const AdminSupplierControls = safeLazy(() => import("@/components/admin/AdminSupplierControls").then(m => ({ default: m.AdminSupplierControls })));
const AdminReviewsModeration = safeLazy(() => import("@/components/admin/AdminReviewsModeration").then(m => ({ default: m.AdminReviewsModeration })));
const CompanyAnalyticsWidget = safeLazy(() => import("@/components/admin/CompanyAnalyticsWidget").then(m => ({ default: m.CompanyAnalyticsWidget })));

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, Plus, Eye, CheckCircle, XCircle, Clock, Save, X,
  Truck, Star, Upload, Sparkles, FileSpreadsheet, Factory,
} from "lucide-react";
import { SmartImportDialog, type ImportedData } from "@/components/smart-import/SmartImportDialog";
import { SortableTableHead } from "@/components/admin/SortableTableHead";
import { CompanyLiveStatsWidget } from "@/components/admin/CompanyLiveStatsWidget";
import { format } from "date-fns";

import { CompanyDetailView } from "./companies/CompanyDetailView";
import { type Company, type CompanyType, type CompanyStatus, COMPANY_TYPES, getTypeLabel, getStatusLabel } from "./companies/companiesAdminTypes";
import { QUERY_LIMIT_LARGE } from "@/lib/constants";

export default function CompaniesAdmin() {
  const isAr = useIsAr();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showDedupScanner, setShowDedupScanner] = useState(false);
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [mainTab, setMainTab] = useState<"companies" | "suppliers" | "reviews">("companies");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [companyForm, setCompanyForm] = useState({
    name: "", name_ar: "", type: "supplier" as CompanyType,
    registration_number: "", tax_number: "", email: "", phone: "", website: "",
    address: "", address_ar: "", city: "", country: "", country_code: "",
    postal_code: "", description: "", description_ar: "",
    credit_limit: 0, payment_terms: 30, currency: "SAR",
  });

  const { data: allCountries = [] } = useAllCountries();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies", searchQuery, typeFilter, statusFilter],
    queryFn: async () => {
      let query = supabase.from("companies").select("id, name, name_ar, type, status, company_number, email, phone, city, country, country_code, operating_countries, logo_url, created_at, import_source, rating, neighborhood, google_maps_url, latitude, longitude").order("created_at", { ascending: false }).limit(QUERY_LIMIT_LARGE);
      if (searchQuery) query = query.or(`name.ilike.%${searchQuery}%,name_ar.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      if (typeFilter !== "all") query = query.eq("type", typeFilter as CompanyType);
      if (statusFilter !== "all") query = query.eq("status", statusFilter as CompanyStatus);
      const { data, error } = await query;
      if (error) throw error;
      return data as Company[];
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: typeof companyForm) => {
      const { country_code, ...rest } = data;
      const { error } = await supabase.from("companies").insert({ ...rest, country_code: country_code || null, status: "pending" });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setShowCompanyForm(false);
      import("@/lib/notificationTriggers").then(({ notifyAdminCompanyRegistration }) => {
        notifyAdminCompanyRegistration({ companyName: variables.name, companyNameAr: variables.name_ar || undefined, submittedBy: "Admin" });
      });
      resetCompanyForm();
      toast({ title: isAr ? "تم إنشاء الشركة" : "Company created" });
    },
    onError: () => toast({ title: isAr ? "فشل في إنشاء الشركة" : "Failed to create company", variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CompanyStatus }) => {
      const { error } = await supabase.from("companies").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
    },
  });

  const resetCompanyForm = () => {
    setCompanyForm({
      name: "", name_ar: "", type: "supplier", registration_number: "", tax_number: "",
      email: "", phone: "", website: "", address: "", address_ar: "", city: "",
      country: "", country_code: "", postal_code: "", description: "", description_ar: "",
      credit_limit: 0, payment_terms: 30, currency: "SAR",
    });
  };

  const handleAITranslate = async (textAr: string, setter: (enText: string) => void) => {
    if (!textAr.trim()) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-translate-seo", {
        body: { text: textAr, source_lang: "ar", target_lang: "en", optimize_seo: true },
      });
      if (error) throw error;
      if (data?.translated) setter(data.translated);
      else toast({ variant: "destructive", title: isAr ? "لم يتم الترجمة" : "Translation failed" });
    } catch {
      toast({ variant: "destructive", title: isAr ? "خدمة الترجمة غير متاحة حالياً" : "Translation service unavailable" });
    }
    setAiLoading(false);
  };

  const AIButton = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
    <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={disabled || aiLoading} className="gap-1">
      <Sparkles className="h-3 w-3" />
      {aiLoading ? "..." : isAr ? "ترجمة + SEO" : "Translate + SEO"}
    </Button>
  );

  const stats = {
    total: companies.length,
    active: companies.filter(c => c.status === "active").length,
    pending: companies.filter(c => c.status === "pending").length,
    sponsors: companies.filter(c => c.type === "sponsor").length,
    suppliers: companies.filter(c => c.type === "supplier").length,
  };

  const { sorted: sortedCompanies, sortColumn, sortDirection, toggleSort } = useTableSort(companies, "created_at", "desc");
  const companyPagination = usePagination(sortedCompanies, { defaultPageSize: 15 });
  const bulk = useAdminBulkActions(sortedCompanies);

  const { exportCSV: exportCompaniesCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الاسم" : "Name", accessor: (c: Company) => c.name },
      { header: isAr ? "الاسم (AR)" : "Name (AR)", accessor: (c: Company) => c.name_ar || "" },
      { header: isAr ? "النوع" : "Type", accessor: (c: Company) => getTypeLabel(c.type, isAr) || c.type },
      { header: isAr ? "الحالة" : "Status", accessor: (c: Company) => getStatusLabel(c.status, isAr) },
      { header: isAr ? "البريد" : "Email", accessor: (c: Company) => c.email || "" },
      { header: isAr ? "الهاتف" : "Phone", accessor: (c: Company) => c.phone || "" },
      { header: isAr ? "المدينة" : "City", accessor: (c: Company) => c.city || "" },
      { header: isAr ? "الدولة" : "Country", accessor: (c: Company) => c.country || "" },
      { header: isAr ? "التاريخ" : "Created", accessor: (c: Company) => c.created_at?.split("T")[0] || "" },
    ],
    filename: "companies",
  });

  const bulkActivate = async () => {
    const ids = [...bulk.selected];
    const { error } = await supabase.from("companies").update({ status: "active" as any }).in("id", ids);
    if (!error) { queryClient.invalidateQueries({ queryKey: ["companies"] }); bulk.clearSelection(); toast({ title: isAr ? `تم تفعيل ${ids.length} شركة` : `Activated ${ids.length} companies` }); }
  };

  const bulkSuspend = async () => {
    if (!confirm(isAr ? "هل أنت متأكد من تعليق الشركات المحددة؟" : "Suspend selected companies?")) return;
    const ids = [...bulk.selected];
    const { error } = await supabase.from("companies").update({ status: "suspended" as any }).in("id", ids);
    if (!error) { queryClient.invalidateQueries({ queryKey: ["companies"] }); bulk.clearSelection(); toast({ title: isAr ? `تم تعليق ${ids.length} شركة` : `Suspended ${ids.length} companies` }); }
  };

  // ══════════════════════════════════════════════════════════
  // COMPANY DETAIL VIEW (extracted)
  // ══════════════════════════════════════════════════════════
  if (selectedCompany) {
    return <CompanyDetailView companyId={selectedCompany} onBack={() => setSelectedCompany(null)} />;
  }

  // ══════════════════════════════════════════════════════════
  // COMPANIES LIST VIEW
  // ══════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          {isAr ? "إدارة الشركات" : "Company Management"}
        </h1>
        <p className="text-muted-foreground mt-1">{isAr ? "إدارة الشركات والرعاة والموردين والشركاء - موحّدة" : "Unified management for companies, sponsors, suppliers & partners"}</p>
      </div>

      <CompanyFinanceWidget />

      <div className="flex flex-wrap gap-2">
        <Button variant={showDedupScanner ? "secondary" : "outline"} size="sm" onClick={() => { setShowDedupScanner(!showDedupScanner); if (showBulkImport) setShowBulkImport(false); }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="me-2 h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          {isAr ? "فاحص التكرارات" : "Dedup Scanner"}
        </Button>
        <Button variant={showBulkImport ? "secondary" : "outline"} size="sm" onClick={() => setShowBulkImport(!showBulkImport)}>
          <FileSpreadsheet className="me-2 h-4 w-4" />
          {isAr ? "استيراد جماعي" : "Bulk Import"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => {
          const csv = ["Name,Name (AR),Type,Status,Email,Phone,City,Country,Company Number,Created"];
          companies.forEach(c => { csv.push([c.name, c.name_ar || "", c.type, c.status, c.email || "", c.phone || "", c.city || "", c.country || "", c.company_number || "", c.created_at?.slice(0, 10) || ""].join(",")); });
          const blob = new Blob([csv.join("\n")], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = `companies-export-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click(); URL.revokeObjectURL(url);
        }}>
          <Upload className="me-2 h-4 w-4 rotate-180" />
          {isAr ? "تصدير CSV" : "Export CSV"}
        </Button>
      </div>
      {showBulkImport && (<BulkImportPanel entityType="company" onImportComplete={() => { setShowBulkImport(false); queryClient.invalidateQueries({ queryKey: ["companies"] }); }} />)}
      {showDedupScanner && (<BatchDuplicateScanner defaultTable="companies" onMergeComplete={() => queryClient.invalidateQueries({ queryKey: ["companies"] })} />)}

      {showCompanyForm ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => { setShowCompanyForm(false); resetCompanyForm(); }}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></Button>
              <CardTitle>{isAr ? "إضافة شركة جديدة" : "Add New Company"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <EntityFormGuard
              entity={{ name: companyForm.name, name_ar: companyForm.name_ar, email: companyForm.email, phone: companyForm.phone, website: companyForm.website, city: companyForm.city, country: companyForm.country }}
              tables={["companies", "organizers", "culinary_entities", "establishments"]}
              translationFields={[
                { en: companyForm.name, ar: companyForm.name_ar, key: "name" },
                { en: companyForm.description, ar: companyForm.description_ar, key: "description" },
                { en: companyForm.address, ar: companyForm.address_ar, key: "address" },
              ]}
              translationContext="company / business / food industry supplier"
              onTranslated={(u) => setCompanyForm(f => ({ ...f, ...u }))}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{isAr ? "اسم الشركة (EN)" : "Company Name (EN)"} *</Label>
                  <AIButton onClick={() => handleAITranslate(companyForm.name_ar, v => setCompanyForm(f => ({ ...f, name: v })))} />
                </div>
                <Input value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} placeholder="Company Name" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "اسم الشركة (AR)" : "Company Name (AR)"}</Label>
                <Input value={companyForm.name_ar} onChange={e => setCompanyForm({ ...companyForm, name_ar: e.target.value })} placeholder="اسم الشركة" dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{isAr ? "نوع الشركة" : "Company Type"} *</Label>
                <Select value={companyForm.type} onValueChange={v => setCompanyForm({ ...companyForm, type: v as CompanyType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{COMPANY_TYPES.map(type => <SelectItem key={type.value} value={type.value}>{isAr ? type.labelAr : type.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>{isAr ? "رقم السجل التجاري" : "Registration Number"}</Label><Input value={companyForm.registration_number} onChange={e => setCompanyForm({ ...companyForm, registration_number: e.target.value })} /></div>
              <div className="space-y-2"><Label>{isAr ? "الرقم الضريبي" : "Tax Number"}</Label><Input value={companyForm.tax_number} onChange={e => setCompanyForm({ ...companyForm, tax_number: e.target.value })} /></div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label><Input type="email" value={companyForm.email} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>{isAr ? "الهاتف" : "Phone"}</Label><Input value={companyForm.phone} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label>{isAr ? "الموقع الإلكتروني" : "Website"}</Label><Input value={companyForm.website} onChange={e => setCompanyForm({ ...companyForm, website: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{isAr ? "العنوان (EN)" : "Address (EN)"}</Label>
                  <AIButton onClick={() => handleAITranslate(companyForm.address_ar, v => setCompanyForm(f => ({ ...f, address: v })))} />
                </div>
                <Textarea value={companyForm.address} onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2"><Label>{isAr ? "العنوان (AR)" : "Address (AR)"}</Label><Textarea value={companyForm.address_ar} onChange={e => setCompanyForm({ ...companyForm, address_ar: e.target.value })} rows={2} dir="rtl" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{isAr ? "الدولة" : "Country"}</Label>
                <CountrySelector value={companyForm.country_code} onChange={v => {
                  const c = allCountries.find(ct => ct.code === v);
                  setCompanyForm(f => ({ ...f, country_code: v, country: c?.name || f.country }));
                }} />
              </div>
              <div className="space-y-2"><Label>{isAr ? "المدينة" : "City"}</Label><Input value={companyForm.city} onChange={e => setCompanyForm({ ...companyForm, city: e.target.value })} /></div>
              <div className="space-y-2"><Label>{isAr ? "الرمز البريدي" : "Postal Code"}</Label><Input value={companyForm.postal_code} onChange={e => setCompanyForm({ ...companyForm, postal_code: e.target.value })} /></div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>{isAr ? "حد الائتمان" : "Credit Limit"}</Label><Input type="number" value={companyForm.credit_limit} onChange={e => setCompanyForm({ ...companyForm, credit_limit: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>{isAr ? "شروط الدفع (أيام)" : "Payment Terms (days)"}</Label><Input type="number" value={companyForm.payment_terms} onChange={e => setCompanyForm({ ...companyForm, payment_terms: Number(e.target.value) })} /></div>
              <div className="space-y-2">
                <Label>{isAr ? "العملة" : "Currency"}</Label>
                <Select value={companyForm.currency} onValueChange={v => setCompanyForm({ ...companyForm, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">SAR</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="AED">AED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{isAr ? "الوصف (EN)" : "Description (EN)"}</Label>
                  <AIButton onClick={() => handleAITranslate(companyForm.description_ar, v => setCompanyForm(f => ({ ...f, description: v })))} />
                </div>
                <Textarea value={companyForm.description} onChange={e => setCompanyForm({ ...companyForm, description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2"><Label>{isAr ? "الوصف (AR)" : "Description (AR)"}</Label><Textarea value={companyForm.description_ar} onChange={e => setCompanyForm({ ...companyForm, description_ar: e.target.value })} rows={3} dir="rtl" /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => createCompanyMutation.mutate(companyForm)} disabled={!companyForm.name}><Save className="h-4 w-4 me-2" />{isAr ? "حفظ الشركة" : "Save Company"}</Button>
              <Button variant="outline" onClick={() => { setShowCompanyForm(false); resetCompanyForm(); }}><X className="h-4 w-4 me-2" />{isAr ? "إلغاء" : "Cancel"}</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
      <div className="space-y-6">
        <div className="flex gap-2 border-b pb-3">
          <Button variant={mainTab === "companies" ? "default" : "outline"} size="sm" onClick={() => setMainTab("companies")}>
            <Building2 className="me-1.5 h-3.5 w-3.5" />{isAr ? "الشركات" : "Companies"}
          </Button>
          <Button variant={mainTab === "suppliers" ? "default" : "outline"} size="sm" onClick={() => setMainTab("suppliers")}>
            <Factory className="me-1.5 h-3.5 w-3.5" />{isAr ? "الموردون المحترفون" : "Pro Suppliers"}
          </Button>
          <Button variant={mainTab === "reviews" ? "default" : "outline"} size="sm" onClick={() => setMainTab("reviews")}>
            <Star className="me-1.5 h-3.5 w-3.5" />{isAr ? "التقييمات" : "Reviews"}
          </Button>
        </div>

        {mainTab === "suppliers" ? (
          <AdminSupplierControls />
        ) : mainTab === "reviews" ? (
          <AdminReviewsModeration />
        ) : (
        <>
        {stats.pending > 0 && (
          <Card className="border-chart-4/50 bg-chart-4/5">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-chart-4/15"><Clock className="h-6 w-6 text-chart-4" /></div>
              <div className="flex-1">
                <h3 className="font-semibold text-chart-4">{isAr ? `${stats.pending} شركات بانتظار الموافقة` : `${stats.pending} Companies Pending Approval`}</h3>
                <p className="text-sm text-muted-foreground">{isAr ? "يرجى مراجعة الطلبات والموافقة عليها أو رفضها" : "Please review and approve or reject these requests"}</p>
              </div>
              <Button variant="outline" className="border-chart-4/30 text-chart-4 hover:bg-chart-4/10" onClick={() => setStatusFilter("pending")}>
                <Eye className="h-4 w-4 me-2" />{isAr ? "عرض الطلبات" : "View Requests"}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: isAr ? "الإجمالي" : "Total", value: stats.total, icon: Building2, color: "primary" },
            { label: isAr ? "نشط" : "Active", value: stats.active, icon: CheckCircle, color: "chart-5" },
            { label: isAr ? "قيد الانتظار" : "Pending", value: stats.pending, icon: Clock, color: "chart-4" },
            { label: isAr ? "الرعاة" : "Sponsors", value: stats.sponsors, icon: Star, color: "chart-3" },
            { label: isAr ? "الموردون" : "Suppliers", value: stats.suppliers, icon: Truck, color: "chart-2" },
          ].map(s => (
            <Card key={s.label} className="rounded-2xl border-border/40 group hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl bg-${s.color}/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                    <s.icon className={`h-5 w-5 text-${s.color}`} />
                  </div>
                  <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <CompanyLiveStatsWidget />
        <CompanyAnalyticsWidget />

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setShowCompanyForm(true)}><Plus className="h-4 w-4 me-2" />{isAr ? "شركة جديدة" : "New Company"}</Button>
          <Button variant="outline" onClick={() => setShowSmartImport(true)}><Sparkles className="h-4 w-4 me-2" />{isAr ? "استيراد ذكي" : "Smart Import"}</Button>
          <Button variant="outline" onClick={() => setShowBulkImport(!showBulkImport)}><Upload className="h-4 w-4 me-2" />{isAr ? "استيراد" : "Import"}</Button>
          <Button variant="outline" onClick={() => exportCompaniesCSV(bulk.count > 0 ? bulk.selectedItems : companies)}><FileSpreadsheet className="h-4 w-4 me-2" />{isAr ? "تصدير CSV" : "Export CSV"}</Button>
        </div>

        {showBulkImport && <BulkImportPanel entityType="company" />}

        <AdminFilterBar searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder={isAr ? "بحث بالاسم أو البريد..." : "Search by name or email..."}>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] rounded-xl h-9 text-sm"><SelectValue placeholder={isAr ? "النوع" : "Type"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "جميع الأنواع" : "All Types"}</SelectItem>
              {COMPANY_TYPES.map(type => <SelectItem key={type.value} value={type.value}>{isAr ? type.labelAr : type.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] rounded-xl h-9 text-sm"><SelectValue placeholder={isAr ? "الحالة" : "Status"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "جميع الحالات" : "All Status"}</SelectItem>
              <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
              <SelectItem value="pending">{isAr ? "قيد الانتظار" : "Pending"}</SelectItem>
              <SelectItem value="inactive">{isAr ? "غير نشط" : "Inactive"}</SelectItem>
              <SelectItem value="suspended">{isAr ? "معلق" : "Suspended"}</SelectItem>
            </SelectContent>
          </Select>
        </AdminFilterBar>

        <BulkActionBar count={bulk.count} onClear={bulk.clearSelection} onStatusChange={bulkActivate} onDelete={bulkSuspend} onExport={() => exportCompaniesCSV(bulk.selectedItems)} />

        <AdminTableCard>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 bg-muted/30"><Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} /></TableHead>
                  <SortableTableHead className="bg-muted/30" column="name" label={isAr ? "الشركة" : "Company"} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                  <SortableTableHead className="bg-muted/30" column="type" label={isAr ? "النوع" : "Type"} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                  <TableHead className="bg-muted/30">{isAr ? "الاتصال" : "Contact"}</TableHead>
                  <SortableTableHead className="bg-muted/30" column="country" label={isAr ? "الموقع" : "Location"} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                  <SortableTableHead className="bg-muted/30" column="status" label={isAr ? "الحالة" : "Status"} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                  <SortableTableHead className="bg-muted/30" column="created_at" label={isAr ? "التاريخ" : "Date"} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                  <TableHead className="bg-muted/30"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyPagination.paginated.map(company => (
                  <TableRow key={company.id} className={`cursor-pointer hover:bg-accent/30 transition-colors ${bulk.isSelected(company.id) ? "bg-primary/5" : ""}`} onClick={() => setSelectedCompany(company.id)}>
                    <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={bulk.isSelected(company.id)} onCheckedChange={() => bulk.toggleOne(company.id)} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {company.logo_url ? <img loading="lazy" decoding="async" src={company.logo_url} alt={company.name} className="h-10 w-10 rounded-xl object-cover" /> : <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center"><Building2 className="h-5 w-5 text-muted-foreground" /></div>}
                        <div>
                          <p className="font-medium">{isAr && company.name_ar ? company.name_ar : company.name}</p>
                          {company.company_number && <p className="text-xs text-muted-foreground font-mono">{company.company_number}</p>}
                          {(isAr ? company.name : company.name_ar) && <p className="text-sm text-muted-foreground" dir={isAr ? "ltr" : "rtl"}>{isAr ? company.name : company.name_ar}</p>}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {company.import_source === 'smart_import' && (<Badge variant="outline" className="text-[12px] px-1 py-0 h-4 gap-0.5 bg-primary/5 text-primary border-primary/20"><Sparkles className="h-2.5 w-2.5" />{isAr ? "ذكي" : "Smart"}</Badge>)}
                            {company.rating && (<Badge variant="outline" className="text-[12px] px-1 py-0 h-4 gap-0.5 bg-chart-4/5 text-chart-4 border-chart-4/20"><Star className="h-2.5 w-2.5" />{Number(company.rating).toFixed(1)}</Badge>)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{getTypeLabel(company.type, isAr)}</Badge></TableCell>
                    <TableCell><div className="text-sm">{company.email && <p>{company.email}</p>}{company.phone && <p className="text-muted-foreground">{company.phone}</p>}</div></TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{company.country_code ? `${countryFlag(company.country_code)} ` : ""}{[company.city, company.country].filter(Boolean).join(", ") || "-"}</p>
                        {company.neighborhood && <p className="text-xs text-muted-foreground">{company.neighborhood}</p>}
                      </div>
                    </TableCell>
                    <TableCell><AdminStatusBadge status={company.status} label={getStatusLabel(company.status, isAr)} /></TableCell>
                    <TableCell>{format(new Date(company.created_at), "yyyy-MM-dd")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {company.status === "pending" && (
                          <>
                            <Button variant="ghost" size="icon" className="text-chart-5 hover:text-chart-5 hover:bg-chart-5/10" onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: company.id, status: "active" }); }} title={isAr ? "تفعيل" : "Approve"}><CheckCircle className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: company.id, status: "suspended" }); }} title={isAr ? "رفض" : "Reject"}><XCircle className="h-4 w-4" /></Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {companies.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground"><Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{isAr ? "لا توجد شركات" : "No companies found"}</p></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          <AdminTablePagination
            page={companyPagination.page} totalPages={companyPagination.totalPages} totalItems={companyPagination.totalItems}
            startItem={companyPagination.startItem} endItem={companyPagination.endItem} pageSize={companyPagination.pageSize}
            pageSizeOptions={companyPagination.pageSizeOptions} hasNext={companyPagination.hasNext} hasPrev={companyPagination.hasPrev}
            onPageChange={companyPagination.goTo} onPageSizeChange={companyPagination.changePageSize}
          />
        </AdminTableCard>
        </>
        )}
      </div>
      )}
      <SmartImportDialog
        open={showSmartImport} onOpenChange={setShowSmartImport} entityType="company"
        onImport={(data: ImportedData) => {
          setCompanyForm(prev => ({
            ...prev, name: data.name_en || prev.name, name_ar: data.name_ar || prev.name_ar,
            description: data.description_en || prev.description, description_ar: data.description_ar || prev.description_ar,
            country_code: data.country_code || prev.country_code, city: data.city_en || prev.city,
            address: data.full_address_en || prev.address, address_ar: data.full_address_ar || prev.address_ar,
            postal_code: data.postal_code || prev.postal_code, email: data.email || prev.email,
            phone: data.phone || prev.phone, website: data.website || prev.website,
            registration_number: data.national_id || data.registration_number || prev.registration_number,
          }));
          setShowCompanyForm(true);
        }}
      />
    </div>
  );
}
