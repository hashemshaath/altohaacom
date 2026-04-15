import { useIsAr } from "@/hooks/useIsAr";
import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useToast } from "@/hooks/use-toast";
import {
  Bell, Search, Mail, CheckCircle2, Clock, Send,
  Eye, EyeOff, MessageSquare, Megaphone, Trash2,
  Loader2, CheckCheck, Filter,
} from "lucide-react";
import { format } from "date-fns";
import { MS_PER_DAY, QUERY_LIMIT_LARGE } from "@/lib/constants";

const MembershipNotificationsTab = memo(function MembershipNotificationsTab() {
  const { user } = useAuth();
  const isAr = useIsAr();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [readFilter, setReadFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [broadcastDialog, setBroadcastDialog] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastTitleAr, setBroadcastTitleAr] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastBodyAr, setBroadcastBodyAr] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("all");

  const { data: stats } = useQuery({
    queryKey: ["membership-notification-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("is_read, type")
        .or("type.eq.membership,type.eq.membership_upgrade,type.eq.membership_trial,type.eq.membership_expired,type.like.membership_email_%");

      const total = data?.length || 0;
      const unread = data?.filter(n => !n.is_read).length || 0;
      const read = data?.filter(n => n.is_read).length || 0;
      const emailTypes = data?.filter(n => n.type?.startsWith("membership_email_")).length || 0;
      return { total, unread, read, emailTypes };
    },
  });

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["membership-notifications-list", search, readFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("notifications")
        .select("id, user_id, title, title_ar, body, body_ar, type, is_read, link, created_at, metadata")
        .order("created_at", { ascending: false })
        .limit(100);

      // Filter by membership-related types
      if (typeFilter === "email") {
        query = query.like("type", "membership_email_%");
      } else if (typeFilter === "in_app") {
        query = query.or("type.eq.membership,type.eq.membership_upgrade,type.eq.membership_trial,type.eq.membership_expired");
      } else {
        query = query.or("type.eq.membership,type.eq.membership_upgrade,type.eq.membership_trial,type.eq.membership_expired,type.like.membership_email_%");
      }

      if (readFilter === "unread") query = query.eq("is_read", false);
      if (readFilter === "read") query = query.eq("is_read", true);
      if (search) query = query.or(`title.ilike.%${search}%,title_ar.ilike.%${search}%,body.ilike.%${search}%`);

      const { data } = await query;
      return data || [];
    },
  });

  // Mark all as read
  const markAllRead = useMutation({
    mutationFn: async () => {
      const ids = notifications?.filter(n => !n.is_read).map(n => n.id) || [];
      if (!ids.length) return;
      for (const id of ids) {
        await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership-notification"] });
      toast({ title: isAr ? "تم تحديث جميع الإشعارات كمقروءة" : "All marked as read" });
    },
  });

  // Delete old notifications
  const deleteOld = useMutation({
    mutationFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * MS_PER_DAY).toISOString();
      await supabase
        .from("notifications")
        .delete()
        .or("type.eq.membership,type.like.membership_email_%")
        .eq("is_read", true)
        .lt("created_at", thirtyDaysAgo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership-notification"] });
      toast({ title: isAr ? "تم حذف الإشعارات القديمة" : "Old notifications cleaned up" });
    },
  });

  // Broadcast notification
  const broadcastMutation = useMutation({
    mutationFn: async () => {
      if (!broadcastTitle && !broadcastTitleAr) throw new Error("Title required");

      let query = supabase.from("profiles").select("user_id").limit(QUERY_LIMIT_LARGE);
      if (broadcastTarget === "professional") query = query.eq("membership_tier", "professional");
      else if (broadcastTarget === "enterprise") query = query.eq("membership_tier", "enterprise");
      else if (broadcastTarget === "paid") query = query.in("membership_tier", ["professional", "enterprise"]);

      const { data: users } = await query;
      if (!users?.length) throw new Error("No users found");

      const notifications = users.map(u => ({
        user_id: u.user_id,
        title: broadcastTitle || broadcastTitleAr,
        title_ar: broadcastTitleAr || broadcastTitle,
        body: broadcastBody || broadcastBodyAr,
        body_ar: broadcastBodyAr || broadcastBody,
        type: "membership",
        link: "/profile?tab=membership",
      }));

      // Insert in batches of 50
      for (let i = 0; i < notifications.length; i += 50) {
        const batch = notifications.slice(i, i + 50);
        await supabase.from("notifications").insert(batch);
      }

      return users.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["membership-notification"] });
      toast({ title: isAr ? `تم إرسال الإشعار إلى ${count} عضو` : `Broadcast sent to ${count} members` });
      setBroadcastDialog(false);
      setBroadcastTitle("");
      setBroadcastTitleAr("");
      setBroadcastBody("");
      setBroadcastBodyAr("");
    },
    onError: (err) => toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : String(err) }),
  });

  const getTypeIcon = (type: string) => {
    if (type?.includes("email")) return <Mail className="h-3.5 w-3.5 text-chart-3" />;
    if (type === "membership_trial") return <Clock className="h-3.5 w-3.5 text-chart-4" />;
    if (type === "membership_upgrade") return <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />;
    if (type === "membership_expired") return <Clock className="h-3.5 w-3.5 text-destructive" />;
    return <Send className="h-3.5 w-3.5 text-primary" />;
  };

  const getTypeBadge = (type: string) => {
    if (type === "membership_upgrade") return <Badge className="text-xs h-4 bg-primary/20 text-primary">{isAr ? "ترقية" : "Upgrade"}</Badge>;
    if (type === "membership_expired") return <Badge variant="destructive" className="text-xs h-4">{isAr ? "منتهي" : "Expired"}</Badge>;
    if (type === "membership_trial") return <Badge className="text-xs h-4 bg-chart-4/20 text-chart-4">{isAr ? "تجريبي" : "Trial"}</Badge>;
    if (type?.includes("email_expiry")) return <Badge variant="destructive" className="text-xs h-4">{isAr ? "تحذير" : "Warning"}</Badge>;
    if (type?.includes("email_expired")) return <Badge variant="destructive" className="text-xs h-4">{isAr ? "منتهي" : "Expired"}</Badge>;
    if (type?.includes("email_upgraded")) return <Badge className="text-xs h-4 bg-primary/20 text-primary">{isAr ? "ترقية" : "Upgrade"}</Badge>;
    if (type?.includes("email_renewed")) return <Badge className="text-xs h-4 bg-chart-2/20 text-chart-2">{isAr ? "تجديد" : "Renewed"}</Badge>;
    if (type?.includes("email_downgraded")) return <Badge variant="secondary" className="text-xs h-4">{isAr ? "تخفيض" : "Downgrade"}</Badge>;
    if (type?.includes("email_trial")) return <Badge className="text-xs h-4 bg-chart-4/20 text-chart-4">{isAr ? "تجريبي" : "Trial"}</Badge>;
    return null;
  };

  const statCards = [
    { icon: Bell, label: isAr ? "إجمالي الإشعارات" : "Total", value: stats?.total || 0, color: "text-primary" },
    { icon: EyeOff, label: isAr ? "غير مقروءة" : "Unread", value: stats?.unread || 0, color: "text-destructive" },
    { icon: Eye, label: isAr ? "مقروءة" : "Read", value: stats?.read || 0, color: "text-chart-2" },
    { icon: Mail, label: isAr ? "بريد إلكتروني" : "Emails Sent", value: stats?.emailTypes || 0, color: "text-chart-3" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(card => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <AnimatedCounter value={card.value} className="text-2xl" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Bar */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setBroadcastDialog(true)}>
              <Megaphone className="h-3.5 w-3.5" />
              {isAr ? "إرسال بث جماعي" : "Broadcast"}
            </Button>
            <Button
              variant="outline" size="sm" className="gap-1.5"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending || !stats?.unread}
            >
              {markAllRead.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
              {isAr ? "قراءة الكل" : "Mark All Read"}
            </Button>
            <Button
              variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive"
              onClick={() => deleteOld.mutate()}
              disabled={deleteOld.isPending}
            >
              {deleteOld.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              {isAr ? "حذف القديمة" : "Clean Old"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              {isAr ? "سجل إشعارات العضوية" : "Membership Notification Log"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-52">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={isAr ? "بحث..." : "Search..."}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="ps-9 h-8 text-xs"
                />
              </div>
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="unread">{isAr ? "جديد" : "Unread"}</SelectItem>
                  <SelectItem value="read">{isAr ? "مقروء" : "Read"}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All Types"}</SelectItem>
                  <SelectItem value="email">{isAr ? "بريد" : "Email"}</SelectItem>
                  <SelectItem value="in_app">{isAr ? "داخلي" : "In-App"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : notifications?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">{isAr ? "لا توجد إشعارات عضوية" : "No membership notifications"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications?.map(notif => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
                    !notif.is_read ? "bg-primary/5 border-primary/20" : "bg-background"
                  }`}
                >
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    !notif.is_read ? "bg-primary/10" : "bg-muted"
                  }`}>
                    {getTypeIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">
                        {isAr ? (notif.title_ar || notif.title) : notif.title}
                      </p>
                      {!notif.is_read && (
                        <Badge variant="default" className="text-xs h-4">{isAr ? "جديد" : "New"}</Badge>
                      )}
                      {getTypeBadge(notif.type)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {isAr ? (notif.body_ar || notif.body) : notif.body}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                    {format(new Date(notif.created_at), "MMM d, HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Broadcast Dialog */}
      <Dialog open={broadcastDialog} onOpenChange={setBroadcastDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAr ? "إرسال بث جماعي" : "Broadcast Notification"}</DialogTitle>
            <DialogDescription>
              {isAr ? "إرسال إشعار لجميع الأعضاء أو مجموعة محددة" : "Send notification to all members or a specific tier"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={broadcastTarget} onValueChange={setBroadcastTarget}>
              <SelectTrigger>
                <SelectValue placeholder={isAr ? "الفئة المستهدفة" : "Target audience"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع الأعضاء" : "All Members"}</SelectItem>
                <SelectItem value="paid">{isAr ? "المدفوعون فقط" : "Paid Members Only"}</SelectItem>
                <SelectItem value="professional">{isAr ? "الاحترافي فقط" : "Professional Only"}</SelectItem>
                <SelectItem value="enterprise">{isAr ? "المؤسسي فقط" : "Enterprise Only"}</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Title (English)"
                value={broadcastTitle}
                onChange={e => setBroadcastTitle(e.target.value)}
              />
              <Input
                placeholder="العنوان (عربي)"
                value={broadcastTitleAr}
                onChange={e => setBroadcastTitleAr(e.target.value)}
                dir="rtl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Textarea
                placeholder="Message body (English)"
                value={broadcastBody}
                onChange={e => setBroadcastBody(e.target.value)}
                rows={3}
              />
              <Textarea
                placeholder="محتوى الرسالة (عربي)"
                value={broadcastBodyAr}
                onChange={e => setBroadcastBodyAr(e.target.value)}
                rows={3}
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBroadcastDialog(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={() => broadcastMutation.mutate()}
              disabled={broadcastMutation.isPending || (!broadcastTitle && !broadcastTitleAr)}
              className="gap-1.5"
            >
              {broadcastMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isAr ? "إرسال" : "Send Broadcast"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default MembershipNotificationsTab;
