import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Send, Bell, Users, Mail, Megaphone } from "lucide-react";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

export const OrganizerAttendeeCommunication = memo(function OrganizerAttendeeCommunication({ exhibitionId, isAr }: Props) {
  const { user } = useAuth();
  const t = (en: string, ar: string) => isAr ? ar : en;
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<"all" | "checked_in" | "not_checked_in">("all");

  const { data: attendeeCount } = useQuery({
    queryKey: ["organizer-attendee-count", exhibitionId, target],
    queryFn: async () => {
      let q = supabase.from("exhibition_tickets").select("user_id", { count: "exact", head: true })
        .eq("exhibition_id", exhibitionId).eq("status", "confirmed");
      if (target === "checked_in") q = q.not("checked_in_at", "is", null);
      if (target === "not_checked_in") q = q.is("checked_in_at", null);
      const { count } = await q;
      return count || 0;
    },
  });

  const sendNotification = useMutation({
    mutationFn: async () => {
      if (!user || !title.trim()) throw new Error("Missing data");
      let q = supabase.from("exhibition_tickets").select("user_id")
        .eq("exhibition_id", exhibitionId).eq("status", "confirmed");
      if (target === "checked_in") q = q.not("checked_in_at", "is", null);
      if (target === "not_checked_in") q = q.is("checked_in_at", null);
      const { data: tickets } = await q;
      const userIds = [...new Set((tickets || []).map(t => t.user_id).filter(Boolean))];
      if (userIds.length === 0) throw new Error("No recipients");

      // Insert notifications in bulk
      const notifications = userIds.map(uid => ({
        user_id: uid,
        title: title.trim(),
        title_ar: title.trim(),
        body: body.trim() || null,
        body_ar: body.trim() || null,
        type: "exhibition_update",
        link: null,
        metadata: { exhibition_id: exhibitionId, sent_by: user.id },
      }));

      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;
      return userIds.length;
    },
    onSuccess: (count) => {
      setTitle("");
      setBody("");
      toast({ title: t(`✅ Sent to ${count} attendees`, `✅ تم الإرسال لـ ${count} حاضر`) });
    },
    onError: () => {
      toast({ title: t("Failed to send", "فشل الإرسال"), variant: "destructive" });
    },
  });

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" />
          {t("Notify Attendees", "إشعار الحاضرين")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Target Selection */}
        <div className="flex gap-2 flex-wrap">
          {([
            { key: "all" as const, label: t("All Attendees", "الكل"), icon: Users },
            { key: "checked_in" as const, label: t("Checked In", "حضروا"), icon: Mail },
            { key: "not_checked_in" as const, label: t("Not Arrived", "لم يحضروا"), icon: Bell },
          ]).map(opt => (
            <Button
              key={opt.key}
              variant={target === opt.key ? "default" : "outline"}
              size="sm"
              className="text-xs gap-1.5 h-8"
              onClick={() => setTarget(opt.key)}
            >
              <opt.icon className="h-3 w-3" />
              {opt.label}
            </Button>
          ))}
        </div>

        <Badge variant="secondary" className="text-[10px]">
          {t("Recipients", "المستلمون")}: {attendeeCount || 0}
        </Badge>

        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={t("Notification title...", "عنوان الإشعار...")}
          className="h-9 text-sm"
        />
        <Textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={t("Message (optional)...", "الرسالة (اختيارية)...")}
          className="text-sm min-h-[60px]"
        />
        <Button
          className="w-full h-9 text-sm gap-1.5"
          disabled={!title.trim() || sendNotification.isPending}
          onClick={() => sendNotification.mutate()}
        >
          <Send className="h-3.5 w-3.5" />
          {sendNotification.isPending ? t("Sending...", "جاري الإرسال...") : t("Send Notification", "إرسال الإشعار")}
        </Button>
      </CardContent>
    </Card>
  );
}

export default OrganizerAttendeeCommunication;
