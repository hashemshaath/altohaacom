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
} from "lucide-react";

type EntityType = Database["public"]["Enums"]["entity_type"];

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

interface ExistingEntity {
  id: string;
  name: string;
  name_ar: string | null;
  entity_number: string;
  type: EntityType;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

type Step = "search" | "results" | "details";

// ─── Source Channel Config ───
const SOURCE_CHANNELS = {
  google_maps: { label_en: "Google Maps", label_ar: "خرائط جوجل", icon: MapPin, color: "bg-red-500/10 text-red-600 border-red-500/20" },
  web_search: { label_en: "Web Search", label_ar: "بحث الويب", icon: Globe, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  website: { label_en: "Official Website", label_ar: "الموقع الرسمي", icon: ExternalLink, color: "bg-green-500/10 text-green-600 border-green-500/20" },
  ai: { label_en: "AI Enrichment", label_ar: "تحليل ذكي", icon: Sparkles, color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
} as const;

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

// ─── Main Component ───
export default function SmartImportAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  // Search inputs
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // State
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

  // DB check state
  const [checkingDb, setCheckingDb] = useState(false);
  const [existingEntities, setExistingEntities] = useState<ExistingEntity[]>([]);
  const [dbChecked, setDbChecked] = useState(false);

  // Add/Update state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType>("culinary_association");
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedExistingId, setSelectedExistingId] = useState<string | null>(null);

  // ─── Step 1: Search ───
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchResults([]);
    setSelectedResult(null);
    setDetails(null);
    setSourcesUsed({});
    setDbChecked(false);
    setExistingEntities([]);
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
    setExistingEntities([]);

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
      setStep("details");
      toast({ title: isAr ? "تم جلب البيانات بنجاح" : "Data fetched successfully" });
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoadingDetails(false);
    }
  }, [location, websiteUrl, isAr]);

  // ─── Check DB for existing entity ───
  const checkExistingEntity = useCallback(async () => {
    if (!details) return;
    setCheckingDb(true);
    setExistingEntities([]);

    try {
      const nameEn = details.name_en?.trim();
      const nameAr = details.name_ar?.trim();
      const phone = details.phone?.trim();
      const email = details.email?.trim()?.toLowerCase();

      let query = supabase.from("culinary_entities").select("id, name, name_ar, entity_number, type, city, phone, email, website");
      const orConditions: string[] = [];
      if (nameEn) orConditions.push(`name.ilike.%${nameEn}%`);
      if (nameAr) orConditions.push(`name_ar.ilike.%${nameAr}%`);
      if (phone) orConditions.push(`phone.eq.${phone}`);
      if (email) orConditions.push(`email.ilike.${email}`);

      if (orConditions.length > 0) {
        const { data, error } = await query.or(orConditions.join(","));
        if (error) throw error;
        setExistingEntities((data as ExistingEntity[]) || []);
      }
    } catch (err: any) {
      console.error("DB check error:", err);
    } finally {
      setCheckingDb(false);
      setDbChecked(true);
    }
  }, [details]);

  // Auto-check DB when details arrive
  useEffect(() => {
    if (details && !dbChecked && step === "details") {
      checkExistingEntity();
    }
  }, [details, dbChecked, step, checkExistingEntity]);

  // ─── Update existing entity ───
  const handleUpdateEntity = async (entityId: string) => {
    if (!details) return;
    setUpdating(true);
    setSelectedExistingId(entityId);

    try {
      const updatePayload: Record<string, any> = {};
      if (details.name_en) updatePayload.name = details.name_en;
      if (details.name_ar) updatePayload.name_ar = details.name_ar;
      if (details.description_en) updatePayload.description = details.description_en;
      if (details.description_ar) updatePayload.description_ar = details.description_ar;
      if (details.phone) updatePayload.phone = details.phone;
      if (details.email) updatePayload.email = details.email;
      if (details.website) updatePayload.website = details.website;
      if (details.city_en || details.city_ar) updatePayload.city = details.city_en || details.city_ar;
      if (details.country_en || details.country_ar) updatePayload.country = details.country_en || details.country_ar;
      if (details.full_address_en) updatePayload.address = details.full_address_en;
      if (details.full_address_ar) updatePayload.address_ar = details.full_address_ar;
      if (details.postal_code) updatePayload.postal_code = details.postal_code;
      if (details.latitude) updatePayload.latitude = details.latitude;
      if (details.longitude) updatePayload.longitude = details.longitude;
      if (details.social_media) updatePayload.social_links = details.social_media;

      const { error } = await supabase.from("culinary_entities").update(updatePayload).eq("id", entityId);
      if (error) throw error;

      toast({ title: isAr ? "تم تحديث الجهة بنجاح" : "Entity updated successfully" });
      setDbChecked(false);
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(false);
      setSelectedExistingId(null);
    }
  };

  // ─── Add new entity ───
  const handleAddNewEntity = async () => {
    if (!details) return;
    setSaving(true);

    try {
      const name = details.name_en || details.name_ar || "Unknown";
      const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const payload = {
        name,
        name_ar: details.name_ar || null,
        description: details.description_en || null,
        description_ar: details.description_ar || null,
        type: selectedEntityType,
        scope: "local" as const,
        status: "pending" as const,
        is_visible: false,
        is_verified: false,
        country: details.country_en || details.country_ar || null,
        city: details.city_en || details.city_ar || null,
        address: details.full_address_en || null,
        address_ar: details.full_address_ar || null,
        postal_code: details.postal_code || null,
        email: details.email || null,
        phone: details.phone || null,
        website: details.website || null,
        latitude: details.latitude || null,
        longitude: details.longitude || null,
        social_links: details.social_media ? details.social_media as any : null,
        slug,
        entity_number: "",
        created_by: user?.id || null,
      };

      const { error } = await supabase.from("culinary_entities").insert(payload);
      if (error) throw error;

      toast({ title: isAr ? "تم إضافة الجهة بنجاح" : "Entity added successfully" });
      setShowAddDialog(false);
      setDbChecked(false);
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ─── Reset ───
  const handleNewSearch = () => {
    setStep("search");
    setSearchResults([]);
    setSelectedResult(null);
    setDetails(null);
    setSourcesUsed({});
    setDbChecked(false);
    setExistingEntities([]);
  };

  const handleBackToResults = () => {
    setStep("results");
    setDetails(null);
    setSourcesUsed({});
    setDbChecked(false);
    setExistingEntities([]);
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
              {step === "details" && (isAr ? "البيانات المستخرجة جاهزة للاستيراد" : "Extracted data ready for import")}
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="hidden sm:flex items-center gap-1.5">
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

      {/* ─── STEP 2: Results (Google Maps only) ─── */}
      {step === "results" && (
        <>
          {/* Inline search bar */}
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

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Results List */}
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
                        <p className="text-sm">{isAr ? "لم يتم العثور على نتائج في خرائط جوجل" : "No Google Maps results found"}</p>
                        <p className="text-xs mt-1">{isAr ? "جرب كلمات بحث مختلفة" : "Try different search terms"}</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {searchResults.map((item) => {
                          const isSelected = selectedResult?.id === item.id;
                          const isLoading = loadingDetails && isSelected;
                          return (
                            <button
                              key={item.id}
                              className={`w-full text-start p-3 rounded-lg transition-all ${
                                isLoading
                                  ? 'bg-primary/10 border border-primary/30 shadow-sm'
                                  : isSelected
                                  ? 'bg-primary/10 border border-primary/30 shadow-sm'
                                  : 'hover:bg-accent/50 border border-transparent'
                              }`}
                              onClick={() => !loadingDetails && handleResultClick(item)}
                              disabled={loadingDetails}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'bg-primary/15' : 'bg-red-500/10'}`}>
                                  {isLoading ? (
                                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                  ) : (
                                    <MapPin className="h-4 w-4 text-red-500" />
                                  )}
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
                                  {item.place_type && (
                                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.place_type}</p>
                                  )}
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground/80 line-clamp-1 mt-0.5">{item.description}</p>
                                  )}
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    {item.google_maps_url && (
                                      <Badge variant="outline" className="text-[9px] h-[18px] px-1 bg-red-500/10 text-red-600 border-red-500/20 gap-0.5">
                                        <MapPin className="h-2 w-2" /> Maps
                                      </Badge>
                                    )}
                                    {item.latitude != null && (
                                      <Badge variant="outline" className="text-[9px] h-[18px] px-1 bg-blue-500/10 text-blue-600 border-blue-500/20 gap-0.5">
                                        📍 {item.latitude.toFixed(2)}, {item.longitude?.toFixed(2)}
                                      </Badge>
                                    )}
                                    {item.total_reviews != null && (
                                      <span className="text-[10px] text-muted-foreground">({item.total_reviews} {isAr ? "تقييم" : "reviews"})</span>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight className={`h-4 w-4 shrink-0 mt-2 transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground/30'}`} />
                              </div>
                              {isLoading && (
                                <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-primary/10">
                                  <Loader2 className="h-3 w-3 text-primary animate-spin" />
                                  <p className="text-xs text-primary font-medium">
                                    {isAr ? "جاري جلب التفاصيل من مصادر متعددة..." : "Fetching details from multiple sources..."}
                                  </p>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Map */}
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

      {/* ─── Loading overlay (when navigating to details) ─── */}
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
                <p className="text-sm text-muted-foreground mt-1">
                  {isAr ? "جمع البيانات من خرائط جوجل ومصادر متعددة" : "Collecting from Google Maps and multiple sources"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 3: Details View ─── */}
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
                    {details.name_en && details.name_ar && (
                      <p className="text-sm text-muted-foreground">{details.name_ar}</p>
                    )}
                  </div>
                  {details.rating && (
                    <Badge variant="secondary" className="gap-1 ms-2 bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      {details.rating}
                      {details.total_reviews != null && <span className="text-muted-foreground">({details.total_reviews})</span>}
                    </Badge>
                  )}
                </div>

                {/* Source Channels */}
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

          {/* ─── DB Existence Check ─── */}
          <Card className={existingEntities.length > 0 ? "border-yellow-500/30 bg-yellow-500/5" : dbChecked ? "border-green-500/30 bg-green-500/5" : ""}>
            <CardContent className="py-4">
              {checkingDb ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm">{isAr ? "جاري التحقق من قاعدة البيانات..." : "Checking database..."}</span>
                </div>
              ) : dbChecked && existingEntities.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-700">
                      {isAr
                        ? `تم العثور على ${existingEntities.length} كيان مطابق في قاعدة البيانات`
                        : `Found ${existingEntities.length} matching entit${existingEntities.length > 1 ? 'ies' : 'y'} in database`}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {existingEntities.map((entity) => (
                      <div key={entity.id} className="flex items-center justify-between rounded-lg border bg-background p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <DatabaseIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{entity.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-[10px] h-4">{entity.entity_number}</Badge>
                              <span>{isAr ? ENTITY_TYPE_LABELS[entity.type]?.ar : ENTITY_TYPE_LABELS[entity.type]?.en}</span>
                              {entity.city && <span>• {entity.city}</span>}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => handleUpdateEntity(entity.id)}
                          disabled={updating}
                        >
                          {updating && selectedExistingId === entity.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          {isAr ? "تحديث البيانات" : "Update Data"}
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {isAr ? "أو يمكنك إضافة ككيان جديد" : "Or you can add as a new entity"}
                    </span>
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
                    <span className="text-sm font-medium text-green-700">
                      {isAr ? "لا يوجد كيان مطابق في قاعدة البيانات" : "No matching entity found in database"}
                    </span>
                  </div>
                  <Button size="sm" variant="default" className="gap-1.5" onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    {isAr ? "إضافة ككيان جديد" : "Add as New Entity"}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Tabbed Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {isAr ? "نظرة عامة" : "Overview"}
              </TabsTrigger>
              <TabsTrigger value="contact" className="gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {isAr ? "التواصل" : "Contact"}
              </TabsTrigger>
              <TabsTrigger value="address" className="gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {isAr ? "العنوان" : "Address"}
              </TabsTrigger>
              <TabsTrigger value="more" className="gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {isAr ? "المزيد" : "More"}
              </TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(details.business_type_en || details.business_type_ar) && (
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">{isAr ? "نوع النشاط" : "Business Type"}</p>
                      <div className="flex gap-2 flex-wrap">
                        {details.business_type_en && <Badge variant="outline">{details.business_type_en}</Badge>}
                        {details.business_type_ar && <Badge variant="outline">{details.business_type_ar}</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {(details.description_en || details.description_ar) && (
                  <Card className={!(details.business_type_en || details.business_type_ar) ? "lg:col-span-2" : ""}>
                    <CardContent className="pt-4 space-y-3">
                      <DataField label={isAr ? "الوصف (EN)" : "Description (EN)"} value={details.description_en} multiline />
                      <DataField label={isAr ? "الوصف (AR)" : "Description (AR)"} value={details.description_ar} multiline />
                    </CardContent>
                  </Card>
                )}
                {/* Quick stats */}
                <Card className="lg:col-span-2">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {details.rating && (
                        <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                          <Star className="h-4 w-4 mx-auto text-yellow-500 fill-yellow-500 mb-1" />
                          <p className="text-xs text-muted-foreground">{isAr ? "تقييم جوجل" : "Google Rating"}</p>
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
                          <p className="text-sm font-medium truncate">{details.website}</p>
                        </div>
                      )}
                      {(details.city_en || details.city_ar) && (
                        <div className="text-center p-3 rounded-lg bg-accent/30">
                          <MapPin className="h-4 w-4 mx-auto text-primary mb-1" />
                          <p className="text-xs text-muted-foreground">{isAr ? "المدينة" : "City"}</p>
                          <p className="text-sm font-medium truncate">{details.city_en || details.city_ar}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Contact */}
            <TabsContent value="contact" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{isAr ? "معلومات التواصل" : "Contact Info"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <DataField label={isAr ? "الهاتف" : "Phone"} value={details.phone} copyable />
                    <DataField label={isAr ? "هاتف ثانوي" : "Secondary Phone"} value={details.phone_secondary} copyable />
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
                        <DataField key={k} label={k} value={v} copyable />
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Address */}
            <TabsContent value="address" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <DataField label={isAr ? "المدينة (EN)" : "City (EN)"} value={details.city_en} />
                      <DataField label={isAr ? "المدينة (AR)" : "City (AR)"} value={details.city_ar} />
                      <DataField label={isAr ? "الحي" : "Neighborhood"} value={details.neighborhood_en || details.neighborhood_ar} />
                      <DataField label={isAr ? "الشارع" : "Street"} value={details.street_en || details.street_ar} />
                      <DataField label={isAr ? "الرمز البريدي" : "Postal Code"} value={details.postal_code} />
                      <DataField label={isAr ? "الدولة" : "Country"} value={details.country_en ? `${details.country_en} (${details.country_code || ''})` : details.country_ar} />
                    </div>
                    <Separator />
                    <DataField label={isAr ? "العنوان الكامل (EN)" : "Full Address (EN)"} value={details.full_address_en} copyable />
                    <DataField label={isAr ? "العنوان الكامل (AR)" : "Full Address (AR)"} value={details.full_address_ar} copyable />
                    {details.national_id && (
                      <>
                        <Separator />
                        <DataField label={isAr ? "السجل التجاري" : "Registration ID"} value={details.national_id} copyable />
                      </>
                    )}
                  </CardContent>
                </Card>
                <GoogleMapEmbed
                  latitude={details.latitude}
                  longitude={details.longitude}
                  name={details.name_en || details.name_ar}
                  className="h-[350px]"
                />
              </div>
            </TabsContent>

            {/* More */}
            <TabsContent value="more" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {details.business_hours && details.business_hours.length > 0 && (
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

      {/* ─── Add New Entity Dialog ─── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              {isAr ? "إضافة كيان جديد" : "Add New Entity"}
            </DialogTitle>
            <DialogDescription>
              {isAr ? "حدد نوع الكيان لإضافته إلى قاعدة البيانات مع رقم تسلسلي جديد" : "Select the entity type to add it to the database with a new serial number"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Preview */}
            <div className="rounded-lg border p-3 bg-accent/30 space-y-1.5">
              <p className="text-sm font-semibold">{details?.name_en || details?.name_ar}</p>
              {details?.name_ar && details?.name_en && <p className="text-xs text-muted-foreground">{details.name_ar}</p>}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {details?.city_en && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{details.city_en}</span>}
                {details?.rating && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />{details.rating}
                  </span>
                )}
              </div>
            </div>

            {/* Entity Type Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isAr ? "نوع الكيان" : "Entity Type"} *</Label>
              <Select value={selectedEntityType} onValueChange={(v) => setSelectedEntityType(v as EntityType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ENTITY_TYPE_LABELS).map(([value, labels]) => (
                    <SelectItem key={value} value={value}>
                      {isAr ? labels.ar : labels.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground flex items-center gap-2">
              <Hash className="h-4 w-4 shrink-0" />
              {isAr ? "سيتم تعيين رقم تسلسلي جديد تلقائياً (ENT...)" : "A new serial number (ENT...) will be auto-assigned"}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleAddNewEntity} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? (isAr ? "جاري الإضافة..." : "Adding...") : (isAr ? "إضافة الكيان" : "Add Entity")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
