import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Loader2, MapPin, Globe, Phone, Clock, Star,
  Building2, Sparkles, CheckCircle, ArrowRight, X, ExternalLink,
  Mail, FileText, Tag,
} from "lucide-react";
import type { ImportedData } from "./SmartImportDialog";
import { SOURCE_CHANNELS } from "./types";

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

interface InlineSmartImportProps {
  onImport: (data: ImportedData) => void;
  onClose: () => void;
}

type Phase = "search" | "results" | "loading-details" | "details";

export function InlineSmartImport({ onImport, onClose }: InlineSmartImportProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [phase, setPhase] = useState<Phase>("search");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResultItem | null>(null);
  const [detailData, setDetailData] = useState<ImportedData | null>(null);
  const [sourcesUsed, setSourcesUsed] = useState<Record<string, boolean>>({});
  const [dataQuality, setDataQuality] = useState(0);
  const [searchTime, setSearchTime] = useState(0);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    setPhase("search");
    const start = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke("smart-import", {
        body: { query: query.trim(), location: location.trim() || undefined, mode: "search" },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Search failed");

      setResults(data.results || []);
      setSearchTime(Date.now() - start);
      setPhase("results");
    } catch (err: any) {
      toast({
        title: isAr ? "خطأ في البحث" : "Search Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = async (item: SearchResultItem) => {
    setSelectedResult(item);
    setPhase("loading-details");

    try {
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
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Details fetch failed");

      setDetailData(data.data);
      setSourcesUsed(data.sources_used || {});
      setDataQuality(data.data_quality || 0);
      setPhase("details");
    } catch (err: any) {
      toast({
        title: isAr ? "خطأ في جلب التفاصيل" : "Details Error",
        description: err.message,
        variant: "destructive",
      });
      setPhase("results");
    }
  };

  const handleUseData = () => {
    if (detailData) {
      onImport(detailData);
      toast({
        title: isAr ? "تم استيراد البيانات" : "Data Imported",
        description: isAr ? "تم تعبئة النموذج بالبيانات المستوردة" : "Form has been pre-filled with imported data",
      });
    }
  };

  const goBackToResults = () => {
    setSelectedResult(null);
    setDetailData(null);
    setPhase("results");
  };

  const qualityColor = dataQuality >= 70 ? "text-green-600" : dataQuality >= 40 ? "text-yellow-600" : "text-red-500";

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.02] to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-primary" />
            {isAr ? "استيراد ذكي" : "Smart Import"}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {isAr
            ? "ابحث عن جهة واستورد بياناتها تلقائياً من جوجل والمواقع الإلكترونية"
            : "Search for an entity and auto-import its data from Google & websites"}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Form */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="ps-9"
              placeholder={isAr ? "اسم الجهة أو الشركة..." : "Entity or company name..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="relative sm:w-48">
            <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="ps-9"
              placeholder={isAr ? "المدينة (اختياري)" : "City (optional)"}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={searching || !query.trim()} className="gap-2 shrink-0">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {isAr ? "بحث" : "Search"}
          </Button>
        </div>

        {/* Loading state */}
        {searching && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 p-3 rounded-xl border">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results list */}
        {phase === "results" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {results.length} {isAr ? "نتيجة" : "results"} • {(searchTime / 1000).toFixed(1)}s
              </span>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">{isAr ? "لم يتم العثور على نتائج" : "No results found"}</p>
                <p className="text-xs mt-1">{isAr ? "جرب كلمات بحث مختلفة" : "Try different search terms"}</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-1.5 pe-2">
                  {results.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectResult(item)}
                      className="w-full flex items-start gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/[0.03] transition-all text-start group"
                    >
                      <div className="h-9 w-9 rounded-xl bg-muted/80 flex items-center justify-center shrink-0">
                        {item.place_type?.toLowerCase().includes("restaurant") ? (
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {item.rating && (
                            <span className="text-xs flex items-center gap-0.5 text-yellow-600">
                              <Star className="h-3 w-3 fill-current" /> {item.rating}
                              {item.total_reviews && <span className="text-muted-foreground">({item.total_reviews})</span>}
                            </span>
                          )}
                          {item.place_type && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                              {item.place_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary shrink-0 mt-1 transition-colors" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Loading details */}
        {phase === "loading-details" && selectedResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>
                {isAr ? `جاري تحليل "${selectedResult.name}"...` : `Analyzing "${selectedResult.name}"...`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2 p-3 rounded-xl border">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detail view */}
        {phase === "details" && detailData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={goBackToResults} className="gap-1 text-xs">
                ← {isAr ? "العودة للنتائج" : "Back to results"}
              </Button>
              <div className="flex items-center gap-2">
                {/* Sources */}
                <div className="flex items-center gap-1">
                  {Object.entries(sourcesUsed).filter(([, v]) => v).map(([key]) => {
                    const ch = SOURCE_CHANNELS[key as keyof typeof SOURCE_CHANNELS];
                    if (!ch) return null;
                    const Icon = ch.icon;
                    return (
                      <Badge key={key} variant="outline" className={`text-[10px] gap-0.5 px-1.5 py-0 h-5 ${ch.color}`}>
                        <Icon className="h-2.5 w-2.5" />
                        {isAr ? ch.label_ar : ch.label_en}
                      </Badge>
                    );
                  })}
                </div>
                {/* Quality */}
                <Badge variant="outline" className={`text-[10px] ${qualityColor}`}>
                  {dataQuality}%
                </Badge>
              </div>
            </div>

            <ScrollArea className="max-h-[420px]">
              <div className="space-y-3 pe-2">
                {/* Names */}
                <div className="grid grid-cols-2 gap-2">
                  <DetailField icon={Building2} label={isAr ? "الاسم (EN)" : "Name (EN)"} value={detailData.name_en} />
                  <DetailField icon={Building2} label={isAr ? "الاسم (AR)" : "Name (AR)"} value={detailData.name_ar} />
                </div>

                {/* Descriptions */}
                {(detailData.description_en || detailData.description_ar) && (
                  <div className="grid grid-cols-2 gap-2">
                    <DetailField icon={FileText} label={isAr ? "الوصف (EN)" : "Description (EN)"} value={detailData.description_en} multiline />
                    <DetailField icon={FileText} label={isAr ? "الوصف (AR)" : "Description (AR)"} value={detailData.description_ar} multiline />
                  </div>
                )}

                {/* Address */}
                {(detailData.city_en || detailData.full_address_en || detailData.country_en) && (
                  <div className="rounded-xl border p-3 space-y-2">
                    <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
                      <MapPin className="h-3 w-3" /> {isAr ? "العنوان" : "Address"}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <DetailField label={isAr ? "المدينة" : "City"} value={[detailData.city_en, detailData.city_ar].filter(Boolean).join(" / ")} />
                      <DetailField label={isAr ? "الدولة" : "Country"} value={[detailData.country_en, detailData.country_code].filter(Boolean).join(" ")} />
                      <DetailField label={isAr ? "الحي" : "Neighborhood"} value={[detailData.neighborhood_en, detailData.neighborhood_ar].filter(Boolean).join(" / ")} />
                      <DetailField label={isAr ? "الرمز البريدي" : "Postal Code"} value={detailData.postal_code} />
                    </div>
                    {(detailData.full_address_en || detailData.full_address_ar) && (
                      <DetailField label={isAr ? "العنوان الكامل" : "Full Address"} value={[detailData.full_address_en, detailData.full_address_ar].filter(Boolean).join("\n")} multiline />
                    )}
                  </div>
                )}

                {/* Contact */}
                {(detailData.phone || detailData.email || detailData.website) && (
                  <div className="rounded-xl border p-3 space-y-2">
                    <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
                      <Phone className="h-3 w-3" /> {isAr ? "التواصل" : "Contact"}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <DetailField icon={Phone} label={isAr ? "الهاتف" : "Phone"} value={detailData.phone} />
                      <DetailField icon={Phone} label={isAr ? "هاتف ثانوي" : "Secondary"} value={detailData.phone_secondary} />
                      <DetailField icon={Mail} label={isAr ? "البريد" : "Email"} value={detailData.email} />
                      <DetailField icon={Globe} label={isAr ? "الموقع" : "Website"} value={detailData.website} isLink />
                    </div>
                  </div>
                )}

                {/* Business Hours */}
                {detailData.business_hours?.length ? (
                  <div className="rounded-xl border p-3 space-y-2">
                    <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
                      <Clock className="h-3 w-3" /> {isAr ? "ساعات العمل" : "Business Hours"}
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      {detailData.business_hours.map((h, i) => (
                        <div key={i} className="flex justify-between text-xs py-0.5">
                          <span className="text-muted-foreground">{isAr ? h.day_ar : h.day_en}</span>
                          <span className={h.is_closed ? "text-muted-foreground/60" : "font-medium"}>
                            {h.is_closed ? (isAr ? "مغلق" : "Closed") : `${h.open} – ${h.close}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Extra info */}
                <div className="grid grid-cols-2 gap-2">
                  {detailData.rating && (
                    <DetailField icon={Star} label={isAr ? "التقييم" : "Rating"} value={`${detailData.rating} ⭐ (${detailData.total_reviews || 0})`} />
                  )}
                  <DetailField label={isAr ? "نوع النشاط" : "Business Type"} value={[detailData.business_type_en, detailData.business_type_ar].filter(Boolean).join(" / ")} />
                  <DetailField label={isAr ? "سنة التأسيس" : "Founded"} value={detailData.founded_year?.toString()} />
                  <DetailField label={isAr ? "عدد الأعضاء" : "Members"} value={detailData.member_count?.toString()} />
                </div>

                {/* Tags / Services */}
                {(detailData.services_en?.length || detailData.tags?.length) ? (
                  <div className="flex flex-wrap gap-1.5">
                    {detailData.tags?.map((t, i) => (
                      <Badge key={`t${i}`} variant="secondary" className="text-[10px]">
                        <Tag className="h-2.5 w-2.5 me-0.5" />{t}
                      </Badge>
                    ))}
                    {detailData.services_en?.map((s, i) => (
                      <Badge key={`s${i}`} variant="outline" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                ) : null}

                {/* Social Media */}
                {detailData.social_media && Object.values(detailData.social_media).some(Boolean) && (
                  <div className="rounded-xl border p-3 space-y-2">
                    <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
                      <Globe className="h-3 w-3" /> {isAr ? "وسائل التواصل" : "Social Media"}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(detailData.social_media).filter(([, v]) => v).map(([k, v]) => (
                        <DetailField key={k} label={k} value={v} isLink />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <Button onClick={handleUseData} className="w-full gap-2">
              <CheckCircle className="h-4 w-4" />
              {isAr ? "استخدام هذه البيانات" : "Use This Data"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailField({
  icon: Icon,
  label,
  value,
  multiline,
  isLink,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
  multiline?: boolean;
  isLink?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        {Icon && <Icon className="h-2.5 w-2.5" />}
        {label}
      </span>
      {multiline ? (
        <p className="text-xs whitespace-pre-line leading-relaxed">{value}</p>
      ) : isLink ? (
        <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block flex items-center gap-1">
          {value} <ExternalLink className="h-2.5 w-2.5 shrink-0" />
        </a>
      ) : (
        <p className="text-xs truncate" title={value}>{value}</p>
      )}
    </div>
  );
}
