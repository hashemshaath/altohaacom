import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Globe, Plus, Edit, Trash2, Search, CheckCircle, XCircle,
  MapPin, DollarSign, Clock, Languages, Star, Settings2,
  Building2, Users, Trophy, ShieldCheck, Save, X, ChevronRight,
  ToggleLeft,
  BarChart3,
} from "lucide-react";
import { CountryOverviewDashboard } from "@/components/admin/CountryOverviewDashboard";

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
  },
  support_email: "", support_phone: "", local_office_address: "", local_office_address_ar: "",
};

const featureLabels: Record<string, { en: string; ar: string }> = {
  competitions: { en: "Competitions", ar: "المسابقات" },
  exhibitions: { en: "Exhibitions", ar: "المعارض" },
  shop: { en: "Shop", ar: "المتجر" },
  masterclasses: { en: "Masterclasses", ar: "الدورات" },
  community: { en: "Community", ar: "المجتمع" },
  company_portal: { en: "Company Portal", ar: "بوابة الشركات" },
  judging: { en: "Judging", ar: "التحكيم" },
  certificates: { en: "Certificates", ar: "الشهادات" },
  knowledge_portal: { en: "Knowledge Portal", ar: "بوابة المعرفة" },
};

const continents = ["Asia", "Africa", "Europe", "North America", "South America", "Oceania"];
const regions = ["GCC", "MENA", "Europe", "Americas", "South Asia", "Southeast Asia", "East Asia", "Oceania", "Sub-Saharan Africa"];

