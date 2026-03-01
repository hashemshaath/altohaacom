import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Eye, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, isSameDay, isToday } from "date-fns";

interface ScheduledItem {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduled_date: string;
}

export function ContentCalendarWidget() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [items, setItems] = useState<ScheduledItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    const fetchScheduled = async () => {
      const start = startOfMonth(currentMonth).toISOString();
      const end = endOfMonth(currentMonth).toISOString();

      const { data } = await supabase
        .from("articles")
        .select("id, title, type, status, published_at")
        .gte("published_at", start)
        .lte("published_at", end)
        .order("published_at", { ascending: true });

      setItems(
        (data || []).map((a) => ({
          id: a.id,
          title: a.title,
          type: a.type,
          status: a.status || "draft",
          scheduled_date: a.published_at || "",
        }))
      );
    };
    fetchScheduled();
  }, [currentMonth]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const dayItems = selectedDay
    ? items.filter((i) => isSameDay(new Date(i.scheduled_date), selectedDay))
    : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
      case "scheduled": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "draft": return "bg-muted text-muted-foreground border-border";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Content Calendar
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-7 gap-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="text-xs text-muted-foreground text-center font-medium py-1">{d}</div>
          ))}
          {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => {
            const count = items.filter((i) => isSameDay(new Date(i.scheduled_date), day)).length;
            const selected = selectedDay && isSameDay(day, selectedDay);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(selected ? null : day)}
                className={`relative text-xs p-1.5 rounded-md transition-colors text-center
                  ${isToday(day) ? "ring-1 ring-primary" : ""}
                  ${selected ? "bg-primary text-primary-foreground" : "hover:bg-muted"}
                `}
              >
                {format(day, "d")}
                {count > 0 && (
                  <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${selected ? "bg-primary-foreground" : "bg-primary"}`} />
                )}
              </button>
            );
          })}
        </div>

        {selectedDay && (
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {format(selectedDay, "EEEE, MMM d")} • {dayItems.length} item(s)
            </p>
            {dayItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">No content scheduled</p>
            ) : (
              dayItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs truncate">{item.title}</span>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${getStatusColor(item.status)}`}>
                    {item.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {items.filter(i => i.status === "published").length} Published</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {items.filter(i => i.status === "scheduled" || i.status === "draft").length} Pending</span>
        </div>
      </CardContent>
    </Card>
  );
}
