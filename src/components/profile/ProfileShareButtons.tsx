import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Check, Twitter, Facebook, Linkedin, Send } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProfileShareButtonsProps {
  username: string;
  displayName: string;
  variant?: "icon" | "full";
}

export function ProfileShareButtons({ username, displayName, variant = "icon" }: ProfileShareButtonsProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const profileUrl = `https://altoha.com/${username}`;
  const shareText = isAr
    ? `تعرّف على ${displayName} على الطهاة - Altohaa`
    : `Check out ${displayName}'s profile on Altohaa`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast({ title: isAr ? "تم نسخ الرابط" : "Link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    {
      label: isAr ? "نسخ الرابط" : "Copy Link",
      icon: copied ? Check : Copy,
      action: copyLink,
    },
    {
      label: "X / Twitter",
      icon: Twitter,
      action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`, "_blank"),
    },
    {
      label: "LinkedIn",
      icon: Linkedin,
      action: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`, "_blank"),
    },
    {
      label: "Facebook",
      icon: Facebook,
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`, "_blank"),
    },
    {
      label: "WhatsApp",
      icon: Send,
      action: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + profileUrl)}`, "_blank"),
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "icon" ? (
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
            <Share2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            {isAr ? "مشاركة" : "Share"}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {shareLinks.map((link) => (
          <DropdownMenuItem key={link.label} onClick={link.action} className="gap-2 cursor-pointer">
            <link.icon className="h-4 w-4" />
            {link.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
