import { useIsAr } from "@/hooks/useIsAr";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { safeLazy } from "@/lib/safeLazy";
import { DataQualityIndicator } from "@/components/smart-import/DataQualityIndicator";
import { ExportDataButton } from "@/components/smart-import/ExportDataButton";
import { ImportStats } from "@/components/smart-import/ImportStats";
import { EditableField } from "@/components/smart-import/EditableField";
import {
  type ExistingRecord, type EntityType, type CompanyType, type TargetTable,
  SOURCE_CHANNELS, TARGET_TABLE_OPTIONS,
  ENTITY_TYPE_LABELS, COMPANY_TYPE_LABELS,
} from "@/components/smart-import/types";
import {
  Search, Loader2, MapPin, Globe, Sparkles, CheckCircle,
  Star, ChevronRight, ArrowLeft, AlertCircle,
  RefreshCw, Plus, Clock, Calendar, Building2,
  Phone, Link2, Zap, BarChart3, Layers, Edit3,
  Copy, ExternalLink, FileText,
} from "lucide-react";
import { useSmartImportData } from "./smartImport/useSmartImportData";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

const GoogleMapEmbed = safeLazy(() => import("@/components/smart-import/GoogleMapEmbed").then(m => ({ default: m.GoogleMapEmbed })));
const DetailTabs = safeLazy(() => import("@/components/smart-import/DetailTabs").then(m => ({ default: m.DetailTabs })));
const AddRecordForm = safeLazy(() => import("@/components/smart-import/AddRecordForm").then(m => ({ default: m.AddRecordForm })));
const ImportHistory = safeLazy(() => import("@/components/smart-import/ImportHistory").then(m => ({ default: m.ImportHistory })));
const BulkUrlImport = safeLazy(() => import("@/components/smart-import/BulkUrlImport").then(m => ({ default: m.BulkUrlImport })));
const CVImportSection = safeLazy(() => import("@/components/cv-import/CVImportSection").then(m => ({ default: m.CVImportSection })));

