import { memo } from "react";
import { Clock } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

/** Estimates read time for a post and shows it as a tiny badge */
export const PostReadTime = memo(function PostReadTime({ content }: { content: string }) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const words = content?.trim().split(/\s+/).length || 0;
  const minutes = Math.max(1, Math.ceil(words / 200));

  if (words < 40) return null;

  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
      <Clock className="h-2.5 w-2.5" />
      {minutes} {isAr ? "د قراءة" : "min read"}
    </span>
  );
}
