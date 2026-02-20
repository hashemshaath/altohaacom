import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  Globe, Plus, Edit, Trash2, Search, CheckCircle, XCircle,
  MapPin, Star, Save, X, ChevronRight,
  ToggleLeft, BarChart3, Download, Copy, Eye, EyeOff,
  AlertTriangle, CheckCheck, RefreshCw, ArrowUpDown, Filter,
  Zap, Shield, Phone, Mail, Building, Clock, DollarSign, Languages,
  ArrowLeftRight, Upload, History,
} from "lucide-react";
import { CountryOverviewDashboard } from "@/components/admin/CountryOverviewDashboard";
import { CountryCompletenessScore, getCompletenessScore } from "@/components/admin/countries/CountryCompletenessScore";
import { CountryComparisonTool } from "@/components/admin/countries/CountryComparisonTool";
import { CountryCSVImport } from "@/components/admin/countries/CountryCSVImport";
import { CountryAuditLog } from "@/components/admin/countries/CountryAuditLog";

interface Country {
  id: string;
  code: string;
  code_alpha3: string | null;
  name: string;
  name_ar: string | null;
  name_local: string | null;
  flag_emoji: string | null;
  continent: string | null;
  region: string | null;
  default_language: string;
  supported_languages: string[];
  currency_code: string;
  currency_symbol: string;
  currency_name: string | null;
  currency_name_ar: string | null;
  timezone: string;
  date_format: string | null;
  phone_code: string | null;
  phone_format: string | null;
  is_active: boolean;
  is_featured: boolean | null;
  launch_date: string | null;
  sort_order: number | null;
  tax_rate: number | null;
  tax_name: string | null;
  tax_name_ar: string | null;
  requires_tax_number: boolean | null;
  data_residency_notes: string | null;
  features: Record<string, boolean>;
  support_email: string | null;
  support_phone: string | null;
  local_office_address: string | null;
  local_office_address_ar: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

const defaultForm = {
  code: "", code_alpha3: "", name: "", name_ar: "", name_local: "",
  flag_emoji: "", continent: "", region: "",
  default_language: "en", supported_languages: ["en"],
  currency_code: "SAR", currency_symbol: "SAR", currency_name: "", currency_name_ar: "",
  timezone: "UTC", date_format: "yyyy-MM-dd", phone_code: "", phone_format: "",
  is_active: false, is_featured: false, launch_date: "", sort_order: 0,
  tax_rate: 0, tax_name: "VAT", tax_name_ar: "ضريبة القيمة المضافة", requires_tax_number: false,
  data_residency_notes: "",
  features: {
    competitions: true, exhibitions: true, shop: true, masterclasses: true,
    community: true, company_portal: true, judging: true, certificates: true, knowledge_portal: true,
  } as Record<string, boolean>,
  support_email: "", support_phone: "", local_office_address: "", local_office_address_ar: "",
};

const featureLabels: Record<string, { en: string; ar: string; icon: typeof Zap }> = {
  competitions: { en: "Competitions", ar: "المسابقات", icon: Zap },
  exhibitions: { en: "Exhibitions", ar: "المعارض", icon: Building },
  shop: { en: "Shop", ar: "المتجر", icon: DollarSign },
  masterclasses: { en: "Masterclasses", ar: "الدورات", icon: Star },
  community: { en: "Community", ar: "المجتمع", icon: Globe },
  company_portal: { en: "Company Portal", ar: "بوابة الشركات", icon: Building },
  judging: { en: "Judging", ar: "التحكيم", icon: Shield },
  certificates: { en: "Certificates", ar: "الشهادات", icon: CheckCircle },
  knowledge_portal: { en: "Knowledge Portal", ar: "بوابة المعرفة", icon: Globe },
};

const continents = ["Asia", "Africa", "Europe", "North America", "South America", "Oceania"];
const regions = ["GCC", "MENA", "Europe", "Americas", "South Asia", "Southeast Asia", "East Asia", "Oceania", "Sub-Saharan Africa"];

type SortField = "name" | "code" | "region" | "sort_order" | "updated_at";

export default function CountriesAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [continentFilter, setContinentFilter] = useState("all");
  const [editCountry, setEditCountry] = useState<Country | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [activeTab, setActiveTab] = useState("overview");
  const [formTab, setFormTab] = useState("basic");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Country | null>(null);
  const [detailCountry, setDetailCountry] = useState<Country | null>(null);
  const [sortField, setSortField] = useState<SortField>("sort_order");
  const [sortAsc, setSortAsc] = useState(true);

