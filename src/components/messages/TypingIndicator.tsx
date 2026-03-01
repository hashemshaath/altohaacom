import { useLanguage } from "@/i18n/LanguageContext";

interface TypingIndicatorProps {
  partnerName?: string;
}

export function TypingIndicator({ partnerName }: TypingIndicatorProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="flex justify-start animate-fade-in mb-2">
      <div className="flex items-end gap-2 max-w-[75%]">
        <div className="rounded-2xl rounded-es-md bg-muted/80 backdrop-blur-sm px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex gap-[3px]">
              <span className="h-[7px] w-[7px] rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
              <span className="h-[7px] w-[7px] rounded-full bg-primary/50 animate-bounce [animation-delay:150ms]" />
              <span className="h-[7px] w-[7px] rounded-full bg-primary/40 animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">
              {partnerName
                ? isAr ? `${partnerName} يكتب...` : `${partnerName} is typing...`
                : isAr ? "يكتب..." : "typing..."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
