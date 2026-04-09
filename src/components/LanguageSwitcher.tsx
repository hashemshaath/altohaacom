import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export const LanguageSwitcher = memo(function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setLanguage(language === "en" ? "ar" : "en")}
      className="h-9 w-9 lg:h-auto lg:w-auto lg:gap-1.5 lg:px-3"
      aria-label={language === "en" ? "التبديل إلى العربية" : "Switch to English"}
    >
      <Globe className="h-4 w-4" />
      <span className="hidden lg:inline text-sm font-medium" style={language === "en" ? { fontFamily: '"IBM Plex Arabic", "Noto Sans Arabic", sans-serif', letterSpacing: 0 } : undefined}>
        {language === "en" ? "العربية" : "English"}
      </span>
    </Button>
  );
});
