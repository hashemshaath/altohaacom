import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Clock, Users, Plus, Ticket, Search, Filter } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, isAfter, isBefore, isToday } from "date-fns";

interface EventForm {
  title: string;
  title_ar: string;
  description: string;
  event_type: string;
  location: string;
  start_date: string;
  end_date: string;
  max_attendees: number;
}

const defaultForm: EventForm = {
  title: "", title_ar: "", description: "", event_type: "workshop",
  location: "", start_date: "", end_date: "", max_attendees: 50,
};

const EVENT_TYPES = [
  { value: "workshop", en: "Workshop", ar: "ورشة عمل" },
  { value: "seminar", en: "Seminar", ar: "ندوة" },
  { value: "competition", en: "Competition", ar: "مسابقة" },
  { value: "tasting", en: "Tasting", ar: "تذوق" },
  { value: "networking", en: "Networking", ar: "تواصل" },
  { value: "masterclass", en: "Masterclass", ar: "ماستر كلاس" },
];

export function EventManager() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<EventForm>(defaultForm);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["managed-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("*")
        .eq("type", "event")
        .order("event_start", { ascending: true });
      return data || [];
    },
  });

  const { data: myRsvps = [] } = useQuery({
    queryKey: ["my-rsvps", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_rsvps" as any)
        .select("event_id, status")
        .eq("user_id", user!.id) as any;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      await (supabase.from("event_rsvps" as any).upsert({ event_id: eventId, user_id: user!.id, status }, { onConflict: "event_id,user_id" }) as any);
    },
    onSuccess: () => {
      toast({ title: isAr ? "تم تسجيل حضورك" : "RSVP confirmed!" });
      qc.invalidateQueries({ queryKey: ["my-rsvps"] });
    },
  });

  const filtered = useMemo(() => {
    let list = events;
    if (searchTerm) {
      list = list.filter((e: any) => e.title?.toLowerCase().includes(searchTerm.toLowerCase()) || e.title_ar?.includes(searchTerm));
    }
    if (filterType !== "all") {
      list = list.filter((e: any) => {
        if (filterType === "upcoming") return e.event_start && isAfter(new Date(e.event_start), new Date());
        if (filterType === "past") return e.event_start && isBefore(new Date(e.event_start), new Date());
        if (filterType === "today") return e.event_start && isToday(new Date(e.event_start));
        return true;
      });
    }
    return list;
  }, [events, searchTerm, filterType]);

  const getEventStatus = (event: any) => {
    if (!event.event_start) return { label: isAr ? "مسودة" : "Draft", variant: "outline" as const };
    const start = new Date(event.event_start);
    const end = event.event_end ? new Date(event.event_end) : start;
    const now = new Date();
    if (isAfter(start, now)) return { label: isAr ? "قادم" : "Upcoming", variant: "default" as const };
    if (isBefore(end, now)) return { label: isAr ? "انتهى" : "Ended", variant: "secondary" as const };
    return { label: isAr ? "جاري الآن" : "Live", variant: "destructive" as const };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          {isAr ? "إدارة الفعاليات" : "Event Manager"}
        </h3>
        <Button size="sm" className="gap-1" onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5" /> {isAr ? "فعالية جديدة" : "New Event"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="ps-8 h-8 text-xs" placeholder={isAr ? "بحث..." : "Search..."} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
            <SelectItem value="upcoming">{isAr ? "قادمة" : "Upcoming"}</SelectItem>
            <SelectItem value="today">{isAr ? "اليوم" : "Today"}</SelectItem>
            <SelectItem value="past">{isAr ? "سابقة" : "Past"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-3 gap-2">
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">{events.length}</p><p className="text-[10px] text-muted-foreground">{isAr ? "إجمالي" : "Total"}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-green-500">{events.filter((e: any) => e.event_start && isAfter(new Date(e.event_start), new Date())).length}</p><p className="text-[10px] text-muted-foreground">{isAr ? "قادمة" : "Upcoming"}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-primary">{myRsvps.length}</p><p className="text-[10px] text-muted-foreground">{isAr ? "حضوري" : "My RSVPs"}</p></CardContent></Card>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filtered.map((event: any) => {
          const status = getEventStatus(event);
          const isRsvped = myRsvps.some((r: any) => r.event_id === event.id);
          return (
            <Card key={event.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {event.featured_image_url ? (
                    <img src={event.featured_image_url} alt="" className="h-16 w-24 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="h-16 w-24 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Calendar className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
                    </div>
                    <h4 className="text-sm font-semibold line-clamp-1">{isAr ? event.title_ar || event.title : event.title}</h4>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      {event.event_start && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {format(new Date(event.event_start), "MMM d, yyyy HH:mm")}
                        </span>
                      )}
                      {event.event_location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {isAr ? event.event_location_ar || event.event_location : event.event_location}
                        </span>
                      )}
                    </div>
                    {event.excerpt && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{isAr ? event.excerpt_ar || event.excerpt : event.excerpt}</p>}
                    <div className="flex gap-2 mt-2">
                      {user && !isRsvped && status.variant !== "secondary" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => rsvpMutation.mutate({ eventId: event.id, status: "attending" })}>
                          <Ticket className="h-3 w-3" /> {isAr ? "سجل حضور" : "RSVP"}
                        </Button>
                      )}
                      {isRsvped && <Badge variant="outline" className="text-xs gap-1"><Ticket className="h-3 w-3 text-green-500" />{isAr ? "مسجل" : "Registered"}</Badge>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <Calendar className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">{isAr ? "لا توجد فعاليات" : "No events found"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
