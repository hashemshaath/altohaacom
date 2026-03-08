import { useState, useCallback, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Props {
  query: string;
}

export const AISearchPanel = memo(function AISearchPanel({ query }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [aiResponse, setAiResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAISearch = useCallback(async () => {
    if (!query.trim() || query.trim().length < 2) return;
    setIsStreaming(true);
    setAiResponse("");
    setError(null);
    setHasSearched(true);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ query: query.trim(), language }),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
              setAiResponse(accumulated);
            }
          } catch {
            // partial JSON, skip
          }
        }
      }
    } catch (e: any) {
      console.error("AI search error:", e);
      setError(e.message || (isAr ? "حدث خطأ" : "An error occurred"));
    } finally {
      setIsStreaming(false);
    }
  }, [query, language, isAr]);

  if (!query || query.trim().length < 2) return null;

  return (
    <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{isAr ? "بحث ذكي بالذكاء الاصطناعي" : "AI Smart Search"}</h3>
            <p className="text-[10px] text-muted-foreground">
              {isAr ? "تحليل ذكي لنتائج البحث" : "Intelligent analysis of search results"}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant={hasSearched ? "outline" : "default"}
          className="h-8 gap-1.5 rounded-xl text-xs touch-manipulation active:scale-95"
          onClick={runAISearch}
          disabled={isStreaming}
        >
          {isStreaming ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : hasSearched ? (
            <RotateCcw className="h-3.5 w-3.5" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {isStreaming
            ? isAr ? "جاري التحليل..." : "Analyzing..."
            : hasSearched
              ? isAr ? "إعادة البحث" : "Search Again"
              : isAr ? "ابحث بالذكاء الاصطناعي" : "Ask AI"}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {aiResponse && (
        <div className="prose prose-sm dark:prose-invert max-w-none rounded-xl bg-card/60 border border-border/30 p-4 text-sm leading-relaxed">
          <ReactMarkdown>{aiResponse}</ReactMarkdown>
        </div>
      )}

      {!hasSearched && !error && (
        <p className="text-xs text-muted-foreground text-center py-2">
          {isAr
            ? `اضغط "ابحث بالذكاء الاصطناعي" للحصول على تحليل ذكي عن "${query}"`
            : `Click "Ask AI" to get intelligent insights about "${query}"`}
        </p>
      )}
    </Card>
  );
}
