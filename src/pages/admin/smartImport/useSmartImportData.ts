/**
 * Data hook for SmartImportAdmin — uses useReducer for all state management.
 */
import { useCallback, useEffect, useMemo, useRef, useReducer } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { MS_PER_DAY, QUERY_LIMIT_LARGE } from "@/lib/constants";
import type { ImportedData } from "@/components/smart-import/SmartImportDialog";
import {
  type SearchResultItem, type ExistingRecord,
  type TargetTable, type EntityType, type CompanyType, type ExhibitionType,
  TARGET_TABLE_OPTIONS, countFields,
} from "@/components/smart-import/types";
import {
  getPayloadForTable, normalizeWebsiteHost, buildEntityPayload, buildCompanyPayload,
  buildEstablishmentPayload, buildExhibitionPayload, buildCompetitionPayload, buildOrganizerPayload,
} from "../smartImportPayloads";
import { smartImportReducer, initialSmartImportState } from "./smartImportReducer";

export function useSmartImportData(isAr: boolean) {
  const { user } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [state, dispatch] = useReducer(smartImportReducer, initialSmartImportState);

  const fieldCount = useMemo(() => countFields(state.details), [state.details]);

  // Convenience setters that dispatch SET_FIELD
  const setField = useCallback(<K extends keyof typeof state>(field: K, value: (typeof state)[K]) => {
    dispatch({ type: "SET_FIELD", field, value });
  }, []);

  // ── Load stats ──
  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      try {
        const { data } = await supabase.functions.invoke("smart-import", { body: { mode: "stats" } });
        if (!cancelled && data?.success) dispatch({ type: "STATS_LOADED", stats: data.stats });
      } catch { /* ignore */ } finally { if (!cancelled) dispatch({ type: "SET_FIELD", field: "loadingStats", value: false }); }
    };
    loadStats();
    return () => { cancelled = true; };
  }, []);

  // ── Handle field update ──
  const handleFieldUpdate = useCallback((key: string, value: string) => {
    dispatch({ type: "UPDATE_DETAILS_FIELD", key, value });
    toast({ title: isAr ? "تم تعديل الحقل" : "Field updated" });
  }, [isAr]);

  // ── Search ──
  const handleSearch = useCallback(async () => {
    if (!state.query.trim()) return;
    dispatch({ type: "SEARCH_START" });
    const startTime = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke("smart-import", { body: { query: state.query.trim(), location: state.location.trim() || undefined, mode: "search" } });
      if (error) throw new Error(typeof error === 'object' && error.message ? error.message : String(error));
      if (!data?.success) throw new Error(data?.error || "Search failed");
      dispatch({ type: "SEARCH_SUCCESS", results: data.results || [], time: Date.now() - startTime });
      if (!data.results?.length) toast({ title: isAr ? "لا توجد نتائج" : "No Results", description: isAr ? "جرب كلمات بحث مختلفة" : "Try different search terms", variant: "destructive" });
    } catch (err: unknown) {
      toast({ title: isAr ? "خطأ في البحث" : "Search Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
      dispatch({ type: "SEARCH_FAIL" });
    }
  }, [state.query, state.location, isAr]);

  // ── URL Import ──
  const handleUrlImport = useCallback(async () => {
    if (!state.directUrl.trim()) return;
    dispatch({ type: "URL_IMPORT_START" });
    try {
      const { data, error } = await supabase.functions.invoke("smart-import", { body: { url: state.directUrl.trim(), mode: "url" } });
      if (error) throw new Error(typeof error === 'object' && error.message ? error.message : String(error));
      if (!data?.success) throw new Error(data?.error || "URL import failed");
      dispatch({ type: "URL_IMPORT_SUCCESS", details: data.data, sourcesUsed: data.sources_used || {}, dataQuality: data.data_quality || 0, suggestedTarget: data.suggested_target || null });
      toast({ title: isAr ? "تم استخراج البيانات بنجاح" : "Data extracted successfully" });
    } catch (err: unknown) {
      toast({ title: isAr ? "خطأ" : "Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
      dispatch({ type: "URL_IMPORT_FAIL" });
    }
  }, [state.directUrl, isAr]);

  // ── Click result ──
  const handleResultClick = useCallback(async (item: SearchResultItem) => {
    dispatch({ type: "DETAILS_START", result: item });
    try {
      const { data, error } = await supabase.functions.invoke("smart-import", {
        body: { query: item.name, location: state.location.trim() || undefined, website_url: state.websiteUrl.trim() || undefined, mode: "details", result_url: item.url || undefined, latitude: item.latitude || undefined, longitude: item.longitude || undefined },
      });
      if (error) throw new Error(typeof error === 'object' && error.message ? error.message : String(error));
      if (!data?.success) throw new Error(data?.error || "Failed to fetch details");
      dispatch({ type: "DETAILS_SUCCESS", details: data.data, sourcesUsed: data.sources_used || {}, dataQuality: data.data_quality || 0, suggestedTarget: data.suggested_target || null });
      toast({ title: isAr ? "تم جلب البيانات بنجاح" : "Data fetched successfully" });
    } catch (err: unknown) {
      toast({ title: isAr ? "خطأ" : "Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
      dispatch({ type: "DETAILS_FAIL" });
    }
  }, [state.location, state.websiteUrl, isAr]);

  const handleRescrape = useCallback(async () => {
    if (state.selectedResult) await handleResultClick(state.selectedResult);
    else if (state.directUrl) await handleUrlImport();
  }, [state.selectedResult, state.directUrl, handleResultClick, handleUrlImport]);

  // ── Check DB ──
  const checkExistingEntity = useCallback(async () => {
    if (!state.details) return;
    dispatch({ type: "DB_CHECK_START" });
    try {
      const details = state.details;
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

      if (orConditions.length === 0 && titleOrConditions.length === 0) { dispatch({ type: "DB_CHECK_DONE", records: [] }); return; }
      const orStr = [...new Set(orConditions)].join(",");
      const titleOrStr = [...new Set(titleOrConditions)].join(",");

      const [entRes, compRes, estRes, exhRes, compResComp, orgRes] = await Promise.all([
        orStr ? supabase.from("culinary_entities").select("id, name, name_ar, entity_number, type, city, phone, email, website").or(orStr).limit(QUERY_LIMIT_LARGE) : Promise.resolve({ data: [] }),
        orStr ? supabase.from("companies").select("id, name, name_ar, company_number, type, city, phone, email, website").or(orStr).limit(QUERY_LIMIT_LARGE) : Promise.resolve({ data: [] }),
        orStr ? supabase.from("establishments").select("id, name, name_ar, type, city, phone, email, website").or(orStr).limit(QUERY_LIMIT_LARGE) : Promise.resolve({ data: [] }),
        titleOrStr ? (supabase as never as { from: (t: string) => { select: (s: string) => { or: (o: string) => Promise<{ data: Record<string, unknown>[] }> } } }).from("exhibitions").select("id, title, title_ar, type, city, organizer_email, website_url, slug").or(titleOrStr) : Promise.resolve({ data: [] }),
        titleOrStr ? (supabase as never as { from: (t: string) => { select: (s: string) => { or: (o: string) => Promise<{ data: Record<string, unknown>[] }> } } }).from("competitions").select("id, title, title_ar, city, country_code, status, competition_number").or(titleOrStr) : Promise.resolve({ data: [] }),
        orStr ? supabase.from("organizers").select("id, name, name_ar, organizer_number, city, phone, email, website, status").or(orStr).limit(QUERY_LIMIT_LARGE) : Promise.resolve({ data: [] }),
      ]);

      const records: ExistingRecord[] = [];
      (entRes.data || []).forEach((e: any) => records.push({ id: e.id, name: e.name, name_ar: e.name_ar, identifier: e.entity_number, sub_type: e.type, city: e.city, phone: e.phone, email: e.email, website: e.website, table: "culinary_entities" }));
      (compRes.data || []).forEach((c: any) => records.push({ id: c.id, name: c.name, name_ar: c.name_ar, identifier: c.company_number || c.id.slice(0, 8), sub_type: c.type, city: c.city, phone: c.phone, email: c.email, website: c.website, table: "companies" }));
      (estRes.data || []).forEach((e: any) => records.push({ id: e.id, name: e.name, name_ar: e.name_ar, identifier: e.id.slice(0, 8), sub_type: e.type, city: e.city, phone: e.phone, email: e.email, website: e.website, table: "establishments" }));
      (exhRes.data || []).forEach((e: any) => records.push({ id: e.id, name: e.title, name_ar: e.title_ar, identifier: e.slug || e.id.slice(0, 8), sub_type: e.type, city: e.city, phone: null, email: e.organizer_email, website: e.website_url, table: "exhibitions" }));
      (compResComp.data || []).forEach((c: any) => records.push({ id: c.id, name: c.title, name_ar: c.title_ar, identifier: c.competition_number || c.id.slice(0, 8), sub_type: "competition", city: c.city, phone: null, email: null, website: null, table: "competitions" }));
      (orgRes.data || []).forEach((o: any) => records.push({ id: o.id, name: o.name, name_ar: o.name_ar, identifier: o.organizer_number || o.id.slice(0, 8), sub_type: "organizer", city: o.city, phone: o.phone, email: o.email, website: o.website, table: "organizers" }));

      const preferredTable = state.suggestedTarget?.table as TargetTable | undefined;
      records.sort((a, b) => {
        const pd = Number(b.table === preferredTable) - Number(a.table === preferredTable);
        if (pd !== 0) return pd;
        const wd = Number(normalizeWebsiteHost(b.website) === websiteHost) - Number(normalizeWebsiteHost(a.website) === websiteHost);
        if (wd !== 0) return wd;
        return a.name.localeCompare(b.name);
      });
      dispatch({ type: "DB_CHECK_DONE", records });
    } catch (err: unknown) {
      console.error("DB check error:", err);
      dispatch({ type: "DB_CHECK_DONE", records: [] });
    }
  }, [state.details, state.suggestedTarget?.table]);

  useEffect(() => { if (state.details && !state.dbChecked && state.step === "details") checkExistingEntity(); }, [state.details, state.dbChecked, state.step, checkExistingEntity]);

  // ── Admin edit URL ──
  const getAdminEditUrl = (table: TargetTable, id: string) => {
    const map: Record<TargetTable, string> = { culinary_entities: `/admin/entities/${id}`, companies: `/admin/companies/${id}`, establishments: `/admin/establishments/${id}`, exhibitions: `/admin/exhibitions/${id}`, competitions: `/admin/competitions/${id}`, organizers: `/admin/organizers/${id}` };
    return map[table];
  };

  // ── Log import ──
  const logImport = async (action: 'create' | 'update', table: TargetTable, recordId: string | null, entityType: string) => {
    try {
      await supabase.from("smart_import_logs").insert({
        imported_by: user?.id || '', target_table: table, target_record_id: recordId, action,
        entity_name: state.details?.name_en || state.selectedResult?.name, entity_name_ar: state.details?.name_ar, entity_type: entityType,
        source_query: state.searchedQuery, source_location: state.searchedLocation, source_url: state.selectedResult?.url || state.directUrl,
        sources_used: state.sourcesUsed, extracted_fields_count: fieldCount, imported_data: state.details as never, status: 'success',
      });
    } catch (err: unknown) { console.error('Failed to log import:', err instanceof Error ? err.message : err); }
  };

  // ── Update record ──
  const handleUpdateRecord = async (record: ExistingRecord) => {
    if (!state.details) return;
    dispatch({ type: "UPDATE_START", id: record.id });
    try {
      const updatePayload = getPayloadForTable(state.details, record.table);
      const { error } = await supabase.from(record.table).update(updatePayload).eq("id", record.id);
      if (error) throw error;
      const tableLabel = TARGET_TABLE_OPTIONS.find(t => t.value === record.table);
      toast({ title: isAr ? "تم تحديث البيانات بنجاح" : `${tableLabel?.label_en || 'Record'} updated successfully`, description: isAr ? "انقر لعرض السجل" : "Click to view record" });
      dispatch({ type: "UPDATE_DONE", record: { table: record.table, id: record.id } });
      await logImport('update', record.table, record.id, record.sub_type);
    } catch (err: unknown) {
      toast({ title: isAr ? "خطأ" : "Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
      dispatch({ type: "SET_FIELD", field: "updating", value: false });
      dispatch({ type: "SET_FIELD", field: "selectedExistingId", value: null });
    }
  };

  // ── Add new record ──
  const handleAddNewRecord = async () => {
    const details = state.details;
    if (!details) return;
    dispatch({ type: "SAVE_START" });
    try {
      const name = details.name_en || details.name_ar || "Unknown";
      let recordId: string | null = null;
      let subType = '';

      if (state.targetTable === "culinary_entities") {
        subType = state.selectedEntityType;
        const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);
        const payload = { ...buildEntityPayload(details), name: details.name_en || name, type: state.selectedEntityType, scope: "local" as const, status: "pending" as const, is_visible: false, is_verified: false, slug, entity_number: "", created_by: user?.id || null };
        const { data: inserted, error } = await supabase.from("culinary_entities").insert(payload).select("id").single();
        if (error) throw error;
        recordId = inserted?.id;
      } else if (state.targetTable === "companies") {
        subType = state.selectedCompanyType;
        const payload = { ...buildCompanyPayload(details), name: details.name_en || name, type: state.selectedCompanyType, status: "pending" as const, country_code: details.country_code || "SA", created_by: user?.id || null };
        const { data: inserted, error } = await supabase.from("companies").insert(payload).select("id").single();
        if (error) throw error;
        recordId = inserted?.id;
      } else if (state.targetTable === "exhibitions") {
        subType = state.selectedExhibitionType;
        const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);
        const now = new Date();
        const payload = { ...buildExhibitionPayload(details), title: details.name_en || name, type: state.selectedExhibitionType, status: "pending" as const, slug, start_date: details.start_date || now.toISOString().split('T')[0], end_date: details.end_date || new Date(now.getTime() + 3 * MS_PER_DAY).toISOString().split('T')[0], created_by: user?.id || null };
        const { data: inserted, error } = await (supabase as never as { from: (t: string) => { insert: (p: unknown) => { select: (s: string) => { single: () => Promise<{ data: { id: string } | null; error: Error | null }> } } } }).from("exhibitions").insert(payload).select("id").single();
        if (error) throw error;
        recordId = inserted?.id;
      } else if (state.targetTable === "competitions") {
        subType = "competition";
        const now = new Date();
        const payload = { ...buildCompetitionPayload(details), title: details.name_en || name, status: "pending" as const, competition_start: details.start_date || now.toISOString().split('T')[0], competition_end: details.end_date || new Date(now.getTime() + 3 * MS_PER_DAY).toISOString().split('T')[0], organizer_id: user?.id || '', country_code: details.country_code || "SA", edition_year: details.edition_year || now.getFullYear() };
        const { data: inserted, error } = await (supabase as never as { from: (t: string) => { insert: (p: unknown) => { select: (s: string) => { single: () => Promise<{ data: { id: string } | null; error: Error | null }> } } } }).from("competitions").insert(payload).select("id").single();
        if (error) throw error;
        recordId = inserted?.id;
      } else if (state.targetTable === "organizers") {
        subType = "organizer";
        const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);
        const payload = { ...buildOrganizerPayload(details), name: details.name_en || name, slug, status: "active", created_by: user?.id || null };
        const { data: inserted, error } = await supabase.from("organizers").insert(payload).select("id").single();
        if (error) throw error;
        recordId = inserted?.id;
      } else {
        subType = state.selectedEstablishmentType;
        const payload = { ...buildEstablishmentPayload(details), name: details.name_en || name, type: state.selectedEstablishmentType, is_active: true, is_verified: false, created_by: user?.id || null };
        const { data: inserted, error } = await supabase.from("establishments").insert(payload).select("id").single();
        if (error) throw error;
        recordId = inserted?.id;
      }

      const tableLabel = TARGET_TABLE_OPTIONS.find(t => t.value === state.targetTable);
      toast({ title: isAr ? "تم الإضافة بنجاح (بانتظار الموافقة)" : `${tableLabel?.label_en || 'Record'} added (pending approval)` });
      dispatch({ type: "SAVE_DONE", record: recordId ? { table: state.targetTable, id: recordId } : undefined });
      await logImport('create', state.targetTable, recordId, subType);

      // Trigger notifications
      if (state.targetTable === "culinary_entities") {
        import("@/lib/notificationTriggers").then(({ notifyAdminEntityReview }) => { notifyAdminEntityReview({ entityName: details.name_en || name, entityNameAr: details.name_ar || undefined, submittedBy: "Smart Import" }); });
      } else if (state.targetTable === "companies") {
        import("@/lib/notificationTriggers").then(({ notifyAdminCompanyRegistration }) => { notifyAdminCompanyRegistration({ companyName: details.name_en || name, companyNameAr: details.name_ar || undefined, submittedBy: "Smart Import" }); });
      } else if (state.targetTable === "exhibitions") {
        import("@/lib/notificationTriggers").then(({ notifyAdminExhibitionReview }) => { notifyAdminExhibitionReview({ exhibitionName: details.name_en || name, exhibitionNameAr: details.name_ar || undefined, submittedBy: "Smart Import" }); });
      } else if (state.targetTable === "competitions") {
        import("@/lib/notificationTriggers").then(({ notifyAdminCompetitionReview }) => { notifyAdminCompetitionReview({ competitionName: details.name_en || name, competitionNameAr: details.name_ar || undefined, submittedBy: "Smart Import" }); });
      }

      try { const { data: newStats } = await supabase.functions.invoke("smart-import", { body: { mode: "stats" } }); if (newStats?.success) dispatch({ type: "STATS_LOADED", stats: newStats.stats }); } catch { /* ignore */ }
    } catch (err: unknown) {
      toast({ title: isAr ? "خطأ" : "Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
      dispatch({ type: "SET_FIELD", field: "saving", value: false });
    }
  };

  const handleNewSearch = useCallback(() => dispatch({ type: "RESET_SEARCH" }), []);
  const handleBackToResults = useCallback(() => dispatch({ type: "BACK_TO_RESULTS" }), []);

  const loadHistory = async () => {
    dispatch({ type: "SET_FIELD", field: "loadingHistory", value: true });
    try {
      const { data } = await supabase.from("smart_import_logs").select("id, entity_type, status, created_at, created_by, errors").order("created_at", { ascending: false }).limit(50);
      dispatch({ type: "HISTORY_LOADED", history: (data || []) as unknown as Record<string, unknown>[] });
    } catch (err: unknown) {
      console.error('Failed to load history:', err instanceof Error ? err.message : err);
      dispatch({ type: "SET_FIELD", field: "loadingHistory", value: false });
    }
  };

  // ── Batch ──
  const toggleBatchSelect = useCallback((id: string) => dispatch({ type: "TOGGLE_BATCH", id }), []);
  const toggleSelectAll = useCallback(() => dispatch({ type: "TOGGLE_SELECT_ALL", allIds: state.searchResults.map(r => r.id) }), [state.searchResults]);

  const handleBatchImport = async () => {
    if (state.batchSelected.size === 0) return;
    const selected = state.searchResults.filter(r => state.batchSelected.has(r.id));
    dispatch({ type: "BATCH_PROGRESS", progress: { current: 0, total: selected.length, successes: 0, failures: 0 } });
    let successCount = 0; let failCount = 0;

    for (let i = 0; i < selected.length; i++) {
      dispatch({ type: "BATCH_PROGRESS", progress: { current: i + 1, total: selected.length, successes: successCount, failures: failCount } });
      const item = selected[i];
      try {
        const { data, error } = await supabase.functions.invoke("smart-import", {
          body: { query: item.name, location: state.location.trim() || undefined, mode: "details", result_url: item.url || undefined, latitude: item.latitude || undefined, longitude: item.longitude || undefined },
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

    dispatch({ type: "BATCH_PROGRESS", progress: { current: selected.length, total: selected.length, successes: successCount, failures: failCount } });
    toast({ title: isAr ? "تم الاستيراد الجماعي" : "Batch import complete", description: `✅ ${successCount} / ❌ ${failCount}` });
    dispatch({ type: "BATCH_DONE" });
    try { const { data: newStats } = await supabase.functions.invoke("smart-import", { body: { mode: "stats" } }); if (newStats?.success) dispatch({ type: "STATS_LOADED", stats: newStats.stats }); } catch { /* ignore */ }
  };

  // ── Copy all data ──
  const copyAllData = useCallback(() => {
    if (!state.details) return;
    const text = Object.entries(state.details).filter(([, v]) => v != null && v !== '').map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n');
    navigator.clipboard.writeText(text);
    toast({ title: isAr ? "تم النسخ" : "Copied to clipboard" });
  }, [state.details, isAr]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') { if (state.step === "details") handleBackToResults(); else if (state.step === "results") handleNewSearch(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); handleNewSearch(); setTimeout(() => searchInputRef.current?.focus(), 100); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.step, handleBackToResults, handleNewSearch]);

  return {
    searchInputRef,
    // Expose individual state fields for backward compatibility
    query: state.query, setQuery: (v: string) => setField("query", v),
    location: state.location, setLocation: (v: string) => setField("location", v),
    websiteUrl: state.websiteUrl, setWebsiteUrl: (v: string) => setField("websiteUrl", v),
    directUrl: state.directUrl, setDirectUrl: (v: string) => setField("directUrl", v),
    step: state.step, searching: state.searching, searchResults: state.searchResults,
    selectedResult: state.selectedResult, searchTime: state.searchTime,
    loadingDetails: state.loadingDetails, details: state.details,
    sourcesUsed: state.sourcesUsed,
    activeTab: state.activeTab, setActiveTab: (v: string) => setField("activeTab", v),
    dataQuality: state.dataQuality,
    checkingDb: state.checkingDb, existingRecords: state.existingRecords, dbChecked: state.dbChecked,
    showAddForm: state.showAddForm, setShowAddForm: (v: boolean) => setField("showAddForm", v),
    targetTable: state.targetTable, setTargetTable: (v: TargetTable) => setField("targetTable", v),
    selectedEntityType: state.selectedEntityType, setSelectedEntityType: (v: EntityType) => setField("selectedEntityType", v),
    selectedCompanyType: state.selectedCompanyType, setSelectedCompanyType: (v: CompanyType) => setField("selectedCompanyType", v),
    selectedEstablishmentType: state.selectedEstablishmentType, setSelectedEstablishmentType: (v: string) => setField("selectedEstablishmentType", v),
    selectedExhibitionType: state.selectedExhibitionType, setSelectedExhibitionType: (v: ExhibitionType) => setField("selectedExhibitionType", v),
    saving: state.saving, updating: state.updating, selectedExistingId: state.selectedExistingId,
    suggestedTarget: state.suggestedTarget,
    batchSelected: state.batchSelected, batchImporting: state.batchImporting, batchProgress: state.batchProgress,
    showHistory: state.showHistory, setShowHistory: (v: boolean) => setField("showHistory", v),
    importHistory: state.importHistory, loadingHistory: state.loadingHistory,
    importMode: state.importMode, setImportMode: (v: "search" | "url" | "bulk" | "cv") => setField("importMode", v),
    urlImporting: state.urlImporting, stats: state.stats, loadingStats: state.loadingStats,
    editingFields: state.editingFields, setEditingFields: (v: boolean) => setField("editingFields", v),
    lastSavedRecord: state.lastSavedRecord, fieldCount,
    handleSearch, handleUrlImport, handleResultClick, handleRescrape,
    handleUpdateRecord, handleAddNewRecord, handleNewSearch, handleBackToResults,
    loadHistory, toggleBatchSelect, toggleSelectAll, handleBatchImport,
    handleFieldUpdate, copyAllData, getAdminEditUrl, user,
  };
}
