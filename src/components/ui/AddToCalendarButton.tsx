import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CalendarPlus, Download, ExternalLink } from "lucide-react";
import { downloadICS, getGoogleCalendarUrl, getOutlookCalendarUrl } from "@/lib/calendarSync";
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
  startDate: string;
  endDate?: string;
  description?: string;
  location?: string;
  url?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
  className?: string;
}

export const AddToCalendarButton = memo(function AddToCalendarButton({
  title, startDate, endDate, description, location, url,
  variant = "outline", size = "sm", className,
}: Props) {
  const isAr = useIsAr();
  const event = { title, startDate, endDate, description, location, url };

  const handleDownloadICS = () => {
    downloadICS(event);
    toast({
      title: isAr ? "تم تنزيل الملف" : "Calendar file downloaded",
      description: isAr ? "افتح الملف لإضافته إلى تقويمك" : "Open the file to add it to your calendar",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <CalendarPlus className="h-4 w-4 me-1.5" />
          {isAr ? "أضف للتقويم" : "Add to Calendar"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => window.open(getGoogleCalendarUrl(event), "_blank", "noopener,noreferrer")}>
          <ExternalLink className="h-4 w-4 me-2" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(getOutlookCalendarUrl(event), "_blank", "noopener,noreferrer")}>
          <ExternalLink className="h-4 w-4 me-2" />
          Outlook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadICS}>
          <Download className="h-4 w-4 me-2" />
          {isAr ? "تنزيل .ics (Apple)" : "Download .ics (Apple)"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
