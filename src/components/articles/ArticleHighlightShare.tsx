import { memo, useEffect, useState, useCallback, useRef } from "react";
import { Twitter, Facebook, Link2, Quote, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  articleUrl: string;
  isAr?: boolean;
}

export const ArticleHighlightShare = memo(function ArticleHighlightShare({ articleUrl, isAr }: Props) {
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      // Delay hiding to allow button clicks
      timeoutRef.current = setTimeout(() => setSelection(null), 200);
      return;
    }
    const text = sel.toString().trim();
    if (text.length < 10) return;

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelection({
      text: text.slice(0, 280),
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY - 10,
    });
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("touchend", handleSelection);
    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("touchend", handleSelection);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [handleSelection]);

  if (!selection) return null;

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${selection.text}"`)} &url=${encodeURIComponent(articleUrl)}`;

  const copyQuote = async () => {
    try {
      await navigator.clipboard.writeText(`"${selection.text}" — ${articleUrl}`);
      setCopied(true);
      setTimeout(() => { setCopied(false); setSelection(null); }, 1500);
    } catch {}
  };

  return (
    <div
      className="fixed z-50 flex items-center gap-1 rounded-2xl bg-foreground text-background px-2 py-1.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        left: `${Math.min(Math.max(selection.x - 80, 16), window.innerWidth - 180)}px`,
        top: `${selection.y - 48}px`,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        onClick={() => window.open(tweetUrl, "_blank", "noopener")}
        className="h-7 w-7 rounded-lg hover:bg-background/20 flex items-center justify-center transition-colors"
        title="Tweet"
      >
        <Twitter className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={copyQuote}
        className="h-7 w-7 rounded-lg hover:bg-background/20 flex items-center justify-center transition-colors"
        title={isAr ? "نسخ الاقتباس" : "Copy quote"}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Quote className="h-3.5 w-3.5" />}
      </button>
      <button
        onClick={copyQuote}
        className="h-7 w-7 rounded-lg hover:bg-background/20 flex items-center justify-center transition-colors"
        title={isAr ? "نسخ الرابط" : "Copy link"}
      >
        <Link2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
});
