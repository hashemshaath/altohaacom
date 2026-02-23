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
import { GoogleMapEmbed } from "@/components/smart-import/GoogleMapEmbed";
import type { ImportedData } from "@/components/smart-import/SmartImportDialog";
import {
  Search, Loader2, MapPin, Globe, Phone, Clock,
  Sparkles, CheckCircle, AlertCircle, Star, Share2, Building2,
} from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportedData | null>(null);
  const [sourcesUsed, setSourcesUsed] = useState<Record<string, boolean>>({});
  const [searchedQuery, setSearchedQuery] = useState("");
  const [searchedLocation, setSearchedLocation] = useState("");

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setSourcesUsed({});
    setSearchedQuery(query.trim());
    setSearchedLocation(location.trim());

    try {
      const { data, error } = await supabase.functions.invoke("smart-import", {
        body: {
          query: query.trim(),
          location: location.trim() || undefined,
          website_url: websiteUrl.trim() || undefined,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Import failed");

      setResult(data.data);
      setSourcesUsed(data.sources_used || {});
    } catch (err: any) {
      toast({ title: isAr ? "خطأ في الاستيراد" : "Import Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [query, location, websiteUrl, isAr]);

  const hasResult = result && (result.name_en || result.name_ar);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          {isAr ? "الاستيراد الذكي" : "Smart Import"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isAr
            ? "ابحث عن أي كيان أو شركة كما في خرائط جوجل واستورد بياناتها تلقائياً"
            : "Search any entity or company like Google Maps and auto-import its data"}
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
                placeholder={isAr ? "مثال: مطعم الريف، فندق هيلتون، شركة أرامكو..." : "e.g. Al Reef Restaurant, Hilton Hotel, Aramco..."}
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
          <Button onClick={handleSearch} disabled={loading || !query.trim()} className="w-full gap-2 h-11">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? (isAr ? "جاري البحث من جميع المصادر..." : "Fetching from all sources...") : (isAr ? "بحث واستيراد" : "Search & Import")}
          </Button>
        </CardContent>
      </Card>

      {/* Map — shows immediately when searching */}
      {(searchedQuery || loading) && (
        <GoogleMapEmbed
          latitude={result?.latitude}
          longitude={result?.longitude}
          name={result?.name_en}
          searchQuery={searchedQuery}
          location={searchedLocation}
          className="h-[400px]"
        />
      )}

      {/* Loading skeleton */}
      {loading && (
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

      {/* Results */}
      {hasResult && !loading && (
        <div className="space-y-4">
          {/* Source badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{isAr ? "المصادر:" : "Sources:"}</span>
            {sourcesUsed.google_places ? (
              <Badge variant="secondary" className="gap-1 text-xs"><CheckCircle className="h-3 w-3" /> Google Places</Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-xs text-muted-foreground"><AlertCircle className="h-3 w-3" /> {isAr ? "جوجل غير مفعل" : "Google Places N/A"}</Badge>
            )}
            {sourcesUsed.firecrawl_search && (
              <Badge variant="secondary" className="gap-1 text-xs"><CheckCircle className="h-3 w-3" /> {isAr ? "بحث الويب" : "Web Search"}</Badge>
            )}
            {sourcesUsed.website && (
              <Badge variant="secondary" className="gap-1 text-xs"><CheckCircle className="h-3 w-3" /> {isAr ? "الموقع" : "Website"}</Badge>
            )}
            {sourcesUsed.ai && (
              <Badge variant="secondary" className="gap-1 text-xs"><Sparkles className="h-3 w-3 text-primary" /> AI</Badge>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Name & Type */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary shrink-0" />
                      <h2 className="text-lg font-bold">{result.name_en}</h2>
                    </div>
                    {result.name_ar && <p className="text-base text-muted-foreground font-medium mt-0.5">{result.name_ar}</p>}
                  </div>
                  {result.rating && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-4 w-4 text-primary fill-primary" />
                      <span className="font-semibold text-sm">{result.rating}</span>
                      {result.total_reviews && <span className="text-xs text-muted-foreground">({result.total_reviews})</span>}
                    </div>
                  )}
                </div>
                {(result.business_type_en || result.business_type_ar) && (
                  <div className="flex gap-2 flex-wrap">
                    {result.business_type_en && <Badge variant="outline">{result.business_type_en}</Badge>}
                    {result.business_type_ar && <Badge variant="outline">{result.business_type_ar}</Badge>}
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
                  <DataField label={isAr ? "الهاتف" : "Phone"} value={result.phone} />
                  <DataField label={isAr ? "هاتف ثانوي" : "Secondary"} value={result.phone_secondary} />
                  <DataField label={isAr ? "البريد" : "Email"} value={result.email} />
                  <DataField label={isAr ? "الموقع" : "Website"} value={result.website} />
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {(result.description_en || result.description_ar) && (
              <Card className="lg:col-span-2">
                <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DataField label={isAr ? "الوصف (EN)" : "Description (EN)"} value={result.description_en} multiline />
                  <DataField label={isAr ? "الوصف (AR)" : "Description (AR)"} value={result.description_ar} multiline />
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
                  <DataField label={isAr ? "المدينة (EN)" : "City (EN)"} value={result.city_en} />
                  <DataField label={isAr ? "المدينة (AR)" : "City (AR)"} value={result.city_ar} />
                  <DataField label={isAr ? "الحي" : "Neighborhood"} value={result.neighborhood_en || result.neighborhood_ar} />
                  <DataField label={isAr ? "الشارع" : "Street"} value={result.street_en || result.street_ar} />
                  <DataField label={isAr ? "الرمز البريدي" : "Postal Code"} value={result.postal_code} />
                  <DataField label={isAr ? "الدولة" : "Country"} value={result.country_en ? `${result.country_en} (${result.country_code || ''})` : result.country_ar} />
                </div>
                {(result.full_address_en || result.full_address_ar) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DataField label={isAr ? "العنوان الكامل (EN)" : "Full Address (EN)"} value={result.full_address_en} />
                      <DataField label={isAr ? "العنوان الكامل (AR)" : "Full Address (AR)"} value={result.full_address_ar} />
                    </div>
                  </>
                )}
                {result.national_id && <DataField label={isAr ? "السجل التجاري" : "Registration ID"} value={result.national_id} />}
              </CardContent>
            </Card>

            {/* Business Hours */}
            {result.business_hours && result.business_hours.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5"><Clock className="h-4 w-4" /> {isAr ? "ساعات العمل" : "Business Hours"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {result.business_hours.map((h, i) => (
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
            {result.social_media && Object.values(result.social_media).some(Boolean) && (
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5"><Share2 className="h-4 w-4" /> {isAr ? "وسائل التواصل" : "Social Media"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(result.social_media).filter(([, v]) => v).map(([k, v]) => (
                      <DataField key={k} label={k} value={v} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Google Maps link */}
          {result.google_maps_url && (
            <a href={result.google_maps_url} target="_blank" rel="noopener noreferrer">
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