export default function CountriesAdmin() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editCountry, setEditCountry] = useState<Country | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [activeTab, setActiveTab] = useState("overview");
  const [formTab, setFormTab] = useState("basic");

  const { data: countries = [], isLoading } = useQuery({
    queryKey: ["countries", searchQuery, regionFilter, statusFilter],
    queryFn: async () => {
      let query = supabase.from("countries").select("*").order("sort_order").order("name");
      if (searchQuery) query = query.or(`name.ilike.%${searchQuery}%,name_ar.ilike.%${searchQuery}%,code.ilike.%${searchQuery}%`);
      if (regionFilter !== "all") query = query.eq("region", regionFilter);
      if (statusFilter === "active") query = query.eq("is_active", true);
      if (statusFilter === "inactive") query = query.eq("is_active", false);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Country[];
    },
  });

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
        const { error } = await supabase.from("countries").update(payload).eq("id", editCountry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("countries").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
      toast({ title: language === "ar" ? "تم الحفظ بنجاح" : "Saved successfully" });
      closeForm();
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("countries").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("countries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
      toast({ title: language === "ar" ? "تم الحذف" : "Deleted" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err.message }),
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

  const stats = {
    total: countries.length,
    active: countries.filter(c => c.is_active).length,
    regions: [...new Set(countries.map(c => c.region).filter(Boolean))].length,
    featured: countries.filter(c => c.is_featured).length,
  };

  // Group by region
  const grouped = countries.reduce<Record<string, Country[]>>((acc, c) => {
    const key = c.region || (language === "ar" ? "أخرى" : "Other");
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Globe className="h-8 w-8 text-primary" />
            {language === "ar" ? "إدارة الدول" : "Country Management"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "ar" ? "تكوين وإدارة الدول والأسواق العالمية" : "Configure and manage countries & global markets"}
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          {language === "ar" ? "إضافة دولة" : "Add Country"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: language === "ar" ? "إجمالي الدول" : "Total Countries", value: stats.total, icon: Globe, color: "text-primary" },
          { label: language === "ar" ? "نشطة" : "Active", value: stats.active, icon: CheckCircle, color: "text-chart-3" },
          { label: language === "ar" ? "المناطق" : "Regions", value: stats.regions, icon: MapPin, color: "text-chart-4" },
          { label: language === "ar" ? "مميزة" : "Featured", value: stats.featured, icon: Star, color: "text-chart-5" },
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
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-1.5" />
            {language === "ar" ? "نظرة عامة" : "Overview"}
          </TabsTrigger>
          <TabsTrigger value="countries">
            <Globe className="h-4 w-4 mr-1.5" />
            {language === "ar" ? "الدول" : "Countries"}
          </TabsTrigger>
          <TabsTrigger value="regions">
            <MapPin className="h-4 w-4 mr-1.5" />
            {language === "ar" ? "حسب المنطقة" : "By Region"}
          </TabsTrigger>
        </TabsList>

        {/* Overview Dashboard */}
        <TabsContent value="overview" className="space-y-4">
          <CountryOverviewDashboard />
        </TabsContent>

        {/* All Countries */}
        <TabsContent value="countries" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{language === "ar" ? "جميع الدول" : "All Countries"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={language === "ar" ? "بحث..." : "Search..."} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="ps-10" />
                </div>
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder={language === "ar" ? "المنطقة" : "Region"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
                    {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder={language === "ar" ? "الحالة" : "Status"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
                    <SelectItem value="active">{language === "ar" ? "نشطة" : "Active"}</SelectItem>
                    <SelectItem value="inactive">{language === "ar" ? "غير نشطة" : "Inactive"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>{language === "ar" ? "الدولة" : "Country"}</TableHead>
                      <TableHead>{language === "ar" ? "الرمز" : "Code"}</TableHead>
                      <TableHead>{language === "ar" ? "المنطقة" : "Region"}</TableHead>
                      <TableHead>{language === "ar" ? "العملة" : "Currency"}</TableHead>
                      <TableHead>{language === "ar" ? "اللغات" : "Languages"}</TableHead>
                      <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{language === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {countries.map(c => (
                      <TableRow key={c.id} className={!c.is_active ? "opacity-60" : ""}>
                        <TableCell className="text-xl">{c.flag_emoji || "🏳️"}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{c.name}</p>
                            {c.name_ar && <p className="text-xs text-muted-foreground" dir="rtl">{c.name_ar}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">{c.code.trim()}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{c.region || "—"}</TableCell>
                        <TableCell className="text-xs">
                          {c.currency_symbol} {c.currency_code.trim()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {c.supported_languages?.map(l => (
                              <Badge key={l} variant="secondary" className="text-[10px]">{l}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={c.is_active}
                            onCheckedChange={v => toggleActiveMutation.mutate({ id: c.id, active: v })}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-0.5">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(c.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {countries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                          {language === "ar" ? "لا توجد دول" : "No countries found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
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
                    <Badge variant="secondary">{regionCountries.length} {language === "ar" ? "دولة" : "countries"}</Badge>
                    <Badge variant="outline" className="text-chart-3">
                      {regionCountries.filter(c => c.is_active).length} {language === "ar" ? "نشطة" : "active"}
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
                        {c.is_featured && <Star className="h-3.5 w-3.5 text-chart-5 fill-chart-5" />}
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
      </Tabs>

      {/* ═══ Country Form Dialog ═══ */}
      <Dialog open={showForm} onOpenChange={v => !v && closeForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {editCountry
                ? (language === "ar" ? `تعديل ${editCountry.name}` : `Edit ${editCountry.name}`)
                : (language === "ar" ? "إضافة دولة جديدة" : "Add New Country")
              }
            </DialogTitle>
            <DialogDescription>
              {language === "ar" ? "إعداد تكوين الدولة بالكامل" : "Configure country settings completely"}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={formTab} onValueChange={setFormTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="basic" className="text-xs">{language === "ar" ? "أساسي" : "Basic"}</TabsTrigger>
              <TabsTrigger value="locale" className="text-xs">{language === "ar" ? "التهيئة" : "Locale"}</TabsTrigger>
              <TabsTrigger value="tax" className="text-xs">{language === "ar" ? "الضرائب" : "Tax"}</TabsTrigger>
              <TabsTrigger value="features" className="text-xs">{language === "ar" ? "الميزات" : "Features"}</TabsTrigger>
              <TabsTrigger value="support" className="text-xs">{language === "ar" ? "الدعم" : "Support"}</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-1">
              {/* Basic */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "الرمز (2 حرف)" : "Code (2-letter)"} *</Label>
                    <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.slice(0, 2) })} placeholder="SA" className="font-mono uppercase" maxLength={2} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "الرمز (3 حرف)" : "Code (3-letter)"}</Label>
                    <Input value={form.code_alpha3} onChange={e => setForm({ ...form, code_alpha3: e.target.value.slice(0, 3) })} placeholder="SAU" className="font-mono uppercase" maxLength={3} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "العلم" : "Flag Emoji"}</Label>
                    <Input value={form.flag_emoji} onChange={e => setForm({ ...form, flag_emoji: e.target.value })} placeholder="🇸🇦" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "الاسم (EN)" : "Name (EN)"} *</Label>
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "الاسم (AR)" : "Name (AR)"}</Label>
                    <Input value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} dir="rtl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{language === "ar" ? "الاسم المحلي" : "Local Name"}</Label>
                  <Input value={form.name_local} onChange={e => setForm({ ...form, name_local: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "القارة" : "Continent"}</Label>
                    <Select value={form.continent} onValueChange={v => setForm({ ...form, continent: v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {continents.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "المنطقة" : "Region"}</Label>
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
                    <Label className="text-xs">{language === "ar" ? "نشطة" : "Active"}</Label>
                    <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label className="text-xs">{language === "ar" ? "مميزة" : "Featured"}</Label>
                    <Switch checked={form.is_featured} onCheckedChange={v => setForm({ ...form, is_featured: v })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "تاريخ الإطلاق" : "Launch Date"}</Label>
                    <Input type="date" value={form.launch_date} onChange={e => setForm({ ...form, launch_date: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "ترتيب العرض" : "Sort Order"}</Label>
                    <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
              </TabsContent>

              {/* Locale */}
              <TabsContent value="locale" className="space-y-4 mt-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{language === "ar" ? "اللغة الافتراضية" : "Default Language"}</Label>
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
                  <Label className="text-xs">{language === "ar" ? "اللغات المدعومة" : "Supported Languages"}</Label>
                  <Input
                    value={form.supported_languages.join(", ")}
                    onChange={e => setForm({ ...form, supported_languages: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                    placeholder="ar, en, fr"
                  />
                  <p className="text-[10px] text-muted-foreground">{language === "ar" ? "مفصولة بفاصلة" : "Comma-separated language codes"}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "رمز العملة" : "Currency Code"}</Label>
                    <Input value={form.currency_code} onChange={e => setForm({ ...form, currency_code: e.target.value.slice(0, 3) })} placeholder="SAR" className="font-mono uppercase" maxLength={3} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "رمز العملة" : "Symbol"}</Label>
                    <Input value={form.currency_symbol} onChange={e => setForm({ ...form, currency_symbol: e.target.value })} placeholder="SAR" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "اسم العملة" : "Currency Name"}</Label>
                    <Input value={form.currency_name} onChange={e => setForm({ ...form, currency_name: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{language === "ar" ? "اسم العملة (AR)" : "Currency Name (AR)"}</Label>
                  <Input value={form.currency_name_ar} onChange={e => setForm({ ...form, currency_name_ar: e.target.value })} dir="rtl" />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "المنطقة الزمنية" : "Timezone"}</Label>
                    <Input value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} placeholder="Asia/Riyadh" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "تنسيق التاريخ" : "Date Format"}</Label>
                    <Input value={form.date_format || ""} onChange={e => setForm({ ...form, date_format: e.target.value })} placeholder="yyyy-MM-dd" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "مفتاح الهاتف" : "Phone Code"}</Label>
                    <Input value={form.phone_code} onChange={e => setForm({ ...form, phone_code: e.target.value })} placeholder="+966" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "تنسيق الهاتف" : "Phone Format"}</Label>
                    <Input value={form.phone_format} onChange={e => setForm({ ...form, phone_format: e.target.value })} placeholder="XXX XXX XXXX" />
                  </div>
                </div>
              </TabsContent>

              {/* Tax */}
              <TabsContent value="tax" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "نسبة الضريبة %" : "Tax Rate %"}</Label>
                    <Input type="number" step="0.01" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label className="text-xs">{language === "ar" ? "يتطلب رقم ضريبي" : "Requires Tax Number"}</Label>
                    <Switch checked={form.requires_tax_number} onCheckedChange={v => setForm({ ...form, requires_tax_number: v })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "اسم الضريبة (EN)" : "Tax Name (EN)"}</Label>
                    <Input value={form.tax_name} onChange={e => setForm({ ...form, tax_name: e.target.value })} placeholder="VAT" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "اسم الضريبة (AR)" : "Tax Name (AR)"}</Label>
                    <Input value={form.tax_name_ar} onChange={e => setForm({ ...form, tax_name_ar: e.target.value })} dir="rtl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{language === "ar" ? "ملاحظات إقامة البيانات" : "Data Residency Notes"}</Label>
                  <Textarea value={form.data_residency_notes} onChange={e => setForm({ ...form, data_residency_notes: e.target.value })} rows={3} />
                </div>
              </TabsContent>

              {/* Features */}
              <TabsContent value="features" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "تحكم في الميزات المتاحة في هذه الدولة" : "Control which features are available in this country"}
                </p>
                <div className="space-y-2">
                  {Object.entries(featureLabels).map(([key, labels]) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm">{language === "ar" ? labels.ar : labels.en}</Label>
                      </div>
                      <Switch
                        checked={form.features[key] ?? true}
                        onCheckedChange={v => setForm({ ...form, features: { ...form.features, [key]: v } })}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Support */}
              <TabsContent value="support" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "بريد الدعم" : "Support Email"}</Label>
                    <Input type="email" value={form.support_email} onChange={e => setForm({ ...form, support_email: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{language === "ar" ? "هاتف الدعم" : "Support Phone"}</Label>
                    <Input value={form.support_phone} onChange={e => setForm({ ...form, support_phone: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{language === "ar" ? "عنوان المكتب (EN)" : "Office Address (EN)"}</Label>
                  <Textarea value={form.local_office_address} onChange={e => setForm({ ...form, local_office_address: e.target.value })} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{language === "ar" ? "عنوان المكتب (AR)" : "Office Address (AR)"}</Label>
                  <Textarea value={form.local_office_address_ar} onChange={e => setForm({ ...form, local_office_address_ar: e.target.value })} rows={2} dir="rtl" />
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closeForm}>
              <X className="h-4 w-4 mr-2" />{language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.code || !form.name || saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />{language === "ar" ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
