import { useMemo, memo } from "react";

interface Props {
  text: string;
  query: string;
  className?: string;
}

/**
 * Highlights matching search terms within text.
 * Splits query into words and wraps matches in <mark>.
 */
export const HighlightText = memo(function HighlightText({ text, query, className }: Props) {
  const parts = useMemo(() => {
    if (!query || query.length < 2 || !text) return [{ text, highlight: false }];
    
    const words = query.trim().split(/\s+/).filter(w => w.length >= 2);
    if (words.length === 0) return [{ text, highlight: false }];

    const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`(${escaped.join("|")})`, "gi");
    
    const result: { text: string; highlight: boolean }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        result.push({ text: text.slice(lastIndex, match.index), highlight: false });
      }
      result.push({ text: match[0], highlight: true });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      result.push({ text: text.slice(lastIndex), highlight: false });
    }

    return result.length > 0 ? result : [{ text, highlight: false }];
  }, [text, query]);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.highlight ? (
          <mark key={i} className="bg-primary/15 text-foreground rounded-sm px-0.5">{part.text}</mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </span>
  );
});
