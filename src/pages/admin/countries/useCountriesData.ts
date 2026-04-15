import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCSVExport } from "@/hooks/useCSVExport";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { QUERY_LIMIT_LARGE } from "@/lib/constants";

export interface Country {
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

export const defaultForm = {
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

export const continents = ["Asia", "Africa", "Europe", "North America", "South America", "Oceania"];
export const regions = ["GCC", "MENA", "Europe", "Americas", "South Asia", "Southeast Asia", "East Asia", "Oceania", "Sub-Saharan Africa"];

export function useCountriesData() {
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
  const [deleteTarget, setDeleteTarget] = useState<Country | null>(null);
  const [detailCountry, setDetailCountry] = useState<Country | null>(null);

  const { data: countries = [], isLoading } = useQuery({
    queryKey: ["admin-countries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("countries").select("id, code, code_alpha3, name, name_ar, name_local, flag_emoji, continent, region, default_language, supported_languages, currency_code, currency_symbol, currency_name, currency_name_ar, timezone, date_format, phone_code, phone_format, is_active, is_featured, launch_date, sort_order, tax_rate, tax_name, tax_name_ar, requires_tax_number, data_residency_notes, features, support_email, support_phone, local_office_address, local_office_address_ar, metadata, created_at, updated_at").order("sort_order").order("name").limit(QUERY_LIMIT_LARGE);
      if (error) throw error;
      return (data || []) as Country[];
    },
  });

  const filtered = useMemo(() => {
    let list = [...countries];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) || (c.name_ar || "").includes(q) ||
        c.code.toLowerCase().includes(q) || (c.code_alpha3 || "").toLowerCase().includes(q)
      );
    }
    if (regionFilter !== "all") list = list.filter(c => c.region === regionFilter);
    if (statusFilter === "active") list = list.filter(c => c.is_active);
    if (statusFilter === "inactive") list = list.filter(c => !c.is_active);
    if (continentFilter !== "all") list = list.filter(c => c.continent === continentFilter);
    return list;
  }, [countries, searchQuery, regionFilter, statusFilter, continentFilter]);

  const { sorted: sortedCountries, sortColumn, sortDirection, toggleSort } = useTableSort(filtered, "sort_order", "asc");
  const countryPagination = usePagination(sortedCountries, { defaultPageSize: 15 });
  const bulk = useAdminBulkActions(sortedCountries);

  const { exportCSV: exportCountriesCSV } = useCSVExport({
    columns: [
      { header: "Code", accessor: (r: Country) => r.code.trim() },
      { header: isAr ? "الاسم" : "Name", accessor: (r: Country) => r.name },
      { header: isAr ? "الاسم (عربي)" : "Name (AR)", accessor: (r: Country) => r.name_ar || "" },
      { header: isAr ? "المنطقة" : "Region", accessor: (r: Country) => r.region || "" },
      { header: isAr ? "القارة" : "Continent", accessor: (r: Country) => r.continent || "" },
      { header: isAr ? "العملة" : "Currency", accessor: (r: Country) => `${r.currency_code.trim()} (${r.currency_symbol})` },
      { header: isAr ? "كود الهاتف" : "Phone Code", accessor: (r: Country) => r.phone_code || "" },
      { header: isAr ? "الضريبة" : "Tax Rate", accessor: (r: Country) => r.tax_rate || 0 },
      { header: isAr ? "نشط" : "Active", accessor: (r: Country) => r.is_active ? "Yes" : "No" },
    ],
    filename: "countries",
  });

  const logAudit = async (code: string, action: string, summary: string, summaryAr: string, changes?: Record<string, { old: unknown; new: unknown }>) => {
    await supabase.from("country_audit_log").insert([{
      country_code: code, action, summary, summary_ar: summaryAr, changes: (changes || null) as any,
    }]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code.toUpperCase(), code_alpha3: form.code_alpha3?.toUpperCase() || null,
        name: form.name, name_ar: form.name_ar || null, name_local: form.name_local || null,
        flag_emoji: form.flag_emoji || null, continent: form.continent || null, region: form.region || null,
        default_language: form.default_language, supported_languages: form.supported_languages,
        currency_code: form.currency_code.toUpperCase(), currency_symbol: form.currency_symbol,
        currency_name: form.currency_name || null, currency_name_ar: form.currency_name_ar || null,
        timezone: form.timezone, date_format: form.date_format || null,
        phone_code: form.phone_code || null, phone_format: form.phone_format || null,
        is_active: form.is_active, is_featured: form.is_featured,
        launch_date: form.launch_date || null, sort_order: form.sort_order,
        tax_rate: form.tax_rate, tax_name: form.tax_name || null, tax_name_ar: form.tax_name_ar || null,
        requires_tax_number: form.requires_tax_number, data_residency_notes: form.data_residency_notes || null,
        features: form.features,
        support_email: form.support_email || null, support_phone: form.support_phone || null,
        local_office_address: form.local_office_address || null, local_office_address_ar: form.local_office_address_ar || null,
      };

      if (editCountry) {
        const changes: Record<string, { old: unknown; new: unknown }> = {};
        const ec = editCountry as unknown as Record<string, unknown>;
        Object.entries(payload).forEach(([k, v]) => {
          if (JSON.stringify(ec[k]) !== JSON.stringify(v)) changes[k] = { old: ec[k], new: v };
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
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : String(err) }),
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
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : String(err) }),
  });

  const bulkToggleMutation = useMutation({
    mutationFn: async (active: boolean) => {
      const ids = [...bulk.selected];
      const { error } = await supabase.from("countries").update({ is_active: active }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-countries"] });
      bulk.clearSelection();
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

  return {
    isAr, toast,
    // Filters
    searchQuery, setSearchQuery,
    regionFilter, setRegionFilter,
    statusFilter, setStatusFilter,
    continentFilter, setContinentFilter,
    // Form
    editCountry, showForm, form, setForm,
    activeTab, setActiveTab, formTab, setFormTab,
    deleteTarget, setDeleteTarget,
    detailCountry, setDetailCountry,
    // Data
    countries, isLoading, filtered,
    sortedCountries, sortColumn, sortDirection, toggleSort,
    countryPagination, bulk,
    // Derived
    stats, grouped, enabledFeatureCount,
    // Mutations
    saveMutation, toggleActiveMutation, deleteMutation, bulkToggleMutation,
    // Actions
    openEdit, duplicateCountry, openNew, closeForm,
    exportCountriesCSV,
  };
}
