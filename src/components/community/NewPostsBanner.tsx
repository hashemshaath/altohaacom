import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewPostsBannerProps {
  count: number;
  onClick: () => void;
}

export const NewPostsBanner = memo(function NewPostsBanner({ count, onClick }: NewPostsBannerProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (count <= 0) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "sticky top-12 z-20 w-full flex items-center justify-center gap-2 py-2.5",
        "bg-primary text-primary-foreground text-sm font-semibold",
        "shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all",
        "animate-in slide-in-from-top duration-300"
      )}
    >
      <ArrowUp className="h-4 w-4" />
      {isAr
        ? `${count} منشور${count > 1 ? "ات" : ""} جديد${count > 1 ? "ة" : ""}`
        : `${count} new post${count > 1 ? "s" : ""}`}
    </button>
  );
}
