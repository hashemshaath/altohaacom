import { useState, useEffect, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Users, Trophy, ShieldAlert, CreditCard, FileText, Package, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AdminEvent {
  id: string;
  type: string;
  title: string;
  titleAr: string;
  time: Date;
  read: boolean;
  icon: React.ElementType;
  color: string;
}

export const AdminRealtimeNotificationBell = memo(function AdminRealtimeNotificationBell() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = events.filter((e) => !e.read).length;

  const addEvent = useCallback((type: string, payload: any) => {
    const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
      user: { icon: Users, color: "text-primary" },
      competition: { icon: Trophy, color: "text-chart-4" },
      order: { icon: CreditCard, color: "text-chart-2" },
      ticket: { icon: AlertTriangle, color: "text-destructive" },
      article: { icon: FileText, color: "text-chart-5" },
      registration: { icon: Package, color: "text-chart-3" },
    };

    const titleMap: Record<string, { en: string; ar: string }> = {
      user: { en: "New user registered", ar: "مستخدم جديد سجّل" },
      competition: { en: "Competition updated", ar: "تم تحديث مسابقة" },
      order: { en: "New order received", ar: "طلب جديد تم استلامه" },
      ticket: { en: "New support ticket", ar: "تذكرة دعم جديدة" },
      article: { en: "Article published", ar: "تم نشر مقال" },
      registration: { en: "New competition registration", ar: "تسجيل جديد في مسابقة" },
    };

    const { icon, color } = iconMap[type] || { icon: Bell, color: "text-muted-foreground" };
    const titles = titleMap[type] || { en: "New event", ar: "حدث جديد" };

    setEvents((prev) => [
      {
        id: crypto.randomUUID(),
        type,
        title: titles.en,
        titleAr: titles.ar,
        time: new Date(),
        read: false,
        icon,
        color,
      },
      ...prev.slice(0, 49),
    ]);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-realtime-events")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, () => addEvent("user", null))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "company_orders" }, () => addEvent("order", null))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_tickets" }, () => addEvent("ticket", null))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "competition_registrations" }, () => addEvent("registration", null))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [addEvent]);

  const markAllRead = () => {
    setEvents((prev) => prev.map((e) => ({ ...e, read: true })));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -end-1 h-4 min-w-4 text-[9px] p-0 flex items-center justify-center animate-in zoom-in"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b border-border/50">
          <h4 className="text-sm font-semibold">
            {isAr ? "الأحداث الفورية" : "Live Events"}
          </h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={markAllRead}>
              <CheckCircle2 className="h-3 w-3 me-1" />
              {isAr ? "تحديد الكل كمقروء" : "Mark all read"}
            </Button>
          )}
        </div>
        <ScrollArea className="h-72">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs">{isAr ? "لا توجد أحداث بعد" : "No events yet"}</p>
              <p className="text-[10px] mt-1">{isAr ? "ستظهر هنا فور حدوثها" : "Events will appear here in real-time"}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "flex items-start gap-2.5 p-3 text-xs transition-colors",
                    !event.read && "bg-primary/5"
                  )}
                >
                  <div className={cn("mt-0.5 shrink-0 h-6 w-6 rounded-full bg-muted/60 flex items-center justify-center")}>
                    <event.icon className={cn("h-3 w-3", event.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{isAr ? event.titleAr : event.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(event.time, { addSuffix: true, locale: isAr ? ar : enUS })}
                    </p>
                  </div>
                  {!event.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
});