  const { data: countries = [], isLoading } = useQuery({
    queryKey: ["admin-countries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("countries").select("*").order("sort_order").order("name");
      if (error) throw error;
      return (data || []) as Country[];
    },
  });

  // Client-side filtering & sorting
  const filtered = useMemo(() => {
    let list = [...countries];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.name_ar || "").includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.code_alpha3 || "").toLowerCase().includes(q)
      );
    }
    if (regionFilter !== "all") list = list.filter(c => c.region === regionFilter);
    if (statusFilter === "active") list = list.filter(c => c.is_active);
    if (statusFilter === "inactive") list = list.filter(c => !c.is_active);
    if (continentFilter !== "all") list = list.filter(c => c.continent === continentFilter);

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "code": cmp = a.code.localeCompare(b.code); break;
        case "region": cmp = (a.region || "").localeCompare(b.region || ""); break;
        case "sort_order": cmp = (a.sort_order || 0) - (b.sort_order || 0); break;
        case "updated_at": cmp = a.updated_at.localeCompare(b.updated_at); break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [countries, searchQuery, regionFilter, statusFilter, continentFilter, sortField, sortAsc]);

  const logAudit = async (code: string, action: string, summary: string, summaryAr: string, changes?: Record<string, { old: unknown; new: unknown }>) => {
    await supabase.from("country_audit_log").insert([{
      country_code: code,
      action,
      summary,
      summary_ar: summaryAr,
      changes: (changes || null) as any,
    }]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code.toUpperCase(),
        code_alpha3: form.code_alpha3?.toUpperCase() || null,
        name: form.name,
        name_ar: form.name_ar || null,
        name_local: form.name_local || null,
        flag_emoji: form.flag_emoji || null,
        continent: form.continent || null,
        region: form.region || null,
        default_language: form.default_language,
        supported_languages: form.supported_languages,
        currency_code: form.currency_code.toUpperCase(),
        currency_symbol: form.currency_symbol,
        currency_name: form.currency_name || null,
        currency_name_ar: form.currency_name_ar || null,
        timezone: form.timezone,
        date_format: form.date_format || null,
        phone_code: form.phone_code || null,
        phone_format: form.phone_format || null,
        is_active: form.is_active,
        is_featured: form.is_featured,
        launch_date: form.launch_date || null,
        sort_order: form.sort_order,
        tax_rate: form.tax_rate,
        tax_name: form.tax_name || null,
        tax_name_ar: form.tax_name_ar || null,
        requires_tax_number: form.requires_tax_number,
        data_residency_notes: form.data_residency_notes || null,
        features: form.features,
        support_email: form.support_email || null,
        support_phone: form.support_phone || null,
        local_office_address: form.local_office_address || null,
        local_office_address_ar: form.local_office_address_ar || null,
      };

      if (editCountry) {
        // Track changes for audit
        const changes: Record<string, { old: unknown; new: unknown }> = {};
        const ec = editCountry as unknown as Record<string, unknown>;
        Object.entries(payload).forEach(([k, v]) => {
          if (JSON.stringify(ec[k]) !== JSON.stringify(v)) {
            changes[k] = { old: ec[k], new: v };
          }
        });

        const { error } = await supabase.from("countries").update(payload).eq("id", editCountry.id);
        if (error) throw error;

        if (Object.keys(changes).length > 0) {
          await logAudit(payload.code, "updated", `Updated ${Object.keys(changes).join(", ")}`, `تم تحديث ${Object.keys(changes).join(", ")}`, changes);
        }
      } else {
        const { error } = await supabase.from("countries").insert(payload);
        if (error) throw error;
        await logAudit(payload.code, "created", `Created country: ${payload.name}`, `تم إنشاء دولة: ${payload.name}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-countries"] });
      queryClient.invalidateQueries({ queryKey: ["country-audit-log"] });
      toast({ title: isAr ? "تم الحفظ بنجاح" : "Saved successfully" });
      closeForm();
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active, code }: { id: string; active: boolean; code: string }) => {
      const { error } = await supabase.from("countries").update({ is_active: active }).eq("id", id);
      if (error) throw error;
      await logAudit(code, active ? "activated" : "deactivated", `${active ? "Activated" : "Deactivated"} country`, `${active ? "تم تفعيل" : "تم إلغاء تفعيل"} الدولة`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-countries"] });
      queryClient.invalidateQueries({ queryKey: ["country-audit-log"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, code }: { id: string; code: string }) => {
      const { error } = await supabase.from("countries").delete().eq("id", id);
      if (error) throw error;
      await logAudit(code, "deleted", `Deleted country`, `تم حذف الدولة`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-countries"] });
      queryClient.invalidateQueries({ queryKey: ["country-audit-log"] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const bulkToggleMutation = useMutation({
    mutationFn: async (active: boolean) => {
      const ids = Array.from(selectedIds);
      const { error } = await supabase.from("countries").update({ is_active: active }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-countries"] });
      setSelectedIds(new Set());
      toast({ title: isAr ? "تم التحديث" : "Updated" });
    },
  });

  const openEdit = (c: Country) => {
    setEditCountry(c);
    setForm({
      code: c.code.trim(), code_alpha3: c.code_alpha3?.trim() || "",
      name: c.name, name_ar: c.name_ar || "", name_local: c.name_local || "",
      flag_emoji: c.flag_emoji || "", continent: c.continent || "", region: c.region || "",
      default_language: c.default_language, supported_languages: c.supported_languages || ["en"],
      currency_code: c.currency_code.trim(), currency_symbol: c.currency_symbol, currency_name: c.currency_name || "",
      currency_name_ar: c.currency_name_ar || "",
      timezone: c.timezone, date_format: c.date_format || "yyyy-MM-dd",
      phone_code: c.phone_code || "", phone_format: c.phone_format || "",
      is_active: c.is_active, is_featured: c.is_featured || false,
      launch_date: c.launch_date || "", sort_order: c.sort_order || 0,
      tax_rate: c.tax_rate || 0, tax_name: c.tax_name || "VAT",
      tax_name_ar: c.tax_name_ar || "", requires_tax_number: c.requires_tax_number || false,
      data_residency_notes: c.data_residency_notes || "",
      features: { ...defaultForm.features, ...(c.features || {}) },
      support_email: c.support_email || "", support_phone: c.support_phone || "",
      local_office_address: c.local_office_address || "", local_office_address_ar: c.local_office_address_ar || "",
    });
    setShowForm(true);
    setFormTab("basic");
  };

  const duplicateCountry = (c: Country) => {
    setEditCountry(null);
    setForm({
      code: "", code_alpha3: "",
      name: c.name + " (Copy)", name_ar: c.name_ar ? c.name_ar + " (نسخة)" : "", name_local: c.name_local || "",
      flag_emoji: c.flag_emoji || "", continent: c.continent || "", region: c.region || "",
      default_language: c.default_language, supported_languages: c.supported_languages || ["en"],
      currency_code: c.currency_code.trim(), currency_symbol: c.currency_symbol, currency_name: c.currency_name || "",
      currency_name_ar: c.currency_name_ar || "",
      timezone: c.timezone, date_format: c.date_format || "yyyy-MM-dd",
      phone_code: c.phone_code || "", phone_format: c.phone_format || "",
      is_active: false, is_featured: false,
      launch_date: "", sort_order: (c.sort_order || 0) + 1,
      tax_rate: c.tax_rate || 0, tax_name: c.tax_name || "VAT",
      tax_name_ar: c.tax_name_ar || "", requires_tax_number: c.requires_tax_number || false,
      data_residency_notes: c.data_residency_notes || "",
      features: { ...defaultForm.features, ...(c.features || {}) },
      support_email: c.support_email || "", support_phone: c.support_phone || "",
      local_office_address: c.local_office_address || "", local_office_address_ar: c.local_office_address_ar || "",
    });
    setShowForm(true);
    setFormTab("basic");
  };

  const openNew = () => {
    setEditCountry(null);
    setForm({ ...defaultForm });
    setShowForm(true);
    setFormTab("basic");
  };

  const closeForm = () => {
    setShowForm(false);
    setEditCountry(null);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(c => c.id)));
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const exportCSV = () => {
    const headers = ["Code", "Name", "Name (AR)", "Region", "Continent", "Currency", "Phone Code", "Tax Rate", "Active", "Featured", "Languages", "Timezone"];
    const rows = filtered.map(c => [
      c.code.trim(), c.name, c.name_ar || "", c.region || "", c.continent || "",
      `${c.currency_code.trim()} (${c.currency_symbol})`, c.phone_code || "",
      c.tax_rate || 0, c.is_active ? "Yes" : "No", c.is_featured ? "Yes" : "No",
      (c.supported_languages || []).join("; "), c.timezone,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `countries-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: isAr ? "تم تصدير البيانات" : "Data exported" });
  };

  const stats = {
    total: countries.length,
    active: countries.filter(c => c.is_active).length,
    inactive: countries.filter(c => !c.is_active).length,
    regions: [...new Set(countries.map(c => c.region).filter(Boolean))].length,
    featured: countries.filter(c => c.is_featured).length,
    continents: [...new Set(countries.map(c => c.continent).filter(Boolean))].length,
  };

  const grouped = filtered.reduce<Record<string, Country[]>>((acc, c) => {
    const key = c.region || (isAr ? "أخرى" : "Other");
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  const enabledFeatureCount = (c: Country) => Object.values(c.features || {}).filter(Boolean).length;

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(field)}>
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && <ArrowUpDown className="h-3 w-3" />}
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Globe}
        title={isAr ? "إدارة الدول" : "Country Management"}
        description={isAr ? "تكوين وإدارة الدول والأسواق العالمية" : "Configure and manage countries & global markets"}
        actions={
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={exportCSV}>
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isAr ? "تصدير CSV" : "Export CSV"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 me-2" />
              {isAr ? "إضافة دولة" : "Add Country"}
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: isAr ? "إجمالي" : "Total", value: stats.total, icon: Globe, color: "text-primary" },
          { label: isAr ? "نشطة" : "Active", value: stats.active, icon: CheckCircle, color: "text-chart-3" },
          { label: isAr ? "غير نشطة" : "Inactive", value: stats.inactive, icon: XCircle, color: "text-destructive" },
          { label: isAr ? "المناطق" : "Regions", value: stats.regions, icon: MapPin, color: "text-chart-4" },
          { label: isAr ? "القارات" : "Continents", value: stats.continents, icon: Globe, color: "text-chart-5" },
          { label: isAr ? "مميزة" : "Featured", value: stats.featured, icon: Star, color: "text-chart-2" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                </div>
                <s.icon className={`h-5 w-5 ${s.color} opacity-60`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 me-1.5" />
            {isAr ? "نظرة عامة" : "Overview"}
          </TabsTrigger>
          <TabsTrigger value="countries">
            <Globe className="h-4 w-4 me-1.5" />
            {isAr ? "الدول" : "Countries"}
            <Badge variant="secondary" className="ms-1.5 text-[10px]">{filtered.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="regions">
            <MapPin className="h-4 w-4 me-1.5" />
            {isAr ? "حسب المنطقة" : "By Region"}
          </TabsTrigger>
          <TabsTrigger value="compare">
            <ArrowLeftRight className="h-4 w-4 me-1.5" />
            {isAr ? "مقارنة" : "Compare"}
          </TabsTrigger>
          <TabsTrigger value="import">
            <Upload className="h-4 w-4 me-1.5" />
            {isAr ? "استيراد" : "Import"}
          </TabsTrigger>
          <TabsTrigger value="audit">
            <History className="h-4 w-4 me-1.5" />
            {isAr ? "السجل" : "Audit Log"}
          </TabsTrigger>
        </TabsList>

        {/* Overview Dashboard */}
        <TabsContent value="overview" className="space-y-4">
          <CountryOverviewDashboard />
        </TabsContent>

        {/* All Countries */}
        <TabsContent value="countries" className="space-y-4">
          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="py-3 flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm font-medium">
                  {selectedIds.size} {isAr ? "محدد" : "selected"}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => bulkToggleMutation.mutate(true)} disabled={bulkToggleMutation.isPending}>
                    <Eye className="h-3.5 w-3.5 me-1.5" />
                    {isAr ? "تفعيل" : "Activate"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => bulkToggleMutation.mutate(false)} disabled={bulkToggleMutation.isPending}>
                    <EyeOff className="h-3.5 w-3.5 me-1.5" />
                    {isAr ? "إلغاء التفعيل" : "Deactivate"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{isAr ? "جميع الدول" : "All Countries"}</CardTitle>
                <Badge variant="outline">{filtered.length} / {countries.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={isAr ? "بحث بالاسم أو الرمز..." : "Search by name or code..."}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="ps-10"
                  />
                </div>
                <Select value={continentFilter} onValueChange={setContinentFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
                    <SelectValue placeholder={isAr ? "القارة" : "Continent"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                    {continents.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder={isAr ? "المنطقة" : "Region"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                    {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]"><SelectValue placeholder={isAr ? "الحالة" : "Status"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                    <SelectItem value="active">{isAr ? "نشطة" : "Active"}</SelectItem>
                    <SelectItem value="inactive">{isAr ? "غير نشطة" : "Inactive"}</SelectItem>
                  </SelectContent>
                </Select>
                {(searchQuery || regionFilter !== "all" || statusFilter !== "all" || continentFilter !== "all") && (
                  <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(""); setRegionFilter("all"); setStatusFilter("all"); setContinentFilter("all"); }}>
                    <RefreshCw className="h-3.5 w-3.5 me-1" />
                    {isAr ? "مسح" : "Clear"}
                  </Button>
                )}
              </div>

              <ScrollArea className="h-[540px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={selectedIds.size === filtered.length && filtered.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                      <SortHeader field="name">{isAr ? "الدولة" : "Country"}</SortHeader>
                      <SortHeader field="code">{isAr ? "الرمز" : "Code"}</SortHeader>
                      <SortHeader field="region">{isAr ? "المنطقة" : "Region"}</SortHeader>
                      <TableHead>{isAr ? "العملة" : "Currency"}</TableHead>
                      <TableHead>{isAr ? "الميزات" : "Features"}</TableHead>
                      <TableHead>{isAr ? "الاكتمال" : "Health"}</TableHead>
                      <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                      <TableHead className="w-[120px]">{isAr ? "الإجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(c => (
                      <TableRow key={c.id} className={`${!c.is_active ? "opacity-60" : ""} ${detailCountry?.id === c.id ? "bg-primary/5" : ""}`}>
                        <TableCell>
                          <Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} />
                        </TableCell>
                        <TableCell className="text-xl">{c.flag_emoji || "🏳️"}</TableCell>
                        <TableCell>
                          <button className="text-left hover:text-primary transition-colors" onClick={() => setDetailCountry(detailCountry?.id === c.id ? null : c)}>
                            <p className="font-medium text-sm">{c.name}</p>
                            {c.name_ar && <p className="text-[11px] text-muted-foreground" dir="rtl">{c.name_ar}</p>}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="font-mono text-[10px]">{c.code.trim()}</Badge>
                            {c.code_alpha3 && <Badge variant="secondary" className="font-mono text-[10px]">{c.code_alpha3.trim()}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs">{c.region || "—"}</p>
                            {c.continent && <p className="text-[10px] text-muted-foreground">{c.continent}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-medium">{c.currency_symbol}</span> {c.currency_code.trim()}
                          {c.tax_rate ? <p className="text-[10px] text-muted-foreground">{c.tax_name} {c.tax_rate}%</p> : null}
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="secondary" className="text-[10px]">
                                  {enabledFeatureCount(c)}/{Object.keys(featureLabels).length}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="grid grid-cols-2 gap-1 text-xs">
                                  {Object.entries(featureLabels).map(([key, label]) => (
                                    <div key={key} className="flex items-center gap-1">
                                      {(c.features || {})[key] ? <CheckCircle className="h-3 w-3 text-chart-3" /> : <XCircle className="h-3 w-3 text-muted-foreground" />}
                                      {isAr ? label.ar : label.en}
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <CountryCompletenessScore country={c as any} isAr={isAr} compact />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Switch
                              checked={c.is_active}
                              onCheckedChange={v => toggleActiveMutation.mutate({ id: c.id, active: v, code: c.code })}
                            />
                            {c.is_featured && <Star className="h-3.5 w-3.5 text-chart-2 fill-chart-2" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-0.5">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{isAr ? "تعديل" : "Edit"}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateCountry(c)}>
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{isAr ? "نسخ" : "Duplicate"}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(c)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{isAr ? "حذف" : "Delete"}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                          {isAr ? "لا توجد دول" : "No countries found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Detail Panel */}
          {detailCountry && (
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-2xl">{detailCountry.flag_emoji || "🏳️"}</span>
                    {detailCountry.name}
                    {detailCountry.name_ar && <span className="text-sm text-muted-foreground font-normal">({detailCountry.name_ar})</span>}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(detailCountry)}>
                      <Edit className="h-3.5 w-3.5 me-1.5" />
                      {isAr ? "تعديل" : "Edit"}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailCountry(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <DetailItem icon={Globe} label={isAr ? "الرمز" : "Code"} value={`${detailCountry.code.trim()} / ${detailCountry.code_alpha3?.trim() || "—"}`} />
                  <DetailItem icon={MapPin} label={isAr ? "المنطقة" : "Region"} value={`${detailCountry.continent || "—"} · ${detailCountry.region || "—"}`} />
                  <DetailItem icon={DollarSign} label={isAr ? "العملة" : "Currency"} value={`${detailCountry.currency_symbol} ${detailCountry.currency_code.trim()} ${detailCountry.currency_name ? `(${detailCountry.currency_name})` : ""}`} />
                  <DetailItem icon={Clock} label={isAr ? "المنطقة الزمنية" : "Timezone"} value={detailCountry.timezone} />
                  <DetailItem icon={Phone} label={isAr ? "مفتاح الهاتف" : "Phone Code"} value={detailCountry.phone_code || "—"} />
                  <DetailItem icon={Languages} label={isAr ? "اللغات" : "Languages"} value={(detailCountry.supported_languages || []).join(", ").toUpperCase()} />
                  <DetailItem icon={Shield} label={isAr ? "الضريبة" : "Tax"} value={detailCountry.tax_rate ? `${detailCountry.tax_name} ${detailCountry.tax_rate}%` : isAr ? "لا ضريبة" : "No Tax"} />
                  <DetailItem icon={Mail} label={isAr ? "بريد الدعم" : "Support"} value={detailCountry.support_email || "—"} />
                </div>
                <Separator className="my-3" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">{isAr ? "الميزات المفعلة" : "Enabled Features"}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(featureLabels).map(([key, label]) => {
                      const enabled = (detailCountry.features || {})[key];
                      return (
                        <Badge key={key} variant={enabled ? "default" : "outline"} className={`text-xs ${!enabled ? "opacity-40" : ""}`}>
                          {enabled ? <CheckCircle className="h-3 w-3 me-1" /> : <XCircle className="h-3 w-3 me-1" />}
                          {isAr ? label.ar : label.en}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <Separator className="my-3" />
                <CountryCompletenessScore country={detailCountry as any} isAr={isAr} />
                {detailCountry.local_office_address && (
                  <>
                    <Separator className="my-3" />
                    <DetailItem icon={Building} label={isAr ? "عنوان المكتب" : "Office Address"} value={detailCountry.local_office_address} />
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* By Region */}
        <TabsContent value="regions" className="space-y-4">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([region, regionCountries]) => (
            <Card key={region}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {region}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{regionCountries.length} {isAr ? "دولة" : "countries"}</Badge>
                    <Badge variant="outline" className="text-chart-3">
                      {regionCountries.filter(c => c.is_active).length} {isAr ? "نشطة" : "active"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {regionCountries.map(c => (
                    <div
                      key={c.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:border-primary/40 transition-colors ${c.is_active ? "" : "opacity-50"}`}
                      onClick={() => openEdit(c)}
                    >
                      <span className="text-2xl">{c.flag_emoji || "🏳️"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{c.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px] font-mono">{c.code.trim()}</Badge>
                          <span className="text-[10px] text-muted-foreground">{c.currency_symbol} {c.currency_code.trim()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {c.is_featured && <Star className="h-3.5 w-3.5 text-chart-2 fill-chart-2" />}
                        {c.is_active ? (
                          <CheckCircle className="h-4 w-4 text-chart-3" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Compare */}
        <TabsContent value="compare" className="space-y-4">
          <CountryComparisonTool countries={countries} />
        </TabsContent>

        {/* Import */}
        <TabsContent value="import" className="space-y-4">
          <CountryCSVImport />
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit" className="space-y-4">
          <CountryAuditLog />
        </TabsContent>
      </Tabs>

      {/* ═══ Delete Confirmation ═══ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {isAr ? "تأكيد الحذف" : "Confirm Deletion"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? `هل أنت متأكد من حذف "${deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate({ id: deleteTarget.id, code: deleteTarget.code })}
            >
              <Trash2 className="h-4 w-4 me-2" />
              {isAr ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ Country Form Dialog ═══ */}
      <Dialog open={showForm} onOpenChange={v => !v && closeForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {editCountry
                ? (isAr ? `تعديل ${editCountry.name}` : `Edit ${editCountry.name}`)
                : (isAr ? "إضافة دولة جديدة" : "Add New Country")
              }
            </DialogTitle>
            <DialogDescription>
              {isAr ? "إعداد تكوين الدولة بالكامل" : "Configure country settings completely"}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={formTab} onValueChange={setFormTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="basic" className="text-xs">{isAr ? "أساسي" : "Basic"}</TabsTrigger>
              <TabsTrigger value="locale" className="text-xs">{isAr ? "التهيئة" : "Locale"}</TabsTrigger>
              <TabsTrigger value="tax" className="text-xs">{isAr ? "الضرائب" : "Tax"}</TabsTrigger>
              <TabsTrigger value="features" className="text-xs">{isAr ? "الميزات" : "Features"}</TabsTrigger>
              <TabsTrigger value="support" className="text-xs">{isAr ? "الدعم" : "Support"}</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-1">
              {/* Basic */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "الرمز (2 حرف)" : "Code (2-letter)"} *</Label>
                    <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.slice(0, 2) })} placeholder="SA" className="font-mono uppercase" maxLength={2} disabled={!!editCountry} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "الرمز (3 حرف)" : "Code (3-letter)"}</Label>
                    <Input value={form.code_alpha3} onChange={e => setForm({ ...form, code_alpha3: e.target.value.slice(0, 3) })} placeholder="SAU" className="font-mono uppercase" maxLength={3} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "العلم" : "Flag Emoji"}</Label>
                    <Input value={form.flag_emoji} onChange={e => setForm({ ...form, flag_emoji: e.target.value })} placeholder="🇸🇦" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "الاسم (EN)" : "Name (EN)"} *</Label>
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "الاسم (AR)" : "Name (AR)"}</Label>
                    <Input value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} dir="rtl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "الاسم المحلي" : "Local Name"}</Label>
                  <Input value={form.name_local} onChange={e => setForm({ ...form, name_local: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "القارة" : "Continent"}</Label>
                    <Select value={form.continent} onValueChange={v => setForm({ ...form, continent: v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {continents.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "المنطقة" : "Region"}</Label>
                    <Select value={form.region} onValueChange={v => setForm({ ...form, region: v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label className="text-xs">{isAr ? "نشطة" : "Active"}</Label>
                    <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label className="text-xs">{isAr ? "مميزة" : "Featured"}</Label>
                    <Switch checked={form.is_featured} onCheckedChange={v => setForm({ ...form, is_featured: v })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "تاريخ الإطلاق" : "Launch Date"}</Label>
                    <Input type="date" value={form.launch_date} onChange={e => setForm({ ...form, launch_date: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "ترتيب العرض" : "Sort Order"}</Label>
                    <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
              </TabsContent>

              {/* Locale */}
              <TabsContent value="locale" className="space-y-4 mt-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "اللغة الافتراضية" : "Default Language"}</Label>
                  <Select value={form.default_language} onValueChange={v => setForm({ ...form, default_language: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["ar", "en", "fr", "de", "tr", "es", "pt", "zh", "hi", "ms", "id", "ru"].map(l => (
                        <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "اللغات المدعومة" : "Supported Languages"}</Label>
                  <Input
                    value={form.supported_languages.join(", ")}
                    onChange={e => setForm({ ...form, supported_languages: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                    placeholder="ar, en, fr"
                  />
                  <p className="text-[10px] text-muted-foreground">{isAr ? "مفصولة بفاصلة" : "Comma-separated language codes"}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "رمز العملة" : "Currency Code"}</Label>
                    <Input value={form.currency_code} onChange={e => setForm({ ...form, currency_code: e.target.value.slice(0, 3) })} placeholder="SAR" className="font-mono uppercase" maxLength={3} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "رمز العملة" : "Symbol"}</Label>
                    <Input value={form.currency_symbol} onChange={e => setForm({ ...form, currency_symbol: e.target.value })} placeholder="SAR" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "اسم العملة" : "Currency Name"}</Label>
                    <Input value={form.currency_name} onChange={e => setForm({ ...form, currency_name: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "اسم العملة (AR)" : "Currency Name (AR)"}</Label>
                  <Input value={form.currency_name_ar} onChange={e => setForm({ ...form, currency_name_ar: e.target.value })} dir="rtl" />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "المنطقة الزمنية" : "Timezone"}</Label>
                    <Input value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} placeholder="Asia/Riyadh" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "تنسيق التاريخ" : "Date Format"}</Label>
                    <Input value={form.date_format || ""} onChange={e => setForm({ ...form, date_format: e.target.value })} placeholder="yyyy-MM-dd" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "مفتاح الهاتف" : "Phone Code"}</Label>
                    <Input value={form.phone_code} onChange={e => setForm({ ...form, phone_code: e.target.value })} placeholder="+966" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "تنسيق الهاتف" : "Phone Format"}</Label>
                    <Input value={form.phone_format} onChange={e => setForm({ ...form, phone_format: e.target.value })} placeholder="XXX XXX XXXX" />
                  </div>
                </div>
              </TabsContent>

              {/* Tax */}
              <TabsContent value="tax" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "نسبة الضريبة %" : "Tax Rate %"}</Label>
                    <Input type="number" step="0.01" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label className="text-xs">{isAr ? "يتطلب رقم ضريبي" : "Requires Tax Number"}</Label>
                    <Switch checked={form.requires_tax_number} onCheckedChange={v => setForm({ ...form, requires_tax_number: v })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "اسم الضريبة (EN)" : "Tax Name (EN)"}</Label>
                    <Input value={form.tax_name} onChange={e => setForm({ ...form, tax_name: e.target.value })} placeholder="VAT" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "اسم الضريبة (AR)" : "Tax Name (AR)"}</Label>
                    <Input value={form.tax_name_ar} onChange={e => setForm({ ...form, tax_name_ar: e.target.value })} dir="rtl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "ملاحظات إقامة البيانات" : "Data Residency Notes"}</Label>
                  <Textarea value={form.data_residency_notes} onChange={e => setForm({ ...form, data_residency_notes: e.target.value })} rows={3} />
                </div>
              </TabsContent>

              {/* Features */}
              <TabsContent value="features" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {isAr ? "تحكم في الميزات المتاحة في هذه الدولة" : "Control which features are available in this country"}
                  </p>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => {
                      const all: Record<string, boolean> = {};
                      Object.keys(featureLabels).forEach(k => all[k] = true);
                      setForm({ ...form, features: all });
                    }}>
                      <CheckCheck className="h-3 w-3 me-1" />
                      {isAr ? "تفعيل الكل" : "Enable All"}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => {
                      const none: Record<string, boolean> = {};
                      Object.keys(featureLabels).forEach(k => none[k] = false);
                      setForm({ ...form, features: none });
                    }}>
                      <X className="h-3 w-3 me-1" />
                      {isAr ? "إلغاء الكل" : "Disable All"}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {Object.entries(featureLabels).map(([key, labels]) => {
                    const FeatureIcon = labels.icon;
                    return (
                      <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <FeatureIcon className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-sm">{isAr ? labels.ar : labels.en}</Label>
                        </div>
                        <Switch
                          checked={form.features[key] ?? true}
                          onCheckedChange={v => setForm({ ...form, features: { ...form.features, [key]: v } })}
                        />
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Support */}
              <TabsContent value="support" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "بريد الدعم" : "Support Email"}</Label>
                    <Input type="email" value={form.support_email} onChange={e => setForm({ ...form, support_email: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "هاتف الدعم" : "Support Phone"}</Label>
                    <Input value={form.support_phone} onChange={e => setForm({ ...form, support_phone: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "عنوان المكتب (EN)" : "Office Address (EN)"}</Label>
                  <Textarea value={form.local_office_address} onChange={e => setForm({ ...form, local_office_address: e.target.value })} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "عنوان المكتب (AR)" : "Office Address (AR)"}</Label>
                  <Textarea value={form.local_office_address_ar} onChange={e => setForm({ ...form, local_office_address_ar: e.target.value })} rows={2} dir="rtl" />
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closeForm}>
              <X className="h-4 w-4 me-2" />{isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.code || !form.name || saveMutation.isPending}>
              <Save className="h-4 w-4 me-2" />{isAr ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof Globe; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
