import { useLanguage } from "@/i18n/LanguageContext";
import { Eye, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface PostEngagementBarProps {
  content: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  className?: string;
}

/**
 * Shows read time estimate + engagement rate for a post.
 */
export function PostEngagementBar({
  content,
  likesCount,
  commentsCount,
  repostsCount,
  className,
}: PostEngagementBarProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  // Estimate read time (average reading speed)
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readTimeSeconds = Math.max(5, Math.ceil((wordCount / 200) * 60));
  const readTimeLabel =
    readTimeSeconds < 60
      ? `${readTimeSeconds}${isAr ? "ث" : "s"}`
      : `${Math.ceil(readTimeSeconds / 60)}${isAr ? "د" : "m"}`;

  const totalEngagement = likesCount + commentsCount + repostsCount;

  // Only show if post has some engagement or is long enough
  if (totalEngagement === 0 && wordCount < 20) return null;

  return (
    <div className={cn("flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground/70", className)}>
      {wordCount >= 15 && (
        <span className="flex items-center gap-0.5">
          <Clock className="h-2.5 w-2.5" />
          {readTimeLabel} {isAr ? "قراءة" : "read"}
        </span>
      )}
      {totalEngagement >= 5 && (
        <span className="flex items-center gap-0.5">
          <TrendingUp className="h-2.5 w-2.5" />
          <AnimatedCounter value={totalEngagement} className="inline" /> {isAr ? "تفاعل" : "engagements"}
        </span>
      )}
    </div>
  );
}
