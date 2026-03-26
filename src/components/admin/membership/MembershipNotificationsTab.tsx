import { useState, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  Bell, Search, Mail, CheckCircle2, Clock, AlertTriangle,
  Send, Eye, EyeOff, MessageSquare,
} from "lucide-react";
import { format } from "date-fns";

const MembershipNotificationsTab = memo(function MembershipNotificationsTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [readFilter, setReadFilter] = useState("all");

  const { data: stats } = useQuery({
    queryKey: ["membership-notification-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("is_read, type")
        .eq("type", "membership");

      const total = data?.length || 0;
      const unread = data?.filter(n => !n.is_read).length || 0;
      const read = data?.filter(n => n.is_read).length || 0;
      return { total, unread, read };
    },
  });

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["membership-notifications-list", search, readFilter],
    queryFn: async () => {
      let query = supabase
        .from("notifications")
        .select("id, user_id, title, title_ar, body, body_ar, type, is_read, link, created_at")
        .eq("type", "membership")
        .order("created_at", { ascending: false })
        .limit(100);

      if (readFilter === "unread") query = query.eq("is_read", false);
      if (readFilter === "read") query = query.eq("is_read", true);
      if (search) query = query.or(`title.ilike.%${search}%,title_ar.ilike.%${search}%,body.ilike.%${search}%`);

      const { data } = await query;
      return data || [];
    },
  });

  const statCards = [
    { icon: Bell, label: isAr ? "إجمالي الإشعارات" : "Total Notifications", value: stats?.total || 0, color: "text-primary" },
    { icon: EyeOff, label: isAr ? "غير مقروءة" : "Unread", value: stats?.unread || 0, color: "text-destructive" },
    { icon: Eye, label: isAr ? "مقروءة" : "Read", value: stats?.read || 0, color: "text-chart-2" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
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

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              {isAr ? "سجل إشعارات العضوية" : "Membership Notification Log"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-56">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={isAr ? "بحث في الإشعارات..." : "Search notifications..."}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="ps-9 h-8 text-xs"
                />
              </div>
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="unread">{isAr ? "غير مقروءة" : "Unread"}</SelectItem>
                  <SelectItem value="read">{isAr ? "مقروءة" : "Read"}</SelectItem>
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
                    <Send className={`h-3.5 w-3.5 ${!notif.is_read ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">
                        {isAr ? (notif.title_ar || notif.title) : notif.title}
                      </p>
                      {!notif.is_read && (
                        <Badge variant="default" className="text-[10px] h-4">{isAr ? "جديد" : "New"}</Badge>
                      )}
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
    </div>
  );
});

export default MembershipNotificationsTab;