export default function SmartImportAdmin() {
  const isAr = useIsAr();
  const d = useSmartImportData(isAr);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* ─── Header ─── */}
      <Card className="border-0 bg-gradient-to-r from-card to-card/80 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            {d.step !== "search" && (
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl active:scale-90 transition-all" onClick={d.step === "details" ? d.handleBackToResults : d.handleNewSearch}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold tracking-tight flex items-center gap-2">
                {isAr ? "الاستيراد الذكي" : "Smart Import"}
                <Badge variant="secondary" className="text-xs font-normal rounded-lg">v4.0</Badge>
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                {d.step === "search" && (isAr ? "ابحث، الصق رابط، أو استورد دفعة واحدة" : "Search, paste URL, or bulk import")}
                {d.step === "results" && (isAr ? `${d.searchResults.length} نتيجة${d.searchTime ? ` في ${(d.searchTime / 1000).toFixed(1)}ث` : ''} — اضغط للتحليل` : `${d.searchResults.length} results${d.searchTime ? ` in ${(d.searchTime / 1000).toFixed(1)}s` : ''} — click to analyze`)}
                {d.step === "details" && (isAr ? `${d.fieldCount} حقل — جودة ${d.dataQuality}% — قابل للتعديل` : `${d.fieldCount} fields — ${d.dataQuality}% quality — editable`)}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl" onClick={() => { d.setShowHistory(true); d.loadHistory(); }}>
              <Clock className="h-3.5 w-3.5" />{isAr ? "السجل" : "History"}
            </Button>
            <div className="flex items-center gap-1">
              {[
                { key: "search", label: isAr ? "بحث" : "Search", num: 1 },
                { key: "results", label: isAr ? "نتائج" : "Results", num: 2 },
                { key: "details", label: isAr ? "تفاصيل" : "Details", num: 3 },
              ].map((s, i) => (
                <div key={s.key} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
                  <Badge variant={d.step === s.key ? "default" : "outline"} className={`text-xs gap-1 rounded-lg transition-all duration-200 ${d.step === s.key ? "shadow-sm" : "opacity-60"}`}>
                    {s.num}. {s.label}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ─── STEP 1: Search ─── */}
      {d.step === "search" && (
        <div className="space-y-4">
          <ImportStats stats={d.stats} loading={d.loadingStats} isAr={isAr} />
          <div className="flex gap-2 p-1 rounded-2xl bg-muted/40 border border-border/30 w-fit">
            {[
              { key: "search", icon: Search, labelEn: "Maps Search", labelAr: "بحث خرائط" },
              { key: "url", icon: Link2, labelEn: "URL Import", labelAr: "رابط مباشر" },
              { key: "bulk", icon: Layers, labelEn: "Bulk Import", labelAr: "استيراد جماعي" },
              { key: "cv", icon: FileText, labelEn: "CV Import", labelAr: "سيرة ذاتية" },
            ].map((mode) => (
              <Button key={mode.key} variant={d.importMode === mode.key ? "default" : "ghost"} size="sm"
                className={`gap-1.5 rounded-xl transition-all duration-200 ${d.importMode === mode.key ? "shadow-sm" : "hover:bg-muted"}`}
                onClick={() => d.setImportMode(mode.key as "search" | "url" | "bulk" | "cv")}>
                <mode.icon className="h-3.5 w-3.5" />{isAr ? mode.labelAr : mode.labelEn}
              </Button>
            ))}
          </div>

          {d.importMode === "search" ? (
            <Card className="border-primary/15 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/10"><MapPin className="h-4 w-4 text-destructive" /></div>
                  {isAr ? "البحث في خرائط جوجل" : "Search Google Maps"}
                </CardTitle>
                <CardDescription>{isAr ? "أدخل اسم المنشأة والموقع — ⌘K للبحث السريع" : "Enter entity name and location — ⌘K for quick search"}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs font-medium">{isAr ? "اسم الكيان / المنشأة" : "Entity / Business Name"}</Label>
                      <div className="relative">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input ref={d.searchInputRef} className="ps-9 h-11 rounded-xl" placeholder={isAr ? "مثال: مطعم الريف، فندق هيلتون..." : "e.g. Al Reef Restaurant, Hilton Hotel..."} value={d.query} onChange={(e) => d.setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && d.handleSearch()} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{isAr ? "الموقع" : "Location"}</Label>
                      <div className="relative">
                        <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="ps-9 h-11 rounded-xl" placeholder={isAr ? "الرياض" : "Riyadh"} value={d.location} onChange={(e) => d.setLocation(e.target.value)} onKeyDown={(e) => e.key === "Enter" && d.handleSearch()} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs font-medium">{isAr ? "الموقع الإلكتروني (اختياري)" : "Website URL (optional)"}</Label>
                      <div className="relative">
                        <Globe className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="ps-9 rounded-xl" placeholder="https://example.com" value={d.websiteUrl} onChange={(e) => d.setWebsiteUrl(e.target.value)} />
                      </div>
                    </div>
                    <Button onClick={d.handleSearch} disabled={d.searching || !d.query.trim()} className="gap-2 h-10 px-8 shrink-0 rounded-xl shadow-md shadow-primary/15 active:scale-95 transition-all">
                      {d.searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      {d.searching ? (isAr ? "جاري البحث..." : "Searching...") : (isAr ? "بحث" : "Search")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : d.importMode === "url" ? (
            <Card className="border-primary/15 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10"><Link2 className="h-4 w-4 text-primary" /></div>
                  {isAr ? "استيراد من رابط" : "Direct URL Import"}
                </CardTitle>
                <CardDescription>{isAr ? "الصق رابط الموقع لاستخراج البيانات بالذكاء الاصطناعي" : "Paste a URL to auto-extract data with AI"}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Globe className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="ps-9 h-11 rounded-xl" placeholder={isAr ? "الصق الرابط هنا..." : "Paste URL here..."} value={d.directUrl} onChange={(e) => d.setDirectUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && d.handleUrlImport()} />
                  </div>
                  <Button onClick={d.handleUrlImport} disabled={d.urlImporting || !d.directUrl.trim()} className="gap-2 h-11 px-8 shrink-0 rounded-xl shadow-md shadow-primary/15 active:scale-95 transition-all">
                    {d.urlImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    {d.urlImporting ? (isAr ? "جاري الاستخراج..." : "Extracting...") : (isAr ? "استخراج" : "Extract")}
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/30"><Sparkles className="h-3 w-3 text-primary" />{isAr ? "تحليل ذكي + خرائط" : "AI + Maps analysis"}</span>
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/30"><Globe className="h-3 w-3" />{isAr ? "أي موقع" : "Any website"}</span>
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/30"><BarChart3 className="h-3 w-3" />{isAr ? "مقياس جودة" : "Quality scoring"}</span>
                </div>
              </CardContent>
            </Card>
          ) : d.importMode === "cv" ? (
            <CVImportSection />
          ) : (
            <BulkUrlImport isAr={isAr} onComplete={() => {}} userId={d.user?.id} />
          )}
        </div>
      )}

      {/* ─── STEP 2: Results ─── */}
      {d.step === "results" && (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="ps-9" value={d.query} onChange={(e) => d.setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && d.handleSearch()} placeholder={isAr ? "بحث جديد..." : "New search..."} />
            </div>
            <Input className="w-40" value={d.location} onChange={(e) => d.setLocation(e.target.value)} onKeyDown={(e) => e.key === "Enter" && d.handleSearch()} placeholder={isAr ? "الموقع" : "Location"} />
            <Button onClick={d.handleSearch} disabled={d.searching} size="icon" className="shrink-0">
              {d.searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {d.searchResults.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border bg-accent/30 p-3">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={d.toggleSelectAll} className="text-xs gap-1.5">
                  <input type="checkbox" checked={d.batchSelected.size === d.searchResults.length && d.searchResults.length > 0} readOnly className="rounded" />
                  {isAr ? "تحديد الكل" : "Select All"}
                </Button>
                {d.batchSelected.size > 0 && <Badge variant="secondary" className="text-xs">{d.batchSelected.size} {isAr ? "محدد" : "selected"}</Badge>}
              </div>
              <div className="flex items-center gap-2">
                {d.batchImporting && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>{d.batchProgress.current}/{d.batchProgress.total}</span>
                    <span className="text-green-600">✅ {d.batchProgress.successes}</span>
                    {d.batchProgress.failures > 0 && <span className="text-red-600">❌ {d.batchProgress.failures}</span>}
                  </div>
                )}
                {d.batchSelected.size > 0 && (
                  <Button size="sm" onClick={d.handleBatchImport} disabled={d.batchImporting} className="gap-1.5">
                    {d.batchImporting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />{d.batchProgress.current}/{d.batchProgress.total}</> : <><Plus className="h-3.5 w-3.5" />{isAr ? `استيراد ${d.batchSelected.size}` : `Import ${d.batchSelected.size}`}</>}
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-red-500" />{isAr ? "النتائج" : "Results"}</span>
                    <div className="flex items-center gap-1.5">
                      {d.searchTime && <Badge variant="outline" className="text-xs font-normal gap-1"><Zap className="h-2.5 w-2.5" />{(d.searchTime / 1000).toFixed(1)}s</Badge>}
                      {!d.searching && <Badge variant="secondary" className="text-xs font-normal">{d.searchResults.length}</Badge>}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[460px]">
                    {d.searching ? (
                      <div className="p-3 space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="p-3 rounded-xl border space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-1/2" /></div>)}</div>
                    ) : d.searchResults.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground"><MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" /><p className="text-sm">{isAr ? "لم يتم العثور على نتائج" : "No results found"}</p></div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {d.searchResults.map((item) => {
                          const isSelected = d.selectedResult?.id === item.id;
                          const isLoading = d.loadingDetails && isSelected;
                          return (
                            <div key={item.id} className="flex items-start gap-1.5">
                              <input type="checkbox" className="mt-4 rounded shrink-0" checked={d.batchSelected.has(item.id)} onChange={() => d.toggleBatchSelect(item.id)} />
                              <button className={`flex-1 text-start p-3 rounded-xl transition-all ${isSelected ? 'bg-primary/10 border border-primary/30 shadow-sm' : 'hover:bg-accent/50 border border-transparent'}`} onClick={() => !d.loadingDetails && d.handleResultClick(item)} disabled={d.loadingDetails || d.batchImporting}>
                                <div className="flex items-start gap-2.5">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'bg-primary/15' : 'bg-red-500/10'}`}>
                                    {isLoading ? <Loader2 className="h-4 w-4 text-primary animate-spin" /> : <MapPin className="h-4 w-4 text-red-500" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-sm truncate">{item.name}</p>
                                      {item.rating != null && <span className="flex items-center gap-0.5 text-xs font-medium shrink-0"><Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />{item.rating}</span>}
                                    </div>
                                    {item.place_type && <p className="text-xs text-muted-foreground mt-0.5">{item.place_type}</p>}
                                    {item.description && <p className="text-xs text-muted-foreground/80 line-clamp-1 mt-0.5">{item.description}</p>}
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                      {item.google_maps_url && <Badge variant="outline" className="text-xs h-[18px] px-1 bg-red-500/10 text-red-600 border-red-500/20 gap-0.5"><MapPin className="h-2 w-2" /> Maps</Badge>}
                                      {item.url && <Badge variant="outline" className="text-xs h-[18px] px-1 gap-0.5"><Globe className="h-2 w-2" /> Web</Badge>}
                                    </div>
                                  </div>
                                </div>
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
              <GoogleMapEmbed latitude={d.selectedResult?.latitude} longitude={d.selectedResult?.longitude} name={d.selectedResult?.name} searchQuery={d.query} location={d.location} className="h-full min-h-[350px]" />
            </div>
          </div>
        </>
      )}

      {/* ─── STEP 3: Details ─── */}
      {d.step === "details" && d.details && (
        <div className="space-y-4">
          <Card className="rounded-2xl overflow-hidden">
            <CardContent className="pt-5 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  {d.details.logo_url ? <img src={d.details.logo_url} alt="" className="h-14 w-14 rounded-xl object-cover ring-1 ring-border/30" /> : <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center"><Building2 className="h-7 w-7 text-primary/60" /></div>}
                  <div>
                    {d.editingFields ? (
                      <>
                        <EditableField label="Name EN" value={d.details.name_en} fieldKey="name_en" onUpdate={d.handleFieldUpdate} />
                        <EditableField label="Name AR" value={d.details.name_ar} fieldKey="name_ar" onUpdate={d.handleFieldUpdate} />
                      </>
                    ) : (
                      <>
                        <h2 className="text-xl font-bold">{d.details.name_en || d.details.name_ar}</h2>
                        {d.details.name_ar && d.details.name_en && <p className="text-sm text-muted-foreground">{d.details.name_ar}</p>}
                        {(d.details.abbreviation_en || d.details.abbreviation_ar) && <p className="text-xs text-muted-foreground/70">{[d.details.abbreviation_en, d.details.abbreviation_ar].filter(Boolean).join(" / ")}</p>}
                      </>
                    )}
                  </div>
                  {d.details.rating && <Badge variant="secondary" className="gap-1 ms-2 bg-yellow-500/10 text-yellow-700 border-yellow-500/20"><Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />{d.details.rating}{d.details.total_reviews != null && <span className="text-muted-foreground">({d.details.total_reviews})</span>}</Badge>}
                  {d.details.founded_year && <Badge variant="outline" className="gap-1 ms-1 text-xs"><Calendar className="h-3 w-3" />{d.details.founded_year}</Badge>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DataQualityIndicator score={d.dataQuality} isAr={isAr} compact />
                  <TooltipProvider>
                    {Object.entries(SOURCE_CHANNELS).map(([key, config]) => {
                      if (!d.sourcesUsed[key]) return null;
                      const Icon = config.icon;
                      return <Tooltip key={key}><TooltipTrigger><Badge variant="outline" className={`gap-1 text-xs border ${config.color}`}><Icon className="h-3 w-3" />{isAr ? config.label_ar : config.label_en}</Badge></TooltipTrigger><TooltipContent>{isAr ? `بيانات من ${config.label_ar}` : `Data from ${config.label_en}`}</TooltipContent></Tooltip>;
                    })}
                  </TooltipProvider>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => d.setEditingFields(!d.editingFields)}><Edit3 className={`h-3.5 w-3.5 ${d.editingFields ? 'text-primary' : ''}`} />{d.editingFields ? (isAr ? "إنهاء التعديل" : "Done") : (isAr ? "تعديل" : "Edit")}</Button>
                  <ExportDataButton data={d.details} isAr={isAr} />
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={d.copyAllData}><Copy className="h-3.5 w-3.5" /></Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={d.handleRescrape} disabled={d.loadingDetails || d.urlImporting}><RefreshCw className={`h-3.5 w-3.5 ${d.loadingDetails ? 'animate-spin' : ''}`} />{isAr ? "إعادة" : "Re-fetch"}</Button>
                </div>
              </div>
              {d.editingFields && (
                <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <EditableField label={isAr ? "الوصف EN" : "Description EN"} value={d.details.description_en} fieldKey="description_en" onUpdate={d.handleFieldUpdate} multiline />
                  <EditableField label={isAr ? "الوصف AR" : "Description AR"} value={d.details.description_ar} fieldKey="description_ar" onUpdate={d.handleFieldUpdate} multiline />
                  <EditableField label={isAr ? "الهاتف" : "Phone"} value={d.details.phone} fieldKey="phone" onUpdate={d.handleFieldUpdate} copyable />
                  <EditableField label={isAr ? "البريد" : "Email"} value={d.details.email} fieldKey="email" onUpdate={d.handleFieldUpdate} copyable />
                  <EditableField label={isAr ? "الموقع" : "Website"} value={d.details.website} fieldKey="website" onUpdate={d.handleFieldUpdate} copyable />
                  <EditableField label={isAr ? "المدينة EN" : "City EN"} value={d.details.city_en} fieldKey="city_en" onUpdate={d.handleFieldUpdate} />
                  <EditableField label={isAr ? "المدينة AR" : "City AR"} value={d.details.city_ar} fieldKey="city_ar" onUpdate={d.handleFieldUpdate} />
                  <EditableField label={isAr ? "العنوان EN" : "Address EN"} value={d.details.full_address_en} fieldKey="full_address_en" onUpdate={d.handleFieldUpdate} />
                  <EditableField label={isAr ? "العنوان AR" : "Address AR"} value={d.details.full_address_ar} fieldKey="full_address_ar" onUpdate={d.handleFieldUpdate} />
                  <EditableField label={isAr ? "رمز البلد" : "Country Code"} value={d.details.country_code} fieldKey="country_code" onUpdate={d.handleFieldUpdate} />
                </div>
              )}
            </CardContent>
          </Card>

          {d.dataQuality > 0 && !d.editingFields && <DataQualityIndicator score={d.dataQuality} isAr={isAr} />}

          {d.suggestedTarget && (
            <Card className="border-primary/20 bg-primary/5 rounded-xl">
              <CardContent className="py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{isAr ? "اقتراح AI:" : "AI Suggestion:"}</span>
                    <Badge variant="secondary" className="gap-1">{TARGET_TABLE_OPTIONS.find(t => t.value === d.suggestedTarget!.table) ? (isAr ? TARGET_TABLE_OPTIONS.find(t => t.value === d.suggestedTarget!.table)!.label_ar : TARGET_TABLE_OPTIONS.find(t => t.value === d.suggestedTarget!.table)!.label_en) : d.suggestedTarget.table}</Badge>
                    <Badge variant="outline" className="text-xs">{d.suggestedTarget.sub_type}</Badge>
                    <span className="text-xs text-muted-foreground">({Math.round(d.suggestedTarget.confidence * 100)}%)</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => d.setShowAddForm(true)}><Edit3 className="h-3 w-3" />{isAr ? "تغيير التصنيف" : "Change"}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {(d.details.website || d.details.google_maps_url) && (
            <div className="flex items-center gap-2 flex-wrap">
              {d.details.website && <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild><a href={d.details.website} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" />{isAr ? "الموقع الرسمي" : "Official Website"}</a></Button>}
              {d.details.google_maps_url && <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild><a href={d.details.google_maps_url} target="_blank" rel="noopener noreferrer"><MapPin className="h-3 w-3" />Google Maps</a></Button>}
              {d.details.phone && <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild><a href={`tel:${d.details.phone}`}><Phone className="h-3 w-3" />{d.details.phone}</a></Button>}
            </div>
          )}

          {/* DB Check */}
          <Card className={d.existingRecords.length > 0 ? "border-yellow-500/30 bg-yellow-500/5" : d.dbChecked ? "border-green-500/30 bg-green-500/5" : ""}>
            <CardContent className="py-4">
              {d.checkingDb ? (
                <div className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin text-primary" /><span className="text-sm">{isAr ? "جاري التحقق..." : "Checking databases..."}</span></div>
              ) : d.dbChecked && d.existingRecords.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-yellow-600" /><span className="text-sm font-semibold text-yellow-700">{isAr ? `⚠️ تم العثور على ${d.existingRecords.length} سجل مطابق` : `⚠️ ${d.existingRecords.length} existing record${d.existingRecords.length > 1 ? 's' : ''} found`}</span></div>
                  <div className="space-y-2">
                    {d.existingRecords.map((record) => {
                      const tableInfo = TARGET_TABLE_OPTIONS.find(t => t.value === record.table);
                      const TableIcon = tableInfo?.icon || Building2;
                      const typeLabel = record.table === "culinary_entities" ? (isAr ? ENTITY_TYPE_LABELS[record.sub_type as EntityType]?.ar : ENTITY_TYPE_LABELS[record.sub_type as EntityType]?.en) || record.sub_type : record.table === "companies" ? (isAr ? COMPANY_TYPE_LABELS[record.sub_type as CompanyType]?.ar : COMPANY_TYPE_LABELS[record.sub_type as CompanyType]?.en) || record.sub_type : record.sub_type;
                      return (
                        <div key={`${record.table}-${record.id}`} className="flex items-center justify-between rounded-xl border-2 border-yellow-500/30 bg-yellow-500/5 p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center"><TableIcon className="h-5 w-5 text-yellow-700" /></div>
                            <div>
                              <p className="text-sm font-semibold">{record.name}</p>
                              {record.name_ar && record.name !== record.name_ar && <p className="text-xs text-muted-foreground">{record.name_ar}</p>}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Badge variant="outline" className="text-xs h-4">{record.identifier}</Badge>
                                <Badge variant="secondary" className="text-xs h-4">{isAr ? tableInfo?.label_ar : tableInfo?.label_en}</Badge>
                                <span>{typeLabel}</span>
                                {record.city && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{record.city}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 items-end shrink-0">
                            <Button size="default" variant="default" className="gap-2 bg-yellow-600 hover:bg-yellow-700 text-primary-foreground shadow-md whitespace-nowrap" onClick={() => d.handleUpdateRecord(record)} disabled={d.updating}>
                              {d.updating && d.selectedExistingId === record.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                              {isAr ? "تحديث المعلومات" : "Update Information"}
                            </Button>
                            <Button size="sm" variant="ghost" className="gap-1 text-xs text-muted-foreground h-6" onClick={() => window.open(d.getAdminEditUrl(record.table as TargetTable, record.id), '_blank', 'noopener')}>
                              <ExternalLink className="h-2.5 w-2.5" />{isAr ? "فتح السجل" : "Open Record"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between bg-muted/30 rounded-xl p-3">
                    <span className="text-xs text-muted-foreground">{isAr ? "إذا كان هذا كيان مختلف فعلاً" : "If this is truly a different entity"}</span>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => d.setShowAddForm(true)}><Plus className="h-3.5 w-3.5" />{isAr ? "إضافة جديد" : "Add New"}</Button>
                  </div>
                </div>
              ) : d.dbChecked ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600" /><span className="text-sm font-medium text-green-700">{isAr ? "لا يوجد سجل مطابق" : "No matching records"}</span></div>
                  <Button size="sm" variant="default" className="gap-1.5" onClick={() => d.setShowAddForm(true)}><Plus className="h-3.5 w-3.5" />{isAr ? "إضافة" : "Add Record"}</Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {d.lastSavedRecord && (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /><span className="text-sm font-medium text-green-700">{isAr ? "تم حفظ السجل بنجاح" : "Record saved successfully"}</span></div>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.open(d.getAdminEditUrl(d.lastSavedRecord!.table, d.lastSavedRecord!.id), '_blank', 'noopener')}><ExternalLink className="h-3.5 w-3.5" />{isAr ? "فتح صفحة التعديل" : "Open Edit Page"}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <DetailTabs details={d.details} activeTab={d.activeTab} onTabChange={d.setActiveTab} isAr={isAr} editing={d.editingFields} onFieldUpdate={d.handleFieldUpdate} />
        </div>
      )}

      {/* Add Form */}
      {d.showAddForm && d.details && d.step === "details" && (
        <AddRecordForm details={d.details} targetTable={d.targetTable} onTargetTableChange={d.setTargetTable} selectedEntityType={d.selectedEntityType} onEntityTypeChange={d.setSelectedEntityType} selectedCompanyType={d.selectedCompanyType} onCompanyTypeChange={d.setSelectedCompanyType} selectedEstablishmentType={d.selectedEstablishmentType} onEstablishmentTypeChange={d.setSelectedEstablishmentType} selectedExhibitionType={d.selectedExhibitionType} onExhibitionTypeChange={d.setSelectedExhibitionType} saving={d.saving} onSave={d.handleAddNewRecord} onCancel={() => d.setShowAddForm(false)} isAr={isAr} />
      )}

      <ImportHistory open={d.showHistory} onOpenChange={d.setShowHistory} loading={d.loadingHistory} history={d.importHistory} isAr={isAr} />
    </div>
  );
}
