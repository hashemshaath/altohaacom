import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { X, ExternalLink, Info, AlertTriangle, CheckCircle2, Sparkles, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_STYLES: Record<string, { icon: LucideIcon; bg: string; border: string; text: string }> = {
  info: { icon: Info, bg: "bg-primary/10", border: "border-primary/20", text: "text-primary" },
  warning: { icon: AlertTriangle, bg: "bg-chart-4/10", border: "border-chart-4/20", text: "text-chart-4" },
  success: { icon: CheckCircle2, bg: "bg-chart-2/10", border: "border-chart-2/20", text: "text-chart-2" },
  promo: { icon: Sparkles, bg: "bg-chart-5/10", border: "border-chart-5/20", text: "text-chart-5" },
};

export const AnnouncementBanner = memo(function AnnouncementBanner() {
  const isAr = useIsAr();
  const { announcements, dismiss } = useAnnouncements();

  if (announcements.length === 0) return null;

  return (
    <div className="space-y-1">
      {announcements.slice(0, 3).map((ann) => {
        const style = TYPE_STYLES[ann.type] || TYPE_STYLES.info;
        const Icon = style.icon;
        const title = isAr ? ann.title_ar || ann.title : ann.title;
        const body = isAr ? ann.body_ar || ann.body : ann.body;
        const linkText = isAr ? ann.link_text_ar || ann.link_text : ann.link_text;

        return (
          <div
            key={ann.id}
            role="alert"
            className={cn(
              "relative flex items-center gap-3 px-4 py-2.5 text-sm border transition-all",
              style.bg, style.border
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", style.text)} />
            <div className="flex-1 min-w-0">
              <span className="font-semibold">{title}</span>
              {body && <span className="text-muted-foreground ms-1.5">{body}</span>}
              {ann.link_url && linkText && (
                <a
                  href={ann.link_url}
                  className={cn("inline-flex items-center gap-1 ms-2 font-medium underline underline-offset-2", style.text)}
                >
                  {linkText}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {ann.is_dismissible && (
              <button
                onClick={() => dismiss(ann.id)}
                className="p-1 rounded-lg hover:bg-foreground/10 transition-colors shrink-0"
                aria-label={isAr ? "إغلاق الإعلان" : "Dismiss announcement"}
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
});
