import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { NewsArticle } from "./NewsArticleCard";

interface Props {
  articles: NewsArticle[];
  isAr: boolean;
  onMonthClick?: (from: string, to: string) => void;
}

export const NewsArchiveWidget = memo(function NewsArchiveWidget({ articles, isAr, onMonthClick }: Props) {
  const archiveMonths = useMemo(() => {
    const monthMap = new Map<string, { count: number; label: string; from: string; to: string }>();

    articles.forEach((a) => {
      const date = new Date(a.published_at || a.created_at);
      const key = format(date, "yyyy-MM");
      if (!monthMap.has(key)) {
        const label = format(date, "MMMM yyyy", { locale: isAr ? ar : enUS });
        const from = `${key}-01`;
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        const to = `${key}-${String(lastDay).padStart(2, "0")}`;
        monthMap.set(key, { count: 0, label, from, to });
      }
      monthMap.get(key)!.count++;
    });

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 8)
      .map(([key, val]) => ({ key, ...val }));
  }, [articles, isAr]);

  if (archiveMonths.length === 0) return null;

  return (
    <Card className="rounded-2xl border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-bold">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          {isAr ? "الأرشيف" : "Archive"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <ul className="space-y-0.5">
          {archiveMonths.map((month) => (
            <li key={month.key}>
              <button
                onClick={() => onMonthClick?.(month.from, month.to)}
                className="group flex items-center justify-between w-full rounded-lg px-2.5 py-2 text-xs transition-colors hover:bg-muted/50"
              >
                <span className="group-hover:text-primary transition-colors capitalize">{month.label}</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <span className="tabular-nums text-[10px] bg-muted rounded-md px-1.5 py-0.5">{month.count}</span>
                  <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity rtl:rotate-180" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
});
