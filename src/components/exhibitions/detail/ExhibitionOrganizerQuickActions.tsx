import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Megaphone, Send, Users, Bell, MessageSquare,
  Loader2, CheckCircle2,
} from "lucide-react";

interface Props {
  exhibitionId: string;
  exhibitionTitle: string;
  isAr: boolean;
  followerCount: number;
  ticketCount: number;
}

export function ExhibitionOrganizerQuickActions({
  exhibitionId, exhibitionTitle, isAr, followerCount, ticketCount,
}: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const sendAnnouncement = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Get all followers
      const { data: followers } = await supabase
        .from("exhibition_followers")
        .select("user_id")
        .eq("exhibition_id", exhibitionId);

      // Get all ticket holders
      const { data: ticketHolders } = await supabase
        .from("exhibition_tickets")
        .select("user_id")
        .eq("exhibition_id", exhibitionId)
        .eq("status", "confirmed");

      // Merge unique user IDs
      const allIds = new Set<string>();
      followers?.forEach((f) => allIds.add(f.user_id));
      ticketHolders?.forEach((t) => allIds.add(t.user_id));
      allIds.delete(user.id); // don't notify self

      if (allIds.size === 0) throw new Error("No recipients");

      // Batch insert notifications
      const notifications = Array.from(allIds).map((uid) => ({
        user_id: uid,
        title: `📢 ${title}`,
        title_ar: `📢 ${title}`,
        body: body,
        body_ar: body,
        type: "exhibition_announcement" as const,
        link: `/exhibitions/${exhibitionId}`,
        metadata: { exhibition_id: exhibitionId, sender_id: user.id },
      }));

      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;
      return allIds.size;
    },
    onSuccess: (count) => {
      setAnnouncementOpen(false);
      setTitle("");
      setBody("");
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
                  <div className="rounded-lg bg-muted/40 p-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {t(
                        `Will be sent to ${totalRecipients} followers & ticket holders`,
                        `سيتم الإرسال إلى ${totalRecipients} متابع وحامل تذكرة`,
                      )}
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
