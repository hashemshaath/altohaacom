import { useState, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GoogleMapEmbed } from "@/components/smart-import/GoogleMapEmbed";
import type { ImportedData } from "@/components/smart-import/SmartImportDialog";
import {
  Search, Loader2, MapPin, Globe, Phone, Clock,
  Sparkles, CheckCircle, AlertCircle, Star, Share2, Building2, Download,
} from "lucide-react";

interface SearchResultItem {
  place_id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  total_reviews: number | null;
  types: string[];
  business_status: string | null;
  google_maps_url: string | null;
}

const DataField = ({ label, value, multiline }: { label: string; value?: string | null; multiline?: boolean }) => {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      {multiline ? (
        <p className="text-xs whitespace-pre-line leading-relaxed">{value}</p>
      ) : (
        <p className="text-sm truncate" title={value}>{value}</p>
      )}
    </div>
  );
};

export default function SmartImportAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Step 1: Search results
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResultItem | null>(null);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [searchedLocation, setSearchedLocation] = useState("");

  // Step 2: Details
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [details, setDetails] = useState<ImportedData | null>(null);
  const [sourcesUsed, setSourcesUsed] = useState<Record<string, boolean>>({});

  // Step 1: Search for entities
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
      if (!data.results?.length) {
        toast({ title: isAr ? "لا توجد نتائج" : "No Results", description: isAr ? "جرب كلمات بحث مختلفة" : "Try different search terms", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: isAr ? "خطأ في البحث" : "Search Error", description: err.message, variant: "destructive" });
    } finally {
      setSearching(false);
    }
  }, [query, location, isAr]);

  // Step 2: Fetch full details for selected entity
  const handleFetchDetails = useCallback(async (item: SearchResultItem) => {
    setSelectedResult(item);
    setLoadingDetails(true);
    setDetails(null);

    try {
      const { data, error } = await supabase.functions.invoke("smart-import", {
        body: {
          query: item.name,
          location: location.trim() || undefined,
          website_url: websiteUrl.trim() || undefined,
          mode: "details",
          place_id: item.place_id,
          google_maps_url: (item as any).google_maps_url || undefined,
          latitude: item.latitude || undefined,
          longitude: item.longitude || undefined,
        },
      });
      if (error) throw new Error(typeof error === 'object' && error.message ? error.message : String(error));
      if (!data?.success) throw new Error(data?.error || "Failed to fetch details");

      setDetails(data.data);
      setSourcesUsed(data.sources_used || {});
      toast({ title: isAr ? "تم استيراد البيانات" : "Data Imported", description: data.data?.name_en || data.data?.name_ar || item.name });
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoadingDetails(false);
    }
  }, [location, websiteUrl, isAr]);

  const hasDetails = details && (details.name_en || details.name_ar);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          {isAr ? "الاستيراد الذكي" : "Smart Import"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isAr ? "ابحث عن أي كيان كما في خرائط جوجل ثم اختر لاستيراد بياناته" : "Search like Google Maps, select an entity, then import its data"}
        </p>
      </div>

      {/* Search Card */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>{isAr ? "اسم الكيان / الشركة" : "Entity / Company Name"}</Label>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{isAr ? "المدينة / الدولة" : "City / Country"}</Label>
              <div className="relative">
                <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="ps-9" placeholder={isAr ? "الرياض، السعودية" : "Riyadh, Saudi Arabia"} value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? "الموقع الإلكتروني (اختياري)" : "Website URL (optional)"}</Label>
              <div className="relative">
                <Globe className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="ps-9" placeholder="https://example.com" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
              </div>
            </div>
          </div>
          <Button onClick={handleSearch} disabled={searching || !query.trim()} className="w-full gap-2 h-11">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {searching ? (isAr ? "جاري البحث..." : "Searching...") : (isAr ? "بحث" : "Search")}
          </Button>
        </CardContent>
      </Card>

      {/* Search Results + Map */}
      {(searchResults.length > 0 || searching) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Results List */}
          <Card className="lg:order-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {isAr ? `النتائج (${searchResults.length})` : `Results (${searchResults.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {searching ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="space-y-2 p-3 border rounded-lg">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y">
                    {searchResults.map((item) => {
                      const isSelected = selectedResult?.place_id === item.place_id;
                      return (
                        <button
                          key={item.place_id}
                          className={`w-full text-start p-3 hover:bg-accent/50 transition-colors ${isSelected ? 'bg-accent border-s-2 border-primary' : ''}`}
                          onClick={() => {
                            setSelectedResult(item);
                            setDetails(null);
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{item.address}</p>
                            </div>
                            {item.rating && (
                              <div className="flex items-center gap-0.5 shrink-0">
                                <Star className="h-3 w-3 text-primary fill-primary" />
                                <span className="text-xs font-medium">{item.rating}</span>
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <Button
                              size="sm"
                              className="mt-2 gap-1.5 w-full"
                              onClick={(e) => { e.stopPropagation(); handleFetchDetails(item); }}
                              disabled={loadingDetails}
                            >
                              {loadingDetails ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                              {loadingDetails ? (isAr ? "جاري الاستيراد..." : "Importing...") : (isAr ? "استيراد البيانات" : "Import Data")}
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

          {/* Map */}
          <div className="lg:order-2">
            <GoogleMapEmbed
              latitude={selectedResult?.latitude}
              longitude={selectedResult?.longitude}
              name={selectedResult?.name}
              searchQuery={!selectedResult ? searchedQuery : undefined}
              location={!selectedResult ? searchedLocation : undefined}
              className="h-[450px]"
            />
          </div>
        </div>
      )}

      {/* Loading details skeleton */}
      {loadingDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detailed Results */}
      {hasDetails && !loadingDetails && (
        <div className="space-y-4">
          {/* Source badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{isAr ? "المصادر:" : "Sources:"}</span>
            {sourcesUsed.google_maps_scrape ? (
              <Badge variant="secondary" className="gap-1 text-xs"><CheckCircle className="h-3 w-3" /> Google Maps</Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-xs text-muted-foreground"><AlertCircle className="h-3 w-3" /> Google Maps N/A</Badge>
            )}
            {sourcesUsed.firecrawl_search && <Badge variant="secondary" className="gap-1 text-xs"><CheckCircle className="h-3 w-3" /> Web</Badge>}
            {sourcesUsed.website && <Badge variant="secondary" className="gap-1 text-xs"><CheckCircle className="h-3 w-3" /> Website</Badge>}
            {sourcesUsed.ai && <Badge variant="secondary" className="gap-1 text-xs"><Sparkles className="h-3 w-3 text-primary" /> AI</Badge>}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Name & Type */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary shrink-0" />
                      <h2 className="text-lg font-bold">{details.name_en}</h2>
                    </div>
                    {details.name_ar && <p className="text-base text-muted-foreground font-medium mt-0.5">{details.name_ar}</p>}
                  </div>
                  {details.rating && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-4 w-4 text-primary fill-primary" />
                      <span className="font-semibold text-sm">{details.rating}</span>
                      {details.total_reviews && <span className="text-xs text-muted-foreground">({details.total_reviews})</span>}
                    </div>
                  )}
                </div>
                {(details.business_type_en || details.business_type_ar) && (
                  <div className="flex gap-2 flex-wrap">
                    {details.business_type_en && <Badge variant="outline">{details.business_type_en}</Badge>}
                    {details.business_type_ar && <Badge variant="outline">{details.business_type_ar}</Badge>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5"><Phone className="h-4 w-4" /> {isAr ? "التواصل" : "Contact"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <DataField label={isAr ? "الهاتف" : "Phone"} value={details.phone} />
                  <DataField label={isAr ? "هاتف ثانوي" : "Secondary"} value={details.phone_secondary} />
                  <DataField label={isAr ? "البريد" : "Email"} value={details.email} />
                  <DataField label={isAr ? "الموقع" : "Website"} value={details.website} />
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {(details.description_en || details.description_ar) && (
              <Card className="lg:col-span-2">
                <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DataField label="Description (EN)" value={details.description_en} multiline />
                  <DataField label="Description (AR)" value={details.description_ar} multiline />
                </CardContent>
              </Card>
            )}

            {/* Address */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {isAr ? "العنوان" : "Address"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <DataField label="City (EN)" value={details.city_en} />
                  <DataField label="City (AR)" value={details.city_ar} />
                  <DataField label="Neighborhood" value={details.neighborhood_en || details.neighborhood_ar} />
                  <DataField label="Street" value={details.street_en || details.street_ar} />
                  <DataField label="Postal Code" value={details.postal_code} />
                  <DataField label="Country" value={details.country_en ? `${details.country_en} (${details.country_code || ''})` : details.country_ar} />
                </div>
                {(details.full_address_en || details.full_address_ar) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DataField label="Full Address (EN)" value={details.full_address_en} />
                      <DataField label="Full Address (AR)" value={details.full_address_ar} />
                    </div>
                  </>
                )}
                {details.national_id && <DataField label={isAr ? "السجل التجاري" : "Registration ID"} value={details.national_id} />}
              </CardContent>
            </Card>

            {/* Business Hours */}
            {details.business_hours && details.business_hours.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5"><Clock className="h-4 w-4" /> {isAr ? "ساعات العمل" : "Business Hours"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {details.business_hours.map((h, i) => (
                      <div key={i} className="flex justify-between text-xs rounded-lg border p-2">
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

            {/* Social Media */}
            {details.social_media && Object.values(details.social_media).some(Boolean) && (
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5"><Share2 className="h-4 w-4" /> {isAr ? "التواصل الاجتماعي" : "Social Media"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(details.social_media).filter(([, v]) => v).map(([k, v]) => (
                      <DataField key={k} label={k} value={v} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {details.google_maps_url && (
            <a href={details.google_maps_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <MapPin className="h-4 w-4" />
                {isAr ? "فتح في خرائط جوجل" : "Open in Google Maps"}
              </Button>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
