import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function FloatingHelpButton() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="fixed bottom-6 end-6 z-40">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            size="icon"
            variant="outline"
            className="h-11 w-11 rounded-full shadow-lg border-primary/20 bg-card hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105"
          >
            <Link to="/help">
              <HelpCircle className="h-5 w-5" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side={isAr ? "left" : "left"}>
          {isAr ? "مركز المساعدة" : "Help Center"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
