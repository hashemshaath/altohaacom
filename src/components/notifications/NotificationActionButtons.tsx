import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Check, X, Eye, ExternalLink, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ActionConfig {
  label: string;
  labelAr: string;
  icon: typeof Check;
  variant: "default" | "outline" | "ghost" | "destructive";
  action: string; // "navigate" | "accept" | "reject" | "view"
  target?: string;
}

const typeActions: Record<string, ActionConfig[]> = {
  follow_request: [
    { label: "Accept", labelAr: "قبول", icon: Check, variant: "default", action: "navigate", target: "/community" },
    { label: "Decline", labelAr: "رفض", icon: X, variant: "outline", action: "dismiss" },
  ],
  booth_assignment: [
    { label: "View Booth", labelAr: "عرض الجناح", icon: Eye, variant: "default", action: "navigate" },
  ],
  exhibition_reminder: [
    { label: "View Event", labelAr: "عرض الفعالية", icon: ExternalLink, variant: "default", action: "navigate" },
  ],
  supplier_inquiry: [
    { label: "Reply", labelAr: "رد", icon: MessageCircle, variant: "default", action: "navigate", target: "/company/supplier" },
  ],
  exhibition_review: [
    { label: "View Review", labelAr: "عرض التقييم", icon: Eye, variant: "outline", action: "navigate" },
  ],
};

interface Props {
  notification: { type?: string | null; link?: string | null; id: string };
  onMarkRead: (id: string) => void;
  compact?: boolean;
}

export function NotificationActionButtons({ notification, onMarkRead, compact = true }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();

  const actions = typeActions[notification.type || ""] || [];
  if (actions.length === 0) return null;

  return (
    <div className="flex items-center gap-1 mt-1.5">
      {actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <Button
            key={i}
            variant={action.variant}
            size="sm"
            className={compact ? "h-6 text-[10px] px-2 gap-1" : "h-7 text-xs px-3 gap-1.5"}
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notification.id);
              if (action.action === "navigate") {
                const target = action.target || notification.link;
                if (target) navigate(target);
              }
            }}
          >
            <Icon className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
            {isAr ? action.labelAr : action.label}
          </Button>
        );
      })}
    </div>
  );
}
