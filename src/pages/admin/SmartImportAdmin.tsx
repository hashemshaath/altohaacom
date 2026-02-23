import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GoogleMapEmbed } from "@/components/smart-import/GoogleMapEmbed";
import { DetailTabs } from "@/components/smart-import/DetailTabs";
import { AddRecordForm } from "@/components/smart-import/AddRecordForm";
import { ImportHistory } from "@/components/smart-import/ImportHistory";
import { DataQualityIndicator } from "@/components/smart-import/DataQualityIndicator";
import { ExportDataButton } from "@/components/smart-import/ExportDataButton";
import { ImportStats } from "@/components/smart-import/ImportStats";
import { BulkUrlImport } from "@/components/smart-import/BulkUrlImport";
import { EditableField } from "@/components/smart-import/EditableField";
import type { ImportedData } from "@/components/smart-import/SmartImportDialog";
import {
  type SearchResultItem, type ExistingRecord, type Step,
  type TargetTable, type EntityType, type CompanyType,
  SOURCE_CHANNELS, TARGET_TABLE_OPTIONS,
  ENTITY_TYPE_LABELS, COMPANY_TYPE_LABELS,
  countFields,
} from "@/components/smart-import/types";
import {
  Search, Loader2, MapPin, Globe, Sparkles, CheckCircle,
  Star, ChevronRight, ArrowLeft, AlertCircle,
  RefreshCw, Plus, Clock, Calendar, Building2,
  Phone, Link2, Zap, BarChart3, Layers, Edit3,
  Copy, ExternalLink,
} from "lucide-react";

// ─── Payload builders ───
const buildEntityPayload = (d: ImportedData) => {
  const payload: Record<string, any> = {};
  if (d.name_en) payload.name = d.name_en;
  if (d.name_ar) payload.name_ar = d.name_ar;
  if (d.abbreviation_en) payload.abbreviation = d.abbreviation_en;
  if (d.abbreviation_ar) payload.abbreviation_ar = d.abbreviation_ar;
  if (d.description_en) payload.description = d.description_en;
  if (d.description_ar) payload.description_ar = d.description_ar;
  if (d.mission_en) payload.mission = d.mission_en;
  if (d.mission_ar) payload.mission_ar = d.mission_ar;
  if (d.phone) payload.phone = d.phone;
  if (d.fax) payload.fax = d.fax;
  if (d.email) payload.email = d.email;
  if (d.website) payload.website = d.website;
  if (d.city_en || d.city_ar) payload.city = d.city_en || d.city_ar;
  if (d.country_en || d.country_ar) payload.country = d.country_en || d.country_ar;
  if (d.full_address_en) payload.address = d.full_address_en;
  if (d.full_address_ar) payload.address_ar = d.full_address_ar;
  if (d.postal_code) payload.postal_code = d.postal_code;
  if (d.latitude) payload.latitude = d.latitude;
  if (d.longitude) payload.longitude = d.longitude;
  if (d.registration_number) payload.registration_number = d.registration_number;
  if (d.license_number) payload.license_number = d.license_number;
  if (d.founded_year) payload.founded_year = d.founded_year;
  if (d.president_name_en) payload.president_name = d.president_name_en;
  if (d.president_name_ar) payload.president_name_ar = d.president_name_ar;
  if (d.secretary_name_en) payload.secretary_name = d.secretary_name_en;
  if (d.secretary_name_ar) payload.secretary_name_ar = d.secretary_name_ar;
  if (d.member_count) payload.member_count = d.member_count;
  const services = [...(d.services_en || []), ...(d.services_ar || [])].filter(Boolean);
  if (services.length) payload.services = services;
  const specs = [...(d.specializations_en || []), ...(d.specializations_ar || [])].filter(Boolean);
  if (specs.length) payload.specializations = specs;
  if (d.affiliated_organizations?.length) payload.affiliated_organizations = d.affiliated_organizations;
  if (d.tags?.length) payload.tags = d.tags;
  if (d.social_media && Object.values(d.social_media).some(Boolean)) payload.social_links = d.social_media;
  if (d.logo_url) payload.logo_url = d.logo_url;
  if (d.cover_url) payload.cover_image_url = d.cover_url;
  return payload;
};

const buildCompanyPayload = (d: ImportedData) => {
  const payload: Record<string, any> = {};
  if (d.name_en) payload.name = d.name_en;
  if (d.name_ar) payload.name_ar = d.name_ar;
  if (d.description_en) payload.description = d.description_en;
  if (d.description_ar) payload.description_ar = d.description_ar;
  if (d.phone) payload.phone = d.phone;
  if (d.phone_secondary) payload.phone_secondary = d.phone_secondary;
  if (d.fax) payload.fax = d.fax;
  if (d.email) payload.email = d.email;
  if (d.website) payload.website = d.website;
  if (d.city_en || d.city_ar) payload.city = d.city_en || d.city_ar;
  if (d.country_en || d.country_ar) payload.country = d.country_en || d.country_ar;
  if (d.full_address_en) payload.address = d.full_address_en;
  if (d.full_address_ar) payload.address_ar = d.full_address_ar;
  if (d.postal_code) payload.postal_code = d.postal_code;
  if (d.country_code) payload.country_code = d.country_code;
  if (d.registration_number) payload.registration_number = d.registration_number;
  if (d.founded_year) payload.founded_year = d.founded_year;
  if (d.business_hours) payload.working_hours = d.business_hours;
  if (d.latitude) payload.latitude = d.latitude;
  if (d.longitude) payload.longitude = d.longitude;
  if (d.neighborhood_en) payload.neighborhood = d.neighborhood_en;
  if (d.neighborhood_ar) payload.neighborhood_ar = d.neighborhood_ar;
  if (d.street_en) payload.street = d.street_en;
  if (d.street_ar) payload.street_ar = d.street_ar;
  if (d.google_maps_url) payload.google_maps_url = d.google_maps_url;
  if (d.rating) payload.rating = d.rating;
  if (d.total_reviews) payload.total_reviews = d.total_reviews;
  if (d.national_id) payload.national_address = d.national_id;
  const specs = [...(d.specializations_en || []), ...(d.specializations_ar || [])].filter(Boolean);
  if (specs.length) payload.specializations = specs;
  if (d.social_media && Object.values(d.social_media).some(Boolean)) payload.social_links = d.social_media;
  if (d.description_en || d.business_type_en) payload.tagline = d.business_type_en || d.description_en?.substring(0, 100);
  if (d.logo_url) payload.logo_url = d.logo_url;
  if (d.cover_url) payload.cover_image_url = d.cover_url;
  payload.import_source = 'smart_import';
  return payload;
};

