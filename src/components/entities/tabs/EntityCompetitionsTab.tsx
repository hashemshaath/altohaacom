import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Trophy } from "lucide-react";

const participationTypeLabels: Record<string, { en: string; ar: string }> = {
  participant: { en: "Participant", ar: "مشارك" }, organizer: { en: "Organizer", ar: "منظم" },
  sponsor: { en: "Sponsor", ar: "راعي" }, host: { en: "Host", ar: "مستضيف" },
  partner: { en: "Partner", ar: "شريك" },
};

interface Props {
  entityId: string;
  onDeleteRequest: (type: string, id: string, name: string) => void;
}

export const EntityCompetitionsTab = memo(function EntityCompetitionsTab({ entityId, onDeleteRequest }: Props) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ competition_id: "", participation_type: "participant", student_count: "" });

  const { data: participations } = useQuery({
    queryKey: ["admin-entity-competitions", entityId],
    queryFn: async () => {
      const { data, error } = await supabase.from("entity_competition_participations").select("*, competitions(title, title_ar, status)").eq("entity_id", entityId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: competitions } = useQuery({
    queryKey: ["all-competitions-select"],
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("id, title, title_ar").order("title");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("entity_competition_participations").insert({
        entity_id: entityId, competition_id: form.competition_id,
        participation_type: form.participation_type,
        student_count: form.student_count ? parseInt(form.student_count) : 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-entity-competitions", entityId] });
      toast({ title: isAr ? "تم ربط المسابقة" : "Competition linked" });
      setShowForm(false);
      setForm({ competition_id: "", participation_type: "participant", student_count: "" });
    },
  });

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{participations?.length || 0} {isAr ? "مشاركة" : "participations"}</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="me-1 h-3.5 w-3.5" />{isAr ? "ربط مسابقة" : "Link Competition"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 space-y-3 bg-muted/30">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>{isAr ? "المسابقة" : "Competition"}</Label>
              <Select value={form.competition_id} onValueChange={v => setForm(p => ({ ...p, competition_id: v }))}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر..." : "Select..."} /></SelectTrigger>
                <SelectContent>{competitions?.map(c => <SelectItem key={c.id} value={c.id}>{isAr && c.title_ar ? c.title_ar : c.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? "الدور" : "Role"}</Label>
              <Select value={form.participation_type} onValueChange={v => setForm(p => ({ ...p, participation_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(participationTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>{isAr ? "عدد الطلاب" : "Student Count"}</Label><Input type="number" value={form.student_count} onChange={e => setForm(p => ({ ...p, student_count: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!form.competition_id || saveMutation.isPending}>
              {saveMutation.isPending ? (isAr ? "جاري الربط..." : "Linking...") : (isAr ? "ربط" : "Link")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
          </div>
        </Card>
      )}

      {participations && participations.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "المسابقة" : "Competition"}</TableHead>
                <TableHead>{isAr ? "الدور" : "Role"}</TableHead>
                <TableHead>{isAr ? "الطلاب" : "Students"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {participations.map(p => {
                const comp = p.competitions as any;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{comp ? (isAr && comp.title_ar ? comp.title_ar : comp.title) : "-"}</TableCell>
                    <TableCell><Badge variant="secondary">{isAr ? participationTypeLabels[p.participation_type]?.ar : participationTypeLabels[p.participation_type]?.en || p.participation_type}</Badge></TableCell>
                    <TableCell>{p.student_count || 0}</TableCell>
                    <TableCell><Badge variant={p.status === "confirmed" ? "default" : "secondary"}>{p.status}</Badge></TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDeleteRequest("competition", p.id, comp?.title || p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : !showForm && (
        <div className="py-12 text-center">
          <Trophy className="mx-auto mb-2 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{isAr ? "لا توجد مشاركات بعد" : "No participations yet"}</p>
        </div>
      )}
    </div>
  );
});
