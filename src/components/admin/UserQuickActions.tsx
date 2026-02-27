import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MoreHorizontal, UserCheck, UserX, Shield, KeyRound, Mail, Ban,
  Eye, MessageSquare, Crown, AlertTriangle, Send, Copy, Check,
} from "lucide-react";

interface UserQuickActionsProps {
  userId: string;
  userName: string;
  email: string | null;
  status: string | null;
  isVerified: boolean | null;
  onViewProfile: () => void;
}

export function UserQuickActions({ userId, userName, email, status, isVerified, onViewProfile }: UserQuickActionsProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [sendMessageOpen, setSendMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [copied, setCopied] = useState(false);

  const callAdminFn = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-user-management", { body });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const handleToggleVerify = async () => {
    const { error } = await supabase.from("profiles").update({ is_verified: !isVerified }).eq("user_id", userId);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    await supabase.from("admin_actions").insert({ admin_id: user!.id, target_user_id: userId, action_type: isVerified ? "unverify_user" : "verify_user", details: {} });
    queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    toast({ title: isAr ? (isVerified ? "تم إلغاء التوثيق" : "تم التوثيق") : (isVerified ? "Unverified" : "Verified") });
  };

  const handleToggleStatus = async (newStatus: string) => {
    const updates: any = { account_status: newStatus };
    if (newStatus === "suspended") {
      updates.suspended_reason = suspendReason || "Admin action";
      updates.suspended_at = new Date().toISOString();
    } else {
      updates.suspended_reason = null;
      updates.suspended_at = null;
    }
    const { error } = await supabase.from("profiles").update(updates).eq("user_id", userId);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    await supabase.from("admin_actions").insert({ admin_id: user!.id, target_user_id: userId, action_type: `${newStatus}_user`, details: { reason: suspendReason } });
    queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    setSuspendOpen(false);
    setSuspendReason("");
    toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
  };

  const handleResetPassword = async () => {
    try {
      await callAdminFn({ action: "reset_password", user_id: userId, new_password: newPassword });
      toast({ title: isAr ? "تم إعادة تعيين كلمة المرور" : "Password reset successfully" });
      setResetPasswordOpen(false);
      setNewPassword("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleSendNotification = async () => {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      title: isAr ? "رسالة من الإدارة" : "Message from Admin",
      title_ar: "رسالة من الإدارة",
      body: messageText,
      body_ar: messageText,
      type: "admin_message",
    });
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    toast({ title: isAr ? "تم إرسال الإشعار" : "Notification sent" });
    setSendMessageOpen(false);
    setMessageText("");
  };

  const copyId = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {/* Inline quick actions */}
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

        {/* More actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setSendMessageOpen(true)}>
              <MessageSquare className="me-2 h-3.5 w-3.5" />
              {isAr ? "إرسال إشعار" : "Send Notification"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setResetPasswordOpen(true)}>
              <KeyRound className="me-2 h-3.5 w-3.5" />
              {isAr ? "إعادة تعيين كلمة المرور" : "Reset Password"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyId}>
              {copied ? <Check className="me-2 h-3.5 w-3.5 text-primary" /> : <Copy className="me-2 h-3.5 w-3.5" />}
              {isAr ? "نسخ المعرف" : "Copy User ID"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {status === "active" ? (
              <DropdownMenuItem onClick={() => setSuspendOpen(true)} className="text-destructive">
                <Ban className="me-2 h-3.5 w-3.5" />
                {isAr ? "إيقاف الحساب" : "Suspend Account"}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleToggleStatus("active")} className="text-primary">
                <UserCheck className="me-2 h-3.5 w-3.5" />
                {isAr ? "تفعيل الحساب" : "Activate Account"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isAr ? "إعادة تعيين كلمة المرور" : "Reset Password"}</DialogTitle>
              <DialogDescription>{userName}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Label>{isAr ? "كلمة المرور الجديدة" : "New Password"}</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetPasswordOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleResetPassword} disabled={newPassword.length < 8}>
                <KeyRound className="me-2 h-4 w-4" />{isAr ? "تغيير" : "Reset"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suspend Dialog */}
        <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {isAr ? "إيقاف الحساب" : "Suspend Account"}
              </DialogTitle>
              <DialogDescription>{userName} ({email})</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Label>{isAr ? "سبب الإيقاف" : "Reason"}</Label>
              <Textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder={isAr ? "أدخل سبب الإيقاف..." : "Enter suspension reason..."} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSuspendOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button variant="destructive" onClick={() => handleToggleStatus("suspended")}>
                <Ban className="me-2 h-4 w-4" />{isAr ? "إيقاف" : "Suspend"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Notification Dialog */}
        <Dialog open={sendMessageOpen} onOpenChange={setSendMessageOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isAr ? "إرسال إشعار" : "Send Notification"}</DialogTitle>
              <DialogDescription>{userName}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Label>{isAr ? "الرسالة" : "Message"}</Label>
              <Textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} rows={4} placeholder={isAr ? "اكتب رسالتك..." : "Write your message..."} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSendMessageOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleSendNotification} disabled={!messageText.trim()}>
                <Send className="me-2 h-4 w-4" />{isAr ? "إرسال" : "Send"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
