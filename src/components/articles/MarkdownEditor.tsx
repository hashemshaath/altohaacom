import { useRef, useState, useCallback, useMemo } from "react";
import { MarkdownToolbar } from "./MarkdownToolbar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Hash, ChevronRight, Maximize2, Minimize2, Languages, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dir?: string;
  minRows?: number;
  isAr?: boolean;
  className?: string;
  contentLang?: "en" | "ar";
  onTranslateContent?: (translated: string) => void;
}

interface TOCItem {
  level: number;
  text: string;
  line: number;
}

function extractTOC(content: string): TOCItem[] {
  const lines = content.split("\n");
  const items: TOCItem[] = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,4})\s+(.+)/);
    if (match) {
      items.push({ level: match[1].length, text: match[2].replace(/[*_`~]/g, ""), line: i });
    }
  }
  return items;
}

export function MarkdownEditor({ value, onChange, placeholder, dir: initialDir, minRows = 16, isAr, className, contentLang, onTranslateContent }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);
  const [direction, setDirection] = useState<"ltr" | "rtl" | "auto">((initialDir as "ltr" | "rtl" | "auto") || "auto");
  const [expanded, setExpanded] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [translating, setTranslating] = useState(false);
  const { toast } = useToast();

  const effectiveDir = direction === "auto" ? (isAr ? "rtl" : "ltr") : direction;

  const toc = useMemo(() => extractTOC(value), [value]);
  const wordCount = useMemo(() => value.trim().split(/\s+/).filter(Boolean).length, [value]);
  const charCount = useMemo(() => value.length, [value]);

  const handleInsert = useCallback((before: string, after: string = "") => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    const newText = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange(newText);
    requestAnimationFrame(() => {
      ta.focus();
      const cursorPos = start + before.length + selected.length + after.length;
      ta.setSelectionRange(
        selected ? cursorPos : start + before.length,
        selected ? cursorPos : start + before.length
      );
    });
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === "b") { e.preventDefault(); handleInsert("**", "**"); }
      if (e.key === "i") { e.preventDefault(); handleInsert("_", "_"); }
      if (e.key === "k") { e.preventDefault(); handleInsert("[", "](url)"); }
    }
    if (e.key === "Tab") { e.preventDefault(); handleInsert("  "); }
    if (e.key === "Enter") {
      const ta = textareaRef.current;
      if (!ta) return;
      const pos = ta.selectionStart;
      const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
      const currentLine = value.substring(lineStart, pos);
      const bulletMatch = currentLine.match(/^(\s*[-*+] )(\[[ x]\] )?/);
      const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s/);
      if (bulletMatch && currentLine.trim() !== "-" && currentLine.trim() !== "*" && currentLine.trim() !== "+") {
        e.preventDefault();
        handleInsert("\n" + bulletMatch[1] + (bulletMatch[2] ? "[ ] " : ""));
      } else if (numberMatch && currentLine.trim() !== `${numberMatch[2]}.`) {
        e.preventDefault();
        handleInsert(`\n${numberMatch[1]}${parseInt(numberMatch[2]) + 1}. `);
      }
    }
  }, [handleInsert, value]);

  const jumpToLine = useCallback((line: number) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const lines = value.split("\n");
    let pos = 0;
    for (let i = 0; i < line && i < lines.length; i++) pos += lines[i].length + 1;
    ta.focus();
    ta.setSelectionRange(pos, pos);
    ta.scrollTop = Math.max(0, line * 20 - 100);
    setPreview(false);
    setShowOutline(false);
  }, [value]);

  const handleTranslateAll = useCallback(async () => {
    if (!value.trim() || !contentLang || !onTranslateContent) return;
    setTranslating(true);
    try {
      const targetLang = contentLang === "en" ? "ar" : "en";
      const { data, error } = await supabase.functions.invoke("ai-translate-seo", {
        body: { text: value, source_lang: contentLang, target_lang: targetLang, optimize_seo: true, field_type: "body" },
      });
      if (error) throw handleSupabaseError(error);
      if (data?.translated) {
        onTranslateContent(data.translated);
        toast({ title: isAr ? "تمت ترجمة المحتوى بالكامل" : "Full content translated" });
      }
    } catch (err: unknown) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err instanceof Error ? err.message : String(err) });
    } finally {
      setTranslating(false);
    }
  }, [value, contentLang, onTranslateContent, isAr, toast]);

  return (
    <div className={cn("rounded-2xl", expanded && "fixed inset-4 z-50 bg-background shadow-2xl flex flex-col", className)}>
      <MarkdownToolbar
        textareaRef={textareaRef}
        onInsert={handleInsert}
        preview={preview}
        onTogglePreview={() => setPreview(!preview)}
        isAr={isAr}
        onDirectionChange={setDirection}
        currentDirection={direction}
      />

      {/* Secondary bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-x border-border/40 bg-muted/20 text-xs text-muted-foreground">
        {toc.length > 0 && (
          <Button type="button" variant="ghost" size="sm" className="h-5 px-1.5 text-xs rounded gap-1" onClick={() => setShowOutline(!showOutline)}>
            <Hash className="h-2.5 w-2.5" />
            {isAr ? `${toc.length} أقسام` : `${toc.length} sections`}
          </Button>
        )}
        <span className="tabular-nums">{wordCount.toLocaleString()} {isAr ? "كلمة" : "words"}</span>
        <span>•</span>
        <span className="tabular-nums">{charCount.toLocaleString()} {isAr ? "حرف" : "chars"}</span>
        {wordCount > 0 && (
          <>
            <span>•</span>
            <span>{Math.max(1, Math.ceil(wordCount / 200))} {isAr ? "د قراءة" : "min read"}</span>
          </>
        )}
        <div className="ms-auto flex items-center gap-1">
          {/* Translate full content button */}
          {onTranslateContent && value.trim() && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 px-2 text-xs rounded gap-1 text-primary hover:text-primary"
              onClick={handleTranslateAll}
              disabled={translating}
            >
              {translating ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Languages className="h-2.5 w-2.5" />}
              {isAr ? `← ترجمة الكل EN` : `→ Translate All AR`}
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" className="h-5 w-5 p-0 rounded" onClick={() => setExpanded(!expanded)}>
            {expanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      <div className={cn("flex", expanded && "flex-1 min-h-0")}>
        {/* Outline Panel */}
        {showOutline && toc.length > 0 && (
          <div className="w-48 shrink-0 border border-t-0 border-e-0 border-border/40 bg-muted/10 overflow-y-auto">
            <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/30">
              {isAr ? "فهرس المحتوى" : "Outline"}
            </p>
            <div className="p-1">
              {toc.map((item, i) => (
                <button
                  key={i}
                  className={cn(
                    "w-full text-start px-2 py-1 text-xs rounded-lg hover:bg-muted/50 transition-colors truncate flex items-center gap-1",
                    item.level === 1 && "font-semibold",
                    item.level === 2 && "ps-4",
                    item.level === 3 && "ps-6 text-muted-foreground",
                    item.level === 4 && "ps-8 text-muted-foreground/70",
                  )}
                  onClick={() => jumpToLine(item.line)}
                >
                  <ChevronRight className="h-2.5 w-2.5 shrink-0 text-primary/50" />
                  <span className="truncate">{item.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Editor / Preview */}
        <div className="flex-1 min-w-0">
          {preview ? (
            <ScrollArea className={cn(expanded ? "h-full" : "min-h-[300px] max-h-[600px]")}>
              <div
                dir={effectiveDir}
                className={cn(
                  "rounded-b-2xl border border-t-0 border-border/40 bg-card p-5 prose prose-sm max-w-none dark:prose-invert",
                  "prose-headings:font-serif prose-p:leading-relaxed prose-img:rounded-xl prose-img:shadow-md",
                  "prose-a:text-primary prose-blockquote:border-primary/30 prose-blockquote:bg-muted/30 prose-blockquote:rounded-e-xl prose-blockquote:py-1",
                  expanded && "min-h-full",
                )}
              >
                <ReactMarkdown>{value || (isAr ? "*لا يوجد محتوى بعد*" : "*No content yet*")}</ReactMarkdown>
              </div>
            </ScrollArea>
          ) : (
            <Textarea
              ref={textareaRef}
              dir={effectiveDir}
              rows={expanded ? undefined : minRows}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                "rounded-t-none rounded-b-2xl border-border/40 text-sm leading-relaxed resize-y",
                expanded ? "h-full resize-none rounded-b-none" : "min-h-[300px]",
                effectiveDir === "rtl" ? "font-[Noto_Sans_Arabic,sans-serif]" : "font-mono",
              )}
            />
          )}
        </div>
      </div>

      {expanded && <div className="fixed inset-0 bg-black/20 -z-10" role="presentation" onClick={() => setExpanded(false)} />}
    </div>
  );
}
