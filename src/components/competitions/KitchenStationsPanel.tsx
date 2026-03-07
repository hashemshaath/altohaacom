import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Plus, ChefHat, Trash2, Wrench } from "lucide-react";

interface Props {
  competitionId: string;
  isOrganizer: boolean;
}

const STATUS_STYLES: Record<string, { en: string; ar: string; color: string }> = {
  available: { en: "Available", ar: "متاح", color: "bg-chart-5/10 text-chart-5" },
  assigned: { en: "Assigned", ar: "مخصص", color: "bg-primary/10 text-primary" },
  maintenance: { en: "Maintenance", ar: "صيانة", color: "bg-destructive/10 text-destructive" },
};

export function KitchenStationsPanel({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ station_number: "", station_name: "", station_name_ar: "" });

  const { data: stations, isLoading } = useQuery({
    queryKey: ["kitchen-stations", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kitchen_stations")
        .select("id, competition_id, station_number, station_name, station_name_ar, status, assigned_registration_id, assigned_slot_id, equipment_list, created_at")
        .eq("competition_id", competitionId)
        .order("station_number");
      if (error) throw error;
      return data;
    },
  });

  const createStation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("kitchen_stations").insert({
        competition_id: competitionId,
        station_number: form.station_number,
        station_name: form.station_name || undefined,
        station_name_ar: form.station_name_ar || undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-stations", competitionId] });
      setShowCreate(false);
      setForm({ station_number: "", station_name: "", station_name_ar: "" });
      toast({ title: isAr ? "تمت الإضافة" : "Station added" });
    },
    onError: () => toast({ title: isAr ? "خطأ (قد يكون الرقم مكرر)" : "Error (number may be duplicate)", variant: "destructive" }),
  });

  const deleteStation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kitchen_stations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-stations", competitionId] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;

  const availableCount = stations?.filter(s => s.status === "available").length || 0;
  const assignedCount = stations?.filter(s => s.status === "assigned").length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
            <ChefHat className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{isAr ? "محطات المطبخ" : "Kitchen Stations"}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{availableCount} {isAr ? "متاح" : "available"}</span>
              <span>·</span>
              <span>{assignedCount} {isAr ? "مخصص" : "assigned"}</span>
            </div>
          </div>
        </div>
        {isOrganizer && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="me-1.5 h-4 w-4" />{isAr ? "محطة" : "Add Station"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isAr ? "إضافة محطة مطبخ" : "Add Kitchen Station"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label>{isAr ? "رقم المحطة" : "Station Number"}</Label>
                  <Input value={form.station_number} onChange={e => setForm(f => ({ ...f, station_number: e.target.value }))} placeholder="A1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{isAr ? "الاسم (EN)" : "Name (EN)"}</Label>
                    <Input value={form.station_name} onChange={e => setForm(f => ({ ...f, station_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{isAr ? "الاسم (AR)" : "Name (AR)"}</Label>
                    <Input value={form.station_name_ar} onChange={e => setForm(f => ({ ...f, station_name_ar: e.target.value }))} dir="rtl" />
                  </div>
                </div>
                <Button onClick={() => createStation.mutate()} disabled={!form.station_number || createStation.isPending}>
                  {createStation.isPending ? "..." : (isAr ? "إضافة" : "Add")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!stations?.length ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ChefHat className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="font-medium text-sm">{isAr ? "لا توجد محطات" : "No stations configured"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {stations.map(station => {
            const statusStyle = STATUS_STYLES[station.status || "available"];
            return (
              <Card key={station.id} className="border-border/50 hover:shadow-sm transition-all group">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted font-mono text-sm font-bold text-foreground shrink-0">
                        {station.station_number}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {isAr && station.station_name_ar ? station.station_name_ar : station.station_name || `${isAr ? "محطة" : "Station"} ${station.station_number}`}
                        </p>
                        <Badge className={`text-[9px] ${statusStyle.color}`}>
                          {isAr ? statusStyle.ar : statusStyle.en}
                        </Badge>
                      </div>
                    </div>
                    {isOrganizer && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteStation.mutate(station.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
