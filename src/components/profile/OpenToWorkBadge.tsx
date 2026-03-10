import { memo } from "react";
import { Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OpenToWorkBadgeProps {
  note?: string | null;
  noteAr?: string | null;
  isAr?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export const OpenToWorkBadge = memo(function OpenToWorkBadge({ note, noteAr, isAr, size = "md", className }: OpenToWorkBadgeProps) {
  const displayNote = isAr ? (noteAr || note) : (note || noteAr);
  
  const badge = (
    <Badge
      variant="default"
      className={`bg-chart-2/15 text-chart-2 border-chart-2/20 hover:bg-chart-2/20 gap-1.5 font-semibold ${
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
      } ${className || ""}`}
    >
      <Briefcase className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {isAr ? "متاح للعمل" : "Open to Work"}
    </Badge>
  );

  if (displayNote) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">{displayNote}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
});
