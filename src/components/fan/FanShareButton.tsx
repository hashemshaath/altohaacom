import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Share2, Copy, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FanShareButtonProps {
  title: string;
  url?: string;
  text?: string;
  variant?: "ghost" | "outline" | "secondary";
  size?: "sm" | "icon" | "default";
  className?: string;
}

export function FanShareButton({ title, url, text, variant = "ghost", size = "icon", className }: FanShareButtonProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const shareUrl = url || window.location.href;
  const shareText = text || title;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
      } catch {
        // User cancelled
      }
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: isAr ? "تم النسخ!" : "Link copied!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: isAr ? "فشل النسخ" : "Failed to copy", variant: "destructive" });
    }
  };

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank");
  };

  const shareToTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "_blank");
  };

  // Use native share on mobile
  if (navigator.share) {
    return (
      <Button variant={variant} size={size} className={className} onClick={handleNativeShare}>
        <Share2 className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuItem onClick={handleCopy} className="gap-2">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {isAr ? "نسخ الرابط" : "Copy Link"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToTwitter} className="gap-2">
          <span className="text-sm">𝕏</span>
          {isAr ? "مشاركة في X" : "Share on X"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToWhatsApp} className="gap-2">
          <span className="text-sm">💬</span>
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToTelegram} className="gap-2">
          <span className="text-sm">✈️</span>
          Telegram
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
