import { useState, memo } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { MessageCircle, Send, Loader2 } from "lucide-react";

interface Props {
  exhibitionId: string;
  exhibitionTitle: string;
  isAr: boolean;
}

type Channel = "in_app" | "email" | "sms";

export const ExhibitionOrganizerMessaging = memo(function ExhibitionOrganizerMessaging({ exhibitionId, exhibitionTitle, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const { user, session } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<Channel>("in_app");

  const sendTargeted = useMutation({
    mutationFn: async () => {
      if (!user || !session) throw new Error("Not authenticated");

      // Get all ticket holders for this exhibition
      const { data: ticketHolders } = await supabase
        .from("exhibition_tickets")
        .select("user_id")
        .eq("exhibition_id", exhibitionId)
        .eq("status", "confirmed");

      const uniqueUserIds = [...new Set((ticketHolders || []).map(t => t.user_id).filter(Boolean))];
      if (uniqueUserIds.length === 0) throw new Error("No recipients");

      // Send via edge function for each user
      const results = await Promise.allSettled(
        uniqueUserIds.map(uid =>
          supabase.functions.invoke("send-notification", {
            body: {
              userId: uid,
              title: `📨 ${subject}`,
              titleAr: `📨 ${subject}`,
              body: message,
              bodyAr: message,
              type: "exhibition_message",
              link: `/exhibitions/${exhibitionId}`,
              channels: [channel],
            },
          })
        )
      );

      const succeeded = results.filter(r => r.status === "fulfilled").length;
      return succeeded;
    },
    onSuccess: (count) => {
      setSubject("");
      setMessage("");
      toast({
        title: t(`Message sent to ${count} attendees! 📨`, `تم إرسال الرسالة إلى ${count} حاضر! 📨`),
      });
    },
    onError: (err: any) => {
      toast({ title: t("Failed to send", "فشل في الإرسال"), description: err.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          {t("Message Attendees", "مراسلة الحضور")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">{t("Channel", "القناة")}</Label>
          <Select value={channel} onValueChange={v => setChannel(v as Channel)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="in_app" className="text-xs">{t("In-App", "داخل التطبيق")}</SelectItem>
              <SelectItem value="email" className="text-xs">{t("Email", "بريد إلكتروني")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("Subject", "الموضوع")}</Label>
          <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder={t("Update about the event", "تحديث حول الفعالية")} className="h-9 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("Message", "الرسالة")}</Label>
          <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={t("Write your message...", "اكتب رسالتك...")} rows={3} className="text-xs" />
        </div>
        <Button
          className="w-full"
          size="sm"
          onClick={() => sendTargeted.mutate()}
          disabled={!subject.trim() || !message.trim() || sendTargeted.isPending}
        >
          {sendTargeted.isPending ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Send className="h-4 w-4 me-2" />}
          {t("Send Message", "إرسال الرسالة")}
        </Button>
      </CardContent>
    </Card>
  );
});
