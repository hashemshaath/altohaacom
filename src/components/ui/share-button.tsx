import { memo } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Props {
  title: string;
  url: string;
  isAr?: boolean;
  className?: string;
}

export const ShareButton = memo(function ShareButton({ title, url, isAr, className }: Props) {
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fullUrl = `${window.location.origin}${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url: fullUrl });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(fullUrl);
      toast({ title: isAr ? "تم نسخ الرابط" : "Link copied!" });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-7 w-7 rounded-full bg-background/70 backdrop-blur-sm hover:bg-background shadow-sm ${className || ""}`}
      onClick={handleShare}
      aria-label={isAr ? "مشاركة" : "Share"}
    >
      <Share2 className="h-3 w-3" />
    </Button>
  );
});
