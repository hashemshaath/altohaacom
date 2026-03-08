import { useState, useMemo, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, BellOff, CheckCheck, Clock, AlertTriangle, Info, Trash2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

const TYPE_ICONS: Record<string, typeof Bell> = {
  warning: AlertTriangle,
  info: Info,
  default: Bell,
};

export const AdminNotificationCenter = memo(function AdminNotificationCenter() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["admin-notifications", typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("notifications")
        .select("id, title, title_ar, body, body_ar, type, is_read, created_at, link, metadata")
        .order("created_at", { ascending: false })
        .limit(50);

      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success(isAr ? "تم تحديد الكل كمقروء" : "All marked as read");
    },
  });

  const unreadCount = useMemo(() => notifications.filter((n: any) => !n.is_read).length, [notifications]);

  const getIcon = (type: string) => {
    const Icon = TYPE_ICONS[type] || TYPE_ICONS.default;
    return <Icon className="h-4 w-4 shrink-0" />;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">
              {isAr ? "مركز الإشعارات" : "Notification Center"}
            </CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                <SelectItem value="follow">{isAr ? "متابعات" : "Follows"}</SelectItem>
                <SelectItem value="reaction">{isAr ? "تفاعلات" : "Reactions"}</SelectItem>
                <SelectItem value="schedule">{isAr ? "جدولة" : "Schedule"}</SelectItem>
                <SelectItem value="bio_milestone">{isAr ? "إنجازات" : "Milestones"}</SelectItem>
              </SelectContent>
            </Select>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
              >
                <CheckCheck className="h-3.5 w-3.5 me-1" />
                {isAr ? "قراءة الكل" : "Mark all read"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[320px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BellOff className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">{isAr ? "لا توجد إشعارات" : "No notifications"}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif: any) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${
                    !notif.is_read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className={`mt-0.5 rounded-full p-1.5 ${!notif.is_read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight truncate">
                      {isAr ? notif.title_ar || notif.title : notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {isAr ? notif.body_ar || notif.body : notif.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDistanceToNow(new Date(notif.created_at), {
                        addSuffix: true,
                        locale: isAr ? ar : undefined,
                      })}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
});
