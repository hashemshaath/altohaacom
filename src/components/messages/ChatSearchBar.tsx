import { useState, useCallback, useEffect, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChatSearchBarProps {
  messages: Array<{ id: string; content: string }>;
  onHighlight: (messageId: string | null) => void;
  onClose: () => void;
}

export function ChatSearchBar({ messages, onHighlight, onClose }: ChatSearchBarProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [query, setQuery] = useState("");
  const [matchIds, setMatchIds] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const search = useCallback(
    (q: string) => {
      if (!q.trim()) {
        setMatchIds([]);
        onHighlight(null);
        return;
      }
      const lower = q.toLowerCase();
      const ids = messages.filter((m) => m.content.toLowerCase().includes(lower)).map((m) => m.id);
      setMatchIds(ids);
      setCurrentIdx(0);
      if (ids.length > 0) onHighlight(ids[0]);
      else onHighlight(null);
    },
    [messages, onHighlight]
  );

  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  const goTo = (dir: 1 | -1) => {
    if (matchIds.length === 0) return;
    const next = (currentIdx + dir + matchIds.length) % matchIds.length;
    setCurrentIdx(next);
    onHighlight(matchIds[next]);
  };

  return (
    <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2 bg-muted/10 animate-fade-in">
      <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <Input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={isAr ? "بحث في الرسائل..." : "Search in messages..."}
        className="h-7 text-xs border-0 bg-transparent shadow-none focus-visible:ring-0 p-0"
        onKeyDown={(e) => {
          if (e.key === "Enter") goTo(1);
          if (e.key === "Escape") onClose();
        }}
      />
      {matchIds.length > 0 && (
        <>
          <Badge variant="secondary" className="text-[10px] shrink-0 font-mono">
            {currentIdx + 1}/{matchIds.length}
          </Badge>
          <div className="flex shrink-0">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => goTo(-1)}>
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => goTo(1)}>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
      {query && matchIds.length === 0 && (
        <span className="text-[10px] text-muted-foreground shrink-0">
          {isAr ? "لا نتائج" : "No results"}
        </span>
      )}
      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onClose}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
