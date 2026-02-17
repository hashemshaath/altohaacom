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
        <div className="rounded-2xl rounded-es-md bg-muted px-4 py-3">
          <div className="flex items-center gap-1.5">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-[10px] text-muted-foreground ms-1.5">
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
