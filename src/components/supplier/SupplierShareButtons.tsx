import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, ExternalLink } from "lucide-react";

interface SupplierShareButtonsProps {
  companyName: string;
  companyId: string;
}

export function SupplierShareButtons({ companyName, companyId }: SupplierShareButtonsProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";
  const url = `${window.location.origin}/pro-suppliers/${companyId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast({ title: isAr ? "تم نسخ الرابط" : "Link copied" });
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({ title: companyName, url });
    } else {
      copyLink();
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={copyLink}>
        <Copy className="me-1.5 h-3.5 w-3.5" />
        {isAr ? "نسخ" : "Copy"}
      </Button>
      <Button variant="outline" size="sm" onClick={shareNative}>
        <Share2 className="me-1.5 h-3.5 w-3.5" />
        {isAr ? "مشاركة" : "Share"}
      </Button>
    </div>
  );
}
