import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { HelpCircle, MessageCircle, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { LiveChatWidget } from "@/components/support/LiveChatWidget";

export function FloatingHelpButton() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  return (
    <>
      <div className="fixed bottom-6 end-6 z-40">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="h-11 w-11 rounded-full shadow-lg border-primary/20 bg-card hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to="/help" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                {isAr ? "مركز المساعدة" : "Help Center"}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/support" className="gap-2">
                <Ticket className="h-4 w-4" />
                {isAr ? "تذاكر الدعم" : "Support Tickets"}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {user && <LiveChatWidget />}
    </>
  );
}
