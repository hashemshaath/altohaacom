import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Layers, Plus, Edit, Trash2, Trophy, Users, Gavel, Calendar,
  CheckCircle, Clock, Play, ArrowUpDown,
} from "lucide-react";

interface CompetitionRoundsManagerProps {
  competitionId: string;
  competitionTitle: string;
}

export function CompetitionRoundsManager({ competitionId, competitionTitle }: CompetitionRoundsManagerProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", name_ar: "", round_number: 1, status: "pending" as string,
    start_date: "", end_date: "", max_participants: "",
  });

  const { data: rounds = [], isLoading } = useQuery({
    queryKey: ["competition-rounds", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_rounds")
        .select("*")
        .eq("competition_id", competitionId)
        .order("round_number");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: judgeCounts = {} } = useQuery({
    queryKey: ["round-judge-counts", competitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("competition_roles")
        .select("id")
        .eq("competition_id", competitionId)
        .eq("role", "judge")
        .eq("status", "active");
      return { total: data?.length || 0 };
    },
  });

  const { data: participantCount = 0 } = useQuery({
    queryKey: ["comp-participant-count", competitionId],
    queryFn: async () => {
      const { count } = await supabase
        .from("competition_registrations")
        .select("*", { count: "exact", head: true })
        .eq("competition_id", competitionId)
        .eq("status", "approved");
      return count || 0;
    },
  });

  const createRoundMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("competition_rounds").insert({
        competition_id: competitionId,
        name: formData.name,
        name_ar: formData.name_ar || null,
        round_number: formData.round_number,
        status: formData.status,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-rounds"] });
      setCreateOpen(false);
      setFormData({ name: "", name_ar: "", round_number: rounds.length + 2, status: "pending", start_date: "", end_date: "", max_participants: "" });
      toast({ title: isAr ? "تم إنشاء الجولة" : "Round created" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("competition_rounds").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-rounds"] });
      toast({ title: isAr ? "تم التحديث" : "Updated" });
    },
  });

  const deleteRoundMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("competition_rounds").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-rounds"] });
      toast({ title: isAr ? "تم حذف الجولة" : "Round deleted" });
    },
  });

  const statusColors: Record<string, string> = {
    pending: "bg-muted/60 text-muted-foreground",
    active: "bg-primary/10 text-primary",
    completed: "bg-chart-5/10 text-chart-5",
    cancelled: "bg-destructive/10 text-destructive",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            {isAr ? "إدارة الجولات" : "Rounds Management"}
          </CardTitle>
          <Button size="sm" onClick={() => { setFormData(f => ({ ...f, round_number: rounds.length + 1 })); setCreateOpen(true); }}>
            <Plus className="me-1.5 h-3.5 w-3.5" /> {isAr ? "جولة جديدة" : "Add Round"}
          </Button>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {participantCount} {isAr ? "مشارك" : "participants"}</span>
          <span className="flex items-center gap-1"><Gavel className="h-3 w-3" /> {(judgeCounts as any).total || 0} {isAr ? "حكم" : "judges"}</span>
          <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {rounds.length} {isAr ? "جولة" : "rounds"}</span>
        </div>
      </CardHeader>
      <CardContent>
        {rounds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {isAr ? "لا توجد جولات بعد" : "No rounds created yet"}
          </div>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>{isAr ? "الجولة" : "Round"}</TableHead>
                  <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rounds.map((round: any) => (
                  <TableRow key={round.id}>
                    <TableCell className="font-mono text-xs">{round.round_number}</TableCell>
                    <TableCell className="font-medium text-sm">{isAr && round.name_ar ? round.name_ar : round.name}</TableCell>
                    <TableCell>
                      <Select value={round.status} onValueChange={(v) => updateStatusMutation.mutate({ id: round.id, status: v })}>
                        <SelectTrigger className="h-7 w-28">
                          <Badge variant="outline" className={`text-[10px] ${statusColors[round.status] || ""}`}>{round.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {round.start_date ? new Date(round.start_date).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteRoundMutation.mutate(round.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "إضافة جولة جديدة" : "Add New Round"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name (EN)</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Round 1" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">الاسم (AR)</Label>
                <Input dir="rtl" value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} placeholder="الجولة الأولى" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "تاريخ البداية" : "Start Date"}</Label>
                <Input type="datetime-local" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "تاريخ النهاية" : "End Date"}</Label>
                <Input type="datetime-local" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "رقم الجولة" : "Round #"}</Label>
                <Input type="number" value={formData.round_number} onChange={(e) => setFormData({ ...formData, round_number: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الحد الأقصى" : "Max Participants"}</Label>
                <Input type="number" value={formData.max_participants} onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })} placeholder="Optional" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => createRoundMutation.mutate()} disabled={!formData.name || createRoundMutation.isPending}>
              <Plus className="me-1.5 h-4 w-4" /> {isAr ? "إنشاء" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
