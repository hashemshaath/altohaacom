import { memo, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, UserCheck, Shield, KeyRound, Ban, Eye, MessageSquare, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserQuickActionsProps {
  userId: string;
  userName: string;
  email: string | null;
  status: string | null;
  isVerified: boolean | null;
  onViewProfile: () => void;
  onResetPassword?: (userId: string, userName: string) => void;
  onSuspend?: (userId: string, userName: string, email: string | null) => void;
  onSendNotification?: (userId: string, userName: string) => void;
  onActivate?: (userId: string) => void;
}

export const UserQuickActions = memo(function UserQuickActions({
  userId, userName, email, status, isVerified, onViewProfile,
  onResetPassword, onSuspend, onSendNotification, onActivate,
}: UserQuickActionsProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [copied, setCopied] = useState(false);

  const handleToggleVerify = async () => {
    const { error } = await supabase.from("profiles").update({ is_verified: !isVerified }).eq("user_id", userId);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    await supabase.from("admin_actions").insert({ admin_id: user!.id, target_user_id: userId, action_type: isVerified ? "unverify_user" : "verify_user", details: {} });
    queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    toast({ title: isAr ? (isVerified ? "تم إلغاء التوثيق" : "تم التوثيق") : (isVerified ? "Unverified" : "Verified") });
  };

  const handleActivate = async () => {
    if (onActivate) {
      onActivate(userId);
    } else {
      const { error } = await supabase.from("profiles").update({ account_status: "active", suspended_reason: null, suspended_at: null }).eq("user_id", userId);
      if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: isAr ? "تم تفعيل الحساب" : "Account activated" });
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onViewProfile}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isAr ? "عرض" : "View"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleToggleVerify}>
              {isVerified ? <UserCheck className="h-3.5 w-3.5 text-primary" /> : <Shield className="h-3.5 w-3.5 text-muted-foreground" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isAr ? (isVerified ? "إلغاء التوثيق" : "توثيق") : (isVerified ? "Unverify" : "Verify")}</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onSendNotification && (
              <DropdownMenuItem onClick={() => onSendNotification(userId, userName)}>
                <MessageSquare className="me-2 h-3.5 w-3.5" />
                {isAr ? "إرسال إشعار" : "Send Notification"}
              </DropdownMenuItem>
            )}
            {onResetPassword && (
              <DropdownMenuItem onClick={() => onResetPassword(userId, userName)}>
                <KeyRound className="me-2 h-3.5 w-3.5" />
                {isAr ? "إعادة تعيين كلمة المرور" : "Reset Password"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={copyId}>
              {copied ? <Check className="me-2 h-3.5 w-3.5 text-primary" /> : <Copy className="me-2 h-3.5 w-3.5" />}
              {isAr ? "نسخ المعرف" : "Copy User ID"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {status === "active" ? (
              onSuspend ? (
                <DropdownMenuItem onClick={() => onSuspend(userId, userName, email)} className="text-destructive">
                  <Ban className="me-2 h-3.5 w-3.5" />
                  {isAr ? "إيقاف الحساب" : "Suspend Account"}
                </DropdownMenuItem>
              ) : null
            ) : (
              <DropdownMenuItem onClick={handleActivate} className="text-primary">
                <UserCheck className="me-2 h-3.5 w-3.5" />
                {isAr ? "تفعيل الحساب" : "Activate Account"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
});
