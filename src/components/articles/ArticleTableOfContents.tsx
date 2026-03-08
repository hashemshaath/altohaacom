import { useMemo } from "react";
import { List } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
  isAr?: boolean;
}

interface Heading {
  level: number;
  text: string;
  id: string;
}

function extractHeadings(md: string): Heading[] {
  const lines = md.split("\n");
  const headings: Heading[] = [];
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (match) {
      const text = match[2].replace(/[*_`\[\]]/g, "").trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 60);
      headings.push({ level: match[1].length, text, id });
    }
  }
  return headings;
}

export function ArticleTableOfContents({ content, isAr }: Props) {
  const headings = useMemo(() => extractHeadings(content), [content]);

  if (headings.length < 2) return null;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-4" aria-label="Table of contents">
      <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <List className="h-3.5 w-3.5" />
        {isAr ? "جدول المحتويات" : "Table of Contents"}
      </div>
      <ol className="space-y-1">
        {headings.map((h, i) => (
          <li key={i}>
            <button
              onClick={() => scrollTo(h.id)}
              className={cn(
                "w-full text-start text-sm py-1 px-2 rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground leading-snug",
                h.level === 1 && "font-semibold text-foreground",
                h.level === 2 && "ps-4",
                h.level === 3 && "ps-8 text-xs"
              )}
            >
              {h.text}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
