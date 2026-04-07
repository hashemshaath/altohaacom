import { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MessageSquare, Plus, X, Send, Highlighter, CornerDownRight } from "lucide-react";

interface Annotation {
  id: string;
  text: string;
  note: string;
  color: string;
  createdAt: Date;
}

const COLORS = [
  { value: "bg-yellow-200/40 border-yellow-400/40", label: "Yellow" },
  { value: "bg-blue-200/40 border-blue-400/40", label: "Blue" },
  { value: "bg-green-200/40 border-green-400/40", label: "Green" },
  { value: "bg-pink-200/40 border-pink-400/40", label: "Pink" },
];

const STORAGE_KEY = "altoha_annotations";

function loadAnnotations(articleId: string): Annotation[] {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${articleId}`);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveAnnotations(articleId: string, annotations: Annotation[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${articleId}`, JSON.stringify(annotations));
  } catch {}
}

export const ArticleAnnotations = memo(function ArticleAnnotations({
  articleId, isAr,
}: { articleId: string; isAr: boolean }) {
  const [annotations, setAnnotations] = useState<Annotation[]>(() => loadAnnotations(articleId));
  const [isOpen, setIsOpen] = useState(false);
  const [activeColor, setActiveColor] = useState(COLORS[0].value);
  const [noteText, setNoteText] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [mode, setMode] = useState<"idle" | "capturing">("idle");

  const handleCapture = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 2) {
      setSelectedText(text);
      setMode("capturing");
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!selectedText) return;
    const newAnnotation: Annotation = {
      id: crypto.randomUUID(),
      text: selectedText.slice(0, 200),
      note: noteText.trim(),
      color: activeColor,
      createdAt: new Date(),
    };
    const updated = [newAnnotation, ...annotations];
    setAnnotations(updated);
    saveAnnotations(articleId, updated);
    setSelectedText("");
    setNoteText("");
    setMode("idle");
    window.getSelection()?.removeAllRanges();
  }, [selectedText, noteText, activeColor, annotations, articleId]);

  const handleDelete = useCallback((id: string) => {
    const updated = annotations.filter(a => a.id !== id);
    setAnnotations(updated);
    saveAnnotations(articleId, updated);
  }, [annotations, articleId]);

  return (
    <>
      {/* Floating trigger button */}
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "rounded-xl h-8 gap-1.5 text-xs shrink-0 border-border/40",
          isOpen && "bg-primary/10 text-primary border-primary/30"
        )}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setMode("idle");
        }}
      >
        <Highlighter className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{isAr ? "تعليقات" : "Notes"}</span>
        {annotations.length > 0 && (
          <Badge variant="secondary" className="text-[12px] h-4 px-1 min-w-[16px] justify-center">
            {annotations.length}
          </Badge>
        )}
      </Button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed top-14 end-4 z-40 w-80 max-h-[70vh] bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border/30">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">{isAr ? "ملاحظاتي" : "My Notes"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant={mode === "capturing" ? "default" : "outline"}
                size="sm"
                className="h-7 text-[12px] rounded-lg gap-1"
                onClick={handleCapture}
              >
                <Plus className="h-3 w-3" />
                {mode === "capturing" ? (isAr ? "حفظ التحديد" : "Selection ready") : (isAr ? "تحديد نص" : "Capture text")}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsOpen(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Capture area */}
          {mode === "capturing" && selectedText && (
            <div className="p-3 border-b border-border/30 bg-muted/30 space-y-2">
              <div className={cn("rounded-lg border p-2 text-xs line-clamp-3", activeColor)}>
                "{selectedText}"
              </div>
              <div className="flex items-center gap-1 mb-1.5">
                {COLORS.map(c => (
                  <button
                    key={c.label}
                    className={cn("h-5 w-5 rounded-full border-2 transition-transform", c.value, activeColor === c.value && "scale-125 ring-2 ring-primary/30")}
                    onClick={() => setActiveColor(c.value)}
                  />
                ))}
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder={isAr ? "أضف ملاحظة..." : "Add a note..."}
                  className="flex-1 h-7 text-xs rounded-lg border border-border/40 bg-background px-2 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  onKeyDown={e => e.key === "Enter" && handleSave()}
                />
                <Button size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={handleSave}>
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Annotations list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {annotations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Highlighter className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">{isAr ? "حدد نصاً لإضافة ملاحظة" : "Select text to add a note"}</p>
              </div>
            ) : (
              annotations.map(a => (
                <div key={a.id} className={cn("rounded-xl border p-2.5 group relative", a.color)}>
                  <p className="text-[12px] font-medium line-clamp-2 mb-1">"{a.text}"</p>
                  {a.note && (
                    <p className="text-[12px] text-muted-foreground flex items-start gap-1 mt-1">
                      <CornerDownRight className="h-2.5 w-2.5 mt-0.5 shrink-0" />
                      {a.note}
                    </p>
                  )}
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="absolute top-1.5 end-1.5 h-5 w-5 rounded-md bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
});
