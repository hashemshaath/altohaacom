import { useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import type { Message } from "@/hooks/useMessagesData";

interface QuickReplySuggestionsProps {
  lastMessage: Message | null;
  isAr: boolean;
  onSelect: (text: string) => void;
}

const QUICK_REPLIES_EN = [
  "👍 Sounds good!",
  "Thank you!",
  "I'll get back to you",
  "On it!",
  "Sure, no problem",
  "Let me check",
];

const QUICK_REPLIES_AR = [
  "👍 تمام!",
  "شكراً!",
  "سأعود إليك",
  "على الفور!",
  "طبعاً، لا مشكلة",
  "دقيقة أتأكد",
];

const APPROVAL_REPLIES_EN = ["✅ Approved", "❌ Rejected", "Need more details"];
const APPROVAL_REPLIES_AR = ["✅ موافق", "❌ مرفوض", "أحتاج تفاصيل أكثر"];

const QUESTION_REPLIES_EN = ["Yes", "No", "Maybe", "Let me think about it"];
const QUESTION_REPLIES_AR = ["نعم", "لا", "ربما", "دعني أفكر"];

function isQuestion(content: string): boolean {
  return /\?|؟/.test(content);
}

export const QuickReplySuggestions = memo(function QuickReplySuggestions({ lastMessage, isAr, onSelect }: QuickReplySuggestionsProps) {
  const suggestions = useMemo(() => {
    if (!lastMessage) return isAr ? QUICK_REPLIES_AR.slice(0, 4) : QUICK_REPLIES_EN.slice(0, 4);

    const isApproval = lastMessage.message_type === "approval_request";
    if (isApproval) return isAr ? APPROVAL_REPLIES_AR : APPROVAL_REPLIES_EN;

    if (isQuestion(lastMessage.content)) {
      return isAr ? QUESTION_REPLIES_AR : QUESTION_REPLIES_EN;
    }

    return isAr ? QUICK_REPLIES_AR.slice(0, 4) : QUICK_REPLIES_EN.slice(0, 4);
  }, [lastMessage, isAr]);

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-1">
      <Zap className="h-3 w-3 text-muted-foreground/50 shrink-0" />
      {suggestions.map((text) => (
        <Button
          key={text}
          variant="outline"
          size="sm"
          className="h-7 text-[11px] rounded-xl border-border/30 bg-muted/20 hover:bg-primary/10 hover:text-primary hover:border-primary/30 shrink-0 transition-all active:scale-95"
          onClick={() => onSelect(text)}
          type="button"
        >
          {text}
        </Button>
      ))}
    </div>
  );
}
