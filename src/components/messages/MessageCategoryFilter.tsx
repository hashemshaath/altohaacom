import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Inbox,
  Mail,
  Star,
  CheckSquare,
  Archive,
  MessageCircle,
} from "lucide-react";

export type MessageFilter = "all" | "unread" | "starred" | "approval" | "archived";

interface MessageCategoryFilterProps {
  active: MessageFilter;
  onChange: (filter: MessageFilter) => void;
  counts: {
    all: number;
    unread: number;
    starred: number;
    approval: number;
    archived: number;
  };
}

export function MessageCategoryFilter({ active, onChange, counts }: MessageCategoryFilterProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const filters: { key: MessageFilter; label: string; icon: React.ElementType; count: number }[] = [
    { key: "all", label: isAr ? "الكل" : "All", icon: Inbox, count: counts.all },
    { key: "unread", label: isAr ? "غير مقروء" : "Unread", icon: Mail, count: counts.unread },
    { key: "starred", label: isAr ? "مميز" : "Starred", icon: Star, count: counts.starred },
    { key: "approval", label: isAr ? "الموافقات" : "Approvals", icon: CheckSquare, count: counts.approval },
    { key: "archived", label: isAr ? "المؤرشف" : "Archived", icon: Archive, count: counts.archived },
  ];

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 px-1">
      {filters.map((f) => {
        const Icon = f.icon;
        const isActive = active === f.key;
        return (
          <Button
            key={f.key}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            className="h-7 text-[11px] shrink-0 gap-1"
            onClick={() => onChange(f.key)}
          >
            <Icon className="h-3 w-3" />
            {f.label}
            {f.count > 0 && (
              <Badge variant={isActive ? "secondary" : "outline"} className="h-4 min-w-4 text-[9px] px-1 ms-0.5">
                {f.count}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}
