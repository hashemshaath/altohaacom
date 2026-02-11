import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Users, Bell, Mail, MessageSquare } from "lucide-react";

interface SegmentBroadcastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segmentName: string;
  segmentId: string;
  estimatedReach: number;
  filters: any;
}

export function SegmentBroadcastDialog({
  open,
  onOpenChange,
  segmentName,
  segmentId,
  estimatedReach,
  filters,
}: SegmentBroadcastDialogProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState("in_app");
  const [type, setType] = useState("info");

  const broadcast = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Get matching user IDs based on segment filters
      let query = supabase.from("profiles").select("user_id");

      // Apply country filter if set
      if (filters?.countries?.length > 0) {
        query = query.in("country_code", filters.countries);
      }

      const { data: matchedUsers } = await query;
      let userIds = matchedUsers?.map(u => u.user_id) || [];

      // Apply role filter if set
      if (filters?.roles?.length > 0) {
        const { data: roleUsers } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("role", filters.roles);
        const roleUserIds = new Set(roleUsers?.map(r => r.user_id) || []);
        userIds = userIds.filter(id => roleUserIds.has(id));
      }

      // Apply verified filter
      if (filters?.is_verified) {
        const { data: verified } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("is_verified", true);
        const verifiedIds = new Set(verified?.map(v => v.user_id) || []);
        userIds = userIds.filter(id => verifiedIds.has(id));
      }

      // Create notifications for all matched users
      if (userIds.length > 0) {
        const notifications = userIds.map(userId => ({
          user_id: userId,
          title,
          title_ar: title,
          body: message,
          body_ar: message,
          type,
          channel: channel as "in_app" | "email",
          is_read: false,
        }));

        // Insert in batches of 100
        for (let i = 0; i < notifications.length; i += 100) {
          const batch = notifications.slice(i, i + 100);
          const { error } = await supabase.from("notifications").insert(batch);
          if (error) throw error;
        }
      }

      // Update segment last_used_at
      await supabase
        .from("audience_segments")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", segmentId);

      return userIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["audienceSegments"] });
      onOpenChange(false);
      setTitle("");
      setMessage("");
      toast({
        title: isAr ? "تم إرسال الإشعار" : "Broadcast Sent",
        description: isAr
          ? `تم إرسال الإشعار إلى ${count} مستخدم`
          : `Notification sent to ${count} users`,
      });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            {isAr ? "إرسال إشعار للشريحة" : "Broadcast to Segment"}
          </DialogTitle>
          <DialogDescription>
            {isAr ? "إرسال إشعار جماعي لشريحة" : "Send a notification to segment"}{" "}
            <span className="font-semibold text-foreground">{segmentName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Segment Info */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{segmentName}</p>
              <p className="text-xs text-muted-foreground">
                ~{estimatedReach.toLocaleString()} {isAr ? "مستخدم" : "users"}
              </p>
            </div>
            <div className="ms-auto flex flex-wrap gap-1">
              {filters?.roles?.map((r: string) => (
                <Badge key={r} variant="secondary" className="text-[9px]">{r}</Badge>
              ))}
            </div>
          </div>

          {/* Channel & Type */}
          <div className="grid grid-cols-2 gap-3">
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_app">
                  <span className="flex items-center gap-2">
                    <Bell className="h-3 w-3" />
                    {isAr ? "داخل التطبيق" : "In-App"}
                  </span>
                </SelectItem>
                <SelectItem value="email">
                  <span className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {isAr ? "بريد إلكتروني" : "Email"}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">{isAr ? "معلومات" : "Info"}</SelectItem>
                <SelectItem value="success">{isAr ? "نجاح" : "Success"}</SelectItem>
                <SelectItem value="warning">{isAr ? "تحذير" : "Warning"}</SelectItem>
                <SelectItem value="competition">{isAr ? "مسابقة" : "Competition"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <Input
            placeholder={isAr ? "عنوان الإشعار" : "Notification Title"}
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          {/* Message */}
          <Textarea
            placeholder={isAr ? "نص الرسالة..." : "Message content..."}
            rows={4}
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            onClick={() => broadcast.mutate()}
            disabled={!title.trim() || !message.trim() || broadcast.isPending}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {broadcast.isPending
              ? isAr ? "جاري الإرسال..." : "Sending..."
              : isAr ? "إرسال الإشعار" : "Send Broadcast"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
