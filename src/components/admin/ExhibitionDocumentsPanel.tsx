import { useState, useCallback, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Upload, Trash2, Loader2, FileText, Bot, ExternalLink, Download } from "lucide-react";
import { toEnglishDigits } from "@/lib/formatNumber";

interface Props {
  exhibitionId: string;
}

const DOC_CATEGORIES = [
  { value: "general", en: "General", ar: "عام" },
  { value: "rules", en: "Rules & Regulations", ar: "القواعد واللوائح" },
  { value: "schedule", en: "Schedule", ar: "الجدول الزمني" },
  { value: "guidelines", en: "Guidelines", ar: "إرشادات" },
  { value: "faq", en: "FAQ", ar: "الأسئلة الشائعة" },
  { value: "brochure", en: "Brochure", ar: "كتيب" },
  { value: "contract", en: "Contract / Agreement", ar: "عقد / اتفاقية" },
  { value: "other", en: "Other", ar: "أخرى" },
];

export const ExhibitionDocumentsPanel = memo(function ExhibitionDocumentsPanel({ exhibitionId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => isAr ? ar : en;
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("general");
  const [feedToAi, setFeedToAi] = useState(false);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["exhibition-documents", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_documents")
        .select("id, exhibition_id, title, title_ar, file_url, file_type, file_size, category, uploaded_by, feed_to_ai, created_at")
        .eq("exhibition_id", exhibitionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!exhibitionId,
  });

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `exhibitions/${exhibitionId}/docs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("exhibition-files").upload(path, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from("exhibition-files").getPublicUrl(path);

        const { error: dbError } = await supabase.from("exhibition_documents").insert({
          exhibition_id: exhibitionId,
          title: file.name,
          file_url: publicUrl,
          file_type: ext || "unknown",
          file_size: file.size,
          category,
          feed_to_ai: feedToAi,
          is_public: true,
        });
        if (dbError) throw dbError;
      }
      queryClient.invalidateQueries({ queryKey: ["exhibition-documents", exhibitionId] });
      toast({ title: t("Documents uploaded", "تم رفع المستندات") });
    } catch (err: any) {
      toast({ title: t("Upload failed", "فشل الرفع"), description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [exhibitionId, category, feedToAi, queryClient, t]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exhibition_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-documents", exhibitionId] });
      toast({ title: t("Deleted", "تم الحذف") });
    },
  });

  const toggleAiMutation = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      const { error } = await supabase.from("exhibition_documents").update({ feed_to_ai: val }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-documents", exhibitionId] });
    },
  });

  if (!exhibitionId) {
    return (
      <p className="text-xs text-muted-foreground italic">
        {t("Save the exhibition first to upload documents.", "احفظ الفعالية أولاً لرفع المستندات.")}
      </p>
    );
  }

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${toEnglishDigits(bytes)} B`;
    if (bytes < 1024 * 1024) return `${toEnglishDigits((bytes / 1024).toFixed(1))} KB`;
    return `${toEnglishDigits((bytes / (1024 * 1024)).toFixed(1))} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Upload */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">{t("Category", "التصنيف")}</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-8 text-xs w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DOC_CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{isAr ? c.ar : c.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={feedToAi} onCheckedChange={setFeedToAi} />
          <Label className="text-xs flex items-center gap-1">
            <Bot className="h-3.5 w-3.5" />
            {t("Feed to AI Support", "تغذية الذكاء الاصطناعي")}
          </Label>
        </div>
        <div>
          <Label htmlFor={`doc-upload-${exhibitionId}`} className="cursor-pointer">
            <Button type="button" size="sm" variant="outline" className="gap-1.5 text-xs" asChild disabled={uploading}>
              <span>
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {t("Upload Files", "رفع ملفات")}
              </span>
            </Button>
          </Label>
          <input
            id={`doc-upload-${exhibitionId}`}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        {t(
          "📌 Files marked 'Feed to AI' will be used by the AI customer service to answer exhibition-related questions.",
          "📌 الملفات المميزة بـ 'تغذية الذكاء الاصطناعي' ستُستخدم لتغذية خدمة العملاء الآلية للإجابة على الأسئلة المتعلقة بالمعرض."
        )}
      </p>

      {/* Documents list */}
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : docs.length > 0 ? (
        <div className="space-y-2">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 rounded-xl border p-2.5 bg-muted/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.title}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-[9px] h-4">
                    {DOC_CATEGORIES.find(c => c.value === doc.category)?.[isAr ? "ar" : "en"] || doc.category}
                  </Badge>
                  {doc.file_size && (
                    <span className="text-[9px] text-muted-foreground">{formatSize(doc.file_size)}</span>
                  )}
                  {doc.feed_to_ai && (
                    <Badge className="text-[8px] h-4 border-0 bg-chart-2/10 text-chart-2 gap-0.5">
                      <Bot className="h-2.5 w-2.5" /> AI
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => toggleAiMutation.mutate({ id: doc.id, val: !doc.feed_to_ai })}
                  title={t("Toggle AI Feed", "تبديل تغذية AI")}
                >
                  <Bot className={`h-3.5 w-3.5 ${doc.feed_to_ai ? "text-chart-2" : "text-muted-foreground"}`} />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" title={t("Open", "فتح")}>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(doc.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("No documents uploaded yet", "لم يتم رفع مستندات بعد")}</p>
      )}
    </div>
  );
});
