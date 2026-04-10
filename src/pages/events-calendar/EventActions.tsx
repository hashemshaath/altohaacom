import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Share2 } from "lucide-react";
import { downloadICS, shareEvent } from "@/lib/icsExport";
import type { GlobalEvent } from "@/hooks/useGlobalEventsCalendar";
import { toast } from "sonner";

export const EventActions = memo(function EventActions({
  event,
  isAr,
  size = "sm",
}: {
  event: GlobalEvent;
  isAr: boolean;
  size?: "sm" | "icon";
}) {
  const handleDownload = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    downloadICS(event);
    toast.success(isAr ? "تم تنزيل ملف التقويم" : "Calendar file downloaded");
  }, [event, isAr]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shared = await shareEvent(event, isAr);
    if (!shared) {
      // Fallback: copy link
      try {
        await navigator.clipboard.writeText(event.link || window.location.href);
        toast.success(isAr ? "تم نسخ الرابط" : "Link copied");
      } catch {
        toast.error(isAr ? "فشل النسخ" : "Failed to copy");
      }
    }
  }, [event, isAr]);

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary"
            onClick={handleDownload}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {isAr ? "إضافة للتقويم" : "Add to Calendar"}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary"
            onClick={handleShare}
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {isAr ? "مشاركة" : "Share"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
});
