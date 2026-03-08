import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApprovalMessageProps {
  messageId: string;
  senderId: string;
  receiverId: string;
  metadata: Record<string, any>;
  isMine: boolean;
}

export const ApprovalMessage = memo(function ApprovalMessage({ messageId, senderId, receiverId, metadata, isMine }: ApprovalMessageProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [note, setNote] = useState("");

  const status = metadata?.approval_status || "pending";
  const title = metadata?.approval_title || (isAr ? "طلب موافقة" : "Approval Request");
  const description = metadata?.approval_description || "";

  const respondMutation = useMutation({
    mutationFn: async (response: "approved" | "rejected") => {
      if (!user) throw new Error("Not authenticated");

      // Send approval response message
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: senderId,
        content: response === "approved"
          ? (isAr ? `✅ تمت الموافقة على: ${title}` : `✅ Approved: ${title}`)
          : (isAr ? `❌ تم الرفض: ${title}` : `❌ Rejected: ${title}`),
        message_type: "approval_response",
        category: "approval",
        reply_to_id: messageId,
        metadata: {
          approval_status: response,
          approval_title: title,
          response_note: note,
          original_message_id: messageId,
        },
      });
      if (error) throw error;

      // Update original message metadata
      const { error: updateError } = await supabase
        .from("messages")
        .update({
          metadata: { ...metadata, approval_status: response, response_note: note },
        })
        .eq("id", messageId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setNote("");
      toast({ title: isAr ? "تم إرسال الرد" : "Response sent" });
    },
  });

  const statusConfig = {
    pending: { icon: Clock, color: "text-chart-4", badge: "secondary" as const, label: isAr ? "بانتظار الموافقة" : "Pending" },
    approved: { icon: CheckCircle2, color: "text-primary", badge: "default" as const, label: isAr ? "تمت الموافقة" : "Approved" },
    rejected: { icon: XCircle, color: "text-destructive", badge: "destructive" as const, label: isAr ? "مرفوض" : "Rejected" },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;
  const canRespond = !isMine && status === "pending";

  return (
    <div className="rounded-xl border bg-background/80 p-3 space-y-2 min-w-[220px]">
      <div className="flex items-center gap-2">
        <StatusIcon className={`h-5 w-5 ${config.color}`} />
        <span className="text-sm font-semibold flex-1">{title}</span>
        <Badge variant={config.badge} className="text-[10px]">{config.label}</Badge>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {metadata?.response_note && status !== "pending" && (
        <div className="flex items-start gap-1.5 rounded bg-muted/50 p-2">
          <MessageSquare className="h-3 w-3 mt-0.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{metadata.response_note}</p>
        </div>
      )}

      {canRespond && (
        <div className="space-y-2 pt-1 border-t">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={isAr ? "ملاحظة (اختياري)..." : "Note (optional)..."}
            rows={2}
            className="text-xs min-h-[50px]"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => respondMutation.mutate("approved")}
              disabled={respondMutation.isPending}
            >
              <CheckCircle2 className="h-3 w-3 me-1" />
              {isAr ? "موافقة" : "Approve"}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 h-7 text-xs"
              onClick={() => respondMutation.mutate("rejected")}
              disabled={respondMutation.isPending}
            >
              <XCircle className="h-3 w-3 me-1" />
              {isAr ? "رفض" : "Reject"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
