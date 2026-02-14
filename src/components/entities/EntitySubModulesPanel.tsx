import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { BookOpen, Calendar, Crown, GraduationCap, Trophy, Users, X } from "lucide-react";
import { EntityLeadershipPanel } from "@/components/entities/EntityLeadershipPanel";
import { EntityProgramsTab } from "@/components/entities/tabs/EntityProgramsTab";
import { EntityEventsTab } from "@/components/entities/tabs/EntityEventsTab";
import { EntityCompetitionsTab } from "@/components/entities/tabs/EntityCompetitionsTab";
import { format } from "date-fns";

interface Props {
  entityId: string;
  entityName: string;
  onClose: () => void;
}

const membershipTypeLabels: Record<string, { en: string; ar: string }> = {
  member: { en: "Member", ar: "عضو" }, student: { en: "Student", ar: "طالب" },
  alumni: { en: "Alumni", ar: "خريج" }, instructor: { en: "Instructor", ar: "مدرب" },
  staff: { en: "Staff", ar: "موظف" }, board_member: { en: "Board Member", ar: "عضو مجلس إدارة" },
  honorary: { en: "Honorary", ar: "فخري" },
};

export function EntitySubModulesPanel({ entityId, entityName, onClose }: Props) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("leadership");
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);

  const { data: programs } = useQuery({
    queryKey: ["admin-entity-programs", entityId],
    queryFn: async () => {
      const { data } = await supabase.from("entity_programs").select("id").eq("entity_id", entityId);
      return data;
    },
  });

  const { data: events } = useQuery({
    queryKey: ["admin-entity-events", entityId],
    queryFn: async () => {
      const { data } = await supabase.from("entity_events").select("id").eq("entity_id", entityId);
      return data;
    },
  });

  const { data: participations } = useQuery({
    queryKey: ["admin-entity-competitions", entityId],
    queryFn: async () => {
      const { data } = await supabase.from("entity_competition_participations").select("id").eq("entity_id", entityId);
      return data;
    },
  });

  const { data: memberships } = useQuery({
    queryKey: ["admin-entity-memberships", entityId],
    queryFn: async () => {
      const { data, error } = await supabase.from("entity_memberships").select("*").eq("entity_id", entityId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: degrees } = useQuery({
    queryKey: ["admin-entity-degrees", entityId],
    queryFn: async () => {
      const { data, error } = await supabase.from("entity_degrees").select("*").eq("entity_id", entityId).order("graduation_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteProgramMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("entity_programs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-entity-programs", entityId] });
      toast({ title: isAr ? "تم حذف البرنامج" : "Program deleted" });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("entity_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-entity-events", entityId] });
      toast({ title: isAr ? "تم حذف الفعالية" : "Event deleted" });
    },
  });

  const deleteCompMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("entity_competition_participations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-entity-competitions", entityId] });
      toast({ title: isAr ? "تم إلغاء الربط" : "Competition unlinked" });
    },
  });

  const handleDeleteRequest = (type: string, id: string, name: string) => {
    setDeleteTarget({ type, id, name });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    switch (deleteTarget.type) {
      case "program": deleteProgramMutation.mutate(deleteTarget.id); break;
      case "event": deleteEventMutation.mutate(deleteTarget.id); break;
      case "competition": deleteCompMutation.mutate(deleteTarget.id); break;
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{isAr ? "إدارة:" : "Manage:"} {entityName}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="leadership" className="gap-1"><Crown className="h-3.5 w-3.5" />{isAr ? "القيادة" : "Leadership"}</TabsTrigger>
              <TabsTrigger value="programs" className="gap-1"><BookOpen className="h-3.5 w-3.5" />{isAr ? "البرامج" : "Programs"} ({programs?.length || 0})</TabsTrigger>
              <TabsTrigger value="events" className="gap-1"><Calendar className="h-3.5 w-3.5" />{isAr ? "الفعاليات" : "Events"} ({events?.length || 0})</TabsTrigger>
              <TabsTrigger value="competitions" className="gap-1"><Trophy className="h-3.5 w-3.5" />{isAr ? "المسابقات" : "Competitions"} ({participations?.length || 0})</TabsTrigger>
              <TabsTrigger value="members" className="gap-1"><Users className="h-3.5 w-3.5" />{isAr ? "الأعضاء" : "Members"} ({memberships?.length || 0})</TabsTrigger>
              <TabsTrigger value="degrees" className="gap-1"><GraduationCap className="h-3.5 w-3.5" />{isAr ? "الشهادات" : "Degrees"} ({degrees?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="leadership" className="mt-4">
              <EntityLeadershipPanel entityId={entityId} />
            </TabsContent>

            <TabsContent value="programs">
              <EntityProgramsTab entityId={entityId} onDeleteRequest={handleDeleteRequest} />
            </TabsContent>

            <TabsContent value="events">
              <EntityEventsTab entityId={entityId} onDeleteRequest={handleDeleteRequest} />
            </TabsContent>

            <TabsContent value="competitions">
              <EntityCompetitionsTab entityId={entityId} onDeleteRequest={handleDeleteRequest} />
            </TabsContent>

            <TabsContent value="members" className="mt-4">
              {memberships && memberships.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                        <TableHead>{isAr ? "القسم" : "Department"}</TableHead>
                        <TableHead>{isAr ? "رقم الطالب" : "Student ID"}</TableHead>
                        <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                        <TableHead>{isAr ? "تاريخ التسجيل" : "Enrolled"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberships.map(m => (
                        <TableRow key={m.id}>
                          <TableCell><Badge variant="secondary">{isAr ? membershipTypeLabels[m.membership_type]?.ar : membershipTypeLabels[m.membership_type]?.en || m.membership_type}</Badge></TableCell>
                          <TableCell>{isAr && m.department_ar ? m.department_ar : m.department || "-"}</TableCell>
                          <TableCell className="font-mono text-xs">{m.student_id || "-"}</TableCell>
                          <TableCell><Badge variant={m.status === "active" ? "default" : "secondary"}>{m.status}</Badge></TableCell>
                          <TableCell>{m.enrollment_date ? format(new Date(m.enrollment_date), "MMM yyyy") : "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Users className="mx-auto mb-2 h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">{isAr ? "لا يوجد أعضاء بعد" : "No members yet"}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="degrees" className="mt-4">
              {degrees && degrees.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isAr ? "الشهادة" : "Degree"}</TableHead>
                        <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                        <TableHead>{isAr ? "التخصص" : "Field"}</TableHead>
                        <TableHead>{isAr ? "التخرج" : "Graduation"}</TableHead>
                        <TableHead>{isAr ? "موثق" : "Verified"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {degrees.map(d => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{isAr && d.degree_name_ar ? d.degree_name_ar : d.degree_name}</TableCell>
                          <TableCell><Badge variant="secondary">{d.degree_type}</Badge></TableCell>
                          <TableCell>{d.field_of_study || "-"}</TableCell>
                          <TableCell>{d.graduation_date ? format(new Date(d.graduation_date), "MMM yyyy") : "-"}</TableCell>
                          <TableCell>{d.is_verified ? "✓" : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <GraduationCap className="mx-auto mb-2 h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">{isAr ? "لا توجد شهادات بعد" : "No degrees yet"}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "تأكيد الحذف" : "Confirm Deletion"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? `هل أنت متأكد من حذف "${deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleConfirmDelete}>
              {isAr ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
