import { memo } from "react";
import { Check, CheckCheck, Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from "@/i18n/LanguageContext";

interface MessageStatusProps {
  isMine: boolean;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  isPending?: boolean;
}

export const MessageStatus = memo(function MessageStatus({ isMine, isRead, readAt, createdAt, isPending }: MessageStatusProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (!isMine) return null;

  if (isPending) {
    return <Clock className="h-3 w-3 opacity-50" />;
  }

  if (isRead) {
    const readTime = readAt
      ? new Date(readAt).toLocaleTimeString(isAr ? "ar" : "en", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <CheckCheck className="h-3 w-3 text-sky-400" />
            </span>
          </TooltipTrigger>
          {readTime && (
            <TooltipContent side="top" className="text-xs">
              {isAr ? `قُرئت ${readTime}` : `Read at ${readTime}`}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Sent / delivered (single check = sent, double gray = delivered)
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <CheckCheck className="h-3 w-3 opacity-60" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {isAr ? "تم التوصيل" : "Delivered"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
