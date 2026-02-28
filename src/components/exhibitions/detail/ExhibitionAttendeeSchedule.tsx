import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { CalendarPlus, Clock, Trash2, MapPin, Plus, BookmarkCheck, CalendarDays } from "lucide-react";
import { format } from "date-fns";

interface Props { exhibitionId: string; isAr: boolean; }

export default memo(function ExhibitionAttendeeSchedule({ exhibitionId, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customNotes, setCustomNotes] = useState("");

  // Fetch personal schedule
  const { data: mySchedule = [], isLoading } = useQuery({
    queryKey: ["attendee-schedule", exhibitionId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("exhibition_attendee_schedule")
        .select("*, exhibition_schedule_items(*), exhibition_agenda_items(*), exhibition_booths(booth_number, name, name_ar)")
        .eq("exhibition_id", exhibitionId)
        .eq("user_id", user.id)
        .order("created_at");
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch available schedule items to add
  const { data: availableItems = [] } = useQuery({
    queryKey: ["available-schedule-items", exhibitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibition_schedule_items")
        .select("id, title, title_ar, start_time, end_time, location, speaker_name")
        .eq("exhibition_id", exhibitionId)
        .order("start_time");
      return data || [];
    },
  });

  const addToSchedule = useMutation({
    mutationFn: async (item: { schedule_item_id?: string; custom_title?: string; custom_notes?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("exhibition_attendee_schedule").insert({
        user_id: user.id,
        exhibition_id: exhibitionId,
        schedule_item_id: item.schedule_item_id || null,
        custom_title: item.custom_title || null,
        custom_notes: item.custom_notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendee-schedule"] });
      toast({ title: t("Added to your schedule ✅", "تمت الإضافة لجدولك ✅") });
      setAddOpen(false);
      setCustomTitle("");
      setCustomNotes("");
    },
    onError: () => toast({ title: t("Already in your schedule", "موجود في جدولك بالفعل"), variant: "destructive" }),
  });

  const removeFromSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exhibition_attendee_schedule").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendee-schedule"] });
      toast({ title: t("Removed from schedule", "تمت الإزالة من الجدول") });
    },
  });

  const savedItemIds = new Set(mySchedule.map((s: any) => s.schedule_item_id).filter(Boolean));

  if (!user) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-8 text-center">
          <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{t("Sign in to create your personal schedule", "سجّل دخولك لإنشاء جدولك الشخصي")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <BookmarkCheck className="h-4 w-4 text-primary" />
          {t("My Personal Schedule", "جدولي الشخصي")}
          <Badge variant="outline" className="text-[9px]">{mySchedule.length}</Badge>
        </h3>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="me-1 h-3.5 w-3.5" /> {t("Add", "إضافة")}
        </Button>
      </div>

      {mySchedule.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-8 text-center">
            <CalendarPlus className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{t("Your schedule is empty. Add sessions and booths to visit!", "جدولك فارغ. أضف جلسات وأجنحة لزيارتها!")}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setAddOpen(true)}>
              <Plus className="me-1 h-3.5 w-3.5" /> {t("Browse sessions", "تصفح الجلسات")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {mySchedule.map((item: any) => {
            const scheduleItem = item.exhibition_schedule_items;
            const booth = item.exhibition_booths;
            const itemTitle = scheduleItem
              ? (isAr && scheduleItem.title_ar ? scheduleItem.title_ar : scheduleItem.title)
              : item.custom_title || t("Custom Event", "حدث مخصص");

            return (
              <Card key={item.id} className="transition-all hover:shadow-sm">
                <CardContent className="p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{itemTitle}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {scheduleItem?.start_time && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" />
                          {format(new Date(scheduleItem.start_time), "MMM d, HH:mm")}
                        </span>
                      )}
                      {scheduleItem?.location && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5" />
                          {scheduleItem.location}
                        </span>
                      )}
                      {booth && (
                        <Badge variant="outline" className="text-[9px]">
                          {t("Booth", "جناح")} {booth.booth_number}
                        </Badge>
                      )}
                    </div>
                    {item.custom_notes && <p className="text-[10px] text-muted-foreground mt-1">{item.custom_notes}</p>}
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-destructive/60 hover:text-destructive" onClick={() => removeFromSchedule.mutate(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add to Schedule Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Add to Schedule", "أضف للجدول")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Available sessions */}
            {availableItems.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2 text-muted-foreground">{t("Event Sessions", "جلسات الفعالية")}</p>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {availableItems.map((item: any) => {
                    const isSaved = savedItemIds.has(item.id);
                    return (
                      <Card key={item.id} className={`transition-all ${isSaved ? "opacity-50" : "hover:shadow-sm cursor-pointer"}`}>
                        <CardContent className="p-2.5 flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{isAr && item.title_ar ? item.title_ar : item.title}</p>
                            <div className="flex gap-2 mt-0.5">
                              {item.start_time && <span className="text-[9px] text-muted-foreground">{format(new Date(item.start_time), "MMM d, HH:mm")}</span>}
                              {item.speaker_name && <span className="text-[9px] text-muted-foreground">🎤 {item.speaker_name}</span>}
                            </div>
                          </div>
                          <Button size="sm" variant={isSaved ? "secondary" : "default"} className="text-[10px] h-7" disabled={isSaved || addToSchedule.isPending} onClick={() => addToSchedule.mutate({ schedule_item_id: item.id })}>
                            {isSaved ? t("Added", "مضاف") : t("Add", "أضف")}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom event */}
            <div className="border-t pt-3">
              <p className="text-xs font-semibold mb-2 text-muted-foreground">{t("Add Custom Note", "إضافة ملاحظة مخصصة")}</p>
              <Input placeholder={t("Title", "العنوان")} value={customTitle} onChange={e => setCustomTitle(e.target.value)} className="mb-2" />
              <Input placeholder={t("Notes (optional)", "ملاحظات (اختياري)")} value={customNotes} onChange={e => setCustomNotes(e.target.value)} className="mb-2" />
              <Button size="sm" className="w-full" disabled={!customTitle || addToSchedule.isPending} onClick={() => addToSchedule.mutate({ custom_title: customTitle, custom_notes: customNotes })}>
                <CalendarPlus className="me-1 h-3.5 w-3.5" /> {t("Add to Schedule", "أضف للجدول")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
