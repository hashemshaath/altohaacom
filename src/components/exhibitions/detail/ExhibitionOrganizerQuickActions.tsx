import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Megaphone, Send, Users, Loader2,
} from "lucide-react";

interface Props {
  exhibitionId: string;
  exhibitionTitle: string;
  isAr: boolean;
  followerCount: number;
  ticketCount: number;
}

type Audience = "all" | "followers" | "ticket_holders" | "checked_in" | "not_checked_in";

export function ExhibitionOrganizerQuickActions({
  exhibitionId, exhibitionTitle, isAr, followerCount, ticketCount,
}: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("all");

  const sendAnnouncement = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const allIds = new Set<string>();

      if (audience === "all" || audience === "followers") {
        const { data: followers } = await supabase
          .from("exhibition_followers")
          .select("user_id")
          .eq("exhibition_id", exhibitionId);
        followers?.forEach((f) => allIds.add(f.user_id));
      }

      if (audience === "all" || audience === "ticket_holders") {
        const { data: ticketHolders } = await supabase
          .from("exhibition_tickets")
          .select("user_id")
          .eq("exhibition_id", exhibitionId)
          .eq("status", "confirmed");
        ticketHolders?.forEach((t) => allIds.add(t.user_id));
      }

      if (audience === "checked_in") {
        const { data: checkedIn } = await supabase
          .from("exhibition_tickets")
          .select("user_id")
          .eq("exhibition_id", exhibitionId)
          .not("checked_in_at", "is", null);
        checkedIn?.forEach((t) => allIds.add(t.user_id));
      }

      if (audience === "not_checked_in") {
        const { data: notCheckedIn } = await supabase
          .from("exhibition_tickets")
          .select("user_id")
          .eq("exhibition_id", exhibitionId)
          .is("checked_in_at", null)
          .eq("status", "confirmed");
        notCheckedIn?.forEach((t) => allIds.add(t.user_id));
      }

      allIds.delete(user.id);
      if (allIds.size === 0) throw new Error("No recipients");

      const notifications = Array.from(allIds).map((uid) => ({
        user_id: uid,
        title: `📢 ${title}`,
        title_ar: `📢 ${title}`,
        body: body,
        body_ar: body,
        type: "exhibition_announcement" as const,
        link: `/exhibitions/${exhibitionId}`,
        metadata: { exhibition_id: exhibitionId, sender_id: user.id, audience },
      }));

      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;
      return allIds.size;
    },
    onSuccess: (count) => {
      setAnnouncementOpen(false);
      setTitle("");
      setBody("");
      setAudience("all");
      toast({
        title: t("Announcement Sent! 📢", "تم إرسال الإعلان! 📢"),
        description: t(`Sent to ${count} recipients`, `تم الإرسال إلى ${count} مستلم`),
      });
    },
    onError: (err: any) => {
      toast({
        title: t("Failed to send", "فشل في الإرسال"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const totalRecipients = followerCount + ticketCount;

  const audienceOptions = [
    { value: "all", label: t("Everyone (Followers + Ticket Holders)", "الجميع (المتابعين + حاملي التذاكر)") },
    { value: "followers", label: t("Followers Only", "المتابعين فقط") },
    { value: "ticket_holders", label: t("Ticket Holders Only", "حاملي التذاكر فقط") },
    { value: "checked_in", label: t("Checked-In Attendees", "الحضور المسجلين") },
    { value: "not_checked_in", label: t("Not Yet Checked In", "لم يحضروا بعد") },
  ];

  return (
    <Card className="border-primary/15 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
              <Megaphone className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold">{t("Quick Actions", "إجراءات سريعة")}</p>
              <p className="text-[10px] text-muted-foreground">
                {t(`${totalRecipients} total recipients`, `${totalRecipients} مستلم إجمالي`)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5 rounded-lg text-xs">
                  <Send className="h-3 w-3" />
                  {t("Send Announcement", "إرسال إعلان")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <Megaphone className="h-4 w-4 text-primary" />
                    {t("Send Announcement", "إرسال إعلان")}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t("Audience", "الجمهور المستهدف")}</Label>
                    <Select value={audience} onValueChange={(v) => setAudience(v as Audience)}>
                      <SelectTrigger className="h-9 rounded-lg text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {audienceOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {audience === "all"
                        ? t(`~${totalRecipients} followers & ticket holders`, `~${totalRecipients} متابع وحامل تذكرة`)
                        : audience === "followers"
                        ? t(`~${followerCount} followers`, `~${followerCount} متابع`)
                        : t(`~${ticketCount} ticket holders`, `~${ticketCount} حامل تذكرة`)
                      }
                    </span>
                  </div>

                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("Announcement title", "عنوان الإعلان")}
                    className="rounded-lg"
                  />
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={t("Write your message...", "اكتب رسالتك...")}
                    className="rounded-lg min-h-[100px]"
                  />

                  <Button
                    className="w-full rounded-lg"
                    onClick={() => sendAnnouncement.mutate()}
                    disabled={sendAnnouncement.isPending || !title.trim() || !body.trim()}
                  >
                    {sendAnnouncement.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin me-2" />
                    ) : (
                      <Send className="h-4 w-4 me-2" />
                    )}
                    {t("Send to All", "إرسال للجميع")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
