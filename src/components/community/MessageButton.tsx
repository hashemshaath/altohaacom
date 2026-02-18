import { forwardRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MessageButtonProps {
  userId: string;
  className?: string;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "icon" | "default";
  iconOnly?: boolean;
}

export const MessageButton = forwardRef<HTMLButtonElement, MessageButtonProps>(function MessageButton({ userId, className = "", variant = "ghost", size = "icon", iconOnly = true }, ref) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();

  if (!user || user.id === userId) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/messages?user=${userId}`);
  };

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={`rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 ${className}`}
      onClick={handleClick}
      title={isAr ? "إرسال رسالة" : "Send message"}
    >
      <MessageCircle className="h-4 w-4" />
      {!iconOnly && (
        <span className="ms-1.5 text-xs font-semibold">
          {isAr ? "رسالة" : "Message"}
        </span>
      )}
    </Button>
  );
});
