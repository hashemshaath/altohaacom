import { memo } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

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
      await navigator.clipboard.writeText(fullUrl).then(null, () => {});
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
