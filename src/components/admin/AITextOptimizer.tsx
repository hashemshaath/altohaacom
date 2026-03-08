import { useState, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Languages } from "lucide-react";

interface Props {
  text: string;
  lang: "en" | "ar";
  /** Called when SEO optimization completes — updates THIS field */
  onOptimized?: (optimized: string) => void;
  /** Called when translation completes — updates the OTHER language field */
  onTranslated?: (translated: string) => void;
  /** Compact mode for inline usage next to labels */
  compact?: boolean;
  /** Field type for AI context-aware length limits */
  fieldType?: "title" | "meta_title" | "meta_description" | "excerpt" | "description" | "bio" | "body" | "tag" | "slug" | "text";
  /** Override max character length */
  maxLength?: number;
}

export const AITextOptimizer = memo(function AITextOptimizer({ text, lang, onOptimized, onTranslated, compact, fieldType, maxLength }: Props) {
  const { toast } = useToast();
  const [optimizing, setOptimizing] = useState(false);
  const [translating, setTranslating] = useState(false);
  const isAr = lang === "ar";

  const handleOptimize = async () => {
    if (!text.trim()) return;
    setOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-translate-seo", {
        body: { text, source_lang: lang, optimize_only: true, field_type: fieldType, max_length: maxLength },
      });
      if (error) throw error;
      if (data?.optimized) {
        onOptimized?.(data.optimized);
        toast({ title: isAr ? "تم التحسين بنجاح" : "Optimized successfully" });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    } finally {
      setOptimizing(false);
    }
  };

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setTranslating(true);
    try {
      const targetLang = lang === "ar" ? "en" : "ar";
      const { data, error } = await supabase.functions.invoke("ai-translate-seo", {
        body: { text, source_lang: lang, target_lang: targetLang, optimize_seo: true, field_type: fieldType, max_length: maxLength },
      });
      if (error) throw error;
      if (data?.translated) {
        onTranslated?.(data.translated);
        toast({
          title: isAr ? "تمت الترجمة وتعبئة الحقل الآخر" : "Translated & filled in the other field",
        });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    } finally {
      setTranslating(false);
    }
  };

  const size = compact ? "icon" : "sm";
  const disabled = !text.trim();

  return (
    <div className="flex gap-1">
      {onOptimized && (
        <Button
          type="button"
          variant="ghost"
          size={size}
          onClick={handleOptimize}
          disabled={optimizing || disabled}
          className={compact ? "h-6 w-6" : "gap-1 text-[10px] h-6 px-2"}
          title={isAr ? "تحسين SEO" : "Optimize SEO"}
        >
          {optimizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {!compact && (isAr ? "تحسين" : "SEO")}
        </Button>
      )}
      {onTranslated && (
        <Button
          type="button"
          variant="ghost"
          size={size}
          onClick={handleTranslate}
          disabled={translating || disabled}
          className={compact ? "h-6 w-6" : "gap-1 text-[10px] h-6 px-2"}
          title={isAr ? "ترجمة عكسية" : "Translate"}
        >
          {translating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
          {!compact && (isAr ? "→ EN" : "→ AR")}
        </Button>
      )}
    </div>
  );
});
