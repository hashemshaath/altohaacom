import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Bell, Send, Megaphone, MessageSquare, Users, Plus,
  CheckCircle2, Clock, AlertCircle,
} from "lucide-react";

interface Props {
  competitionId: string;
  language: string;
  isOrganizer?: boolean;
}

export const NotificationHub = memo(function NotificationHub({ competitionId, language, isOrganizer }: Props) {
  const isAr = language === "ar";
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCompose, setShowCompose] = useState(false);
  const [message, setMessage] = useState("");
  const [messageAr, setMessageAr] = useState("");
  const [subject, setSubject] = useState("");
  const [targetGroup, setTargetGroup] = useState("all");

  // Fetch recent notifications sent for this competition
  const { data: sentNotifications = [], isLoading } = useQuery({
    queryKey: ["comp-notifications", competitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, title, title_ar, body, body_ar, type, created_at, is_read")
        .eq("link", `/competitions/${competitionId}`)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!competitionId,
  });

  // Get participant count for targeting
  const { data: participantCount = 0 } = useQuery({
    queryKey: ["comp-notif-participants", competitionId],
    queryFn: async () => {
      const { count } = await supabase
        .from("competition_registrations")
        .select("id", { count: "exact", head: true })
        .eq("competition_id", competitionId)
        .eq("status", "approved");
      return count || 0;
    },
    enabled: !!competitionId,
  });

  // Get judge count
  const { data: judgeCount = 0 } = useQuery({
    queryKey: ["comp-notif-judges", competitionId],
    queryFn: async () => {
      const { count } = await supabase
        .from("competition_roles")
        .select("id", { count: "exact", head: true })
        .eq("competition_id", competitionId)
        .in("role", ["judge", "head_judge"])
        .eq("status", "active");
      return count || 0;
    },
    enabled: !!competitionId,
  });

  const sendAnnouncementMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !subject.trim() || !message.trim()) throw new Error("Missing fields");

      // Get target user IDs
      let userIds: string[] = [];
      
      if (targetGroup === "all" || targetGroup === "participants") {
        const { data: regs } = await supabase
          .from("competition_registrations")
          .select("participant_id")
          .eq("competition_id", competitionId)
          .eq("status", "approved");
        if (regs) userIds.push(...regs.map(r => r.participant_id));
      }

      if (targetGroup === "all" || targetGroup === "judges") {
        const { data: roles } = await supabase
          .from("competition_roles")
          .select("user_id")
          .eq("competition_id", competitionId)
          .in("role", ["judge", "head_judge"])
          .eq("status", "active");
        if (roles) userIds.push(...roles.map(r => r.user_id));
      }

      // Deduplicate
      userIds = [...new Set(userIds)];

      if (userIds.length === 0) throw new Error("No recipients found");

      // Batch insert notifications
      const notifications = userIds.map(uid => ({
        user_id: uid,
        title: subject,
        title_ar: isAr ? subject : (messageAr ? subject : null),
        body: message,
        body_ar: messageAr || null,
        type: "competition_announcement",
        link: `/competitions/${competitionId}`,
      }));

      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;
      return userIds.length;
    },
    onSuccess: (count) => {
      toast.success(isAr ? `تم إرسال الإشعار إلى ${count} مستخدم` : `Notification sent to ${count} users`);
      setShowCompose(false);
      setSubject("");
      setMessage("");
      setMessageAr("");
      queryClient.invalidateQueries({ queryKey: ["comp-notifications", competitionId] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{isAr ? "مركز الإشعارات" : "Notification Hub"}</h3>
        </div>
        {isOrganizer && (
          <Dialog open={showCompose} onOpenChange={setShowCompose}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Megaphone className="me-1.5 h-3.5 w-3.5" />
                {isAr ? "إعلان جديد" : "New Announcement"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{isAr ? "إرسال إعلان" : "Send Announcement"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex gap-2">
                  {[
                    { value: "all", label: isAr ? "الجميع" : "All", count: participantCount + judgeCount },
                    { value: "participants", label: isAr ? "المشاركون" : "Participants", count: participantCount },
                    { value: "judges", label: isAr ? "الحكام" : "Judges", count: judgeCount },
                  ].map(g => (
                    <Button
                      key={g.value}
                      size="sm"
                      variant={targetGroup === g.value ? "default" : "outline"}
                      onClick={() => setTargetGroup(g.value)}
                      className="flex-1 text-xs"
                    >
                      {g.label} ({g.count})
                    </Button>
                  ))}
                </div>
                <Input
                  placeholder={isAr ? "عنوان الإعلان" : "Subject"}
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
                <Textarea
                  placeholder={isAr ? "نص الإعلان (English)" : "Message (English)"}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                />
                <Textarea
                  placeholder={isAr ? "نص الإعلان (عربي)" : "Message (Arabic - optional)"}
                  value={messageAr}
                  onChange={e => setMessageAr(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="ghost" size="sm">{isAr ? "إلغاء" : "Cancel"}</Button>
                  </DialogClose>
                  <Button
                    size="sm"
                    onClick={() => sendAnnouncementMutation.mutate()}
                    disabled={!subject.trim() || !message.trim() || sendAnnouncementMutation.isPending}
                  >
                    <Send className="me-1.5 h-3.5 w-3.5" />
                    {sendAnnouncementMutation.isPending ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال" : "Send")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Users className="mx-auto h-5 w-5 text-primary mb-1" />
            <p className="text-lg font-bold">{participantCount}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "مشاركون" : "Participants"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <MessageSquare className="mx-auto h-5 w-5 text-chart-4 mb-1" />
            <p className="text-lg font-bold">{judgeCount}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "حكام" : "Judges"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Bell className="mx-auto h-5 w-5 text-chart-3 mb-1" />
            <p className="text-lg font-bold">{sentNotifications.length}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "إشعارات" : "Sent"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isAr ? "الإشعارات الأخيرة" : "Recent Notifications"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : sentNotifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                {isAr ? "لا توجد إشعارات بعد" : "No notifications yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sentNotifications.map((notif: any) => (
                <div key={notif.id} className="flex items-start gap-3 rounded-xl border p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Megaphone className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {isAr && notif.title_ar ? notif.title_ar : notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {isAr && notif.body_ar ? notif.body_ar : notif.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {notif.created_at ? new Date(notif.created_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
