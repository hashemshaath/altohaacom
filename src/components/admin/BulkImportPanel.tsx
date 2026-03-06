import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import {
  Upload, Download, FileSpreadsheet, CheckCircle, XCircle, Loader2,
  Sparkles, Eye, Save, AlertTriangle, ArrowRight, Trash2, Languages, ShieldAlert,
} from "lucide-react";

type EntityType = "exhibition" | "competition" | "participant" | "judge" | "winner" | "company" | "entity" | "volunteer" | "sponsor" | "organizer";
type ImportStep = "upload" | "preview" | "optimize" | "review" | "saving";

interface BulkImportPanelProps {
  entityType: EntityType;
  onImportComplete?: () => void;
  /** For competition-scoped imports: auto-fill competition_number in template */
  competitionNumber?: string;
}

const ENTITY_LABELS: Record<EntityType, { en: string; ar: string }> = {
  exhibition: { en: "Exhibitions", ar: "المعارض" },
  competition: { en: "Competitions", ar: "المسابقات" },
  participant: { en: "Participants", ar: "المشاركين" },
  judge: { en: "Judges", ar: "المحكمين" },
  winner: { en: "Winners", ar: "الفائزين" },
  company: { en: "Companies", ar: "الشركات" },
  entity: { en: "Entities", ar: "الجهات" },
  volunteer: { en: "Volunteers & Team", ar: "المتطوعين والفريق" },
  sponsor: { en: "Sponsors", ar: "الرعاة" },
  organizer: { en: "Organizers", ar: "المنظمين" },
};

