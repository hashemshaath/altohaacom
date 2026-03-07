import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Bell, BellOff, Check, CheckCheck, ShoppingCart, FileText, Users,
  Crown, Megaphone, AlertCircle, Info, Clock, Trash2, Filter,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { CompanyPageGuard } from "@/components/company/CompanyPageGuard";
import { useToast } from "@/hooks/use-toast";

type NotificationType = string | null;

interface Notification {
  id: string;
  title: string;
  title_ar: string | null;
  body: string;
  body_ar: string | null;
  type: NotificationType;
  is_read: boolean | null;
  link: string | null;
  created_at: string;
  metadata: any;
}

const CATEGORIES = [
  { key: "all", labelEn: "All", labelAr: "الكل" },
  { key: "orders", labelEn: "Orders", labelAr: "الطلبيات" },
  { key: "approvals", labelEn: "Approvals", labelAr: "الموافقات" },
  { key: "invitations", labelEn: "Invitations", labelAr: "الدعوات" },
  { key: "general", labelEn: "General", labelAr: "عام" },
];

function getCategory(type: NotificationType): string {
  if (!type) return "general";
  if (type.includes("order")) return "orders";
  if (type.includes("approv") || type.includes("reject") || type.includes("review")) return "approvals";
  if (type.includes("invit") || type.includes("follow")) return "invitations";
  return "general";
}

function getIcon(type: NotificationType) {
  if (!type) return Info;
  if (type.includes("order")) return ShoppingCart;
  if (type.includes("invoice")) return FileText;
  if (type.includes("team") || type.includes("contact")) return Users;
  if (type.includes("sponsor")) return Crown;
  if (type.includes("ad") || type.includes("campaign")) return Megaphone;
  if (type.includes("approv")) return Check;
  if (type.includes("reject")) return AlertCircle;
  return Bell;
}

export default function CompanyNotifications() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["company-notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, title_ar, body, body_ar, type, is_read, link, created_at, metadata")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as Notification[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("company-notifs")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => { queryClient.invalidateQueries({ queryKey: ["company-notifications", user.id] }); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const filtered = notifications
    .filter(n => activeTab === "all" || getCategory(n.type) === activeTab)
    .filter(n => readFilter === "all" || (readFilter === "unread" && !n.is_read) || (readFilter === "read" && n.is_read));

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["company-notifications", user?.id] });
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("user_id", user.id).eq("is_read", false);
    queryClient.invalidateQueries({ queryKey: ["company-notifications", user?.id] });
  };

  const bulkMarkRead = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selected);
      if (ids.length === 0) return;
      for (const id of ids) {
        await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-notifications", user?.id] });
      setSelected(new Set());
      toast({ title: isAr ? "تم تحديث الإشعارات" : "Notifications updated" });
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selected);
      if (ids.length === 0) return;
      for (const id of ids) {
        await supabase.from("notifications").delete().eq("id", id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-notifications", user?.id] });
      setSelected(new Set());
      toast({ title: isAr ? "تم حذف الإشعارات" : "Notifications deleted" });
    },
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(n => n.id)));
    }
  };

  return (
    <CompanyPageGuard page="communications">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{isAr ? "الإشعارات" : "Notifications"}</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {unreadCount} {isAr ? "غير مقروء" : "unread"}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={() => bulkMarkRead.mutate()} disabled={bulkMarkRead.isPending}>
                  <Check className="me-1.5 h-4 w-4" />
                  {isAr ? "قراءة" : "Read"} ({selected.size})
                </Button>
                <Button variant="outline" size="sm" className="text-destructive" onClick={() => bulkDelete.mutate()} disabled={bulkDelete.isPending}>
                  <Trash2 className="me-1.5 h-4 w-4" />
                  {isAr ? "حذف" : "Delete"} ({selected.size})
                </Button>
              </>
            )}
            {unreadCount > 0 && selected.size === 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                <CheckCheck className="me-1.5 h-4 w-4" />
                {isAr ? "تعيين الكل كمقروء" : "Mark all read"}
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="w-full justify-start overflow-x-auto">
              {CATEGORIES.map(cat => (
                <TabsTrigger key={cat.key} value={cat.key} className="text-xs">
                  {isAr ? cat.labelAr : cat.labelEn}
                  {cat.key !== "all" && (() => {
                    const count = notifications.filter(n => !n.is_read && getCategory(n.type) === cat.key).length;
                    return count > 0 ? (
                      <Badge variant="destructive" className="ms-1.5 h-4 min-w-4 px-1 text-[10px]">{count}</Badge>
                    ) : null;
                  })()}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Select value={readFilter} onValueChange={setReadFilter}>
            <SelectTrigger className="w-[130px]">
              <Filter className="me-2 h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
              <SelectItem value="unread">{isAr ? "غير مقروء" : "Unread"}</SelectItem>
              <SelectItem value="read">{isAr ? "مقروء" : "Read"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Select all */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selected.size === filtered.length && filtered.length > 0}
              onCheckedChange={selectAll}
            />
            <span className="text-xs text-muted-foreground">
              {isAr ? `تحديد الكل (${filtered.length})` : `Select all (${filtered.length})`}
            </span>
          </div>
        )}

        {/* Notification List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/50 mb-3">
                <BellOff className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium">{isAr ? "لا توجد إشعارات" : "No notifications"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isAr ? "ستظهر هنا عند وصول إشعارات جديدة" : "New notifications will appear here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="max-h-[calc(100vh-340px)]">
            <div className="space-y-2">
              {filtered.map(n => {
                const Icon = getIcon(n.type);
                const title = isAr && n.title_ar ? n.title_ar : n.title;
                const body = isAr && n.body_ar ? n.body_ar : n.body;
                return (
                  <Card
                    key={n.id}
                    className={`transition-all duration-200 hover:shadow-sm ${!n.is_read ? "border-primary/30 bg-primary/[0.02]" : ""} ${selected.has(n.id) ? "ring-2 ring-primary/30" : ""}`}
                  >
                    <CardContent className="flex items-start gap-3 p-4">
                      <Checkbox
                        checked={selected.has(n.id)}
                        onCheckedChange={() => toggleSelect(n.id)}
                        className="mt-1"
                      />
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl cursor-pointer ${!n.is_read ? "bg-primary/10" : "bg-muted"}`}
                        onClick={() => !n.is_read && markAsRead(n.id)}
                      >
                        <Icon className={`h-4 w-4 ${!n.is_read ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => !n.is_read && markAsRead(n.id)}>
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm truncate ${!n.is_read ? "font-semibold" : "font-medium"}`}>{title}</p>
                          {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{body}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: isAr ? ar : enUS })}
                          </span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                            {isAr ? CATEGORIES.find(c => c.key === getCategory(n.type))?.labelAr : CATEGORIES.find(c => c.key === getCategory(n.type))?.labelEn}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </CompanyPageGuard>
  );
}
