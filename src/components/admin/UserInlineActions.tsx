import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Shield, Ban, UserCheck, KeyRound, Mail, Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

interface UserInlineActionsProps {
  userId: string;
  userName: string;
  accountStatus: string | null;
  isVerified: boolean | null;
  onView: () => void;
  onEdit: () => void;
  onStatusChange: (status: string) => void;
  onResetPassword: () => void;
  onVerifyToggle: () => void;
}

export const UserInlineActions = memo(function UserInlineActions({
  userId,
  userName,
  accountStatus,
  isVerified,
  onView,
  onEdit,
  onStatusChange,
  onResetPassword,
  onVerifyToggle,
}: UserInlineActionsProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const copyId = () => {
    navigator.clipboard.writeText(userId);
    toast({ title: isAr ? "تم نسخ المعرف" : "ID Copied" });
  };

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onView} title={isAr ? "عرض" : "View"}>
        <Eye className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} title={isAr ? "تعديل" : "Edit"}>
        <Edit className="h-3.5 w-3.5" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onVerifyToggle} className="gap-2 text-xs">
            <Shield className="h-3.5 w-3.5" />
            {isVerified
              ? (isAr ? "إلغاء التوثيق" : "Unverify")
              : (isAr ? "توثيق" : "Verify")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onResetPassword} className="gap-2 text-xs">
            <KeyRound className="h-3.5 w-3.5" />
            {isAr ? "إعادة تعيين كلمة المرور" : "Reset Password"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyId} className="gap-2 text-xs">
            <Copy className="h-3.5 w-3.5" />
            {isAr ? "نسخ المعرف" : "Copy User ID"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {accountStatus !== "suspended" ? (
            <DropdownMenuItem onClick={() => onStatusChange("suspended")} className="gap-2 text-xs text-destructive">
              <Ban className="h-3.5 w-3.5" />
              {isAr ? "إيقاف الحساب" : "Suspend Account"}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onStatusChange("active")} className="gap-2 text-xs text-chart-2">
              <UserCheck className="h-3.5 w-3.5" />
              {isAr ? "تفعيل الحساب" : "Activate Account"}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});
