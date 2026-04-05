import { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, Loader2, ChevronDown, ChevronUp, Languages } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * AI-powered article summary that generates a concise TL;DR
 * using Lovable AI (Gemini Flash) on demand.
 */
export const ArticleAISummary = memo(function ArticleAISummary({
  content,
  title,
  isAr,
}: {
  content: string;
  title: string;
  isAr: boolean;
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [lang, setLang] = useState<"en" | "ar">(isAr ? "ar" : "en");
  const [error, setError] = useState<string | null>(null);

  const generateSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const prompt = lang === "ar"
        ? `لخّص هذا المقال بعنوان "${title}" في 3-4 نقاط رئيسية مختصرة باللغة العربية. اكتب بأسلوب صحفي محترف. المقال:\n\n${content.slice(0, 3000)}`
        : `Summarize this article titled "${title}" into 3-4 concise key points. Write in a professional journalistic style. Article:\n\n${content.slice(0, 3000)}`;

      const { data, error: fnError } = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: [{ role: "user", content: prompt }],
          model: "google/gemini-2.5-flash-lite",
        },
      });

      if (fnError) throw fnError;
      const text = data?.choices?.[0]?.message?.content || data?.message || "";
      if (!text) throw new Error("No summary generated");
      setSummary(text);
    } catch (e: unknown) {
      setError(isAr ? "فشل إنشاء الملخص" : "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  }, [content, title, lang, isAr]);

  const toggleLang = useCallback(() => {
    const newLang = lang === "en" ? "ar" : "en";
    setLang(newLang);
    setSummary(null); // Reset so user re-generates
  }, [lang]);

  if (!summary && !loading) {
    return (
      <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-primary/[0.02] p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold mb-1">
              {isAr ? "ملخص ذكي بالذكاء الاصطناعي" : "AI Quick Summary"}
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              {isAr ? "احصل على ملخص سريع للنقاط الرئيسية في هذا المقال" : "Get a quick summary of the key points in this article"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="rounded-xl gap-1.5 text-xs shadow-md shadow-primary/15"
                onClick={generateSummary}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isAr ? "إنشاء ملخص" : "Generate Summary"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1 text-xs h-8"
                onClick={toggleLang}
              >
                <Languages className="h-3 w-3" />
                {lang === "en" ? "العربية" : "English"}
              </Button>
            </div>
          </div>
        </div>
        {error && (
          <p className="text-xs text-destructive mt-2 ms-13">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-primary/[0.02] overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 p-4 pb-2 hover:bg-primary/5 transition-colors text-start"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold flex items-center gap-2">
            {isAr ? "ملخص AI" : "AI Summary"}
            <span className="text-[9px] font-normal text-muted-foreground uppercase">{lang}</span>
          </p>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4">
          {loading ? (
            <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">{isAr ? "جارٍ إنشاء الملخص..." : "Generating summary..."}</span>
            </div>
          ) : (
            <div
              className={cn(
                "text-xs leading-relaxed text-muted-foreground whitespace-pre-line",
                lang === "ar" && "text-end"
              )}
              dir={lang === "ar" ? "rtl" : "ltr"}
            >
              {summary}
            </div>
          )}
          {summary && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/20">
              <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-lg gap-1" onClick={toggleLang}>
                <Languages className="h-3 w-3" />
                {lang === "en" ? "بالعربية" : "In English"}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-lg gap-1" onClick={generateSummary}>
                <Sparkles className="h-3 w-3" />
                {isAr ? "إعادة إنشاء" : "Regenerate"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
