import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Twitter, Facebook, Linkedin, Link2, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SocialShareButtonsProps {
  title: string;
  participantName: string;
  rank: number;
  score: number;
  competitionUrl: string;
}

export const SocialShareButtons = memo(function SocialShareButtons({
  title,
  participantName,
  rank,
  score,
  competitionUrl,
}: SocialShareButtonsProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const getRankLabel = (rank: number) => {
    if (language === "ar") {
      if (rank === 1) return "المركز الأول 🥇";
      if (rank === 2) return "المركز الثاني 🥈";
      if (rank === 3) return "المركز الثالث 🥉";
      return `المركز ${rank}`;
    }
    if (rank === 1) return "1st Place 🥇";
    if (rank === 2) return "2nd Place 🥈";
    if (rank === 3) return "3rd Place 🥉";
    return `${rank}th Place`;
  };

  const shareText =
    language === "ar"
      ? `🏆 ${participantName} حصل على ${getRankLabel(rank)} في ${title} بنتيجة ${score.toFixed(1)}!\n\nشاهد النتائج الكاملة:`
      : `🏆 ${participantName} achieved ${getRankLabel(rank)} in ${title} with a score of ${score.toFixed(1)}!\n\nView full results:`;

  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(competitionUrl);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(competitionUrl);
      setCopied(true);
      toast({
        title: language === "ar" ? "تم النسخ!" : "Link copied!",
        description: language === "ar" ? "تم نسخ الرابط إلى الحافظة" : "Link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: "destructive",
        title: language === "ar" ? "فشل النسخ" : "Copy failed",
        description: language === "ar" ? "لم نتمكن من نسخ الرابط" : "Could not copy the link",
      });
    }
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], "_blank", "width=600,height=400");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          {language === "ar" ? "مشاركة" : "Share"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleShare("twitter")} className="cursor-pointer gap-2">
          <Twitter className="h-4 w-4" />
          Twitter / X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("facebook")} className="cursor-pointer gap-2">
          <Facebook className="h-4 w-4" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("linkedin")} className="cursor-pointer gap-2">
          <Linkedin className="h-4 w-4" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer gap-2">
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4" />}
          {language === "ar" ? "نسخ الرابط" : "Copy Link"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
