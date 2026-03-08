import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Loader2,
  MapPin,
  Globe,
  Phone,
  Clock,
  Building2,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export interface ImportedData {
  name_en?: string;
  name_ar?: string;
  abbreviation_en?: string;
  abbreviation_ar?: string;
  description_en?: string;
  description_ar?: string;
  mission_en?: string;
  mission_ar?: string;
  city_en?: string;
  city_ar?: string;
  neighborhood_en?: string;
  neighborhood_ar?: string;
  street_en?: string;
  street_ar?: string;
  full_address_en?: string;
  full_address_ar?: string;
  postal_code?: string;
  country_en?: string;
  country_ar?: string;
  country_code?: string;
  phone?: string;
  phone_secondary?: string;
  fax?: string;
  email?: string;
  website?: string;
  business_hours?: {
    day_en: string;
    day_ar: string;
    open: string;
    close: string;
    is_closed: boolean;
  }[];
  business_type_en?: string;
  business_type_ar?: string;
  rating?: number;
  total_reviews?: number;
  latitude?: number;
  longitude?: number;
  google_maps_url?: string;
  national_id?: string;
  registration_number?: string;
  license_number?: string;
  founded_year?: number;
  president_name_en?: string;
  president_name_ar?: string;
  secretary_name_en?: string;
  secretary_name_ar?: string;
  member_count?: number;
  services_en?: string[];
  services_ar?: string[];
  specializations_en?: string[];
  specializations_ar?: string[];
  affiliated_organizations?: string[];
  tags?: string[];
  social_media?: Record<string, string>;
  logo_url?: string;
  cover_url?: string;
  // Exhibition/Conference fields
  venue_en?: string;
  venue_ar?: string;
  start_date?: string;
  end_date?: string;
  registration_url?: string;
  registration_deadline?: string;
  max_attendees?: number;
  organizer_name_en?: string;
  organizer_name_ar?: string;
  organizer_logo_url?: string;
  organizer_website?: string;
  organizer_email?: string;
  organizer_phone?: string;
  map_url?: string;
  ticket_price?: string;
  is_free?: boolean;
  is_virtual?: boolean;
  virtual_link?: string;
  target_audience?: string[];
  // Competition fields
  registration_fee?: number;
  rules_summary_en?: string;
  rules_summary_ar?: string;
  edition_year?: number;
  // Extended competition fields from PDF/website import
  competition_type?: string;
  competition_versions?: { name: string; name_ar?: string; description?: string; description_ar?: string; max_participants?: number }[];
  judging_criteria?: { criterion: string; criterion_ar?: string; weight?: number; description?: string; description_ar?: string }[];
  judging_committee?: { name: string; name_ar?: string; title?: string; title_ar?: string; role?: string; photo_url?: string }[];
  terms_conditions_en?: string;
  terms_conditions_ar?: string;
  eligibility_en?: string;
  eligibility_ar?: string;
  participation_requirements_en?: string[];
  participation_requirements_ar?: string[];
  prizes?: { place: string; place_ar?: string; prize: string; prize_ar?: string; value?: number }[];
  competition_schedule?: { time: string; date?: string; activity: string; activity_ar?: string }[];
  scoring_method_en?: string;
  scoring_method_ar?: string;
  max_team_size?: number;
  min_team_size?: number;
  allowed_entry_types?: string[];
  blind_judging?: boolean;
  competition_rounds?: { name: string; name_ar?: string; description?: string; description_ar?: string; duration?: string }[];
  age_restrictions?: string;
  dress_code?: string;
  dress_code_ar?: string;
  equipment_provided?: string[];
  equipment_required?: string[];
  // Enhanced exhibition fields
  description_short_en?: string;
  description_short_ar?: string;
  description_long_en?: string;
  description_long_ar?: string;
  activities_en?: string[];
  activities_ar?: string[];
  reasons_to_attend?: { reason: string; reason_ar: string }[];
  unique_features?: { feature: string; feature_ar: string }[];
  targeted_sectors?: string[];
  categories?: string[];
  highlights?: { label: string; label_ar: string; value: string }[];
  edition_stats?: Record<string, any>;
  entry_details?: Record<string, any>;
  venue_details?: Record<string, any>;
  sponsors?: { name: string; name_ar?: string; tier?: string; logo_url?: string; website_url?: string }[];
  speakers?: { name: string; name_ar?: string; title?: string; title_ar?: string; photo_url?: string }[];
  schedule_items?: { time: string; title: string; title_ar?: string; description?: string; description_ar?: string }[];
  gallery_urls?: string[];
  includes_competitions?: boolean;
  includes_seminars?: boolean;
  includes_training?: boolean;
  currency?: string;
  early_bird_deadline?: string;
}

