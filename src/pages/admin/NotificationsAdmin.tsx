import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Bell,
  Send,
  Plus,
  Mail,
  MessageSquare,
  Smartphone,
  Clock,
  Check,
  X,
  AlertCircle,
  BarChart3,
  RefreshCw,
  Megaphone,
} from "lucide-react";

export default function NotificationsAdmin() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [newNotification, setNewNotification] = useState({
    title: "",
    title_ar: "",
    body: "",
    body_ar: "",
    type: "info",
    channel: "in_app",
    targetAll: true,
    targetUsers: "",
  });

  const [channelSettings, setChannelSettings] = useState({
    in_app: true,
    email: true,
    sms: false,
    whatsapp: false,
    push: false,
  });

  const { data: templates } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: recentNotifications, isLoading: loadingRecent } = useQuery({
    queryKey: ["recent-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });

  const { data: queueStats } = useQuery({
    queryKey: ["notification-queue-stats"],
    queryFn: async () => {
      const [pending, sent, failed] = await Promise.all([
        supabase.from("notification_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("notification_queue").select("*", { count: "exact", head: true }).eq("status", "sent"),
        supabase.from("notification_queue").select("*", { count: "exact", head: true }).eq("status", "failed"),
      ]);
      return {
        pending: pending.count || 0,
        sent: sent.count || 0,
        failed: failed.count || 0,
        total: (pending.count || 0) + (sent.count || 0) + (failed.count || 0),
      };
    },
  });

  // Queue items for delivery tracking
  const { data: queueItems = [], isLoading: loadingQueue } = useQuery({
    queryKey: ["notification-queue-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_queue")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("broadcast-notification", {
        body: {
          title: newNotification.title,
          titleAr: newNotification.title_ar,
          body: newNotification.body,
          bodyAr: newNotification.body_ar,
          type: newNotification.type,
          channels: [newNotification.channel],
          targetAll: newNotification.targetAll,
          targetUserIds: newNotification.targetAll
            ? []
            : newNotification.targetUsers.split(",").map((id) => id.trim()).filter(Boolean),
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["recent-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-queue-stats"] });
      queryClient.invalidateQueries({ queryKey: ["notification-queue-items"] });
      toast({
        title: language === "ar" ? "تم الإرسال" : "Sent",
        description: language === "ar"
          ? `تم إرسال الإشعار إلى ${data?.totalUsers || 0} مستخدم`
          : `Notification sent to ${data?.totalUsers || 0} users`,
      });
      setIsCreateOpen(false);
      setNewNotification({ title: "", title_ar: "", body: "", body_ar: "", type: "info", channel: "in_app", targetAll: true, targetUsers: "" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: language === "ar" ? "فشل الإرسال" : "Send Failed", description: error.message });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><Check className="h-3 w-3" />{status}</Badge>;
      case "failed":
        return <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" />{status}</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{status}</Badge>;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email": return <Mail className="h-3.5 w-3.5" />;
      case "sms": return <Smartphone className="h-3.5 w-3.5" />;
      case "whatsapp": return <MessageSquare className="h-3.5 w-3.5" />;
      case "push": return <Megaphone className="h-3.5 w-3.5" />;
      default: return <Bell className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            {language === "ar" ? "إدارة الإشعارات" : "Notification Management"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {language === "ar" ? "إرسال وتتبع إشعارات المستخدمين" : "Send and track user notifications"}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Send className="mr-2 h-4 w-4" />
              {language === "ar" ? "إرسال إشعار" : "Send Notification"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{language === "ar" ? "إرسال إشعار جديد" : "Send New Notification"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Tabs defaultValue="en">
                <TabsList>
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="ar">العربية</TabsTrigger>
                </TabsList>
                <TabsContent value="en" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={newNotification.title} onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea rows={3} value={newNotification.body} onChange={(e) => setNewNotification({ ...newNotification, body: e.target.value })} />
                  </div>
                </TabsContent>
                <TabsContent value="ar" className="space-y-4">
                  <div className="space-y-2">
                    <Label>العنوان</Label>
                    <Input dir="rtl" value={newNotification.title_ar} onChange={(e) => setNewNotification({ ...newNotification, title_ar: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>الرسالة</Label>
                    <Textarea dir="rtl" rows={3} value={newNotification.body_ar} onChange={(e) => setNewNotification({ ...newNotification, body_ar: e.target.value })} />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "النوع" : "Type"}</Label>
                  <Select value={newNotification.type} onValueChange={(v) => setNewNotification({ ...newNotification, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "القناة" : "Channel"}</Label>
                  <Select value={newNotification.channel} onValueChange={(v) => setNewNotification({ ...newNotification, channel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_app">In-App</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="push">Push</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{language === "ar" ? "إرسال للجميع" : "Send to All Users"}</p>
                    <p className="text-xs text-muted-foreground">{language === "ar" ? "إرسال الإشعار لجميع المستخدمين" : "Broadcast to all registered users"}</p>
                  </div>
                  <Switch checked={newNotification.targetAll} onCheckedChange={(checked) => setNewNotification({ ...newNotification, targetAll: checked })} />
                </div>
                {!newNotification.targetAll && (
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "معرفات المستخدمين" : "User IDs"}</Label>
                    <Textarea
                      placeholder={language === "ar" ? "أدخل معرفات المستخدمين مفصولة بفواصل" : "Enter user IDs, separated by commas"}
                      value={newNotification.targetUsers}
                      onChange={(e) => setNewNotification({ ...newNotification, targetUsers: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending || !newNotification.title}>
                <Send className="mr-2 h-4 w-4" />
                {sendMutation.isPending ? (language === "ar" ? "جارٍ الإرسال..." : "Sending...") : (language === "ar" ? "إرسال" : "Send")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Queue Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-s-[3px] border-s-primary">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-primary/10 p-2.5"><BarChart3 className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "الإجمالي" : "Total"}</p>
              <p className="text-2xl font-bold">{queueStats?.total || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-amber-500">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-amber-500/10 p-2.5"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "في الانتظار" : "Pending"}</p>
              <p className="text-2xl font-bold">{queueStats?.pending || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-emerald-500">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-emerald-500/10 p-2.5"><Check className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "تم الإرسال" : "Sent"}</p>
              <p className="text-2xl font-bold">{queueStats?.sent || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-destructive">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-destructive/10 p-2.5"><AlertCircle className="h-5 w-5 text-destructive" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "فشل" : "Failed"}</p>
              <p className="text-2xl font-bold">{queueStats?.failed || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent">{language === "ar" ? "الإشعارات الأخيرة" : "Recent"}</TabsTrigger>
          <TabsTrigger value="queue">{language === "ar" ? "تتبع التوصيل" : "Delivery Queue"}</TabsTrigger>
          <TabsTrigger value="templates">{language === "ar" ? "القوالب" : "Templates"}</TabsTrigger>
          <TabsTrigger value="settings">{language === "ar" ? "الإعدادات" : "Settings"}</TabsTrigger>
        </TabsList>

        {/* Recent */}
        <TabsContent value="recent" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {loadingRecent ? (
                <div className="p-6"><Skeleton className="h-64" /></div>
              ) : recentNotifications && recentNotifications.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
                        <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
                        <TableHead>{language === "ar" ? "القناة" : "Channel"}</TableHead>
                        <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                        <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentNotifications.map((notif) => (
                        <TableRow key={notif.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{language === "ar" && notif.title_ar ? notif.title_ar : notif.title}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[250px]">{language === "ar" && notif.body_ar ? notif.body_ar : notif.body}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-xs">{notif.type || "info"}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {getChannelIcon(notif.channel || "in_app")}
                              <span className="text-xs capitalize">{notif.channel || "in_app"}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(notif.status || "pending")}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(notif.created_at), "MMM d, HH:mm")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
                    <Bell className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">{language === "ar" ? "لا توجد إشعارات" : "No notifications sent yet"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Queue */}
        <TabsContent value="queue" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">{language === "ar" ? "سجل التوصيل" : "Delivery Log"}</CardTitle>
                <CardDescription>{language === "ar" ? "تتبع حالة توصيل الإشعارات" : "Track notification delivery status"}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["notification-queue-items"] })}>
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                {language === "ar" ? "تحديث" : "Refresh"}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingQueue ? (
                <div className="p-6"><Skeleton className="h-64" /></div>
              ) : queueItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "ar" ? "القناة" : "Channel"}</TableHead>
                        <TableHead>{language === "ar" ? "المستخدم" : "User"}</TableHead>
                        <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                        <TableHead>{language === "ar" ? "المحاولات" : "Attempts"}</TableHead>
                        <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                        <TableHead>{language === "ar" ? "آخر محاولة" : "Last Attempt"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queueItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {getChannelIcon(item.channel)}
                              <span className="text-sm capitalize">{item.channel}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{item.user_id?.substring(0, 12) || "—"}...</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell className="text-sm">{item.attempts || 0}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(item.created_at), "MMM d, HH:mm")}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.last_attempt_at ? format(new Date(item.last_attempt_at), "HH:mm:ss") : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
                    <Send className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">{language === "ar" ? "لا توجد عناصر في قائمة الانتظار" : "No queue items"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{language === "ar" ? "قوالب الإشعارات" : "Notification Templates"}</CardTitle>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  {language === "ar" ? "قالب جديد" : "New Template"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {templates?.length === 0 || !templates ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
                    <Bell className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">{language === "ar" ? "لا توجد قوالب" : "No templates yet"}</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {templates.map((template) => (
                    <Card key={template.id}>
                      <CardContent className="p-4">
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{template.title}</p>
                        <div className="flex gap-1 mt-2">
                          {template.channels?.map((channel: string) => (
                            <Badge key={channel} variant="outline" className="text-xs gap-1">
                              {getChannelIcon(channel)}
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{language === "ar" ? "قنوات الإشعارات" : "Notification Channels"}</CardTitle>
              <CardDescription>{language === "ar" ? "تفعيل وتعطيل قنوات الإشعارات على مستوى المنصة" : "Enable or disable notification channels platform-wide"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "in_app", icon: Bell, label: language === "ar" ? "داخل التطبيق" : "In-App", desc: language === "ar" ? "إشعارات فورية داخل المنصة" : "Real-time in-platform alerts" },
                { key: "email", icon: Mail, label: language === "ar" ? "البريد الإلكتروني" : "Email", desc: language === "ar" ? "إرسال عبر البريد الإلكتروني" : "Delivery via email" },
                { key: "sms", icon: Smartphone, label: "SMS", desc: language === "ar" ? "رسائل نصية قصيرة" : "Short message service" },
                { key: "whatsapp", icon: MessageSquare, label: "WhatsApp", desc: language === "ar" ? "إرسال عبر واتساب" : "WhatsApp messaging" },
                { key: "push", icon: Megaphone, label: language === "ar" ? "إشعارات الدفع" : "Push", desc: language === "ar" ? "إشعارات الدفع للأجهزة" : "Browser & device push notifications" },
              ].map(({ key, icon: Icon, label, desc }) => (
                <div key={key} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${channelSettings[key as keyof typeof channelSettings] ? "bg-primary/10" : "bg-muted"}`}>
                      <Icon className={`h-4 w-4 ${channelSettings[key as keyof typeof channelSettings] ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={channelSettings[key as keyof typeof channelSettings]}
                    onCheckedChange={(checked) => setChannelSettings({ ...channelSettings, [key]: checked })}
                  />
                </div>
              ))}
              <Button
                className="w-full mt-4"
                onClick={() => toast({ title: language === "ar" ? "تم الحفظ" : "Saved", description: language === "ar" ? "تم حفظ إعدادات الإشعارات" : "Notification settings saved" })}
              >
                {language === "ar" ? "حفظ الإعدادات" : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
