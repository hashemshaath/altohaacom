/**
 * Data hook for SmartImportAdmin — all queries, handlers, and state.
 */
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { MS_PER_DAY } from "@/lib/constants";
import type { ImportedData } from "@/components/smart-import/SmartImportDialog";
import {
  type SearchResultItem, type ExistingRecord, type Step,
  type TargetTable, type EntityType, type CompanyType, type ExhibitionType,
  TARGET_TABLE_OPTIONS, countFields,
} from "@/components/smart-import/types";
import {
  getPayloadForTable, normalizeWebsiteHost, buildEntityPayload, buildCompanyPayload,
  buildEstablishmentPayload, buildExhibitionPayload, buildCompetitionPayload, buildOrganizerPayload,
} from "../smartImportPayloads";

export function useSmartImportData(isAr: boolean) {
  const { user } = useAuth();
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
  const [selectedExhibitionType, setSelectedExhibitionType] = useState<ExhibitionType>("exhibition");
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedExistingId, setSelectedExistingId] = useState<string | null>(null);

  const [suggestedTarget, setSuggestedTarget] = useState<{ table: string; sub_type: string; confidence: number } | null>(null);

  const [batchSelected, setBatchSelected] = useState<Set<string>>(new Set());
  const [batchImporting, setBatchImporting] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, successes: 0, failures: 0 });

  const [showHistory, setShowHistory] = useState(false);
  const [importHistory, setImportHistory] = useState<Record<string, unknown>[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [importMode, setImportMode] = useState<"search" | "url" | "bulk" | "cv">("search");
  const [urlImporting, setUrlImporting] = useState(false);

  const [stats, setStats] = useState<{
    totals: { entities: number; companies: number; establishments: number; exhibitions?: number; competitions?: number; organizers?: number };
    imports: { today: number; week: number; total: number; by_table: Record<string, number>; by_action: { create: number; update: number } };
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [editingFields, setEditingFields] = useState(false);
  const [lastSavedRecord, setLastSavedRecord] = useState<{ table: TargetTable; id: string } | null>(null);

  const fieldCount = useMemo(() => countFields(details), [details]);

  // Load stats
  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      try {
        const { data } = await supabase.functions.invoke("smart-import", { body: { mode: "stats" } });
        if (!cancelled && data?.success) setStats(data.stats);
      } catch { /* ignore */ } finally { if (!cancelled) setLoadingStats(false); }
    };
    loadStats();
    return () => { cancelled = true; };
  }, []);

  // Apply suggested target
  const applySuggestedTarget = useCallback((st: { table: string; sub_type: string; confidence: number }) => {
    setSuggestedTarget(st);
    if (st.table === 'culinary_entities') { setTargetTable('culinary_entities'); setSelectedEntityType(st.sub_type as EntityType); }
    else if (st.table === 'companies') { setTargetTable('companies'); setSelectedCompanyType(st.sub_type as CompanyType); }
    else if (st.table === 'establishments') { setTargetTable('establishments'); setSelectedEstablishmentType(st.sub_type); }
    else if (st.table === 'exhibitions') { setTargetTable('exhibitions'); setSelectedExhibitionType(st.sub_type as ExhibitionType); }
    else if (st.table === 'competitions') { setTargetTable('competitions'); }
    else if (st.table === 'organizers') { setTargetTable('organizers'); }
  }, []);

  const handleFieldUpdate = useCallback((key: string, value: string) => {
    setDetails(prev => prev ? { ...prev, [key]: value } : prev);
    toast({ title: isAr ? "تم تعديل الحقل" : "Field updated" });
  }, [isAr]);

  // Search
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true); setSearchResults([]); setSelectedResult(null); setDetails(null);
    setSourcesUsed({}); setDbChecked(false); setExistingRecords([]);
    setSearchedQuery(query.trim()); setSearchedLocation(location.trim()); setSearchTime(null);
    const startTime = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke("smart-import", { body: { query: query.trim(), location: location.trim() || undefined, mode: "search" } });
      if (error) throw new Error(typeof error === 'object' && error.message ? error.message : String(error));
      if (!data?.success) throw new Error(data?.error || "Search failed");
      setSearchResults(data.results || []); setSearchTime(Date.now() - startTime); setStep("results");
      if (!data.results?.length) toast({ title: isAr ? "لا توجد نتائج" : "No Results", description: isAr ? "جرب كلمات بحث مختلفة" : "Try different search terms", variant: "destructive" });
    } catch (err: unknown) { toast({ title: isAr ? "خطأ في البحث" : "Search Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" }); }
    finally { setSearching(false); }
  }, [query, location, isAr]);

  // URL Import
  const handleUrlImport = useCallback(async () => {
    if (!directUrl.trim()) return;
    setUrlImporting(true); setDetails(null); setSourcesUsed({}); setDbChecked(false);
    setExistingRecords([]); setSelectedResult(null); setDataQuality(0);
    try {
      const { data, error } = await supabase.functions.invoke("smart-import", { body: { url: directUrl.trim(), mode: "url" } });
      if (error) throw new Error(typeof error === 'object' && error.message ? error.message : String(error));
      if (!data?.success) throw new Error(data?.error || "URL import failed");
      setDetails(data.data); setSourcesUsed(data.sources_used || {}); setDataQuality(data.data_quality || 0);
      if (data.suggested_target) applySuggestedTarget(data.suggested_target);
      setStep("details");
      toast({ title: isAr ? "تم استخراج البيانات بنجاح" : "Data extracted successfully" });
    } catch (err: unknown) { toast({ title: isAr ? "خطأ" : "Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" }); }
    finally { setUrlImporting(false); }
  }, [directUrl, isAr, applySuggestedTarget]);

  // Click result
  const handleResultClick = useCallback(async (item: SearchResultItem) => {
    setSelectedResult(item); setLoadingDetails(true); setDetails(null);
    setActiveTab("overview"); setDbChecked(false); setExistingRecords([]); setDataQuality(0);
    try {
      const { data, error } = await supabase.functions.invoke("smart-import", {
        body: { query: item.name, location: location.trim() || undefined, website_url: websiteUrl.trim() || undefined, mode: "details", result_url: item.url || undefined, latitude: item.latitude || undefined, longitude: item.longitude || undefined },
      });
      if (error) throw new Error(typeof error === 'object' && error.message ? error.message : String(error));
      if (!data?.success) throw new Error(data?.error || "Failed to fetch details");
      setDetails(data.data); setSourcesUsed(data.sources_used || {}); setDataQuality(data.data_quality || 0);
      if (data.suggested_target) applySuggestedTarget(data.suggested_target);
      setStep("details");
      toast({ title: isAr ? "تم جلب البيانات بنجاح" : "Data fetched successfully" });
    } catch (err: unknown) { toast({ title: isAr ? "خطأ" : "Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" }); }
    finally { setLoadingDetails(false); }
  }, [location, websiteUrl, isAr, applySuggestedTarget]);

  const handleRescrape = useCallback(async () => {
    if (selectedResult) await handleResultClick(selectedResult);
    else if (directUrl) await handleUrlImport();
  }, [selectedResult, directUrl, handleResultClick, handleUrlImport]);

  // Check DB
  const checkExistingEntity = useCallback(async () => {
    if (!details) return;
    setCheckingDb(true); setExistingRecords([]);
    try {
      const nameEn = details.name_en?.trim();
      const nameAr = details.name_ar?.trim();
      const phone = details.phone?.trim();
      const email = details.email?.trim()?.toLowerCase();
      const websiteHost = normalizeWebsiteHost(details.website || details.organizer_website);
      const stripYear = (s: string | undefined) => s?.replace(/\b(19|20)\d{2}\b/g, '').replace(/\s+/g, ' ').trim();
      const nameEnNoYear = stripYear(nameEn);
      const nameArNoYear = stripYear(nameAr);
      const stopWords = new Set(['the', 'and', 'for', 'of', 'in', 'at', 'to', 'a', 'an', 'is', 'on', 'its', 'with']);
      const extractBigrams = (name: string | undefined) => {
        if (!name) return [];
        const words = name.split(/[\s\-_,&()]+/).map(w => w.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '').trim()).filter(w => w.length >= 2 && !stopWords.has(w.toLowerCase()));
        const bigrams: string[] = [];
        for (let i = 0; i < words.length - 1; i++) bigrams.push(`${words[i]} ${words[i + 1]}`);
        return bigrams;
      };
      const enBigrams = extractBigrams(nameEnNoYear || nameEn);
      const arBigrams = extractBigrams(nameArNoYear || nameAr);

      const orConditions: string[] = [];
      if (nameEn) orConditions.push(`name.ilike.%${nameEn}%`);
      if (nameAr) orConditions.push(`name_ar.ilike.%${nameAr}%`);
      if (nameEnNoYear && nameEnNoYear !== nameEn) orConditions.push(`name.ilike.%${nameEnNoYear}%`);
      if (nameArNoYear && nameArNoYear !== nameAr) orConditions.push(`name_ar.ilike.%${nameArNoYear}%`);
      for (const bg of enBigrams) orConditions.push(`name.ilike.%${bg}%`);
      for (const bg of arBigrams) orConditions.push(`name_ar.ilike.%${bg}%`);
      if (phone) orConditions.push(`phone.eq.${phone}`);
      if (email) orConditions.push(`email.ilike.${email}`);
      if (websiteHost) orConditions.push(`website.ilike.%${websiteHost}%`);

      const titleOrConditions: string[] = [];
      if (nameEn) titleOrConditions.push(`title.ilike.%${nameEn}%`);
      if (nameAr) titleOrConditions.push(`title_ar.ilike.%${nameAr}%`);
      if (nameEnNoYear && nameEnNoYear !== nameEn) titleOrConditions.push(`title.ilike.%${nameEnNoYear}%`);
      if (nameArNoYear && nameArNoYear !== nameAr) titleOrConditions.push(`title_ar.ilike.%${nameArNoYear}%`);
      for (const bg of enBigrams) titleOrConditions.push(`title.ilike.%${bg}%`);
      for (const bg of arBigrams) titleOrConditions.push(`title_ar.ilike.%${bg}%`);
      if (websiteHost) { titleOrConditions.push(`website_url.ilike.%${websiteHost}%`); titleOrConditions.push(`organizer_website.ilike.%${websiteHost}%`); titleOrConditions.push(`competition_website.ilike.%${websiteHost}%`); }

      if (orConditions.length === 0 && titleOrConditions.length === 0) { setCheckingDb(false); setDbChecked(true); return; }
      const orStr = [...new Set(orConditions)].join(",");
      const titleOrStr = [...new Set(titleOrConditions)].join(",");

      const [entRes, compRes, estRes, exhRes, compResComp, orgRes] = await Promise.all([
        orStr ? supabase.from("culinary_entities").select("id, name, name_ar, entity_number, type, city, phone, email, website").or(orStr).limit(5000) : Promise.resolve({ data: [] }),
        orStr ? supabase.from("companies").select("id, name, name_ar, company_number, type, city, phone, email, website").or(orStr).limit(5000) : Promise.resolve({ data: [] }),
        orStr ? supabase.from("establishments").select("id, name, name_ar, type, city, phone, email, website").or(orStr).limit(5000) : Promise.resolve({ data: [] }),
        titleOrStr ? (supabase as never as { from: (t: string) => { select: (s: string) => { or: (o: string) => Promise<{ data: Record<string, unknown>[] }> } } }).from("exhibitions").select("id, title, title_ar, type, city, organizer_email, website_url, slug").or(titleOrStr) : Promise.resolve({ data: [] }),
        titleOrStr ? (supabase as never as { from: (t: string) => { select: (s: string) => { or: (o: string) => Promise<{ data: Record<string, unknown>[] }> } } }).from("competitions").select("id, title, title_ar, city, country_code, status, competition_number").or(titleOrStr) : Promise.resolve({ data: [] }),
        orStr ? supabase.from("organizers").select("id, name, name_ar, organizer_number, city, phone, email, website, status").or(orStr).limit(5000) : Promise.resolve({ data: [] }),
      ]);

      const records: ExistingRecord[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (entRes.data || []).forEach((e: any) => records.push({ id: e.id, name: e.name, name_ar: e.name_ar, identifier: e.entity_number, sub_type: e.type, city: e.city, phone: e.phone, email: e.email, website: e.website, table: "culinary_entities" }));
      (compRes.data || []).forEach((c: any) => records.push({ id: c.id, name: c.name, name_ar: c.name_ar, identifier: c.company_number || c.id.slice(0, 8), sub_type: c.type, city: c.city, phone: c.phone, email: c.email, website: c.website, table: "companies" }));
      (estRes.data || []).forEach((e: any) => records.push({ id: e.id, name: e.name, name_ar: e.name_ar, identifier: e.id.slice(0, 8), sub_type: e.type, city: e.city, phone: e.phone, email: e.email, website: e.website, table: "establishments" }));
      (exhRes.data || []).forEach((e: any) => records.push({ id: e.id, name: e.title, name_ar: e.title_ar, identifier: e.slug || e.id.slice(0, 8), sub_type: e.type, city: e.city, phone: null, email: e.organizer_email, website: e.website_url, table: "exhibitions" }));
      (compResComp.data || []).forEach((c: any) => records.push({ id: c.id, name: c.title, name_ar: c.title_ar, identifier: c.competition_number || c.id.slice(0, 8), sub_type: "competition", city: c.city, phone: null, email: null, website: null, table: "competitions" }));
      (orgRes.data || []).forEach((o: any) => records.push({ id: o.id, name: o.name, name_ar: o.name_ar, identifier: o.organizer_number || o.id.slice(0, 8), sub_type: "organizer", city: o.city, phone: o.phone, email: o.email, website: o.website, table: "organizers" }));

      const preferredTable = suggestedTarget?.table as TargetTable | undefined;
      records.sort((a, b) => {
        const pd = Number(b.table === preferredTable) - Number(a.table === preferredTable);
        if (pd !== 0) return pd;
        const wd = Number(normalizeWebsiteHost(b.website) === websiteHost) - Number(normalizeWebsiteHost(a.website) === websiteHost);
        if (wd !== 0) return wd;
        return a.name.localeCompare(b.name);
      });
      setExistingRecords(records);
    } catch (err: unknown) { console.error("DB check error:", err); }
    finally { setCheckingDb(false); setDbChecked(true); }
  }, [details, suggestedTarget?.table]);

  useEffect(() => { if (details && !dbChecked && step === "details") checkExistingEntity(); }, [details, dbChecked, step, checkExistingEntity]);

  // Admin edit URL
  const getAdminEditUrl = (table: TargetTable, id: string) => {
    const map: Record<TargetTable, string> = { culinary_entities: `/admin/entities/${id}`, companies: `/admin/companies/${id}`, establishments: `/admin/establishments/${id}`, exhibitions: `/admin/exhibitions/${id}`, competitions: `/admin/competitions/${id}`, organizers: `/admin/organizers/${id}` };
    return map[table];
  };

  // Log import
  const logImport = async (action: 'create' | 'update', table: TargetTable, recordId: string | null, entityType: string) => {
    try {
      await supabase.from("smart_import_logs").insert({
        imported_by: user?.id || '', target_table: table, target_record_id: recordId, action,
        entity_name: details?.name_en || selectedResult?.name, entity_name_ar: details?.name_ar, entity_type: entityType,
        source_query: searchedQuery, source_location: searchedLocation, source_url: selectedResult?.url || directUrl,
        sources_used: sourcesUsed, extracted_fields_count: fieldCount, imported_data: details as never, status: 'success',
      });
    } catch (err: unknown) { console.error('Failed to log import:', err instanceof Error ? err.message : err); }
  };

  // Update record
  const handleUpdateRecord = async (record: ExistingRecord) => {
    if (!details) return;
    setUpdating(true); setSelectedExistingId(record.id);
    try {
      const updatePayload = getPayloadForTable(details, record.table);
      const { error } = await supabase.from(record.table).update(updatePayload).eq("id", record.id);
      if (error) throw error;
      const tableLabel = TARGET_TABLE_OPTIONS.find(t => t.value === record.table);
      toast({
        title: isAr ? "تم تحديث البيانات بنجاح" : `${tableLabel?.label_en || 'Record'} updated successfully`,
        description: isAr ? "انقر لعرض السجل" : "Click to view record",
      });
      setLastSavedRecord({ table: record.table, id: record.id });
      await logImport('update', record.table, record.id, record.sub_type);
      setDbChecked(false);
    } catch (err: unknown) { toast({ title: isAr ? "خطأ" : "Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" }); }
    finally { setUpdating(false); setSelectedExistingId(null); }
  };

  // Add new record
  const handleAddNewRecord = async () => {
    if (!details) return;
    setSaving(true);
    try {
      const name = details.name_en || details.name_ar || "Unknown";
      let recordId: string | null = null;
      let subType = '';

      if (targetTable === "culinary_entities") {
        subType = selectedEntityType;
        const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);
        const payload = { ...buildEntityPayload(details), name: details.name_en || name, type: selectedEntityType, scope: "local" as const, status: "pending" as const, is_visible: false, is_verified: false, slug, entity_number: "", created_by: user?.id || null };
        const { data: inserted, error } = await supabase.from("culinary_entities").insert(payload).select("id").single();
        if (error) throw error;
        recordId = inserted?.id;
      } else if (targetTable === "companies") {
        subType = selectedCompanyType;
        const payload = { ...buildCompanyPayload(details), name: details.name_en || name, type: selectedCompanyType, status: "pending" as const, country_code: details.country_code || "SA", created_by: user?.id || null };
        const { data: inserted, error } = await supabase.from("companies").insert(payload).select("id").single();
        if (error) throw error;
        recordId = inserted?.id;
      } else if (targetTable === "exhibitions") {
        subType = selectedExhibitionType;
        const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);
        const now = new Date();
        const payload = { ...buildExhibitionPayload(details), title: details.name_en || name, type: selectedExhibitionType, status: "pending" as const, slug, start_date: details.start_date || now.toISOString().split('T')[0], end_date: details.end_date || new Date(now.getTime() + 3 * MS_PER_DAY).toISOString().split('T')[0], created_by: user?.id || null };
        const { data: inserted, error } = await (supabase as never as { from: (t: string) => { insert: (p: unknown) => { select: (s: string) => { single: () => Promise<{ data: { id: string } | null; error: Error | null }> } } } }).from("exhibitions").insert(payload).select("id").single();
        if (error) throw error;
        recordId = inserted?.id;
      } else if (targetTable === "competitions") {
        subType = "competition";
        const now = new Date();
        const payload = { ...buildCompetitionPayload(details), title: details.name_en || name, status: "pending" as const, competition_start: details.start_date || now.toISOString().split('T')[0], competition_end: details.end_date || new Date(now.getTime() + 3 * MS_PER_DAY).toISOString().split('T')[0], organizer_id: user?.id || '', country_code: details.country_code || "SA", edition_year: details.edition_year || now.getFullYear() };
        const { data: inserted, error } = await (supabase as never as { from: (t: string) => { insert: (p: unknown) => { select: (s: string) => { single: () => Promise<{ data: { id: string } | null; error: Error | null }> } } } }).from("competitions").insert(payload).select("id").single();
        if (error) throw error;
        recordId = inserted?.id;
      } else if (targetTable === "organizers") {
        subType = "organizer";
        const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);
        const payload = { ...buildOrganizerPayload(details), name: details.name_en || name, slug, status: "active", created_by: user?.id || null };
        const { data: inserted, error } = await supabase.from("organizers").insert(payload).select("id").single();
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
      toast({ title: isAr ? "تم الإضافة بنجاح (بانتظار الموافقة)" : `${tableLabel?.label_en || 'Record'} added (pending approval)` });
      if (recordId) setLastSavedRecord({ table: targetTable, id: recordId });
      await logImport('create', targetTable, recordId, subType);

      // Trigger notifications
      if (targetTable === "culinary_entities") {
        import("@/lib/notificationTriggers").then(({ notifyAdminEntityReview }) => { notifyAdminEntityReview({ entityName: details.name_en || name, entityNameAr: details.name_ar || undefined, submittedBy: "Smart Import" }); });
      } else if (targetTable === "companies") {
        import("@/lib/notificationTriggers").then(({ notifyAdminCompanyRegistration }) => { notifyAdminCompanyRegistration({ companyName: details.name_en || name, companyNameAr: details.name_ar || undefined, submittedBy: "Smart Import" }); });
      } else if (targetTable === "exhibitions") {
        import("@/lib/notificationTriggers").then(({ notifyAdminExhibitionReview }) => { notifyAdminExhibitionReview({ exhibitionName: details.name_en || name, exhibitionNameAr: details.name_ar || undefined, submittedBy: "Smart Import" }); });
      } else if (targetTable === "competitions") {
        import("@/lib/notificationTriggers").then(({ notifyAdminCompetitionReview }) => { notifyAdminCompetitionReview({ competitionName: details.name_en || name, competitionNameAr: details.name_ar || undefined, submittedBy: "Smart Import" }); });
      }

      setShowAddForm(false); setDbChecked(false);
      try { const { data: newStats } = await supabase.functions.invoke("smart-import", { body: { mode: "stats" } }); if (newStats?.success) setStats(newStats.stats); } catch { /* ignore */ }
    } catch (err: unknown) { toast({ title: isAr ? "خطأ" : "Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleNewSearch = useCallback(() => {
    setStep("search"); setSearchResults([]); setSelectedResult(null); setDetails(null);
    setSourcesUsed({}); setDbChecked(false); setExistingRecords([]); setBatchSelected(new Set());
    setSuggestedTarget(null); setDataQuality(0); setSearchTime(null); setEditingFields(false);
  }, []);

  const handleBackToResults = useCallback(() => {
    setStep("results"); setDetails(null); setSourcesUsed({}); setDbChecked(false);
    setExistingRecords([]); setSuggestedTarget(null); setDataQuality(0); setEditingFields(false);
  }, []);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data } = await supabase.from("smart_import_logs").select("id, entity_type, status, created_at, created_by, errors").order("created_at", { ascending: false }).limit(50);
      setImportHistory((data || []) as unknown as Record<string, unknown>[]);
    } catch (err: unknown) { console.error('Failed to load history:', err instanceof Error ? err.message : err); }
    finally { setLoadingHistory(false); }
  };

  // Batch
  const toggleBatchSelect = useCallback((id: string) => {
    setBatchSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setBatchSelected(prev => prev.size === searchResults.length ? new Set() : new Set(searchResults.map(r => r.id)));
  }, [searchResults]);

  const handleBatchImport = async () => {
    if (batchSelected.size === 0) return;
    setBatchImporting(true);
    const selected = searchResults.filter(r => batchSelected.has(r.id));
    setBatchProgress({ current: 0, total: selected.length, successes: 0, failures: 0 });
    let successCount = 0; let failCount = 0;

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
        const batchName = d.name_en || d.name_ar || item.name;

        if (tbl === 'culinary_entities') {
          const slug = batchName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
          await supabase.from("culinary_entities").insert({ ...buildEntityPayload(d), name: d.name_en || batchName, type: suggestion.sub_type as EntityType, scope: 'local' as const, status: 'pending' as const, is_visible: false, is_verified: false, slug, entity_number: '', created_by: user?.id || null }).select("id").single();
        } else if (tbl === 'companies') {
          await supabase.from("companies").insert({ ...buildCompanyPayload(d), name: d.name_en || batchName, type: suggestion.sub_type as CompanyType, status: 'pending' as const, country_code: d.country_code || 'SA', created_by: user?.id || null }).select("id").single();
        } else if (tbl === 'exhibitions') {
          const slug = batchName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);
          const now = new Date();
          await (supabase as never as { from: (t: string) => { insert: (p: unknown) => { select: (s: string) => { single: () => Promise<unknown> } } } }).from("exhibitions").insert({ ...buildExhibitionPayload(d), title: d.name_en || batchName, type: (suggestion.sub_type || 'exhibition') as ExhibitionType, status: 'pending' as const, slug, start_date: d.start_date || now.toISOString().split('T')[0], end_date: d.end_date || new Date(now.getTime() + 3 * MS_PER_DAY).toISOString().split('T')[0], created_by: user?.id || null }).select("id").single();
        } else if (tbl === 'competitions') {
          const now = new Date();
          await (supabase as never as { from: (t: string) => { insert: (p: unknown) => { select: (s: string) => { single: () => Promise<unknown> } } } }).from("competitions").insert({ ...buildCompetitionPayload(d), title: d.name_en || batchName, status: 'pending' as const, competition_start: d.start_date || now.toISOString().split('T')[0], competition_end: d.end_date || new Date(now.getTime() + 3 * MS_PER_DAY).toISOString().split('T')[0], organizer_id: user?.id || '', country_code: d.country_code || 'SA', edition_year: d.edition_year || now.getFullYear() }).select("id").single();
        } else if (tbl === 'organizers') {
          const slug = batchName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);
          await supabase.from("organizers").insert({ ...buildOrganizerPayload(d), name: d.name_en || batchName, slug, status: 'active', created_by: user?.id || null }).select("id").single();
        } else {
          await supabase.from("establishments").insert({ ...buildEstablishmentPayload(d), name: d.name_en || batchName, type: suggestion.sub_type, is_active: true, is_verified: false, created_by: user?.id || null }).select("id").single();
        }
        successCount++;
      } catch { failCount++; }
    }

    setBatchProgress({ current: selected.length, total: selected.length, successes: successCount, failures: failCount });
    toast({ title: isAr ? "تم الاستيراد الجماعي" : "Batch import complete", description: `✅ ${successCount} / ❌ ${failCount}` });
    setBatchImporting(false); setBatchSelected(new Set());
    try { const { data: newStats } = await supabase.functions.invoke("smart-import", { body: { mode: "stats" } }); if (newStats?.success) setStats(newStats.stats); } catch { /* ignore */ }
  };

  // Copy all data
  const copyAllData = useCallback(() => {
    if (!details) return;
    const text = Object.entries(details).filter(([, v]) => v != null && v !== '').map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n');
    navigator.clipboard.writeText(text);
    toast({ title: isAr ? "تم النسخ" : "Copied to clipboard" });
  }, [details, isAr]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') { if (step === "details") handleBackToResults(); else if (step === "results") handleNewSearch(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); handleNewSearch(); setTimeout(() => searchInputRef.current?.focus(), 100); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, handleBackToResults, handleNewSearch]);

  return {
    searchInputRef, query, setQuery, location, setLocation, websiteUrl, setWebsiteUrl,
    directUrl, setDirectUrl, step, searching, searchResults, selectedResult,
    searchTime, loadingDetails, details, sourcesUsed, activeTab, setActiveTab,
    dataQuality, checkingDb, existingRecords, dbChecked, showAddForm, setShowAddForm,
    targetTable, setTargetTable, selectedEntityType, setSelectedEntityType,
    selectedCompanyType, setSelectedCompanyType, selectedEstablishmentType, setSelectedEstablishmentType,
    selectedExhibitionType, setSelectedExhibitionType, saving, updating, selectedExistingId,
    suggestedTarget, batchSelected, batchImporting, batchProgress,
    showHistory, setShowHistory, importHistory, loadingHistory,
    importMode, setImportMode, urlImporting, stats, loadingStats,
    editingFields, setEditingFields, lastSavedRecord, fieldCount,
    handleSearch, handleUrlImport, handleResultClick, handleRescrape,
    handleUpdateRecord, handleAddNewRecord, handleNewSearch, handleBackToResults,
    loadHistory, toggleBatchSelect, toggleSelectAll, handleBatchImport,
    handleFieldUpdate, copyAllData, getAdminEditUrl, user,
  };
}
