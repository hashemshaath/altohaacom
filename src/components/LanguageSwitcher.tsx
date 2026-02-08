import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === "en" ? "ar" : "en")}
      className="gap-1.5"
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm font-medium">
        {language === "en" ? "العربية" : "English"}
      </span>
    </Button>
  );
}
