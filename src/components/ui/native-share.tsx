import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NativeShareProps {
  title: string;
  text?: string;
  url?: string;
  isAr?: boolean;
  variant?: "ghost" | "outline" | "default" | "secondary";
  size?: "icon" | "sm" | "default";
  className?: string;
}

/**
 * Universal share button: uses Web Share API on supported platforms,
 * falls back to clipboard copy with visual feedback.
 */
export const NativeShare = memo(function NativeShare({
  title,
  text,
  url,
  isAr = false,
  variant = "ghost",
  size = "icon",
  className,
}: NativeShareProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const shareUrl = url || window.location.href;

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({ title, text: text || title, url: shareUrl });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: isAr ? "تم نسخ الرابط" : "Link copied",
        description: isAr ? "تم نسخ الرابط إلى الحافظة" : "Link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: "destructive",
        title: isAr ? "فشل النسخ" : "Copy failed",
      });
    }
  }, [title, text, shareUrl, isAr, toast]);

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("transition-all", className)}
      onClick={handleShare}
      aria-label={isAr ? "مشاركة" : "Share"}
    >
      {copied ? (
        <Check className="h-4 w-4 text-chart-2" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </Button>
  );
});
