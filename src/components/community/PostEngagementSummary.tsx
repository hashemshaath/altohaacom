import { useLanguage } from "@/i18n/LanguageContext";
import { formatNumber } from "@/lib/formatNumber";
import { Eye, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  likesCount: number;
  commentsCount: number;
  repostsCount?: number;
  viewCount?: number;
}

/**
 * Compact engagement metrics displayed below a post.
 * Shows view count + trending indicator when engagement is high.
 */
export function PostEngagementSummary({ likesCount, commentsCount, repostsCount = 0, viewCount }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const totalEngagement = likesCount + commentsCount * 2 + repostsCount * 3;
  const isTrending = totalEngagement >= 10;

  return (
    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
      {viewCount != null && viewCount > 0 && (
        <span className="inline-flex items-center gap-0.5">
          <Eye className="h-2.5 w-2.5" />
          {formatNumber(viewCount)}
        </span>
      )}
      {isTrending && (
        <span className={cn(
          "inline-flex items-center gap-0.5 font-semibold",
          "text-chart-4"
        )}>
          <TrendingUp className="h-2.5 w-2.5" />
          {isAr ? "رائج" : "Trending"}
        </span>
      )}
    </div>
  );
}
