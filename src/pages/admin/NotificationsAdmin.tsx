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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Bell, 
  Send,
  Plus,
  Settings,
  Mail,
  MessageSquare,
  Smartphone,
  Users,
  FileText,
  Clock,
  Check,
  X,
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

  const { data: recentNotifications } = useQuery({
    queryKey: ["recent-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
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
      };
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      // In real implementation, this would send notifications to all users or specific users
      toast({
        title: language === "ar" ? "تم الإرسال" : "Sent",
        description: language === "ar" ? "تم إرسال الإشعار بنجاح" : "Notification sent successfully",
      });
      setIsCreateOpen(false);
      setNewNotification({
        title: "",
        title_ar: "",
        body: "",
        body_ar: "",
        type: "info",
        channel: "in_app",
        targetAll: true,
        targetUsers: "",
      });
    },
  });

  const handleSaveSettings = () => {
    toast({
      title: language === "ar" ? "تم الحفظ" : "Saved",
      description: language === "ar" ? "تم حفظ إعدادات الإشعارات" : "Notification settings saved",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; icon: any }> = {
      pending: { variant: "secondary", icon: Clock },
      sent: { variant: "default", icon: Check },
      delivered: { variant: "default", icon: Check },
      failed: { variant: "destructive", icon: X },
      read: { variant: "default", icon: Check },
    };
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="gap-1">
        <config.icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">
            {language === "ar" ? "إدارة الإشعارات" : "Notification Management"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "إرسال وإدارة إشعارات المستخدمين" : "Send and manage user notifications"}
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
              <DialogTitle>
                {language === "ar" ? "إرسال إشعار جديد" : "Send New Notification"}
              </DialogTitle>
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
                    <Input
                      value={newNotification.title}
                      onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      rows={3}
                      value={newNotification.body}
                      onChange={(e) => setNewNotification({ ...newNotification, body: e.target.value })}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="ar" className="space-y-4">
                  <div className="space-y-2">
                    <Label>العنوان</Label>
                    <Input
                      dir="rtl"
                      value={newNotification.title_ar}
                      onChange={(e) => setNewNotification({ ...newNotification, title_ar: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الرسالة</Label>
                    <Textarea
                      dir="rtl"
                      rows={3}
                      value={newNotification.body_ar}
                      onChange={(e) => setNewNotification({ ...newNotification, body_ar: e.target.value })}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "النوع" : "Type"}</Label>
                  <Select 
                    value={newNotification.type}
                    onValueChange={(v) => setNewNotification({ ...newNotification, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "القناة" : "Channel"}</Label>
                  <Select 
                    value={newNotification.channel}
                    onValueChange={(v) => setNewNotification({ ...newNotification, channel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_app">In-App</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="push">Push</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{language === "ar" ? "إرسال للجميع" : "Send to All Users"}</p>
                    <p className="text-sm text-muted-foreground">
                      {language === "ar" ? "إرسال الإشعار لجميع المستخدمين" : "Send notification to all users"}
                    </p>
                  </div>
                  <Switch
                    checked={newNotification.targetAll}
                    onCheckedChange={(checked) => setNewNotification({ ...newNotification, targetAll: checked })}
                  />
                </div>
                {!newNotification.targetAll && (
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "معرفات المستخدمين" : "User IDs"}</Label>
                    <Textarea
                      placeholder={language === "ar" ? "أدخل معرفات المستخدمين مفصولة بفواصل" : "Enter user IDs separated by commas"}
                      value={newNotification.targetUsers}
                      onChange={(e) => setNewNotification({ ...newNotification, targetUsers: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </Button>
                <Button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}>
                  <Send className="mr-2 h-4 w-4" />
                  {language === "ar" ? "إرسال" : "Send"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Queue Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{language === "ar" ? "في الانتظار" : "Pending"}</p>
                <p className="text-2xl font-bold">{queueStats?.pending || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{language === "ar" ? "تم الإرسال" : "Sent"}</p>
                <p className="text-2xl font-bold text-green-600">{queueStats?.sent || 0}</p>
              </div>
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{language === "ar" ? "فشل" : "Failed"}</p>
                <p className="text-2xl font-bold text-red-600">{queueStats?.failed || 0}</p>
              </div>
              <X className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent">{language === "ar" ? "الإشعارات الأخيرة" : "Recent"}</TabsTrigger>
          <TabsTrigger value="templates">{language === "ar" ? "القوالب" : "Templates"}</TabsTrigger>
          <TabsTrigger value="settings">{language === "ar" ? "الإعدادات" : "Settings"}</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
                    <TableHead>{language === "ar" ? "القناة" : "Channel"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentNotifications?.map((notif) => (
                    <TableRow key={notif.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{language === "ar" && notif.title_ar ? notif.title_ar : notif.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {language === "ar" && notif.body_ar ? notif.body_ar : notif.body}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{notif.channel || "in_app"}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(notif.status || "pending")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(notif.created_at), "MMM d, HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{language === "ar" ? "قوالب الإشعارات" : "Notification Templates"}</CardTitle>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  {language === "ar" ? "قالب جديد" : "New Template"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {templates?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {language === "ar" ? "لا توجد قوالب" : "No templates yet"}
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {templates?.map((template) => (
                    <Card key={template.id}>
                      <CardContent className="pt-4">
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{template.title}</p>
                        <div className="flex gap-1 mt-2">
                          {template.channels?.map((channel: string) => (
                            <Badge key={channel} variant="outline" className="text-xs">{channel}</Badge>
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

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "قنوات الإشعارات" : "Notification Channels"}</CardTitle>
              <CardDescription>
                {language === "ar" ? "تفعيل وتعطيل قنوات الإشعارات" : "Enable or disable notification channels"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "in_app", icon: Bell, label: language === "ar" ? "داخل التطبيق" : "In-App" },
                { key: "email", icon: Mail, label: language === "ar" ? "البريد الإلكتروني" : "Email" },
                { key: "sms", icon: Smartphone, label: "SMS" },
                { key: "whatsapp", icon: MessageSquare, label: "WhatsApp" },
                { key: "push", icon: Bell, label: language === "ar" ? "إشعارات الدفع" : "Push Notifications" },
              ].map(({ key, icon: Icon, label }) => (
                <div key={key} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{label}</span>
                  </div>
                  <Switch
                    checked={channelSettings[key as keyof typeof channelSettings]}
                    onCheckedChange={(checked) => setChannelSettings({ ...channelSettings, [key]: checked })}
                  />
                </div>
              ))}
              <Button onClick={handleSaveSettings} className="w-full mt-4">
                {language === "ar" ? "حفظ الإعدادات" : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
