import { useMemo, useEffect, useState } from "react";
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
  const [activeId, setActiveId] = useState<string>("");

  // Scroll-spy: track which heading is currently in view
  useEffect(() => {
    if (headings.length < 2) return;
    const ids = headings.map((h) => h.id);
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first intersecting heading
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-4" aria-label="Table of contents">
      <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <List className="h-3.5 w-3.5" />
        {isAr ? "جدول المحتويات" : "Contents"}
      </div>
      <ol className="space-y-0.5 relative">
        {/* Active indicator line */}
        <div className="absolute start-0 top-0 bottom-0 w-[2px] bg-border/20 rounded-full" />
        {headings.map((h, i) => {
          const isActive = h.id === activeId;
          return (
            <li key={i} className="relative">
              {isActive && (
                <div className="absolute start-0 top-1 bottom-1 w-[2px] bg-primary rounded-full transition-all duration-300" />
              )}
              <button
                onClick={() => scrollTo(h.id)}
                className={cn(
                  "w-full text-start text-[13px] py-1.5 ps-3 pe-2 rounded-lg transition-all duration-200 leading-snug",
                  isActive
                    ? "text-primary font-medium bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  h.level === 1 && "font-semibold",
                  h.level === 2 && "ps-5",
                  h.level === 3 && "ps-7 text-xs"
                )}
              >
                {h.text}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