const buildEstablishmentPayload = (d: ImportedData) => {
  const payload: Record<string, any> = {};
  if (d.name_en) payload.name = d.name_en;
  if (d.name_ar) payload.name_ar = d.name_ar;
  if (d.description_en) payload.description = d.description_en;
  if (d.description_ar) payload.description_ar = d.description_ar;
  if (d.phone) payload.phone = d.phone;
  if (d.email) payload.email = d.email;
  if (d.website) payload.website = d.website;
  if (d.city_en || d.city_ar) payload.city = d.city_en || d.city_ar;
  if (d.city_ar) payload.city_ar = d.city_ar;
  if (d.country_code) payload.country_code = d.country_code;
  if (d.full_address_en) payload.address = d.full_address_en;
  if (d.full_address_ar) payload.address_ar = d.full_address_ar;
  if (d.business_type_en) payload.cuisine_type = d.business_type_en;
  if (d.business_type_ar) payload.cuisine_type_ar = d.business_type_ar;
  if (d.rating) payload.star_rating = Math.round(d.rating);
  if (d.logo_url) payload.logo_url = d.logo_url;
  if (d.cover_url) payload.cover_image_url = d.cover_url;
  if (d.latitude) payload.latitude = d.latitude;
  if (d.longitude) payload.longitude = d.longitude;
  if (d.country_code) payload.country_code = d.country_code;
  if (d.google_maps_url) payload.google_maps_url = d.google_maps_url;
  if (d.social_media && Object.values(d.social_media).some(Boolean)) payload.social_links = d.social_media;
  return payload;
};

const getPayloadForTable = (d: ImportedData, table: TargetTable) => {
  switch (table) {
    case "culinary_entities": return buildEntityPayload(d);
    case "companies": return buildCompanyPayload(d);
    case "establishments": return buildEstablishmentPayload(d);
  }
};

