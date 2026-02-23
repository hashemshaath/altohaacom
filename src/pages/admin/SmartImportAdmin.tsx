import { useState, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
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
import { GoogleMapEmbed } from "@/components/smart-import/GoogleMapEmbed";
import type { ImportedData } from "@/components/smart-import/SmartImportDialog";
import {
  Search, Loader2, MapPin, Globe, Phone, Clock,
  Sparkles, CheckCircle, Star, Share2, Copy,
  Building2, Download, ExternalLink, ChevronRight,
  FileText, Mail, Hash, ArrowLeft,
} from "lucide-react";

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
}

type Step = "search" | "results" | "details";

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

const SourceBadge = ({ active, label, icon: Icon }: { active: boolean; label: string; icon: any }) => {
  if (!active) return null;
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      <Icon className="h-3 w-3" /> {label}
    </Badge>
  );
};

// ─── Main Component ───
export default function SmartImportAdmin() {
  const { language } = useLanguage();
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

  // ─── Step 1: Search ───
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchResults([]);
    setSelectedResult(null);
    setDetails(null);
    setSourcesUsed({});
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

  // ─── Step 2: Fetch Details ───
  const handleFetchDetails = useCallback(async (item: SearchResultItem) => {
    setLoadingDetails(true);
    setDetails(null);
    setActiveTab("overview");

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
      toast({ title: isAr ? "تم التحليل بنجاح" : "Analysis Complete" });
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoadingDetails(false);
    }
  }, [location, websiteUrl, isAr]);

  // ─── Reset ───
  const handleNewSearch = () => {
    setStep("search");
    setSearchResults([]);
    setSelectedResult(null);
    setDetails(null);
    setSourcesUsed({});
  };

  const handleBackToResults = () => {
    setStep("results");
    setDetails(null);
    setSourcesUsed({});
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
              {step === "search" && (isAr ? "ابحث عن أي كيان واستورد بياناته بالذكاء الاصطناعي" : "Search any entity and auto-import with AI")}
              {step === "results" && (isAr ? `${searchResults.length} نتيجة — اختر كياناً للتحليل` : `${searchResults.length} results — select one to analyze`)}
              {step === "details" && (isAr ? "البيانات المستخرجة جاهزة للاستيراد" : "Extracted data ready for import")}
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="hidden sm:flex items-center gap-1.5">
          {[
            { key: "search", label: isAr ? "بحث" : "Search", num: 1 },
            { key: "results", label: isAr ? "اختيار" : "Select", num: 2 },
            { key: "details", label: isAr ? "تحليل" : "Analyze", num: 3 },
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
            <CardTitle className="text-base">{isAr ? "البحث عن كيان" : "Search for an Entity"}</CardTitle>
            <CardDescription>
              {isAr ? "أدخل اسم المنشأة أو الشركة والموقع للبحث عبر الويب" : "Enter the business name and location to search across the web"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">{isAr ? "اسم الكيان / الشركة" : "Entity / Company Name"}</Label>
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
                  {searching ? (isAr ? "جاري البحث..." : "Searching...") : (isAr ? "بحث" : "Search")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 2: Results + Map ─── */}
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
                      <Building2 className="h-4 w-4 text-primary" />
                      {isAr ? "النتائج" : "Results"}
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
                    ) : (
                      <div className="p-2 space-y-1">
                        {searchResults.map((item) => {
                          const isSelected = selectedResult?.id === item.id;
                          return (
                            <button
                              key={item.id}
                              className={`w-full text-start p-3 rounded-lg transition-all ${
                                isSelected
                                  ? 'bg-primary/10 border border-primary/30 shadow-sm'
                                  : 'hover:bg-accent/50 border border-transparent'
                              }`}
                              onClick={() => { setSelectedResult(item); setDetails(null); }}
                            >
                              <div className="flex items-start gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                  <MapPin className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{item.name}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    {item.google_maps_url && (
                                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                        <MapPin className="h-2.5 w-2.5 me-0.5" /> Maps
                                      </Badge>
                                    )}
                                    {item.rating && (
                                      <span className="flex items-center gap-0.5 text-xs">
                                        <Star className="h-3 w-3 text-primary fill-primary" />
                                        {item.rating}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <Button
                                  size="sm"
                                  className="mt-3 gap-1.5 w-full"
                                  onClick={(e) => { e.stopPropagation(); handleFetchDetails(item); }}
                                  disabled={loadingDetails}
                                >
                                  {loadingDetails ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                  {loadingDetails ? (isAr ? "جاري التحليل..." : "Analyzing...") : (isAr ? "تحليل واستيراد" : "Analyze & Import")}
                                </Button>
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

      {/* ─── Loading overlay ─── */}
      {loadingDetails && step !== "results" && (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <Sparkles className="h-5 w-5 text-primary absolute -top-1 -end-1 animate-pulse" />
              </div>
              <div>
                <p className="font-semibold text-lg">{isAr ? "جاري التحليل..." : "Analyzing..."}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isAr ? "جمع البيانات من مصادر متعددة وتحليلها بالذكاء الاصطناعي" : "Collecting from multiple sources and enriching with AI"}
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
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{details.name_en || details.name_ar}</h2>
                    {details.name_en && details.name_ar && (
                      <p className="text-sm text-muted-foreground">{details.name_ar}</p>
                    )}
                  </div>
                  {details.rating && (
                    <Badge variant="secondary" className="gap-1 ms-2">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      {details.rating}
                      {details.total_reviews != null && <span className="text-muted-foreground">({details.total_reviews})</span>}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <SourceBadge active={!!sourcesUsed.scrape} label={isAr ? "محتوى" : "Scraped"} icon={CheckCircle} />
                  <SourceBadge active={!!sourcesUsed.web_search} label={isAr ? "ويب" : "Web"} icon={Globe} />
                  <SourceBadge active={!!sourcesUsed.website} label={isAr ? "موقع" : "Website"} icon={ExternalLink} />
                  <SourceBadge active={!!sourcesUsed.ai} label="AI" icon={Sparkles} />
                </div>
              </div>
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
                      {(details.country_en || details.country_ar) && (
                        <div className="text-center p-3 rounded-lg bg-accent/30">
                          <Globe className="h-4 w-4 mx-auto text-primary mb-1" />
                          <p className="text-xs text-muted-foreground">{isAr ? "الدولة" : "Country"}</p>
                          <p className="text-sm font-medium truncate">{details.country_en || details.country_ar} {details.country_code && `(${details.country_code})`}</p>
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
                      <MapPin className="h-8 w-8 text-primary" />
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
    </div>
  );
}
