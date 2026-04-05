import { memo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Trophy, TrendingUp, Flame, Target, BarChart3 } from "lucide-react";

const STORAGE_KEY = "altoha_reading_stats";

interface ReadingStats {
  articlesRead: number;
  totalMinutes: number;
  totalWords: number;
  streak: number;
  lastReadDate: string;
  favoriteType: string;
  typeCounts: Record<string, number>;
}

function loadStats(): ReadingStats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    articlesRead: 0,
    totalMinutes: 0,
    totalWords: 0,
    streak: 0,
    lastReadDate: "",
    favoriteType: "",
    typeCounts: {},
  };
}

function saveStats(stats: ReadingStats) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); } catch {}
}

function getLevel(articles: number): { level: number; title: string; titleAr: string; next: number; progress: number } {
  const levels = [
    { min: 0, title: "Newcomer", titleAr: "مبتدئ" },
    { min: 5, title: "Regular Reader", titleAr: "قارئ منتظم" },
    { min: 15, title: "Knowledge Seeker", titleAr: "باحث عن المعرفة" },
    { min: 30, title: "Expert Reader", titleAr: "قارئ خبير" },
    { min: 50, title: "Master Scholar", titleAr: "عالم متمرس" },
    { min: 100, title: "Legend", titleAr: "أسطورة" },
  ];
  let current = levels[0];
  let nextLevel = levels[1];
  for (let i = levels.length - 1; i >= 0; i--) {
    if (articles >= levels[i].min) {
      current = levels[i];
      nextLevel = levels[i + 1] || levels[i];
      break;
    }
  }
  const progress = nextLevel.min > current.min
    ? Math.min(100, Math.round(((articles - current.min) / (nextLevel.min - current.min)) * 100))
    : 100;
  return { level: levels.indexOf(current) + 1, title: current.title, titleAr: current.titleAr, next: nextLevel.min, progress };
}

export const NewsReadingStats = memo(function NewsReadingStats({ isAr }: { isAr: boolean }) {
  const [stats, setStats] = useState<ReadingStats>(loadStats);

  const level = getLevel(stats.articlesRead);

  return (
    <Card className="rounded-2xl border-border/40 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">{isAr ? "إحصائيات القراءة" : "Reading Stats"}</h3>
        </div>

        {/* Level badge */}
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15 p-3 mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold">{isAr ? level.titleAr : level.title}</span>
            </div>
            <Badge variant="outline" className="text-[9px] px-1.5 border-primary/20 text-primary">
              Lv.{level.level}
            </Badge>
          </div>
          <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${level.progress}%` }}
            />
          </div>
          <p className="text-[9px] text-muted-foreground mt-1">
            {level.progress < 100
              ? (isAr ? `${level.next - stats.articlesRead} مقال للمستوى التالي` : `${level.next - stats.articlesRead} articles to next level`)
              : (isAr ? "أعلى مستوى! 🎉" : "Max level! 🎉")}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/30 p-2.5 text-center">
            <BookOpen className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold tabular-nums">{stats.articlesRead}</p>
            <p className="text-[9px] text-muted-foreground">{isAr ? "مقالات مقروءة" : "Articles Read"}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-2.5 text-center">
            <Clock className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold tabular-nums">{stats.totalMinutes}</p>
            <p className="text-[9px] text-muted-foreground">{isAr ? "دقائق قراءة" : "Minutes Read"}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-2.5 text-center">
            <Flame className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold tabular-nums">{stats.streak}</p>
            <p className="text-[9px] text-muted-foreground">{isAr ? "أيام متتالية" : "Day Streak"}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-2.5 text-center">
            <Target className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold tabular-nums">{(stats.totalWords / 1000).toFixed(1)}k</p>
            <p className="text-[9px] text-muted-foreground">{isAr ? "كلمات مقروءة" : "Words Read"}</p>
          </div>
        </div>

        {/* Favorite type */}
        {stats.favoriteType && (
          <div className="mt-2.5 flex items-center gap-2 text-[10px] text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            {isAr ? "نوع مفضل:" : "Favorite:"} <span className="font-medium text-foreground capitalize">{stats.favoriteType}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

/** Call this when a user finishes reading an article */
export function trackArticleRead(articleType: string, readingTimeMinutes: number, wordCount: number) {
  const stats = loadStats();
  const today = new Date().toDateString();
  const wasYesterday = stats.lastReadDate
    ? new Date(stats.lastReadDate).toDateString() === new Date(Date.now() - 86400000).toDateString()
    : false;
  const isToday = stats.lastReadDate && new Date(stats.lastReadDate).toDateString() === today;

  stats.articlesRead++;
  stats.totalMinutes += readingTimeMinutes;
  stats.totalWords += wordCount;
  stats.typeCounts[articleType] = (stats.typeCounts[articleType] || 0) + 1;
  stats.lastReadDate = today;

  if (!isToday) {
    stats.streak = wasYesterday ? stats.streak + 1 : 1;
  }

  // Find favorite type
  let maxCount = 0;
  Object.entries(stats.typeCounts).forEach(([type, count]) => {
    if (count > maxCount) { maxCount = count; stats.favoriteType = type; }
  });

  saveStats(stats);
}
