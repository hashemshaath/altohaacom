import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Share2, Bookmark, MessageCircle, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Props {
  postId: string;
  title?: string;
  className?: string;
}

/**
 * Quick share bar with native Web Share + haptic feedback for post cards.
 */
export const PostQuickShare = memo(function PostQuickShare({ postId, title, className }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  const handleShare = async () => {
    try { if ("vibrate" in navigator) navigator.vibrate(8); } catch {}
    const url = `${window.location.origin}/community/post/${postId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: title || "Post", url });
        return;
      } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(url);
    toast({ title: isAr ? "تم نسخ الرابط!" : "Link copied!" });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors", className)}
      onClick={handleShare}
      aria-label={isAr ? "مشاركة" : "Share"}
    >
      <Share2 className="h-3.5 w-3.5" />
    </Button>
  );
});