// ─── Main Component ───
export default function SmartImportAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [directUrl, setDirectUrl] = useState("");

  const [step, setStep] = useState<Step>("search");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResultItem | null>(null);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [searchedLocation, setSearchedLocation] = useState("");
  const [searchTime, setSearchTime] = useState<number | null>(null);

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [details, setDetails] = useState<ImportedData | null>(null);
  const [sourcesUsed, setSourcesUsed] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("overview");
  const [dataQuality, setDataQuality] = useState<number>(0);

  const [checkingDb, setCheckingDb] = useState(false);
  const [existingRecords, setExistingRecords] = useState<ExistingRecord[]>([]);
  const [dbChecked, setDbChecked] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [targetTable, setTargetTable] = useState<TargetTable>("culinary_entities");
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType>("culinary_association");
  const [selectedCompanyType, setSelectedCompanyType] = useState<CompanyType>("supplier");
  const [selectedEstablishmentType, setSelectedEstablishmentType] = useState("restaurant");
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedExistingId, setSelectedExistingId] = useState<string | null>(null);

  const [suggestedTarget, setSuggestedTarget] = useState<{ table: string; sub_type: string; confidence: number } | null>(null);

  const [batchSelected, setBatchSelected] = useState<Set<string>>(new Set());
  const [batchImporting, setBatchImporting] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, successes: 0, failures: 0 });

  const [showHistory, setShowHistory] = useState(false);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [importMode, setImportMode] = useState<"search" | "url" | "bulk">("search");
  const [urlImporting, setUrlImporting] = useState(false);

  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Inline editing mode
  const [editingFields, setEditingFields] = useState(false);

  const fieldCount = useMemo(() => countFields(details), [details]);

  // Load stats on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data } = await supabase.functions.invoke("smart-import", { body: { mode: "stats" } });
        if (data?.success) setStats(data.stats);
      } catch {} finally { setLoadingStats(false); }
    };
    loadStats();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') {
        if (step === "details") handleBackToResults();
        else if (step === "results") handleNewSearch();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleNewSearch();
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step]);

  // Inline field editing
  const handleFieldUpdate = useCallback((key: string, value: string) => {
    setDetails(prev => prev ? { ...prev, [key]: value } : prev);
    toast({ title: isAr ? "تم تعديل الحقل" : "Field updated" });
  }, [isAr]);

  // ─── Step 1: Search ───
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchResults([]);
    setSelectedResult(null);
    setDetails(null);
    setSourcesUsed({});
    setDbChecked(false);
    setExistingRecords([]);
    setSearchedQuery(query.trim());
    setSearchedLocation(location.trim());
    setSearchTime(null);

    const startTime = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke("smart-import", {
        body: { query: query.trim(), location: location.trim() || undefined, mode: "search" },
      });
      if (error) throw new Error(typeof error === 'object' && error.message ? error.message : String(error));
      if (!data?.success) throw new Error(data?.error || "Search failed");
      setSearchResults(data.results || []);
      setSearchTime(Date.now() - startTime);
      setStep("results");
      if (!data.results?.length) {
        toast({ title: isAr ? "لا توجد نتائج" : "No Results", description: isAr ? "جرب كلمات بحث مختلفة" : "Try different search terms", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: isAr ? "خطأ في البحث" : "Search Error", description: err.message, variant: "destructive" });
    } finally {
      setSearching(false);
    }
  }, [query, location, isAr]);

  // ─── Direct URL Import ───
  const handleUrlImport = useCallback(async () => {
    if (!directUrl.trim()) return;
    setUrlImporting(true);
    setDetails(null);
    setSourcesUsed({});
    setDbChecked(false);
    setExistingRecords([]);
    setSelectedResult(null);
    setDataQuality(0);

    try {
      const { data, error } = await supabase.functions.invoke("smart-import", {
        body: { url: directUrl.trim(), mode: "url" },
      });
      if (error) throw new Error(typeof error === 'object' && error.message ? error.message : String(error));
      if (!data?.success) throw new Error(data?.error || "URL import failed");

      setDetails(data.data);
      setSourcesUsed(data.sources_used || {});
      setDataQuality(data.data_quality || 0);
      if (data.suggested_target) {
        setSuggestedTarget(data.suggested_target);
        const st = data.suggested_target;
        if (st.table === 'culinary_entities') { setTargetTable('culinary_entities'); setSelectedEntityType(st.sub_type as EntityType); }
        else if (st.table === 'companies') { setTargetTable('companies'); setSelectedCompanyType(st.sub_type as CompanyType); }
        else if (st.table === 'establishments') { setTargetTable('establishments'); setSelectedEstablishmentType(st.sub_type); }
      }
      setStep("details");
      toast({ title: isAr ? "تم استخراج البيانات بنجاح" : "Data extracted successfully" });
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setUrlImporting(false);
    }
  }, [directUrl, isAr]);

  // ─── Click result → auto-fetch details ───
  const handleResultClick = useCallback(async (item: SearchResultItem) => {
    setSelectedResult(item);
    setLoadingDetails(true);
    setDetails(null);
    setActiveTab("overview");
    setDbChecked(false);
    setExistingRecords([]);
    setDataQuality(0);

    try {
      const { data, error } = await supabase.functions.invoke("smart-import", {
        body: {
          query: item.name,
          location: location.trim() || undefined,
          website_url: websiteUrl.trim() || undefined,
          mode: "details",
          result_url: item.url || undefined,
          latitude: item.latitude || undefined,
          longitude: item.longitude || undefined,
        },
      });
      if (error) throw new Error(typeof error === 'object' && error.message ? error.message : String(error));
      if (!data?.success) throw new Error(data?.error || "Failed to fetch details");

      setDetails(data.data);
      setSourcesUsed(data.sources_used || {});
      setDataQuality(data.data_quality || 0);
      if (data.suggested_target) {
        setSuggestedTarget(data.suggested_target);
        const st = data.suggested_target;
        if (st.table === 'culinary_entities') { setTargetTable('culinary_entities'); setSelectedEntityType(st.sub_type as EntityType); }
        else if (st.table === 'companies') { setTargetTable('companies'); setSelectedCompanyType(st.sub_type as CompanyType); }
        else if (st.table === 'establishments') { setTargetTable('establishments'); setSelectedEstablishmentType(st.sub_type); }
      }
      setStep("details");
      toast({ title: isAr ? "تم جلب البيانات بنجاح" : "Data fetched successfully" });
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoadingDetails(false);
    }
  }, [location, websiteUrl, isAr]);

  const handleRescrape = useCallback(async () => {
    if (!selectedResult && !directUrl) return;
    if (selectedResult) await handleResultClick(selectedResult);
    else if (directUrl) await handleUrlImport();
  }, [selectedResult, directUrl, handleResultClick, handleUrlImport]);

  // ─── Check DB ───
  const checkExistingEntity = useCallback(async () => {
    if (!details) return;
    setCheckingDb(true);
    setExistingRecords([]);

    try {
      const nameEn = details.name_en?.trim();
      const nameAr = details.name_ar?.trim();
      const phone = details.phone?.trim();
      const email = details.email?.trim()?.toLowerCase();

      const orConditions: string[] = [];
      if (nameEn) orConditions.push(`name.ilike.%${nameEn}%`);
      if (nameAr) orConditions.push(`name_ar.ilike.%${nameAr}%`);
      if (phone) orConditions.push(`phone.eq.${phone}`);
      if (email) orConditions.push(`email.ilike.${email}`);

      if (orConditions.length === 0) { setCheckingDb(false); setDbChecked(true); return; }
      const orStr = orConditions.join(",");

      const [entRes, compRes, estRes] = await Promise.all([
        supabase.from("culinary_entities").select("id, name, name_ar, entity_number, type, city, phone, email, website").or(orStr),
        supabase.from("companies").select("id, name, name_ar, company_number, type, city, phone, email, website").or(orStr),
        supabase.from("establishments").select("id, name, name_ar, type, city, phone, email, website").or(orStr),
      ]);

      const records: ExistingRecord[] = [];
      (entRes.data || []).forEach((e: any) => records.push({ id: e.id, name: e.name, name_ar: e.name_ar, identifier: e.entity_number, sub_type: e.type, city: e.city, phone: e.phone, email: e.email, website: e.website, table: "culinary_entities" }));
      (compRes.data || []).forEach((c: any) => records.push({ id: c.id, name: c.name, name_ar: c.name_ar, identifier: c.company_number || c.id.slice(0, 8), sub_type: c.type, city: c.city, phone: c.phone, email: c.email, website: c.website, table: "companies" }));
      (estRes.data || []).forEach((e: any) => records.push({ id: e.id, name: e.name, name_ar: e.name_ar, identifier: e.id.slice(0, 8), sub_type: e.type, city: e.city, phone: e.phone, email: e.email, website: e.website, table: "establishments" }));

      setExistingRecords(records);
    } catch (err: any) {
      console.error("DB check error:", err);
    } finally {
      setCheckingDb(false);
      setDbChecked(true);
    }
  }, [details]);

  useEffect(() => {
    if (details && !dbChecked && step === "details") {
      checkExistingEntity();
    }
  }, [details, dbChecked, step, checkExistingEntity]);

  // ─── Update existing record ───
  const handleUpdateRecord = async (record: ExistingRecord) => {
    if (!details) return;
    setUpdating(true);
    setSelectedExistingId(record.id);

    try {
      const updatePayload = getPayloadForTable(details, record.table);
      const { error } = await supabase.from(record.table).update(updatePayload).eq("id", record.id);
      if (error) throw error;
      const tableLabel = TARGET_TABLE_OPTIONS.find(t => t.value === record.table);
      toast({ title: isAr ? "تم تحديث البيانات بنجاح" : `${tableLabel?.label_en || 'Record'} updated successfully` });
      await logImport('update', record.table, record.id, record.sub_type);
      setDbChecked(false);
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(false);
      setSelectedExistingId(null);
    }
  };

  // ─── Add new record ───
  const handleAddNewRecord = async () => {
    if (!details) return;
    setSaving(true);

    try {
      const name = details.name_en || details.name_ar || "Unknown";
      let recordId: string | null = null;
      let subType = '';

      if (targetTable === "culinary_entities") {
        subType = selectedEntityType;
        const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const payload = { ...buildEntityPayload(details), name: details.name_en || name, type: selectedEntityType, scope: "local" as const, status: "active" as const, is_visible: true, is_verified: false, slug, entity_number: "", created_by: user?.id || null };
        const { data: inserted, error } = await supabase.from("culinary_entities").insert(payload).select("id").single();
        if (error) throw error;
        recordId = inserted?.id;
      } else if (targetTable === "companies") {
        subType = selectedCompanyType;
        const payload = { ...buildCompanyPayload(details), name: details.name_en || name, type: selectedCompanyType, status: "pending" as const, country_code: details.country_code || "SA", created_by: user?.id || null };
        const { data: inserted, error } = await supabase.from("companies").insert(payload).select("id").single();
        if (error) throw error;
        recordId = inserted?.id;
      } else {
        subType = selectedEstablishmentType;
        const payload = { ...buildEstablishmentPayload(details), name: details.name_en || name, type: selectedEstablishmentType, is_active: true, is_verified: false, created_by: user?.id || null };
        const { data: inserted, error } = await supabase.from("establishments").insert(payload).select("id").single();
        if (error) throw error;
        recordId = inserted?.id;
      }

      const tableLabel = TARGET_TABLE_OPTIONS.find(t => t.value === targetTable);
      toast({ title: isAr ? "تم الإضافة بنجاح" : `${tableLabel?.label_en || 'Record'} added successfully` });
      await logImport('create', targetTable, recordId, subType);
      setShowAddForm(false);
      setDbChecked(false);
      // Refresh stats
      try {
        const { data: newStats } = await supabase.functions.invoke("smart-import", { body: { mode: "stats" } });
        if (newStats?.success) setStats(newStats.stats);
      } catch {}
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleNewSearch = useCallback(() => {
    setStep("search");
    setSearchResults([]);
    setSelectedResult(null);
    setDetails(null);
    setSourcesUsed({});
    setDbChecked(false);
    setExistingRecords([]);
    setBatchSelected(new Set());
    setSuggestedTarget(null);
    setDataQuality(0);
    setSearchTime(null);
    setEditingFields(false);
  }, []);

  const handleBackToResults = useCallback(() => {
    setStep("results");
    setDetails(null);
    setSourcesUsed({});
    setDbChecked(false);
    setExistingRecords([]);
    setSuggestedTarget(null);
    setDataQuality(0);
    setEditingFields(false);
  }, []);

  const logImport = async (action: 'create' | 'update', table: TargetTable, recordId: string | null, entityType: string) => {
    try {
      await supabase.from("smart_import_logs").insert({
        imported_by: user?.id || '',
        target_table: table,
        target_record_id: recordId,
        action,
        entity_name: details?.name_en || selectedResult?.name,
        entity_name_ar: details?.name_ar,
        entity_type: entityType,
        source_query: searchedQuery,
        source_location: searchedLocation,
        source_url: selectedResult?.url || directUrl,
        sources_used: sourcesUsed,
        extracted_fields_count: fieldCount,
        imported_data: details as any,
        status: 'success',
      });
    } catch (e) { console.error('Failed to log import:', e); }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data } = await supabase.from("smart_import_logs").select("*").order("created_at", { ascending: false }).limit(50);
      setImportHistory(data || []);
    } catch (e) { console.error('Failed to load history:', e); }
    finally { setLoadingHistory(false); }
  };

  // ─── Batch import ───
  const handleBatchImport = async () => {
    if (batchSelected.size === 0) return;
    setBatchImporting(true);
    const selected = searchResults.filter(r => batchSelected.has(r.id));
    setBatchProgress({ current: 0, total: selected.length, successes: 0, failures: 0 });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selected.length; i++) {
      setBatchProgress({ current: i + 1, total: selected.length, successes: successCount, failures: failCount });
      const item = selected[i];
      try {
        const { data, error } = await supabase.functions.invoke("smart-import", {
          body: { query: item.name, location: location.trim() || undefined, mode: "details", result_url: item.url || undefined, latitude: item.latitude || undefined, longitude: item.longitude || undefined },
        });
        if (error || !data?.success) { failCount++; continue; }

        const d = data.data as ImportedData;
        const suggestion = data.suggested_target || { table: 'establishments', sub_type: 'restaurant' };
        const tbl = suggestion.table as TargetTable;
        const name = d.name_en || d.name_ar || item.name;
        let recordId: string | null = null;

        if (tbl === 'culinary_entities') {
          const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
          const payload = { ...buildEntityPayload(d), name: d.name_en || name, type: suggestion.sub_type as EntityType, scope: 'local' as const, status: 'active' as const, is_visible: true, is_verified: false, slug, entity_number: '', created_by: user?.id || null };
          const { data: inserted } = await supabase.from("culinary_entities").insert(payload).select("id").single();
          recordId = inserted?.id;
        } else if (tbl === 'companies') {
          const payload = { ...buildCompanyPayload(d), name: d.name_en || name, type: suggestion.sub_type as CompanyType, status: 'pending' as const, country_code: d.country_code || 'SA', created_by: user?.id || null };
          const { data: inserted } = await supabase.from("companies").insert(payload).select("id").single();
          recordId = inserted?.id;
        } else {
          const payload = { ...buildEstablishmentPayload(d), name: d.name_en || name, type: suggestion.sub_type, is_active: true, is_verified: false, created_by: user?.id || null };
          const { data: inserted } = await supabase.from("establishments").insert(payload).select("id").single();
          recordId = inserted?.id;
        }

        try {
          await supabase.from("smart_import_logs").insert({
            imported_by: user?.id || '', target_table: tbl, target_record_id: recordId, action: 'create',
            entity_name: d.name_en || name, entity_name_ar: d.name_ar, entity_type: suggestion.sub_type,
            source_query: searchedQuery, source_location: searchedLocation, source_url: item.url,
            sources_used: data.sources_used, extracted_fields_count: countFields(d), imported_data: d as any, status: 'success',
          });
        } catch {}
        successCount++;
      } catch (err) {
        console.error('Batch import error:', item.name, err);
        failCount++;
      }
    }

    setBatchImporting(false);
    setBatchSelected(new Set());
    setBatchProgress({ current: selected.length, total: selected.length, successes: successCount, failures: failCount });
    toast({
      title: isAr ? "تم الاستيراد الجماعي" : "Batch Import Complete",
      description: isAr
        ? `✅ ${successCount} نجح | ❌ ${failCount} فشل — من أصل ${selected.length}`
        : `✅ ${successCount} succeeded | ❌ ${failCount} failed — out of ${selected.length}`,
    });
    // Refresh stats
    try {
      const { data: newStats } = await supabase.functions.invoke("smart-import", { body: { mode: "stats" } });
      if (newStats?.success) setStats(newStats.stats);
    } catch {}
  };

  const toggleBatchSelect = useCallback((id: string) => {
    setBatchSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setBatchSelected(prev =>
      prev.size === searchResults.length ? new Set() : new Set(searchResults.map(r => r.id))
    );
  }, [searchResults]);

  // Copy all details as JSON
  const copyAllData = useCallback(() => {
    if (details) {
      navigator.clipboard.writeText(JSON.stringify(details, null, 2));
      toast({ title: isAr ? "تم نسخ البيانات" : "Data copied to clipboard" });
    }
  }, [details, isAr]);

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {step !== "search" && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={step === "details" ? handleBackToResults : handleNewSearch}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              {isAr ? "الاستيراد الذكي" : "Smart Import"}
              <Badge variant="secondary" className="text-[10px] font-normal">v4.0</Badge>
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {step === "search" && (isAr ? "ابحث، الصق رابط، أو استورد دفعة واحدة" : "Search, paste URL, or bulk import")}
              {step === "results" && (isAr ? `${searchResults.length} نتيجة${searchTime ? ` في ${(searchTime / 1000).toFixed(1)}ث` : ''} — اضغط للتحليل` : `${searchResults.length} results${searchTime ? ` in ${(searchTime / 1000).toFixed(1)}s` : ''} — click to analyze`)}
              {step === "details" && (isAr ? `${fieldCount} حقل — جودة ${dataQuality}% — قابل للتعديل` : `${fieldCount} fields — ${dataQuality}% quality — editable`)}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { setShowHistory(true); loadHistory(); }}>
                  <Clock className="h-3.5 w-3.5" />
                  {isAr ? "السجل" : "History"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isAr ? "عرض سجل الاستيراد" : "View import history"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex items-center gap-1.5">
            {[
              { key: "search", label: isAr ? "بحث" : "Search", num: 1 },
              { key: "results", label: isAr ? "نتائج" : "Results", num: 2 },
              { key: "details", label: isAr ? "تفاصيل" : "Details", num: 3 },
            ].map((s, i) => (
              <div key={s.key} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
                <Badge variant={step === s.key ? "default" : "outline"} className="text-xs gap-1">
                  {s.num}. {s.label}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── STEP 1: Search Form ─── */}
      {step === "search" && (
        <div className="space-y-4">
          {/* Stats Dashboard */}
          <ImportStats stats={stats} loading={loadingStats} isAr={isAr} />

          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button variant={importMode === "search" ? "default" : "outline"} size="sm" className="gap-1.5" onClick={() => setImportMode("search")}>
              <Search className="h-3.5 w-3.5" />
              {isAr ? "بحث خرائط" : "Maps Search"}
            </Button>
            <Button variant={importMode === "url" ? "default" : "outline"} size="sm" className="gap-1.5" onClick={() => setImportMode("url")}>
              <Link2 className="h-3.5 w-3.5" />
              {isAr ? "رابط مباشر" : "URL Import"}
            </Button>
            <Button variant={importMode === "bulk" ? "default" : "outline"} size="sm" className="gap-1.5" onClick={() => setImportMode("bulk")}>
              <Layers className="h-3.5 w-3.5" />
              {isAr ? "استيراد جماعي" : "Bulk Import"}
            </Button>
          </div>

          {importMode === "search" ? (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-500" />
                  {isAr ? "البحث في خرائط جوجل" : "Search Google Maps"}
                </CardTitle>
                <CardDescription>
                  {isAr ? "أدخل اسم المنشأة والموقع — ⌘K للبحث السريع" : "Enter entity name and location — ⌘K for quick search"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs">{isAr ? "اسم الكيان / المنشأة" : "Entity / Business Name"}</Label>
                      <div className="relative">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input ref={searchInputRef} className="ps-9 h-11" placeholder={isAr ? "مثال: مطعم الريف، فندق هيلتون..." : "e.g. Al Reef Restaurant, Hilton Hotel..."} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{isAr ? "الموقع" : "Location"}</Label>
                      <div className="relative">
                        <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="ps-9 h-11" placeholder={isAr ? "الرياض" : "Riyadh"} value={location} onChange={(e) => setLocation(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs">{isAr ? "الموقع الإلكتروني (اختياري)" : "Website URL (optional)"}</Label>
                      <div className="relative">
                        <Globe className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="ps-9" placeholder="https://example.com" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
                      </div>
                    </div>
                    <Button onClick={handleSearch} disabled={searching || !query.trim()} className="gap-2 h-10 px-8 shrink-0">
                      {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      {searching ? (isAr ? "جاري البحث..." : "Searching...") : (isAr ? "بحث" : "Search")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : importMode === "url" ? (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" />
                  {isAr ? "استيراد من رابط" : "Direct URL Import"}
                </CardTitle>
                <CardDescription>
                  {isAr ? "الصق رابط الموقع لاستخراج البيانات بالذكاء الاصطناعي" : "Paste a URL to auto-extract data with AI"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Globe className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="ps-9 h-11" placeholder={isAr ? "الصق الرابط هنا..." : "Paste URL here..."} value={directUrl} onChange={(e) => setDirectUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleUrlImport()} />
                  </div>
                  <Button onClick={handleUrlImport} disabled={urlImporting || !directUrl.trim()} className="gap-2 h-11 px-8 shrink-0">
                    {urlImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    {urlImporting ? (isAr ? "جاري الاستخراج..." : "Extracting...") : (isAr ? "استخراج" : "Extract")}
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" />{isAr ? "تحليل ذكي + خرائط" : "AI + Maps analysis"}</span>
                  <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{isAr ? "أي موقع" : "Any website"}</span>
                  <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" />{isAr ? "مقياس جودة" : "Quality scoring"}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <BulkUrlImport isAr={isAr} onComplete={() => {}} userId={user?.id} />
          )}
        </div>
      )}

      {/* ─── STEP 2: Results ─── */}
      {step === "results" && (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="ps-9" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder={isAr ? "بحث جديد..." : "New search..."} />
            </div>
            <Input className="w-40" value={location} onChange={(e) => setLocation(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder={isAr ? "الموقع" : "Location"} />
            <Button onClick={handleSearch} disabled={searching} size="icon" className="shrink-0">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {/* Batch import bar */}
          {searchResults.length > 0 && (
            <div className="flex items-center justify-between rounded-lg border bg-accent/30 p-3">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={toggleSelectAll} className="text-xs gap-1.5">
                  <input type="checkbox" checked={batchSelected.size === searchResults.length && searchResults.length > 0} readOnly className="rounded" />
                  {isAr ? "تحديد الكل" : "Select All"}
                </Button>
                {batchSelected.size > 0 && (
                  <Badge variant="secondary" className="text-xs">{batchSelected.size} {isAr ? "محدد" : "selected"}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {batchImporting && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>{batchProgress.current}/{batchProgress.total}</span>
                    <span className="text-green-600">✅ {batchProgress.successes}</span>
                    {batchProgress.failures > 0 && <span className="text-red-600">❌ {batchProgress.failures}</span>}
                  </div>
                )}
                {batchSelected.size > 0 && (
                  <Button size="sm" onClick={handleBatchImport} disabled={batchImporting} className="gap-1.5">
                    {batchImporting ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" />{batchProgress.current}/{batchProgress.total}</>
                    ) : (
                      <><Plus className="h-3.5 w-3.5" />{isAr ? `استيراد ${batchSelected.size}` : `Import ${batchSelected.size}`}</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-red-500" />
                      {isAr ? "النتائج" : "Results"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {searchTime && (
                        <Badge variant="outline" className="text-[10px] font-normal gap-1">
                          <Zap className="h-2.5 w-2.5" />{(searchTime / 1000).toFixed(1)}s
                        </Badge>
                      )}
                      {!searching && <Badge variant="secondary" className="text-xs font-normal">{searchResults.length}</Badge>}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[460px]">
                    {searching ? (
                      <div className="p-3 space-y-2">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className="p-3 rounded-lg border space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        ))}
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">{isAr ? "لم يتم العثور على نتائج" : "No results found"}</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {searchResults.map((item) => {
                          const isSelected = selectedResult?.id === item.id;
                          const isLoading = loadingDetails && isSelected;
                          return (
                            <div key={item.id} className="flex items-start gap-1.5">
                              <input type="checkbox" className="mt-4 rounded shrink-0" checked={batchSelected.has(item.id)} onChange={() => toggleBatchSelect(item.id)} />
                              <button
                                className={`flex-1 text-start p-3 rounded-lg transition-all ${isSelected ? 'bg-primary/10 border border-primary/30 shadow-sm' : 'hover:bg-accent/50 border border-transparent'}`}
                                onClick={() => !loadingDetails && handleResultClick(item)}
                                disabled={loadingDetails || batchImporting}
                              >
                                <div className="flex items-start gap-2.5">
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'bg-primary/15' : 'bg-red-500/10'}`}>
                                    {isLoading ? <Loader2 className="h-4 w-4 text-primary animate-spin" /> : <MapPin className="h-4 w-4 text-red-500" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-sm truncate">{item.name}</p>
                                      {item.rating != null && (
                                        <span className="flex items-center gap-0.5 text-xs font-medium shrink-0">
                                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />{item.rating}
                                        </span>
                                      )}
                                    </div>
                                    {item.place_type && <p className="text-[11px] text-muted-foreground mt-0.5">{item.place_type}</p>}
                                    {item.description && <p className="text-xs text-muted-foreground/80 line-clamp-1 mt-0.5">{item.description}</p>}
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                      {item.google_maps_url && <Badge variant="outline" className="text-[9px] h-[18px] px-1 bg-red-500/10 text-red-600 border-red-500/20 gap-0.5"><MapPin className="h-2 w-2" /> Maps</Badge>}
                                      {item.latitude != null && <Badge variant="outline" className="text-[9px] h-[18px] px-1 bg-blue-500/10 text-blue-600 border-blue-500/20 gap-0.5">📍 {item.latitude.toFixed(2)}, {item.longitude?.toFixed(2)}</Badge>}
                                      {item.total_reviews != null && <span className="text-[10px] text-muted-foreground">({item.total_reviews} {isAr ? "تقييم" : "reviews"})</span>}
                                    </div>
                                  </div>
                                  <ChevronRight className={`h-4 w-4 shrink-0 mt-2 transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground/30'}`} />
                                </div>
                                {isLoading && (
                                  <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-primary/10">
                                    <Loader2 className="h-3 w-3 text-primary animate-spin" />
                                    <p className="text-xs text-primary font-medium">{isAr ? "جاري جلب التفاصيل..." : "Fetching details..."}</p>
                                  </div>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-3">
              <GoogleMapEmbed
                latitude={selectedResult?.latitude}
                longitude={selectedResult?.longitude}
                name={selectedResult?.name}
                searchQuery={!selectedResult ? searchedQuery : undefined}
                location={!selectedResult ? searchedLocation : undefined}
                className="h-[500px]"
              />
            </div>
          </div>
        </>
      )}

      {/* ─── Loading ─── */}
      {(loadingDetails || urlImporting) && step !== "results" && (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <Sparkles className="h-5 w-5 text-primary absolute -top-1 -end-1 animate-pulse" />
              </div>
              <div>
                <p className="font-semibold text-lg">{isAr ? "جاري جلب وتحليل البيانات..." : "Fetching & Analyzing Data..."}</p>
                <p className="text-sm text-muted-foreground mt-1">{isAr ? "تحليل ذكي + خرائط جوجل + الموقع الرسمي" : "AI analysis + Google Maps + Official website"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 3: Details ─── */}
      {step === "details" && details && (details.name_en || details.name_ar) && (
        <div className="space-y-4">
          {/* Entity Header */}
          <Card>
            <CardContent className="py-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    {editingFields ? (
                      <div className="space-y-1.5">
                        <EditableField label={isAr ? "الاسم EN" : "Name EN"} value={details.name_en} fieldKey="name_en" onUpdate={handleFieldUpdate} />
                        <EditableField label={isAr ? "الاسم AR" : "Name AR"} value={details.name_ar} fieldKey="name_ar" onUpdate={handleFieldUpdate} />
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xl font-bold">{details.name_en || details.name_ar}</h2>
                        {details.name_en && details.name_ar && <p className="text-sm text-muted-foreground">{details.name_ar}</p>}
                        {(details.abbreviation_en || details.abbreviation_ar) && (
                          <p className="text-xs text-muted-foreground/70">{[details.abbreviation_en, details.abbreviation_ar].filter(Boolean).join(" / ")}</p>
                        )}
                      </>
                    )}
                  </div>
                  {details.rating && (
                    <Badge variant="secondary" className="gap-1 ms-2 bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />{details.rating}
                      {details.total_reviews != null && <span className="text-muted-foreground">({details.total_reviews})</span>}
                    </Badge>
                  )}
                  {details.founded_year && (
                    <Badge variant="outline" className="gap-1 ms-1 text-xs"><Calendar className="h-3 w-3" />{details.founded_year}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DataQualityIndicator score={dataQuality} isAr={isAr} compact />
                  <TooltipProvider>
                    {Object.entries(SOURCE_CHANNELS).map(([key, config]) => {
                      if (!sourcesUsed[key]) return null;
                      const Icon = config.icon;
                      return (
                        <Tooltip key={key}>
                          <TooltipTrigger>
                            <Badge variant="outline" className={`gap-1 text-xs border ${config.color}`}>
                              <Icon className="h-3 w-3" />{isAr ? config.label_ar : config.label_en}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>{isAr ? `بيانات من ${config.label_ar}` : `Data from ${config.label_en}`}</TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </TooltipProvider>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setEditingFields(!editingFields)}>
                    <Edit3 className={`h-3.5 w-3.5 ${editingFields ? 'text-primary' : ''}`} />
                    {editingFields ? (isAr ? "إنهاء التعديل" : "Done") : (isAr ? "تعديل" : "Edit")}
                  </Button>
                  <ExportDataButton data={details} isAr={isAr} />
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={copyAllData}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleRescrape} disabled={loadingDetails || urlImporting}>
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingDetails ? 'animate-spin' : ''}`} />
                    {isAr ? "إعادة" : "Re-fetch"}
                  </Button>
                </div>
              </div>

              {/* Quick editable fields when editing mode is on */}
              {editingFields && (
                <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <EditableField label={isAr ? "الوصف EN" : "Description EN"} value={details.description_en} fieldKey="description_en" onUpdate={handleFieldUpdate} multiline />
                  <EditableField label={isAr ? "الوصف AR" : "Description AR"} value={details.description_ar} fieldKey="description_ar" onUpdate={handleFieldUpdate} multiline />
                  <EditableField label={isAr ? "الهاتف" : "Phone"} value={details.phone} fieldKey="phone" onUpdate={handleFieldUpdate} copyable />
                  <EditableField label={isAr ? "البريد" : "Email"} value={details.email} fieldKey="email" onUpdate={handleFieldUpdate} copyable />
                  <EditableField label={isAr ? "الموقع" : "Website"} value={details.website} fieldKey="website" onUpdate={handleFieldUpdate} copyable />
                  <EditableField label={isAr ? "المدينة EN" : "City EN"} value={details.city_en} fieldKey="city_en" onUpdate={handleFieldUpdate} />
                  <EditableField label={isAr ? "المدينة AR" : "City AR"} value={details.city_ar} fieldKey="city_ar" onUpdate={handleFieldUpdate} />
                  <EditableField label={isAr ? "العنوان EN" : "Address EN"} value={details.full_address_en} fieldKey="full_address_en" onUpdate={handleFieldUpdate} />
                  <EditableField label={isAr ? "العنوان AR" : "Address AR"} value={details.full_address_ar} fieldKey="full_address_ar" onUpdate={handleFieldUpdate} />
                  <EditableField label={isAr ? "رمز البلد" : "Country Code"} value={details.country_code} fieldKey="country_code" onUpdate={handleFieldUpdate} />
                </div>
              )}
            </CardContent>
          </Card>

          {dataQuality > 0 && !editingFields && <DataQualityIndicator score={dataQuality} isAr={isAr} />}

          {/* AI Suggestion */}
          {suggestedTarget && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{isAr ? "اقتراح AI:" : "AI Suggestion:"}</span>
                  <Badge variant="secondary" className="gap-1">
                    {TARGET_TABLE_OPTIONS.find(t => t.value === suggestedTarget.table)
                      ? (isAr ? TARGET_TABLE_OPTIONS.find(t => t.value === suggestedTarget.table)!.label_ar : TARGET_TABLE_OPTIONS.find(t => t.value === suggestedTarget.table)!.label_en)
                      : suggestedTarget.table}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{suggestedTarget.sub_type}</Badge>
                  <span className="text-xs text-muted-foreground">({Math.round(suggestedTarget.confidence * 100)}%)</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick links */}
          {(details.website || details.google_maps_url) && (
            <div className="flex items-center gap-2 flex-wrap">
              {details.website && (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                  <a href={details.website} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" /> {isAr ? "الموقع الرسمي" : "Official Website"}
                  </a>
                </Button>
              )}
              {details.google_maps_url && (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                  <a href={details.google_maps_url} target="_blank" rel="noopener noreferrer">
                    <MapPin className="h-3 w-3" /> Google Maps
                  </a>
                </Button>
              )}
              {details.phone && (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                  <a href={`tel:${details.phone}`}>
                    <Phone className="h-3 w-3" /> {details.phone}
                  </a>
                </Button>
              )}
            </div>
          )}

          {/* DB Check */}
          <Card className={existingRecords.length > 0 ? "border-yellow-500/30 bg-yellow-500/5" : dbChecked ? "border-green-500/30 bg-green-500/5" : ""}>
            <CardContent className="py-4">
              {checkingDb ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm">{isAr ? "جاري التحقق..." : "Checking databases..."}</span>
                </div>
              ) : dbChecked && existingRecords.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-700">
                      {isAr ? `${existingRecords.length} سجل مطابق` : `${existingRecords.length} matching record${existingRecords.length > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {existingRecords.map((record) => {
                      const tableInfo = TARGET_TABLE_OPTIONS.find(t => t.value === record.table);
                      const TableIcon = tableInfo?.icon || Building2;
                      const typeLabel = record.table === "culinary_entities"
                        ? (isAr ? ENTITY_TYPE_LABELS[record.sub_type as EntityType]?.ar : ENTITY_TYPE_LABELS[record.sub_type as EntityType]?.en) || record.sub_type
                        : record.table === "companies"
                          ? (isAr ? COMPANY_TYPE_LABELS[record.sub_type as CompanyType]?.ar : COMPANY_TYPE_LABELS[record.sub_type as CompanyType]?.en) || record.sub_type
                          : record.sub_type;
                      return (
                        <div key={`${record.table}-${record.id}`} className="flex items-center justify-between rounded-lg border bg-background p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                              <TableIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{record.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-[10px] h-4">{record.identifier}</Badge>
                                <Badge variant="secondary" className="text-[10px] h-4">{isAr ? tableInfo?.label_ar : tableInfo?.label_en}</Badge>
                                <span>{typeLabel}</span>
                              </div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleUpdateRecord(record)} disabled={updating}>
                            {updating && selectedExistingId === record.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                            {isAr ? "تحديث" : "Update"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{isAr ? "أو أضف كسجل جديد" : "Or add as new"}</span>
                    <Button size="sm" variant="default" className="gap-1.5" onClick={() => setShowAddForm(true)}>
                      <Plus className="h-3.5 w-3.5" />{isAr ? "إضافة جديد" : "Add New"}
                    </Button>
                  </div>
                </div>
              ) : dbChecked ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">{isAr ? "لا يوجد سجل مطابق" : "No matching records"}</span>
                  </div>
                  <Button size="sm" variant="default" className="gap-1.5" onClick={() => setShowAddForm(true)}>
                    <Plus className="h-3.5 w-3.5" />{isAr ? "إضافة" : "Add Record"}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Tabbed Details */}
          <DetailTabs details={details} activeTab={activeTab} onTabChange={setActiveTab} isAr={isAr} editing={editingFields} onFieldUpdate={handleFieldUpdate} />
        </div>
      )}

      {/* ─── Add New Record Form ─── */}
      {showAddForm && details && step === "details" && (
        <AddRecordForm
          details={details}
          targetTable={targetTable}
          onTargetTableChange={setTargetTable}
          selectedEntityType={selectedEntityType}
          onEntityTypeChange={setSelectedEntityType}
          selectedCompanyType={selectedCompanyType}
          onCompanyTypeChange={setSelectedCompanyType}
          selectedEstablishmentType={selectedEstablishmentType}
          onEstablishmentTypeChange={setSelectedEstablishmentType}
          saving={saving}
          onSave={handleAddNewRecord}
          onCancel={() => setShowAddForm(false)}
          isAr={isAr}
        />
      )}

      {/* ─── Import History ─── */}
      <ImportHistory
        open={showHistory}
        onOpenChange={setShowHistory}
        loading={loadingHistory}
        history={importHistory}
        isAr={isAr}
      />
    </div>
  );
}
