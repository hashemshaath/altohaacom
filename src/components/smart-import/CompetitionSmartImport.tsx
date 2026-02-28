import { useState, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Search, Loader2, MapPin, Globe, Sparkles, CheckCircle, ArrowRight, X,
  ExternalLink, FileText, Trophy, Users, Calendar, Gavel, Award, Upload,
  Link2, Star, Clock, Shield, ListChecks, Target, Layers,
} from "lucide-react";
import type { ImportedData } from "./SmartImportDialog";
import { SOURCE_CHANNELS } from "./types";

interface CompetitionSmartImportProps {
  onImport: (data: ImportedData) => void;
  onClose: () => void;
}

type Phase = "idle" | "searching" | "results" | "loading-details" | "details";
type ImportMode = "search" | "url" | "pdf";

interface SearchResultItem {
  id: string;
  name: string;
  description: string;
  url: string;
  rating: number | null;
  total_reviews: number | null;
  place_type: string | null;
}

export function CompetitionSmartImport({ onImport, onClose }: CompetitionSmartImportProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [mode, setMode] = useState<ImportMode>("search");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [pdfText, setPdfText] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [detailData, setDetailData] = useState<ImportedData | null>(null);
  const [sourcesUsed, setSourcesUsed] = useState<Record<string, boolean>>({});
  const [dataQuality, setDataQuality] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Search for competitions
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setPhase("searching");
    setResults([]);
    const start = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke("smart-import", {
        body: { query: `${query.trim()} culinary competition championship`, location: location.trim() || undefined, mode: "search" },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Search failed");
      setResults(data.results || []);
      setSearchTime(Date.now() - start);
      setPhase("results");
    } catch (err: any) {
      toast({ title: isAr ? "خطأ في البحث" : "Search Error", description: err.message, variant: "destructive" });
      setPhase("idle");
    }
  }, [query, location, isAr]);

  // Get details from search result
  const handleSelectResult = useCallback(async (item: SearchResultItem) => {
    setPhase("loading-details");
    try {
      const { data, error } = await supabase.functions.invoke("smart-import", {
        body: { query: item.name, location: location.trim() || undefined, mode: "details", result_url: item.url || undefined },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Details fetch failed");
      setDetailData(data.data);
      setSourcesUsed(data.sources_used || {});
      setDataQuality(data.data_quality || 0);
      setPhase("details");
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
      setPhase("results");
    }
  }, [location, isAr]);

  // Import from URL
  const handleUrlImport = useCallback(async () => {
    if (!urlInput.trim()) return;
    setPhase("loading-details");
    try {
      const { data, error } = await supabase.functions.invoke("smart-import", {
        body: { url: urlInput.trim(), mode: "url" },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "URL import failed");
      setDetailData(data.data);
      setSourcesUsed(data.sources_used || {});
      setDataQuality(data.data_quality || 0);
      setPhase("details");
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
      setPhase("idle");
    }
  }, [urlInput, isAr]);

  // Import from PDF text (paste or file)
  const handlePdfImport = useCallback(async (textContent: string) => {
    if (!textContent.trim()) return;
    setPhase("loading-details");
    try {
      const { data, error } = await supabase.functions.invoke("smart-import", {
        body: { mode: "competition_text", text_content: textContent.trim() },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Text import failed");
      setDetailData(data.data);
      setSourcesUsed(data.sources_used || {});
      setDataQuality(data.data_quality || 0);
      setPhase("details");
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
      setPhase("idle");
    }
  }, [isAr]);

  // Handle file upload
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
    setUploading(true);
    try {
      const text = await file.text();
      setPdfText(text);
      setUploading(false);
    } catch {
      // For PDF files, read as ArrayBuffer and extract what we can
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        setPdfText(content);
        setUploading(false);
      };
      reader.onerror = () => {
        toast({ title: isAr ? "خطأ" : "Error", description: isAr ? "فشل قراءة الملف" : "Failed to read file", variant: "destructive" });
        setUploading(false);
      };
      reader.readAsText(file);
    }
  }, [isAr]);

  const handleUseData = useCallback(() => {
    if (detailData) {
      onImport(detailData);
      toast({
        title: isAr ? "✅ تم استيراد البيانات" : "✅ Data Imported",
        description: isAr ? "تم تعبئة بيانات المسابقة" : "Competition data has been imported",
      });
    }
  }, [detailData, onImport, isAr]);

  const resetToSearch = () => {
    setPhase("idle");
    setDetailData(null);
    setResults([]);
  };

  const qualityColor = dataQuality >= 70 ? "text-green-600" : dataQuality >= 40 ? "text-chart-4" : "text-destructive";

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.02] to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-primary" />
            {isAr ? "استيراد ذكي للمسابقات" : "Smart Competition Import"}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {isAr
            ? "استخرج بيانات المسابقة من رابط أو بحث أو ملف PDF — بما في ذلك الشروط ولجنة التحكيم والجدول الزمني"
            : "Extract competition data from URL, search, or PDF — including rules, judging committee, and schedule"}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mode Tabs */}
        {(phase === "idle" || phase === "searching" || phase === "results" || phase === "loading-details") && (
          <Tabs value={mode} onValueChange={(v) => { setMode(v as ImportMode); resetToSearch(); }}>
            <TabsList className="w-full">
              <TabsTrigger value="search" className="flex-1 gap-1.5">
                <Search className="h-3.5 w-3.5" />
                {isAr ? "بحث ذكي" : "Smart Search"}
              </TabsTrigger>
              <TabsTrigger value="url" className="flex-1 gap-1.5">
                <Link2 className="h-3.5 w-3.5" />
                {isAr ? "من رابط" : "From URL"}
              </TabsTrigger>
              <TabsTrigger value="pdf" className="flex-1 gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {isAr ? "من ملف / نص" : "From File / Text"}
              </TabsTrigger>
            </TabsList>

            {/* Search Tab */}
            <TabsContent value="search" className="space-y-3 mt-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="ps-9"
                    placeholder={isAr ? "اسم المسابقة أو البطولة..." : "Competition or championship name..."}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <div className="relative sm:w-44">
                  <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="ps-9"
                    placeholder={isAr ? "الدولة (اختياري)" : "Country (optional)"}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} disabled={phase === "searching" || !query.trim()} className="gap-2 shrink-0">
                  {phase === "searching" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {isAr ? "بحث" : "Search"}
                </Button>
              </div>
            </TabsContent>

            {/* URL Tab */}
            <TabsContent value="url" className="space-y-3 mt-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="ps-9"
                    placeholder={isAr ? "رابط موقع المسابقة..." : "Competition website URL..."}
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUrlImport()}
                  />
                </div>
                <Button onClick={handleUrlImport} disabled={phase === "loading-details" || !urlInput.trim()} className="gap-2 shrink-0">
                  {phase === "loading-details" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                  {isAr ? "استخراج" : "Extract"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {isAr ? "يدعم مواقع المسابقات والمعارض وصفحات التسجيل" : "Supports competition websites, exhibition pages, and registration portals"}
              </p>
            </TabsContent>

            {/* PDF/Text Tab */}
            <TabsContent value="pdf" className="space-y-3 mt-3">
              <div className="border-2 border-dashed border-border/60 rounded-lg p-4 text-center space-y-3">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <div>
                  <label htmlFor="comp-file-upload" className="cursor-pointer">
                    <span className="text-sm text-primary hover:underline font-medium">
                      {isAr ? "اختر ملف PDF أو نص" : "Choose a PDF or text file"}
                    </span>
                    <input
                      id="comp-file-upload"
                      type="file"
                      accept=".pdf,.txt,.doc,.docx,.md"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  {pdfFile && (
                    <p className="text-xs text-muted-foreground mt-1">
                      📎 {pdfFile.name} ({(pdfFile.size / 1024).toFixed(0)} KB)
                    </p>
                  )}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {isAr ? "أو الصق النص مباشرة:" : "Or paste text directly:"}
                </p>
                <Textarea
                  value={pdfText}
                  onChange={(e) => setPdfText(e.target.value)}
                  placeholder={isAr
                    ? "الصق محتوى ملف PDF للمسابقة هنا... (الشروط، الأحكام، المواعيد، لجنة التحكيم، إلخ)"
                    : "Paste competition PDF content here... (rules, terms, dates, judging committee, etc.)"}
                  className="min-h-[120px] text-xs font-mono"
                />
              </div>
              <Button
                onClick={() => handlePdfImport(pdfText)}
                disabled={phase === "loading-details" || !pdfText.trim()}
                className="w-full gap-2"
              >
                {phase === "loading-details" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isAr ? "تحليل واستخراج البيانات" : "Analyze & Extract Data"}
              </Button>
            </TabsContent>
          </Tabs>
        )}

        {/* Searching skeleton */}
        {phase === "searching" && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 p-3 rounded-lg border">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
              </div>
            ))}
          </div>
        )}

        {/* Search Results */}
        {phase === "results" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {results.length} {isAr ? "نتيجة" : "results"} • {(searchTime / 1000).toFixed(1)}s
              </span>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={resetToSearch}>
                {isAr ? "بحث جديد" : "New Search"}
              </Button>
            </div>
            {results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">{isAr ? "لم يتم العثور على مسابقات" : "No competitions found"}</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[350px]">
                <div className="space-y-1.5 pe-2">
                  {results.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectResult(item)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-primary/[0.03] transition-all text-start group"
                    >
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Trophy className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        {item.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>}
                        {item.place_type && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 mt-1">{item.place_type}</Badge>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Loading details */}
        {phase === "loading-details" && (
          <div className="space-y-4 py-6">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {isAr ? "جاري تحليل بيانات المسابقة..." : "Analyzing competition data..."}
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {["🔍 Scraping", "🤖 AI Extraction", "📋 Rules", "⚖️ Judging", "📅 Schedule"].map(s => (
                  <Badge key={s} variant="outline" className="text-[10px] animate-pulse">{s}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detail View */}
        {phase === "details" && detailData && (
          <div className="space-y-4">
            {/* Header bar */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={resetToSearch} className="gap-1 text-xs">
                ← {isAr ? "بحث جديد" : "Back"}
              </Button>
              <div className="flex items-center gap-2">
                {Object.entries(sourcesUsed).filter(([, v]) => v).map(([key]) => {
                  const ch = SOURCE_CHANNELS[key as keyof typeof SOURCE_CHANNELS];
                  if (!ch) return null;
                  const Icon = ch.icon;
                  return (
                    <Badge key={key} variant="outline" className={`text-[10px] gap-0.5 px-1.5 py-0 h-5 ${ch.color}`}>
                      <Icon className="h-2.5 w-2.5" />
                    </Badge>
                  );
                })}
                <Badge variant="outline" className={`text-[10px] ${qualityColor}`}>
                  {dataQuality}% {isAr ? "جودة" : "quality"}
                </Badge>
              </div>
            </div>

            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3 pe-2">
                {/* Basic Info */}
                <DetailSection icon={Trophy} title={isAr ? "معلومات المسابقة" : "Competition Info"}>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Name (EN)" value={detailData.name_en} />
                    <Field label="الاسم (AR)" value={detailData.name_ar} />
                  </div>
                  {(detailData.description_en || detailData.description_ar) && (
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Description (EN)" value={detailData.description_en} multi />
                      <Field label="الوصف (AR)" value={detailData.description_ar} multi />
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <Field label={isAr ? "السنة" : "Edition Year"} value={detailData.edition_year?.toString()} />
                    <Field label={isAr ? "النوع" : "Type"} value={detailData.competition_type} />
                    <Field label={isAr ? "رسوم التسجيل" : "Reg. Fee"} value={detailData.registration_fee ? `${detailData.registration_fee} ${detailData.currency || ""}` : null} />
                  </div>
                </DetailSection>

                {/* Dates & Venue */}
                <DetailSection icon={Calendar} title={isAr ? "المواعيد والمكان" : "Dates & Venue"}>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label={isAr ? "بداية المسابقة" : "Start Date"} value={detailData.start_date} />
                    <Field label={isAr ? "نهاية المسابقة" : "End Date"} value={detailData.end_date} />
                    <Field label={isAr ? "آخر موعد للتسجيل" : "Reg. Deadline"} value={detailData.registration_deadline} />
                    <Field label={isAr ? "المكان" : "Venue"} value={[detailData.venue_en, detailData.venue_ar].filter(Boolean).join(" / ")} />
                    <Field label={isAr ? "المدينة" : "City"} value={[detailData.city_en, detailData.city_ar].filter(Boolean).join(" / ")} />
                    <Field label={isAr ? "الدولة" : "Country"} value={[detailData.country_en, detailData.country_code].filter(Boolean).join(" ")} />
                  </div>
                </DetailSection>

                {/* Schedule */}
                {detailData.competition_schedule?.length ? (
                  <DetailSection icon={Clock} title={isAr ? "الجدول الزمني" : "Schedule"}>
                    <div className="space-y-1">
                      {detailData.competition_schedule.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs p-1.5 rounded bg-muted/30">
                          <span className="font-mono text-muted-foreground shrink-0 w-16">{s.time}</span>
                          <span>{isAr ? s.activity_ar || s.activity : s.activity}</span>
                        </div>
                      ))}
                    </div>
                  </DetailSection>
                ) : null}

                {/* Versions */}
                {detailData.competition_versions?.length ? (
                  <DetailSection icon={Layers} title={isAr ? "فئات / نسخ المسابقة" : "Competition Versions / Categories"}>
                    <div className="space-y-1.5">
                      {detailData.competition_versions.map((v, i) => (
                        <div key={i} className="p-2 rounded-lg border text-xs">
                          <p className="font-medium">{v.name} {v.name_ar && `/ ${v.name_ar}`}</p>
                          {v.description && <p className="text-muted-foreground mt-0.5">{v.description}</p>}
                          {v.max_participants && <Badge variant="outline" className="mt-1 text-[10px]">Max: {v.max_participants}</Badge>}
                        </div>
                      ))}
                    </div>
                  </DetailSection>
                ) : null}

                {/* Rules & Eligibility */}
                {(detailData.rules_summary_en || detailData.terms_conditions_en || detailData.eligibility_en) && (
                  <DetailSection icon={Shield} title={isAr ? "الشروط والأحكام" : "Rules & Terms"}>
                    <Field label={isAr ? "ملخص القواعد (EN)" : "Rules Summary (EN)"} value={detailData.rules_summary_en} multi />
                    <Field label={isAr ? "ملخص القواعد (AR)" : "Rules Summary (AR)"} value={detailData.rules_summary_ar} multi />
                    <Field label={isAr ? "الشروط والأحكام (EN)" : "Terms & Conditions (EN)"} value={detailData.terms_conditions_en} multi />
                    <Field label={isAr ? "الشروط والأحكام (AR)" : "Terms & Conditions (AR)"} value={detailData.terms_conditions_ar} multi />
                    <Field label={isAr ? "شروط الأهلية (EN)" : "Eligibility (EN)"} value={detailData.eligibility_en} multi />
                    <Field label={isAr ? "شروط الأهلية (AR)" : "Eligibility (AR)"} value={detailData.eligibility_ar} multi />
                    {detailData.participation_requirements_en?.length ? (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">{isAr ? "متطلبات المشاركة" : "Participation Requirements"}</span>
                        <ul className="list-disc list-inside text-xs space-y-0.5">
                          {detailData.participation_requirements_en.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    ) : null}
                  </DetailSection>
                )}

                {/* Judging */}
                {(detailData.judging_criteria?.length || detailData.judging_committee?.length || detailData.scoring_method_en) && (
                  <DetailSection icon={Gavel} title={isAr ? "التحكيم والتقييم" : "Judging & Scoring"}>
                    <Field label={isAr ? "طريقة التقييم (EN)" : "Scoring Method (EN)"} value={detailData.scoring_method_en} multi />
                    <Field label={isAr ? "طريقة التقييم (AR)" : "Scoring Method (AR)"} value={detailData.scoring_method_ar} multi />

                    {detailData.judging_criteria?.length ? (
                      <div className="space-y-1">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">{isAr ? "معايير التحكيم" : "Judging Criteria"}</span>
                        {detailData.judging_criteria.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/30">
                            <span className="font-medium flex-1">{c.criterion} {c.criterion_ar && `/ ${c.criterion_ar}`}</span>
                            {c.weight && <Badge variant="secondary" className="text-[10px]">{c.weight}%</Badge>}
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {detailData.judging_committee?.length ? (
                      <div className="space-y-1">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">{isAr ? "لجنة التحكيم" : "Judging Committee"}</span>
                        {detailData.judging_committee.map((j, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/30">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Users className="h-3 w-3 text-primary/60" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{j.name} {j.name_ar && `/ ${j.name_ar}`}</p>
                              {j.title && <p className="text-muted-foreground truncate">{j.title}</p>}
                            </div>
                            {j.role && <Badge variant="outline" className="text-[9px] shrink-0">{j.role}</Badge>}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </DetailSection>
                )}

                {/* Prizes */}
                {detailData.prizes?.length ? (
                  <DetailSection icon={Award} title={isAr ? "الجوائز" : "Prizes"}>
                    <div className="space-y-1">
                      {detailData.prizes.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/30">
                          <span className="font-medium">{isAr ? p.place_ar || p.place : p.place}</span>
                          <span>{isAr ? p.prize_ar || p.prize : p.prize}</span>
                        </div>
                      ))}
                    </div>
                  </DetailSection>
                ) : null}

                {/* Rounds */}
                {detailData.competition_rounds?.length ? (
                  <DetailSection icon={ListChecks} title={isAr ? "جولات المسابقة" : "Competition Rounds"}>
                    {detailData.competition_rounds.map((r, i) => (
                      <div key={i} className="p-2 rounded-lg border text-xs">
                        <p className="font-medium">{r.name} {r.name_ar && `/ ${r.name_ar}`}</p>
                        {r.description && <p className="text-muted-foreground mt-0.5">{r.description}</p>}
                        {r.duration && <Badge variant="outline" className="mt-1 text-[10px]">{r.duration}</Badge>}
                      </div>
                    ))}
                  </DetailSection>
                ) : null}

                {/* Organizer */}
                {(detailData.organizer_name_en || detailData.organizer_name_ar) && (
                  <DetailSection icon={Target} title={isAr ? "المنظم" : "Organizer"}>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Name (EN)" value={detailData.organizer_name_en} />
                      <Field label="الاسم (AR)" value={detailData.organizer_name_ar} />
                      <Field label={isAr ? "الموقع" : "Website"} value={detailData.organizer_website} />
                      <Field label={isAr ? "البريد" : "Email"} value={detailData.organizer_email} />
                    </div>
                  </DetailSection>
                )}

                {/* Contact & Misc */}
                {(detailData.phone || detailData.email || detailData.website) && (
                  <DetailSection icon={Globe} title={isAr ? "التواصل" : "Contact"}>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label={isAr ? "الهاتف" : "Phone"} value={detailData.phone} />
                      <Field label={isAr ? "البريد" : "Email"} value={detailData.email} />
                      <Field label={isAr ? "الموقع" : "Website"} value={detailData.website} />
                      <Field label={isAr ? "رابط التسجيل" : "Registration URL"} value={detailData.registration_url} />
                    </div>
                  </DetailSection>
                )}

                {/* Extra details */}
                <div className="grid grid-cols-3 gap-2">
                  <Field label={isAr ? "الحد الأقصى للفريق" : "Max Team"} value={detailData.max_team_size?.toString()} />
                  <Field label={isAr ? "الحد الأدنى للفريق" : "Min Team"} value={detailData.min_team_size?.toString()} />
                  <Field label={isAr ? "تحكيم مخفي" : "Blind Judging"} value={detailData.blind_judging != null ? (detailData.blind_judging ? "✅" : "❌") : null} />
                </div>
                {detailData.dress_code && (
                  <Field label={isAr ? "الزي المطلوب" : "Dress Code"} value={[detailData.dress_code, detailData.dress_code_ar].filter(Boolean).join(" / ")} />
                )}
              </div>
            </ScrollArea>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleUseData} className="flex-1 gap-2">
                <CheckCircle className="h-4 w-4" />
                {isAr ? "استخدام هذه البيانات وإنشاء مسابقة" : "Use Data & Create Competition"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailSection({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
        <Icon className="h-3 w-3" /> {title}
      </h4>
      {children}
    </div>
  );
}

function Field({ label, value, multi }: { label: string; value?: string | null; multi?: boolean }) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      {multi ? (
        <p className="text-xs whitespace-pre-line leading-relaxed">{value}</p>
      ) : (
        <p className="text-xs truncate" title={value}>{value}</p>
      )}
    </div>
  );
}
