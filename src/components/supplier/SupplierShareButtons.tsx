import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, ExternalLink } from "lucide-react";

interface SupplierShareButtonsProps {
  companyName: string;
  companyId: string;
}

export const SupplierShareButtons = memo(function SupplierShareButtons({ companyName, companyId }: SupplierShareButtonsProps) {
  const isAr = useIsAr();
  const { toast } = useToast();
  const url = `${window.location.origin}/pro-suppliers/${companyId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(null, () => {});
    toast({ title: isAr ? "تم نسخ الرابط" : "Link copied" });
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: companyName, url });
        return;
      } catch {
        // Permission denied or cancelled — fallback to copy
      }
    }
    copyLink();
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
});