export function BulkImportPanel({ entityType, onImportComplete, competitionNumber }: BulkImportPanelProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>("upload");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [dupChecking, setDupChecking] = useState(false);
  const [dupResults, setDupResults] = useState<Record<number, { score: number; match: string }>>({});

  const label = ENTITY_LABELS[entityType];

  // Check rows for duplicates before insert
  const handleDedupCheck = async () => {
    const nameTables: Record<string, string[]> = {
      exhibition: ["exhibitions"],
      company: ["companies", "organizers"],
      entity: ["culinary_entities", "establishments"],
      organizer: ["organizers", "companies", "culinary_entities"],
    };
    const tables = nameTables[entityType];
    if (!tables) return;

    setDupChecking(true);
    const results: Record<number, { score: number; match: string }> = {};
    try {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const name = row.name || row.title || "";
        if (!name) continue;
        const { data } = await supabase.functions.invoke("entity-dedup", {
          body: { mode: "check", entity: { name, email: row.email, phone: row.phone, website: row.website }, tables },
        });
        if (data?.duplicates?.length > 0) {
          const top = data.duplicates[0];
          results[i] = { score: top.score, match: top.record?.name || "Unknown" };
        }
      }
      setDupResults(results);
      const dupCount = Object.keys(results).length;
      if (dupCount > 0) {
        toast({ variant: "destructive", title: t(`${dupCount} potential duplicates found`, `تم العثور على ${dupCount} تكرار محتمل`) });
      } else {
        toast({ title: t("No duplicates found ✨", "لا توجد تكرارات ✨") });
      }
    } catch (err) {
      console.error("Dedup check failed:", err);
    } finally {
      setDupChecking(false);
    }
  };

  // Download template
  const handleDownloadTemplate = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const templateUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bulk-import?action=template&type=${entityType}${competitionNumber ? `&competition_number=${competitionNumber}` : ""}`;
      const res = await fetch(
        templateUrl,
        { headers: { Authorization: `Bearer ${session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
      );
      if (!res.ok) throw new Error("Failed to download template");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${entityType}-template.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t("Template downloaded", "تم تنزيل القالب") });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("Error", "خطأ"), description: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Upload & parse file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setFileName(file.name);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bulk-import?action=parse&type=${entityType}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Failed to parse file");
      const data = await res.json();
      setParsedData(data);
      setRows(data.rows || []);
      setErrors(data.errors || []);
      setStep("preview");
      toast({
        title: t(`${data.total} rows found`, `تم العثور على ${data.total} صف`),
        description: t(`${data.valid} valid, ${data.errors?.length || 0} errors`, `${data.valid} صالح، ${data.errors?.length || 0} أخطاء`),
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("Parse error", "خطأ في التحليل"), description: err.message });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // AI optimize bilingual texts
  const handleAIOptimize = async () => {
    setOptimizing(true);
    setOptimizeProgress(0);
    setStep("optimize");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      // Process in batches of 5
      const batchSize = 5;
      const allOptimized: any[] = [];

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bulk-import?action=ai-optimize`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ rows: batch, entityType }),
          }
        );

        if (!res.ok) throw new Error("AI optimization failed");
        const data = await res.json();
        allOptimized.push(...(data.rows || batch));
        setOptimizeProgress(Math.round(((i + batchSize) / rows.length) * 100));
      }

      setRows(allOptimized);
      setStep("review");
      toast({ title: t("AI optimization complete", "اكتمل التحسين بالذكاء الاصطناعي") });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("AI Error", "خطأ AI"), description: err.message });
      setStep("preview");
    } finally {
      setOptimizing(false);
    }
  };

  // Save as draft import
  const handleSaveAsDraft = async () => {
    setSaving(true);
    setSaveProgress(0);
    setStep("saving");

    try {
      // Save the import batch record
      const { data: importRecord, error: insertErr } = await supabase
        .from("bulk_imports")
        .insert({
          entity_type: entityType,
          status: "review",
          file_name: fileName,
          total_rows: rows.length,
          processed_rows: rows.filter(r => !r._has_errors).length,
          failed_rows: rows.filter(r => r._has_errors).length,
          imported_data: rows as any,
          errors: errors as any,
          created_by: user?.id,
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      setSaveProgress(100);
      toast({
        title: t("Import saved as draft for review", "تم حفظ الاستيراد كمسودة للمراجعة"),
        description: t(`Batch ID: ${importRecord.id.slice(0, 8)}`, `رقم الدفعة: ${importRecord.id.slice(0, 8)}`),
      });

      queryClient.invalidateQueries({ queryKey: ["bulk-imports"] });
      onImportComplete?.();
      resetState();
    } catch (err: any) {
      toast({ variant: "destructive", title: t("Save error", "خطأ في الحفظ"), description: err.message });
      setStep("review");
    } finally {
      setSaving(false);
    }
  };

  // Approve and insert data directly
  const handleApproveAndInsert = async () => {
    setSaving(true);
    setSaveProgress(0);
    setStep("saving");

    try {
      const validRows = rows.filter(r => !r._has_errors);
      let insertedCount = 0;

      for (const row of validRows) {
        try {
          await insertRow(row);
          insertedCount++;
        } catch (err) {
          console.error("Row insert failed:", err);
        }
        setSaveProgress(Math.round((insertedCount / validRows.length) * 100));
      }

      // Save record as completed
      await supabase.from("bulk_imports").insert({
        entity_type: entityType,
        status: "completed",
        file_name: fileName,
        total_rows: rows.length,
        processed_rows: insertedCount,
        failed_rows: rows.length - insertedCount,
        imported_data: rows as any,
        errors: errors as any,
        created_by: user?.id,
      });

      toast({
        title: t(`${insertedCount} records imported`, `تم استيراد ${insertedCount} سجل`),
      });

      queryClient.invalidateQueries({ queryKey: ["admin-exhibitions"] });
      queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-entities"] });
      onImportComplete?.();
      resetState();
    } catch (err: any) {
      toast({ variant: "destructive", title: t("Import error", "خطأ في الاستيراد"), description: err.message });
      setStep("review");
    } finally {
      setSaving(false);
    }
  };

  // Insert a single row based on entity type
  const insertRow = async (row: any) => {
    switch (entityType) {
      case "exhibition": {
        const slug = (row.title || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);
        await supabase.from("exhibitions").insert({
          title: row.title, title_ar: row.title_ar || null, slug,
          description: row.description || null, description_ar: row.description_ar || null,
          type: row.type || "exhibition", status: row.status || "draft",
          start_date: row.start_date, end_date: row.end_date,
          venue: row.venue || null, venue_ar: row.venue_ar || null,
          city: row.city || null, country: row.country || null,
          organizer_name: row.organizer_name || null, organizer_name_ar: row.organizer_name_ar || null,
          organizer_email: row.organizer_email || null, organizer_phone: row.organizer_phone || null,
          is_virtual: row.is_virtual === "true" || row.is_virtual === "1",
          virtual_link: row.virtual_link || null,
          website_url: row.website_url || null, registration_url: row.registration_url || null,
          is_free: row.is_free === "true" || row.is_free === "1",
          ticket_price: row.ticket_price || null,
          max_attendees: row.max_attendees ? parseInt(row.max_attendees) : null,
          tags: row.tags ? row.tags.split(",").map((t: string) => t.trim()) : [],
          cover_image_url: row.cover_image_url || null,
          created_by: user?.id,
        }).throwOnError();
        break;
      }
      case "competition": {
        await supabase.from("competitions").insert({
          title: row.title, title_ar: row.title_ar || null,
          description: row.description || null, description_ar: row.description_ar || null,
          status: (row.status as any) || "draft",
          competition_start: row.competition_start, competition_end: row.competition_end || null,
          registration_start: row.registration_start || null, registration_end: row.registration_end || null,
          venue: row.venue || null, venue_ar: row.venue_ar || null,
          city: row.city || null, country: row.country || null, country_code: row.country_code || null,
          max_participants: row.max_participants ? parseInt(row.max_participants) : null,
          edition_year: row.edition_year ? parseInt(row.edition_year) : new Date().getFullYear(),
          is_virtual: row.is_virtual === "true" || row.is_virtual === "1",
          rules_summary: row.rules_summary || null, rules_summary_ar: row.rules_summary_ar || null,
          scoring_notes: row.scoring_notes || null, scoring_notes_ar: row.scoring_notes_ar || null,
          cover_image_url: row.cover_image_url || null,
          organizer_id: user?.id,
        }).throwOnError();
        break;
      }
      case "company": {
        await supabase.from("companies").insert({
          name: row.name, name_ar: row.name_ar || null,
          type: (row.type as any) || "supplier",
          email: row.email || null, phone: row.phone || null, website: row.website || null,
          address: row.address || null, address_ar: row.address_ar || null,
          city: row.city || null, country: row.country || null, country_code: row.country_code || null,
          registration_number: row.registration_number || null,
          tax_number: row.tax_number || null,
          description: row.description || null, description_ar: row.description_ar || null,
          logo_url: row.logo_url || null,
          status: "pending",
        }).throwOnError();
        break;
      }
      case "entity": {
        const slug = (row.name || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        await supabase.from("culinary_entities").insert({
          name: row.name, name_ar: row.name_ar || null,
          abbreviation: row.abbreviation || null, abbreviation_ar: row.abbreviation_ar || null,
          type: (row.type as any) || "culinary_association",
          scope: (row.scope as any) || "local",
          description: row.description || null, description_ar: row.description_ar || null,
          country: row.country || null, city: row.city || null,
          address: row.address || null, address_ar: row.address_ar || null,
          email: row.email || null, phone: row.phone || null, fax: row.fax || null,
          website: row.website || null,
          president_name: row.president_name || null, president_name_ar: row.president_name_ar || null,
          secretary_name: row.secretary_name || null, secretary_name_ar: row.secretary_name_ar || null,
          founded_year: row.founded_year ? parseInt(row.founded_year) : null,
          member_count: row.member_count ? parseInt(row.member_count) : null,
          mission: row.mission || null, mission_ar: row.mission_ar || null,
          logo_url: row.logo_url || null, cover_image_url: row.cover_image_url || null,
          slug, entity_number: "", status: "pending",
          created_by: user?.id,
        }).throwOnError();
        break;
      }
      case "organizer": {
        const slug = (row.name || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);
        await supabase.from("organizers").insert({
          name: row.name, name_ar: row.name_ar || null, slug,
          description: row.description || null, description_ar: row.description_ar || null,
          email: row.email || null, phone: row.phone || null, website: row.website || null,
          address: row.address || null, address_ar: row.address_ar || null,
          city: row.city || null, city_ar: row.city_ar || null,
          country: row.country || null, country_ar: row.country_ar || null,
          country_code: row.country_code || null,
          services: row.services ? row.services.split(",").map((s: string) => s.trim()) : [],
          targeted_sectors: row.targeted_sectors ? row.targeted_sectors.split(",").map((s: string) => s.trim()) : [],
          founded_year: row.founded_year ? parseInt(row.founded_year) : null,
          logo_url: row.logo_url || null, cover_image_url: row.cover_image_url || null,
          status: "pending",
        }).throwOnError();
        break;
      }
      default:
        // For participant/judge/winner, save to bulk_imports for manual processing
        break;
    }
  };

  const removeRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const resetState = () => {
    setStep("upload");
    setParsedData(null);
    setRows([]);
    setErrors([]);
    setFileName("");
    setOptimizeProgress(0);
    setSaveProgress(0);
  };

  // Get display columns (first 5 meaningful columns)
  const displayColumns = rows.length > 0
    ? Object.keys(rows[0]).filter(k => !k.startsWith("_")).slice(0, 6)
    : [];

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          {t(`Bulk Import ${label.en}`, `استيراد جماعي ${label.ar}`)}
          <Badge variant="outline" className="ms-auto text-xs">
            {step === "upload" && t("Step 1: Upload", "الخطوة 1: الرفع")}
            {step === "preview" && t("Step 2: Preview", "الخطوة 2: معاينة")}
            {step === "optimize" && t("Step 3: AI Optimize", "الخطوة 3: تحسين AI")}
            {step === "review" && t("Step 4: Review & Save", "الخطوة 4: مراجعة وحفظ")}
            {step === "saving" && t("Saving...", "جاري الحفظ...")}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border/60 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{t("Upload Excel File", "رفع ملف إكسل")}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("Download the template first, fill it out, then upload", "قم بتنزيل القالب أولاً، ثم املأه وارفعه")}
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate} disabled={loading}>
                  <Download className="me-2 h-4 w-4" />
                  {t("Download Template", "تنزيل القالب")}
                </Button>
                <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                  {loading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Upload className="me-2 h-4 w-4" />}
                  {t("Upload File", "رفع ملف")}
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{fileName}</Badge>
                <Badge className="bg-chart-5/10 text-chart-5">{rows.filter(r => !r._has_errors).length} {t("valid", "صالح")}</Badge>
                {errors.length > 0 && (
                  <Badge variant="destructive">{errors.length} {t("errors", "أخطاء")}</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={resetState}>
                  {t("Cancel", "إلغاء")}
                </Button>
                <Button size="sm" onClick={handleAIOptimize} disabled={rows.length === 0}>
                  <Sparkles className="me-2 h-4 w-4" />
                  {t("AI Translate & Optimize", "ترجمة وتحسين AI")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setStep("review")}>
                  {t("Skip AI → Review", "تخطي AI → مراجعة")}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="rounded-xl bg-destructive/5 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {t("Validation Errors", "أخطاء التحقق")}
                </div>
                <ul className="mt-2 space-y-1">
                  {errors.slice(0, 5).map((err: any, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground">
                      {t(`Row ${err.row}: ${err.message}`, `الصف ${err.row}: ${err.message}`)}
                    </li>
                  ))}
                  {errors.length > 5 && (
                    <li className="text-xs text-muted-foreground">...{t(`and ${errors.length - 5} more`, `و ${errors.length - 5} أخرى`)}</li>
                  )}
                </ul>
              </div>
            )}

            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    {displayColumns.map(col => (
                      <TableHead key={col} className="text-xs">{col}</TableHead>
                    ))}
                    <TableHead className="w-8">
                      <Languages className="h-3.5 w-3.5" />
                    </TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={idx} className={row._has_errors ? "bg-destructive/5" : ""}>
                      <TableCell className="text-xs text-muted-foreground">{row._row_index}</TableCell>
                      {displayColumns.map(col => (
                        <TableCell key={col} className="text-xs max-w-[150px] truncate">
                          {String(row[col] || "").slice(0, 50)}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Badge variant="outline" className="text-[9px]">
                          {row._detected_language === "ar" ? "عربي" : "EN"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeRow(idx)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        {/* Step 3: AI Optimizing */}
        {step === "optimize" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <p className="text-sm font-medium">{t("AI is translating & optimizing...", "الذكاء الاصطناعي يترجم ويحسّن...")}</p>
            <div className="w-full max-w-xs">
              <Progress value={optimizeProgress} className="h-2" />
              <p className="mt-1 text-center text-xs text-muted-foreground">{optimizeProgress}%</p>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === "review" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-chart-5" />
                <span className="text-sm font-medium">
                  {t(`${rows.length} rows ready`, `${rows.length} صف جاهز`)}
                </span>
                {rows.some(r => r._ai_processed) && (
                  <Badge className="bg-primary/10 text-primary text-[9px]">
                    <Sparkles className="me-1 h-3 w-3" /> {t("AI Enhanced", "محسّن بـ AI")}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={resetState}>
                  {t("Cancel", "إلغاء")}
                </Button>
                <Button variant="outline" size="sm" onClick={handleSaveAsDraft}>
                  <Save className="me-2 h-4 w-4" />
                  {t("Save as Draft", "حفظ كمسودة")}
                </Button>
                <Button size="sm" onClick={handleApproveAndInsert}>
                  <CheckCircle className="me-2 h-4 w-4" />
                  {t("Approve & Import", "اعتماد واستيراد")}
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    {displayColumns.map(col => (
                      <TableHead key={col} className="text-xs">{col}</TableHead>
                    ))}
                    <TableHead className="w-12">{t("Status", "الحالة")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      {displayColumns.map(col => (
                        <TableCell key={col} className="text-xs max-w-[150px] truncate" dir={col.endsWith("_ar") ? "rtl" : "ltr"}>
                          {String(row[col] || "").slice(0, 50)}
                        </TableCell>
                      ))}
                      <TableCell>
                        {row._has_errors ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-chart-5" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        {/* Step: Saving */}
        {step === "saving" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm font-medium">{t("Importing data...", "جاري استيراد البيانات...")}</p>
            <div className="w-full max-w-xs">
              <Progress value={saveProgress} className="h-2" />
              <p className="mt-1 text-center text-xs text-muted-foreground">{saveProgress}%</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
