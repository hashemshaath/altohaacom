import { useState, useCallback, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { GoogleMapEmbed } from "@/components/smart-import/GoogleMapEmbed";
import type { ImportedData } from "@/components/smart-import/SmartImportDialog";
import type { Database } from "@/integrations/supabase/types";
import {
  Search, Loader2, MapPin, Globe, Phone, Clock,
  Sparkles, CheckCircle, Star, Share2, Copy,
  Building2, ExternalLink, ChevronRight,
  FileText, Mail, Hash, ArrowLeft, AlertCircle,
  RefreshCw, Plus, Database as DatabaseIcon,
  Users, Award, Briefcase, Tag, Link2, Shield,
  Calendar, BookOpen, UserCheck,
} from "lucide-react";

type EntityType = Database["public"]["Enums"]["entity_type"];
type CompanyType = Database["public"]["Enums"]["company_type"];
type TargetTable = "culinary_entities" | "companies" | "establishments";

// ─── Types ───
interface SearchResultItem {
  id: string;
  name: string;
  description: string;
  url: string;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  total_reviews: number | null;
  google_maps_url: string | null;
  place_type: string | null;
}

interface ExistingRecord {
  id: string;
  name: string;
  name_ar: string | null;
  identifier: string; // entity_number, company_number, or id
  sub_type: string;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  table: TargetTable;
}

type Step = "search" | "results" | "details";

// ─── Source Channel Config ───
const SOURCE_CHANNELS = {
  google_maps: { label_en: "Google Maps", label_ar: "خرائط جوجل", icon: MapPin, color: "bg-red-500/10 text-red-600 border-red-500/20" },
  web_search: { label_en: "Web Search", label_ar: "بحث الويب", icon: Globe, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  website: { label_en: "Official Website", label_ar: "الموقع الرسمي", icon: ExternalLink, color: "bg-green-500/10 text-green-600 border-green-500/20" },
  ai: { label_en: "AI Enrichment", label_ar: "تحليل ذكي", icon: Sparkles, color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
} as const;

const TARGET_TABLE_OPTIONS: { value: TargetTable; label_en: string; label_ar: string; icon: typeof Building2; description_en: string; description_ar: string }[] = [
  { value: "culinary_entities", label_en: "Culinary Entity", label_ar: "كيان طهوي", icon: Building2, description_en: "Associations, academies, government entities", description_ar: "جمعيات، أكاديميات، جهات حكومية" },
  { value: "companies", label_en: "Company", label_ar: "شركة", icon: Briefcase, description_en: "Sponsors, suppliers, partners, vendors", description_ar: "رعاة، موردون، شركاء" },
  { value: "establishments", label_en: "Establishment", label_ar: "منشأة", icon: MapPin, description_en: "Hotels, restaurants, kitchens", description_ar: "فنادق، مطاعم، مطابخ" },
];

const ENTITY_TYPE_LABELS: Record<EntityType, { en: string; ar: string }> = {
  culinary_association: { en: "Culinary Association", ar: "جمعية طهي" },
  government_entity: { en: "Government Entity", ar: "جهة حكومية" },
  private_association: { en: "Private Association", ar: "جمعية خاصة" },
  culinary_academy: { en: "Culinary Academy", ar: "أكاديمية طهي" },
  industry_body: { en: "Industry Body", ar: "هيئة صناعية" },
  university: { en: "University", ar: "جامعة" },
  college: { en: "College", ar: "كلية" },
  training_center: { en: "Training Center", ar: "مركز تدريب" },
};

const COMPANY_TYPE_LABELS: Record<CompanyType, { en: string; ar: string }> = {
  sponsor: { en: "Sponsor", ar: "راعي" },
  supplier: { en: "Supplier", ar: "مورد" },
  partner: { en: "Partner", ar: "شريك" },
  vendor: { en: "Vendor", ar: "بائع" },
};

const ESTABLISHMENT_TYPES = [
  { value: "restaurant", en: "Restaurant", ar: "مطعم" },
  { value: "hotel", en: "Hotel", ar: "فندق" },
  { value: "cafe", en: "Café", ar: "مقهى" },
  { value: "catering", en: "Catering", ar: "تموين" },
  { value: "bakery", en: "Bakery", ar: "مخبز" },
  { value: "kitchen", en: "Kitchen", ar: "مطبخ" },
  { value: "resort", en: "Resort", ar: "منتجع" },
  { value: "club", en: "Club", ar: "نادي" },
  { value: "other", en: "Other", ar: "أخرى" },
];

// ─── Helpers ───
const DataField = ({ label, value, copyable, multiline }: { label: string; value?: string | null; copyable?: boolean; multiline?: boolean }) => {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex items-start gap-1.5">
        {multiline ? (
          <p className="text-sm leading-relaxed flex-1">{value}</p>
        ) : (
          <p className="text-sm truncate flex-1" title={value}>{value}</p>
        )}
        {copyable && (
          <Button
            variant="ghost" size="icon" className="h-6 w-6 shrink-0"
            onClick={() => { navigator.clipboard.writeText(value); toast({ title: "Copied!" }); }}
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

const TagList = ({ label, items }: { label: string; items?: string[] | null }) => {
  if (!items?.length) return null;
  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <Badge key={i} variant="outline" className="text-xs">{item}</Badge>
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ───
export default function SmartImportAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const [step, setStep] = useState<Step>("search");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResultItem | null>(null);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [searchedLocation, setSearchedLocation] = useState("");

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [details, setDetails] = useState<ImportedData | null>(null);
  const [sourcesUsed, setSourcesUsed] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("overview");

  const [checkingDb, setCheckingDb] = useState(false);
  const [existingRecords, setExistingRecords] = useState<ExistingRecord[]>([]);
  const [dbChecked, setDbChecked] = useState(false);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [targetTable, setTargetTable] = useState<TargetTable>("culinary_entities");
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType>("culinary_association");
  const [selectedCompanyType, setSelectedCompanyType] = useState<CompanyType>("supplier");
  const [selectedEstablishmentType, setSelectedEstablishmentType] = useState("restaurant");
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedExistingId, setSelectedExistingId] = useState<string | null>(null);

  // Auto-detect suggestion from AI
  const [suggestedTarget, setSuggestedTarget] = useState<{ table: string; sub_type: string; confidence: number } | null>(null);

  // Batch import
  const [batchSelected, setBatchSelected] = useState<Set<string>>(new Set());
  const [batchImporting, setBatchImporting] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Import history
  const [showHistory, setShowHistory] = useState(false);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

    try {
      const { data, error } = await supabase.functions.invoke("smart-import", {
        body: { query: query.trim(), location: location.trim() || undefined, mode: "search" },
      });
      if (error) throw new Error(typeof error === 'object' && error.message ? error.message : String(error));
      if (!data?.success) throw new Error(data?.error || "Search failed");
      setSearchResults(data.results || []);
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

  // ─── Click result → auto-fetch details ───
  const handleResultClick = useCallback(async (item: SearchResultItem) => {
    setSelectedResult(item);
    setLoadingDetails(true);
    setDetails(null);
    setActiveTab("overview");
    setDbChecked(false);
    setExistingRecords([]);

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
      // Apply auto-detect suggestion
      if (data.suggested_target) {
        setSuggestedTarget(data.suggested_target);
        const st = data.suggested_target;
        if (st.table === 'culinary_entities') {
          setTargetTable('culinary_entities');
          setSelectedEntityType(st.sub_type as EntityType);
        } else if (st.table === 'companies') {
          setTargetTable('companies');
          setSelectedCompanyType(st.sub_type as CompanyType);
        } else if (st.table === 'establishments') {
          setTargetTable('establishments');
          setSelectedEstablishmentType(st.sub_type);
        }
      }
      setStep("details");
      toast({ title: isAr ? "تم جلب البيانات بنجاح" : "Data fetched successfully" });
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoadingDetails(false);
    }
  }, [location, websiteUrl, isAr]);

  // ─── Check DB for existing records across all 3 tables ───
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

      // Search all 3 tables in parallel
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

  // ─── Build payload per target table ───
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
    return payload;
  };

  const buildCompanyPayload = (d: ImportedData) => {
    const payload: Record<string, any> = {};
    if (d.name_en) payload.name = d.name_en;
    if (d.name_ar) payload.name_ar = d.name_ar;
    if (d.description_en) payload.description = d.description_en;
    if (d.description_ar) payload.description_ar = d.description_ar;
    if (d.phone) payload.phone = d.phone;
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
    const specs = [...(d.specializations_en || []), ...(d.specializations_ar || [])].filter(Boolean);
    if (specs.length) payload.specializations = specs;
    if (d.social_media && Object.values(d.social_media).some(Boolean)) payload.social_links = d.social_media;
    if (d.description_en || d.business_type_en) payload.tagline = d.business_type_en || d.description_en?.substring(0, 100);
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
    return payload;
  };

  const getPayloadForTable = (d: ImportedData, table: TargetTable) => {
    switch (table) {
      case "culinary_entities": return buildEntityPayload(d);
      case "companies": return buildCompanyPayload(d);
      case "establishments": return buildEstablishmentPayload(d);
    }
  };

  // ─── Update existing record (any table) ───
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

  // ─── Add new record (routes to correct table) ───
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
        const payload = {
          ...buildEntityPayload(details),
          name: details.name_en || name,
          type: selectedEntityType,
          scope: "local" as const,
          status: "pending" as const,
          is_visible: false,
          is_verified: false,
          slug,
          entity_number: "",
          created_by: user?.id || null,
        };
        const { data: inserted, error } = await supabase.from("culinary_entities").insert(payload).select("id").single();
        if (error) throw error;
        recordId = inserted?.id;
      } else if (targetTable === "companies") {
        subType = selectedCompanyType;
        const payload = {
          ...buildCompanyPayload(details),
          name: details.name_en || name,
          type: selectedCompanyType,
          status: "active" as const,
          country_code: details.country_code || "SA",
          created_by: user?.id || null,
        };
        const { data: inserted, error } = await supabase.from("companies").insert(payload).select("id").single();
        if (error) throw error;
        recordId = inserted?.id;
      } else {
        subType = selectedEstablishmentType;
        const payload = {
          ...buildEstablishmentPayload(details),
          name: details.name_en || name,
          type: selectedEstablishmentType,
          is_active: true,
          is_verified: false,
          created_by: user?.id || null,
        };
        const { data: inserted, error } = await supabase.from("establishments").insert(payload).select("id").single();
        if (error) throw error;
        recordId = inserted?.id;
      }

      const tableLabel = TARGET_TABLE_OPTIONS.find(t => t.value === targetTable);
      toast({ title: isAr ? "تم الإضافة بنجاح" : `${tableLabel?.label_en || 'Record'} added successfully` });
      await logImport('create', targetTable, recordId, subType);
      setShowAddDialog(false);
      setDbChecked(false);
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleNewSearch = () => {
    setStep("search");
    setSearchResults([]);
    setSelectedResult(null);
    setDetails(null);
    setSourcesUsed({});
    setDbChecked(false);
    setExistingRecords([]);
    setBatchSelected(new Set());
    setSuggestedTarget(null);
  };

  const handleBackToResults = () => {
    setStep("results");
    setDetails(null);
    setSourcesUsed({});
    setDbChecked(false);
    setExistingRecords([]);
    setSuggestedTarget(null);
  };

  // ─── Log import to smart_import_logs ───
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
        source_url: selectedResult?.url,
        sources_used: sourcesUsed,
        extracted_fields_count: countFields(details),
        imported_data: details as any,
        status: 'success',
      });
    } catch (e) {
      console.error('Failed to log import:', e);
    }
  };

  // ─── Load import history ───
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data } = await supabase
        .from("smart_import_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setImportHistory(data || []);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ─── Batch import handler ───
  const handleBatchImport = async () => {
    if (batchSelected.size === 0) return;
    setBatchImporting(true);
    const selected = searchResults.filter(r => batchSelected.has(r.id));
    setBatchProgress({ current: 0, total: selected.length });
    let successCount = 0;

    for (let i = 0; i < selected.length; i++) {
      setBatchProgress({ current: i + 1, total: selected.length });
      const item = selected[i];
      try {
        // Fetch details for each
        const { data, error } = await supabase.functions.invoke("smart-import", {
          body: {
            query: item.name,
            location: location.trim() || undefined,
            mode: "details",
            result_url: item.url || undefined,
            latitude: item.latitude || undefined,
            longitude: item.longitude || undefined,
          },
        });
        if (error || !data?.success) continue;

        const d = data.data as ImportedData;
        const suggestion = data.suggested_target || { table: 'establishments', sub_type: 'restaurant' };
        const tbl = suggestion.table as TargetTable;
        const name = d.name_en || d.name_ar || item.name;

        let recordId: string | null = null;

        if (tbl === 'culinary_entities') {
          const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
          const payload = { ...buildEntityPayload(d), name: d.name_en || name, type: suggestion.sub_type as EntityType, scope: 'local' as const, status: 'pending' as const, is_visible: false, is_verified: false, slug, entity_number: '', created_by: user?.id || null };
          const { data: inserted } = await supabase.from("culinary_entities").insert(payload).select("id").single();
          recordId = inserted?.id;
        } else if (tbl === 'companies') {
          const payload = { ...buildCompanyPayload(d), name: d.name_en || name, type: suggestion.sub_type as CompanyType, status: 'active' as const, country_code: d.country_code || 'SA', created_by: user?.id || null };
          const { data: inserted } = await supabase.from("companies").insert(payload).select("id").single();
          recordId = inserted?.id;
        } else {
          const payload = { ...buildEstablishmentPayload(d), name: d.name_en || name, type: suggestion.sub_type, is_active: true, is_verified: false, created_by: user?.id || null };
          const { data: inserted } = await supabase.from("establishments").insert(payload).select("id").single();
          recordId = inserted?.id;
        }

        // Log import
        try {
          await supabase.from("smart_import_logs").insert({
            imported_by: user?.id || '',
            target_table: tbl,
            target_record_id: recordId,
            action: 'create',
            entity_name: d.name_en || name,
            entity_name_ar: d.name_ar,
            entity_type: suggestion.sub_type,
            source_query: searchedQuery,
            source_location: searchedLocation,
            source_url: item.url,
            sources_used: data.sources_used,
            extracted_fields_count: countFields(d),
            imported_data: d as any,
            status: 'success',
          });
        } catch {}

        successCount++;
      } catch (err) {
        console.error('Batch import error for:', item.name, err);
      }
    }

    setBatchImporting(false);
    setBatchSelected(new Set());
    toast({
      title: isAr ? "تم الاستيراد الجماعي" : "Batch Import Complete",
      description: isAr ? `تم استيراد ${successCount} من ${selected.length} بنجاح` : `${successCount} of ${selected.length} imported successfully`,
    });
  };

  const toggleBatchSelect = (id: string) => {
    setBatchSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (batchSelected.size === searchResults.length) {
      setBatchSelected(new Set());
    } else {
      setBatchSelected(new Set(searchResults.map(r => r.id)));
    }
  };

  // Count how many detail fields are populated
  const countFields = (d: ImportedData | null) => {
    if (!d) return 0;
    let count = 0;
    const check = (v: any) => { if (v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)) count++; };
    Object.values(d).forEach(v => {
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        Object.values(v).forEach(sv => check(sv));
      } else {
        check(v);
      }
    });
    return count;
  };

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
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {step === "search" && (isAr ? "ابحث عن كيان في خرائط جوجل واستورد بياناته تلقائياً" : "Search Google Maps for entities and auto-import data")}
              {step === "results" && (isAr ? `${searchResults.length} نتيجة من خرائط جوجل — اضغط للتحليل` : `${searchResults.length} Google Maps results — click to analyze`)}
              {step === "details" && (isAr ? `تم استخراج ${countFields(details)} حقل بيانات — جاهز للاستيراد` : `${countFields(details)} data fields extracted — ready for import`)}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { setShowHistory(true); loadHistory(); }}>
            <Clock className="h-3.5 w-3.5" />
            {isAr ? "السجل" : "History"}
          </Button>
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
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" />
              {isAr ? "البحث في خرائط جوجل" : "Search Google Maps"}
            </CardTitle>
            <CardDescription>
              {isAr ? "أدخل اسم المنشأة والموقع للبحث في خرائط جوجل" : "Enter entity name and location to search Google Maps"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">{isAr ? "اسم الكيان / المنشأة" : "Entity / Business Name"}</Label>
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="ps-9 h-11"
                      placeholder={isAr ? "مثال: مطعم الريف، فندق هيلتون..." : "e.g. Al Reef Restaurant, Hilton Hotel..."}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
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
                  {searching ? (isAr ? "جاري البحث..." : "Searching...") : (isAr ? "بحث في جوجل" : "Search Google Maps")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
                  <Badge variant="secondary" className="text-xs">
                    {batchSelected.size} {isAr ? "محدد" : "selected"}
                  </Badge>
                )}
              </div>
              {batchSelected.size > 0 && (
                <Button size="sm" onClick={handleBatchImport} disabled={batchImporting} className="gap-1.5">
                  {batchImporting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {isAr ? `${batchProgress.current}/${batchProgress.total}` : `${batchProgress.current}/${batchProgress.total}`}
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      {isAr ? `استيراد ${batchSelected.size} (تلقائي)` : `Import ${batchSelected.size} (auto-detect)`}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-red-500" />
                      {isAr ? "نتائج خرائط جوجل" : "Google Maps Results"}
                    </span>
                    {!searching && <Badge variant="secondary" className="text-xs font-normal">{searchResults.length}</Badge>}
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
                              <input
                                type="checkbox"
                                className="mt-4 rounded shrink-0"
                                checked={batchSelected.has(item.id)}
                                onChange={() => toggleBatchSelect(item.id)}
                              />
                              <button
                                className={`flex-1 text-start p-3 rounded-lg transition-all ${
                                  isSelected ? 'bg-primary/10 border border-primary/30 shadow-sm' : 'hover:bg-accent/50 border border-transparent'
                                }`}
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
                                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                          {item.rating}
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
      {loadingDetails && step === "details" && (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <Sparkles className="h-5 w-5 text-primary absolute -top-1 -end-1 animate-pulse" />
              </div>
              <div>
                <p className="font-semibold text-lg">{isAr ? "جاري جلب البيانات..." : "Fetching Data..."}</p>
                <p className="text-sm text-muted-foreground mt-1">{isAr ? "جمع البيانات من خرائط جوجل ومصادر متعددة" : "Collecting from Google Maps and multiple sources"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 3: Comprehensive Details View ─── */}
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
                    <h2 className="text-xl font-bold">{details.name_en || details.name_ar}</h2>
                    {details.name_en && details.name_ar && <p className="text-sm text-muted-foreground">{details.name_ar}</p>}
                    {(details.abbreviation_en || details.abbreviation_ar) && (
                      <p className="text-xs text-muted-foreground/70">
                        {[details.abbreviation_en, details.abbreviation_ar].filter(Boolean).join(" / ")}
                      </p>
                    )}
                  </div>
                  {details.rating && (
                    <Badge variant="secondary" className="gap-1 ms-2 bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      {details.rating}
                      {details.total_reviews != null && <span className="text-muted-foreground">({details.total_reviews})</span>}
                    </Badge>
                  )}
                  {details.founded_year && (
                    <Badge variant="outline" className="gap-1 ms-1 text-xs">
                      <Calendar className="h-3 w-3" />
                      {details.founded_year}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-medium text-muted-foreground me-1">{isAr ? "المصادر:" : "Sources:"}</span>
                  {Object.entries(SOURCE_CHANNELS).map(([key, config]) => {
                    if (!sourcesUsed[key]) return null;
                    const Icon = config.icon;
                    return (
                      <Badge key={key} variant="outline" className={`gap-1 text-xs border ${config.color}`}>
                        <Icon className="h-3 w-3" />
                        {isAr ? config.label_ar : config.label_en}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Suggested Target */}
          {suggestedTarget && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {isAr ? "اقتراح الذكاء الاصطناعي:" : "AI Suggestion:"}
                    </span>
                    <Badge variant="secondary" className="gap-1">
                      {TARGET_TABLE_OPTIONS.find(t => t.value === suggestedTarget.table)
                        ? (isAr ? TARGET_TABLE_OPTIONS.find(t => t.value === suggestedTarget.table)!.label_ar : TARGET_TABLE_OPTIONS.find(t => t.value === suggestedTarget.table)!.label_en)
                        : suggestedTarget.table}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{suggestedTarget.sub_type}</Badge>
                    <span className="text-xs text-muted-foreground">({Math.round(suggestedTarget.confidence * 100)}%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* DB Check */}
          <Card className={existingRecords.length > 0 ? "border-yellow-500/30 bg-yellow-500/5" : dbChecked ? "border-green-500/30 bg-green-500/5" : ""}>
            <CardContent className="py-4">
              {checkingDb ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm">{isAr ? "جاري التحقق من قاعدة البيانات..." : "Checking all databases..."}</span>
                </div>
              ) : dbChecked && existingRecords.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-700">
                      {isAr ? `تم العثور على ${existingRecords.length} سجل مطابق` : `Found ${existingRecords.length} matching record${existingRecords.length > 1 ? 's' : ''}`}
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
                            {isAr ? "تحديث البيانات" : "Update Data"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{isAr ? "أو أضف كسجل جديد" : "Or add as new record"}</span>
                    <Button size="sm" variant="default" className="gap-1.5" onClick={() => setShowAddDialog(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      {isAr ? "إضافة جديد" : "Add New"}
                    </Button>
                  </div>
                </div>
              ) : dbChecked ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">{isAr ? "لا يوجد سجل مطابق" : "No matching records found"}</span>
                  </div>
                  <Button size="sm" variant="default" className="gap-1.5" onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    {isAr ? "إضافة كسجل جديد" : "Add as New Record"}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* ─── Comprehensive Tabbed Content ─── */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="overview" className="gap-1.5"><FileText className="h-3.5 w-3.5" />{isAr ? "نظرة عامة" : "Overview"}</TabsTrigger>
              <TabsTrigger value="contact" className="gap-1.5"><Phone className="h-3.5 w-3.5" />{isAr ? "التواصل" : "Contact"}</TabsTrigger>
              <TabsTrigger value="address" className="gap-1.5"><MapPin className="h-3.5 w-3.5" />{isAr ? "العنوان" : "Address"}</TabsTrigger>
              <TabsTrigger value="organization" className="gap-1.5"><Building2 className="h-3.5 w-3.5" />{isAr ? "المنظمة" : "Organization"}</TabsTrigger>
              <TabsTrigger value="services" className="gap-1.5"><Briefcase className="h-3.5 w-3.5" />{isAr ? "الخدمات" : "Services"}</TabsTrigger>
              <TabsTrigger value="hours" className="gap-1.5"><Clock className="h-3.5 w-3.5" />{isAr ? "ساعات العمل" : "Hours"}</TabsTrigger>
            </TabsList>

            {/* ── Overview Tab ── */}
            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Quick Stats */}
                <Card className="lg:col-span-2">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {details.rating && (
                        <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                          <Star className="h-4 w-4 mx-auto text-yellow-500 fill-yellow-500 mb-1" />
                          <p className="text-xs text-muted-foreground">{isAr ? "التقييم" : "Rating"}</p>
                          <p className="text-lg font-bold">{details.rating}</p>
                          {details.total_reviews != null && <p className="text-xs text-muted-foreground">{details.total_reviews} {isAr ? "تقييم" : "reviews"}</p>}
                        </div>
                      )}
                      {details.phone && (
                        <div className="text-center p-3 rounded-lg bg-accent/30">
                          <Phone className="h-4 w-4 mx-auto text-primary mb-1" />
                          <p className="text-xs text-muted-foreground">{isAr ? "الهاتف" : "Phone"}</p>
                          <p className="text-sm font-medium truncate">{details.phone}</p>
                        </div>
                      )}
                      {details.website && (
                        <div className="text-center p-3 rounded-lg bg-accent/30">
                          <Globe className="h-4 w-4 mx-auto text-primary mb-1" />
                          <p className="text-xs text-muted-foreground">{isAr ? "الموقع" : "Website"}</p>
                          <p className="text-sm font-medium truncate">{details.website.replace(/^https?:\/\//, '')}</p>
                        </div>
                      )}
                      {(details.city_en || details.city_ar) && (
                        <div className="text-center p-3 rounded-lg bg-accent/30">
                          <MapPin className="h-4 w-4 mx-auto text-primary mb-1" />
                          <p className="text-xs text-muted-foreground">{isAr ? "المدينة" : "City"}</p>
                          <p className="text-sm font-medium truncate">{details.city_en || details.city_ar}</p>
                        </div>
                      )}
                      {details.founded_year && (
                        <div className="text-center p-3 rounded-lg bg-accent/30">
                          <Calendar className="h-4 w-4 mx-auto text-primary mb-1" />
                          <p className="text-xs text-muted-foreground">{isAr ? "سنة التأسيس" : "Founded"}</p>
                          <p className="text-lg font-bold">{details.founded_year}</p>
                        </div>
                      )}
                      {details.member_count && (
                        <div className="text-center p-3 rounded-lg bg-accent/30">
                          <Users className="h-4 w-4 mx-auto text-primary mb-1" />
                          <p className="text-xs text-muted-foreground">{isAr ? "الأعضاء" : "Members"}</p>
                          <p className="text-lg font-bold">{details.member_count}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Names & Abbreviations */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "الأسماء" : "Names"}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <DataField label={isAr ? "الاسم (EN)" : "Name (EN)"} value={details.name_en} copyable />
                    <DataField label={isAr ? "الاسم (AR)" : "Name (AR)"} value={details.name_ar} copyable />
                    <DataField label={isAr ? "الاختصار (EN)" : "Abbreviation (EN)"} value={details.abbreviation_en} copyable />
                    <DataField label={isAr ? "الاختصار (AR)" : "Abbreviation (AR)"} value={details.abbreviation_ar} copyable />
                  </CardContent>
                </Card>

                {/* Business Type */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "نوع النشاط" : "Business Type"}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <DataField label={isAr ? "النوع (EN)" : "Type (EN)"} value={details.business_type_en} />
                    <DataField label={isAr ? "النوع (AR)" : "Type (AR)"} value={details.business_type_ar} />
                    <TagList label={isAr ? "الكلمات المفتاحية" : "Tags"} items={details.tags} />
                  </CardContent>
                </Card>

                {/* Description */}
                {(details.description_en || details.description_ar) && (
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "الوصف" : "Description"}</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <DataField label={isAr ? "الوصف (EN)" : "Description (EN)"} value={details.description_en} multiline />
                      <DataField label={isAr ? "الوصف (AR)" : "Description (AR)"} value={details.description_ar} multiline />
                    </CardContent>
                  </Card>
                )}

                {/* Mission */}
                {(details.mission_en || details.mission_ar) && (
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><BookOpen className="h-4 w-4" />{isAr ? "الرسالة والرؤية" : "Mission & Vision"}</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <DataField label={isAr ? "الرسالة (EN)" : "Mission (EN)"} value={details.mission_en} multiline />
                      <DataField label={isAr ? "الرسالة (AR)" : "Mission (AR)"} value={details.mission_ar} multiline />
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ── Contact Tab ── */}
            <TabsContent value="contact" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "معلومات التواصل" : "Contact Info"}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <DataField label={isAr ? "الهاتف" : "Phone"} value={details.phone} copyable />
                    <DataField label={isAr ? "هاتف ثانوي" : "Secondary Phone"} value={details.phone_secondary} copyable />
                    <DataField label={isAr ? "الفاكس" : "Fax"} value={details.fax} copyable />
                    <DataField label={isAr ? "البريد الإلكتروني" : "Email"} value={details.email} copyable />
                    <DataField label={isAr ? "الموقع الإلكتروني" : "Website"} value={details.website} copyable />
                  </CardContent>
                </Card>
                {details.social_media && Object.values(details.social_media).some(Boolean) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1.5"><Share2 className="h-4 w-4" /> {isAr ? "التواصل الاجتماعي" : "Social Media"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(details.social_media).filter(([, v]) => v).map(([k, v]) => (
                        <DataField key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v} copyable />
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ── Address Tab ── */}
            <TabsContent value="address" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <DataField label={isAr ? "المدينة (EN)" : "City (EN)"} value={details.city_en} />
                      <DataField label={isAr ? "المدينة (AR)" : "City (AR)"} value={details.city_ar} />
                      <DataField label={isAr ? "الحي (EN)" : "Neighborhood (EN)"} value={details.neighborhood_en} />
                      <DataField label={isAr ? "الحي (AR)" : "Neighborhood (AR)"} value={details.neighborhood_ar} />
                      <DataField label={isAr ? "الشارع (EN)" : "Street (EN)"} value={details.street_en} />
                      <DataField label={isAr ? "الشارع (AR)" : "Street (AR)"} value={details.street_ar} />
                      <DataField label={isAr ? "الرمز البريدي" : "Postal Code"} value={details.postal_code} />
                      <DataField label={isAr ? "الدولة" : "Country"} value={details.country_en ? `${details.country_en}${details.country_code ? ` (${details.country_code})` : ''}` : details.country_ar} />
                    </div>
                    <Separator />
                    <DataField label={isAr ? "العنوان الكامل (EN)" : "Full Address (EN)"} value={details.full_address_en} copyable />
                    <DataField label={isAr ? "العنوان الكامل (AR)" : "Full Address (AR)"} value={details.full_address_ar} copyable />
                    {(details.latitude || details.longitude) && (
                      <>
                        <Separator />
                        <div className="grid grid-cols-2 gap-3">
                          <DataField label={isAr ? "خط العرض" : "Latitude"} value={details.latitude?.toString()} copyable />
                          <DataField label={isAr ? "خط الطول" : "Longitude"} value={details.longitude?.toString()} copyable />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
                <GoogleMapEmbed
                  latitude={details.latitude}
                  longitude={details.longitude}
                  name={details.name_en || details.name_ar}
                  className="h-[400px]"
                />
              </div>
            </TabsContent>

            {/* ── Organization Tab ── */}
            <TabsContent value="organization" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Leadership */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><UserCheck className="h-4 w-4" />{isAr ? "القيادة" : "Leadership"}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <DataField label={isAr ? "الرئيس (EN)" : "President (EN)"} value={details.president_name_en} />
                    <DataField label={isAr ? "الرئيس (AR)" : "President (AR)"} value={details.president_name_ar} />
                    <DataField label={isAr ? "السكرتير (EN)" : "Secretary (EN)"} value={details.secretary_name_en} />
                    <DataField label={isAr ? "السكرتير (AR)" : "Secretary (AR)"} value={details.secretary_name_ar} />
                    {details.member_count && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/30">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm">{isAr ? "عدد الأعضاء:" : "Member Count:"} <strong>{details.member_count}</strong></span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Registration & Legal */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Shield className="h-4 w-4" />{isAr ? "التسجيل والترخيص" : "Registration & Legal"}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <DataField label={isAr ? "السجل التجاري" : "National/Commercial ID"} value={details.national_id} copyable />
                    <DataField label={isAr ? "رقم التسجيل" : "Registration Number"} value={details.registration_number} copyable />
                    <DataField label={isAr ? "رقم الترخيص" : "License Number"} value={details.license_number} copyable />
                    {details.founded_year && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/30">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm">{isAr ? "سنة التأسيس:" : "Founded:"} <strong>{details.founded_year}</strong></span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Affiliated Organizations */}
                {details.affiliated_organizations && details.affiliated_organizations.length > 0 && (
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Link2 className="h-4 w-4" />{isAr ? "المنظمات التابعة" : "Affiliated Organizations"}</CardTitle></CardHeader>
                    <CardContent>
                      <TagList label="" items={details.affiliated_organizations} />
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ── Services Tab ── */}
            <TabsContent value="services" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Briefcase className="h-4 w-4" />{isAr ? "الخدمات" : "Services"}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <TagList label={isAr ? "الخدمات (EN)" : "Services (EN)"} items={details.services_en} />
                    <TagList label={isAr ? "الخدمات (AR)" : "Services (AR)"} items={details.services_ar} />
                    {!details.services_en?.length && !details.services_ar?.length && (
                      <p className="text-sm text-muted-foreground">{isAr ? "لم يتم العثور على خدمات" : "No services found"}</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Award className="h-4 w-4" />{isAr ? "التخصصات" : "Specializations"}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <TagList label={isAr ? "التخصصات (EN)" : "Specializations (EN)"} items={details.specializations_en} />
                    <TagList label={isAr ? "التخصصات (AR)" : "Specializations (AR)"} items={details.specializations_ar} />
                    {!details.specializations_en?.length && !details.specializations_ar?.length && (
                      <p className="text-sm text-muted-foreground">{isAr ? "لم يتم العثور على تخصصات" : "No specializations found"}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Hours Tab ── */}
            <TabsContent value="hours" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {details.business_hours && details.business_hours.length > 0 ? (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1.5"><Clock className="h-4 w-4" /> {isAr ? "ساعات العمل" : "Business Hours"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1.5">
                        {details.business_hours.map((h, i) => (
                          <div key={i} className="flex justify-between text-xs rounded-lg border p-2.5">
                            <span className="font-medium">{isAr ? h.day_ar : h.day_en}</span>
                            <span className={h.is_closed ? "text-muted-foreground" : "text-primary font-medium"}>
                              {h.is_closed ? (isAr ? "مغلق" : "Closed") : `${h.open} - ${h.close}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">{isAr ? "لم يتم العثور على ساعات العمل" : "No business hours found"}</p>
                    </CardContent>
                  </Card>
                )}
                {details.google_maps_url && (
                  <Card>
                    <CardContent className="pt-4 flex flex-col items-center justify-center gap-3 text-center h-full">
                      <MapPin className="h-8 w-8 text-red-500" />
                      <p className="text-sm font-medium">{isAr ? "عرض على الخريطة" : "View on Map"}</p>
                      <a href={details.google_maps_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <ExternalLink className="h-3.5 w-3.5" />
                          {isAr ? "فتح في خرائط جوجل" : "Open in Google Maps"}
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* ─── Add New Record Dialog ─── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              {isAr ? "إضافة سجل جديد" : "Add New Record"}
            </DialogTitle>
            <DialogDescription>
              {isAr ? "حدد الجدول والنوع لإضافة البيانات المستخرجة" : "Select target table and type to add extracted data"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border p-3 bg-accent/30 space-y-1.5">
              <p className="text-sm font-semibold">{details?.name_en || details?.name_ar}</p>
              {details?.name_ar && details?.name_en && <p className="text-xs text-muted-foreground">{details.name_ar}</p>}
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                {details?.city_en && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{details.city_en}</span>}
                {details?.rating && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />{details.rating}</span>}
                {details?.founded_year && <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" />{details.founded_year}</span>}
                {details?.phone && <span className="flex items-center gap-0.5"><Phone className="h-3 w-3" />{details.phone}</span>}
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-1">
                {isAr ? `سيتم استيراد ${countFields(details)} حقل بيانات` : `${countFields(details)} data fields will be imported`}
              </p>
            </div>

            {/* Target Table Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isAr ? "الجدول المستهدف" : "Target Table"} *</Label>
              <div className="grid grid-cols-3 gap-2">
                {TARGET_TABLE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = targetTable === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all text-center ${
                        isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'hover:bg-accent/50'
                      }`}
                      onClick={() => setTargetTable(opt.value)}
                    >
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-xs font-medium ${isSelected ? 'text-primary' : ''}`}>
                        {isAr ? opt.label_ar : opt.label_en}
                      </span>
                      <span className="text-[10px] text-muted-foreground leading-tight">
                        {isAr ? opt.description_ar : opt.description_en}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-type selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {targetTable === "culinary_entities" ? (isAr ? "نوع الكيان" : "Entity Type")
                  : targetTable === "companies" ? (isAr ? "نوع الشركة" : "Company Type")
                  : (isAr ? "نوع المنشأة" : "Establishment Type")} *
              </Label>
              {targetTable === "culinary_entities" && (
                <Select value={selectedEntityType} onValueChange={(v) => setSelectedEntityType(v as EntityType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ENTITY_TYPE_LABELS).map(([value, labels]) => (
                      <SelectItem key={value} value={value}>{isAr ? labels.ar : labels.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {targetTable === "companies" && (
                <Select value={selectedCompanyType} onValueChange={(v) => setSelectedCompanyType(v as CompanyType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(COMPANY_TYPE_LABELS).map(([value, labels]) => (
                      <SelectItem key={value} value={value}>{isAr ? labels.ar : labels.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {targetTable === "establishments" && (
                <Select value={selectedEstablishmentType} onValueChange={setSelectedEstablishmentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ESTABLISHMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground flex items-center gap-2">
              <Hash className="h-4 w-4 shrink-0" />
              {targetTable === "culinary_entities"
                ? (isAr ? "سيتم تعيين رقم تسلسلي جديد تلقائياً (ENT...)" : "A new serial number (ENT...) will be auto-assigned")
                : targetTable === "companies"
                  ? (isAr ? "سيتم تعيين رقم شركة جديد تلقائياً (C...)" : "A new company number (C...) will be auto-assigned")
                  : (isAr ? "سيتم إنشاء سجل منشأة جديد" : "A new establishment record will be created")}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleAddNewRecord} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? (isAr ? "جاري الإضافة..." : "Adding...") : (isAr ? "إضافة" : "Add Record")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Import History Dialog ─── */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {isAr ? "سجل الاستيراد" : "Import History"}
            </DialogTitle>
            <DialogDescription>
              {isAr ? "جميع عمليات الاستيراد السابقة" : "All previous import operations"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : importHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DatabaseIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{isAr ? "لا توجد عمليات استيراد سابقة" : "No previous imports"}</p>
              </div>
            ) : (
              <div className="space-y-2 pe-2">
                {importHistory.map((log) => {
                  const tableInfo = TARGET_TABLE_OPTIONS.find(t => t.value === log.target_table);
                  return (
                    <div key={log.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          {log.action === 'create' ? <Plus className="h-4 w-4 text-primary" /> : <RefreshCw className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{log.entity_name || 'Unknown'}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px] h-4">{isAr ? tableInfo?.label_ar : tableInfo?.label_en}</Badge>
                            <Badge variant="secondary" className="text-[10px] h-4">{log.entity_type}</Badge>
                            <span>{log.action === 'create' ? (isAr ? 'إضافة' : 'Created') : (isAr ? 'تحديث' : 'Updated')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0 text-end">
                        <p>{new Date(log.created_at).toLocaleDateString()}</p>
                        <p>{new Date(log.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
