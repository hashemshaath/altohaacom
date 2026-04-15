import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

interface TypingIndicatorProps {
  partnerName?: string;
}

export const TypingIndicator = memo(function TypingIndicator({ partnerName }: TypingIndicatorProps) {
  const isAr = useIsAr();

  return (
    <div className="flex justify-start animate-in fade-in-50 slide-in-from-bottom-2 duration-300 mb-2">
      <div className="flex items-end gap-2 max-w-[75%]">
        <div className="rounded-2xl rounded-es-md bg-muted/80 backdrop-blur-sm px-4 py-2.5 shadow-sm border border-border/20">
          <div className="flex items-center gap-2.5">
            <div className="flex gap-[4px]">
              <span className="h-[6px] w-[6px] rounded-full bg-primary/60 animate-bounce [animation-delay:0ms] [animation-duration:1.2s]" />
              <span className="h-[6px] w-[6px] rounded-full bg-primary/50 animate-bounce [animation-delay:200ms] [animation-duration:1.2s]" />
              <span className="h-[6px] w-[6px] rounded-full bg-primary/40 animate-bounce [animation-delay:400ms] [animation-duration:1.2s]" />
            </div>
            <span className="text-[12px] text-muted-foreground font-medium">
              {partnerName
                ? isAr ? `${partnerName} يكتب...` : `${partnerName} is typing...`
                : isAr ? "يكتب..." : "typing..."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