interface SmartImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ImportedData) => void;
  entityType?: "entity" | "company" | "establishment" | "competition" | "exhibition";
}

export function SmartImportDialog({
  open,
  onOpenChange,
  onImport,
  entityType = "company",
}: SmartImportDialogProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportedData | null>(null);
  const [sourcesUsed, setSourcesUsed] = useState<Record<string, boolean>>({});

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);

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
      toast({
        title: isAr ? "خطأ في الاستيراد" : "Import Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseData = () => {
    if (result) {
      onImport(result);
      onOpenChange(false);
      toast({
        title: isAr ? "تم استيراد البيانات" : "Data Imported",
        description: isAr
          ? "تم تعبئة النموذج بالبيانات المستوردة"
          : "Form has been pre-filled with imported data",
      });
    }
  };

  const entityLabel = isAr
    ? entityType === "entity" ? "الكيان" : entityType === "company" ? "الشركة" : entityType === "competition" ? "المسابقة" : entityType === "exhibition" ? "المعرض" : "المنشأة"
    : entityType === "entity" ? "entity" : entityType === "company" ? "company" : entityType === "competition" ? "competition" : entityType === "exhibition" ? "exhibition" : "establishment";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {isAr ? "استيراد ذكي" : "Smart Import"}
          </DialogTitle>
          <DialogDescription>
            {isAr
              ? `ابحث عن ${entityLabel} واستورد بياناتها تلقائياً من جوجل والموقع الإلكتروني`
              : `Search for a ${entityLabel} and auto-import its data from Google & website`}
          </DialogDescription>
        </DialogHeader>

        {/* Search Form */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm">{isAr ? "اسم الكيان / الشركة" : "Entity / Company Name"}</Label>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="ps-9"
                placeholder={isAr ? "مثال: مطعم الريف، فندق هيلتون..." : "e.g. Al Reef Restaurant, Hilton Hotel..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">{isAr ? "المدينة / الدولة (اختياري)" : "City / Country (optional)"}</Label>
              <div className="relative">
                <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="ps-9"
                  placeholder={isAr ? "الرياض، السعودية" : "Riyadh, Saudi Arabia"}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{isAr ? "الموقع الإلكتروني (اختياري)" : "Website URL (optional)"}</Label>
              <div className="relative">
                <Globe className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="ps-9"
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSearch} disabled={loading || !query.trim()} className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading
              ? isAr ? "جاري البحث والتحليل..." : "Searching & analyzing..."
              : isAr ? "بحث واستيراد" : "Search & Import"}
          </Button>
        </div>

        {/* Results */}
        {result && (
          <>
            <Separator />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{isAr ? "المصادر:" : "Sources:"}</span>
              {sourcesUsed.scrape && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <CheckCircle className="h-3 w-3" /> Scraped
                </Badge>
              )}
              {sourcesUsed.web_search && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <CheckCircle className="h-3 w-3" /> Web
                </Badge>
              )}
              {sourcesUsed.website && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <CheckCircle className="h-3 w-3" /> Website
                </Badge>
              )}
              {sourcesUsed.ai && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Sparkles className="h-3 w-3" /> AI
                </Badge>
              )}
            </div>

            <ScrollArea className="max-h-[40vh]">
              <div className="space-y-4 pe-2">
                {/* Name */}
                <div className="grid grid-cols-2 gap-3">
                  <DataField label={isAr ? "الاسم (إنجليزي)" : "Name (EN)"} value={result.name_en} />
                  <DataField label={isAr ? "الاسم (عربي)" : "Name (AR)"} value={result.name_ar} />
                </div>

                {/* Description */}
                <div className="grid grid-cols-2 gap-3">
                  <DataField label={isAr ? "الوصف (إنجليزي)" : "Description (EN)"} value={result.description_en} multiline />
                  <DataField label={isAr ? "الوصف (عربي)" : "Description (AR)"} value={result.description_ar} multiline />
                </div>

                {/* Address */}
                <div className="rounded-xl border p-3 space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {isAr ? "العنوان" : "Address"}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <DataField label={isAr ? "المدينة" : "City"} value={`${result.city_en || ''} / ${result.city_ar || ''}`} />
                    <DataField label={isAr ? "الحي" : "Neighborhood"} value={`${result.neighborhood_en || ''} / ${result.neighborhood_ar || ''}`} />
                    <DataField label={isAr ? "الشارع" : "Street"} value={`${result.street_en || ''} / ${result.street_ar || ''}`} />
                    <DataField label={isAr ? "الرمز البريدي" : "Postal Code"} value={result.postal_code} />
                    <DataField label={isAr ? "الدولة" : "Country"} value={`${result.country_en || ''} (${result.country_code || ''})`} />
                  </div>
                  <DataField label={isAr ? "العنوان الكامل" : "Full Address"} value={`${result.full_address_en || ''}\n${result.full_address_ar || ''}`} multiline />
                </div>

                {/* Contact */}
                <div className="rounded-xl border p-3 space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {isAr ? "التواصل" : "Contact"}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <DataField label={isAr ? "الهاتف" : "Phone"} value={result.phone} />
                    <DataField label={isAr ? "هاتف ثانوي" : "Secondary Phone"} value={result.phone_secondary} />
                    <DataField label={isAr ? "البريد" : "Email"} value={result.email} />
                    <DataField label={isAr ? "الموقع" : "Website"} value={result.website} />
                  </div>
                </div>

                {/* Business Hours */}
                {result.business_hours?.length ? (
                  <div className="rounded-xl border p-3 space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {isAr ? "ساعات العمل" : "Business Hours"}
                    </h4>
                    <div className="space-y-1">
                      {result.business_hours.map((h, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span>{isAr ? h.day_ar : h.day_en}</span>
                          <span className={h.is_closed ? "text-muted-foreground" : ""}>
                            {h.is_closed ? (isAr ? "مغلق" : "Closed") : `${h.open} - ${h.close}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Extra */}
                <div className="grid grid-cols-2 gap-2">
                  <DataField label={isAr ? "نوع النشاط" : "Business Type"} value={`${result.business_type_en || ''} / ${result.business_type_ar || ''}`} />
                  <DataField label={isAr ? "الرقم الوطني / السجل" : "National ID / Registration"} value={result.national_id} />
                  {result.rating && (
                    <DataField label={isAr ? "التقييم" : "Rating"} value={`${result.rating} ⭐ (${result.total_reviews || 0})`} />
                  )}
                  {result.google_maps_url && (
                    <DataField label="Google Maps" value={result.google_maps_url} />
                  )}
                </div>

                {/* Social Media */}
                {result.social_media && Object.values(result.social_media).some(Boolean) && (
                  <div className="rounded-xl border p-3 space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {isAr ? "وسائل التواصل" : "Social Media"}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(result.social_media).filter(([, v]) => v).map(([k, v]) => (
                        <DataField key={k} label={k} value={v} />
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DataField({ label, value, multiline }: { label: string; value?: string | null; multiline?: boolean }) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] font-medium text-muted-foreground uppercase">{label}</span>
      {multiline ? (
        <p className="text-xs whitespace-pre-line">{value}</p>
      ) : (
        <p className="text-xs truncate" title={value}>{value}</p>
      )}
    </div>
  );
}
