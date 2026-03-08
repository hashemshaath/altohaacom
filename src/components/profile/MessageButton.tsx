import { memo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface MessageButtonProps {
  userId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const MessageButton = memo(function MessageButton({ userId, variant = "outline", size = "sm", className }: MessageButtonProps) {
  const { user } = useAuth();
  const { language } = useLanguage();

  // Don't show if viewing own profile or not logged in
  if (!user || user.id === userId) {
    return null;
  }

  return (
    <Button variant={variant} size={size} asChild className={className}>
      <Link to={`/messages?user=${userId}`} className="gap-2">
        <MessageSquare className="h-4 w-4" />
        {size !== "icon" && (language === "ar" ? "مراسلة" : "Message")}
      </Link>
    </Button>
  );
});
