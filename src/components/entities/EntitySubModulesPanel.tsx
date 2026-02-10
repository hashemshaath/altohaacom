import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, BookOpen, Users, GraduationCap, Calendar, Trophy } from "lucide-react";
import { format } from "date-fns";

interface Props {
  entityId: string;
  entityName: string;
  onClose: () => void;
}

const programTypes = ["diploma", "degree", "certificate", "course", "workshop", "bootcamp", "apprenticeship"];
const programLevels = ["beginner", "intermediate", "advanced", "professional", "bachelor", "master", "doctorate"];
const programStatuses = ["draft", "open", "in_progress", "completed", "cancelled"];
const eventTypes = ["competition", "workshop", "seminar", "conference", "exhibition", "graduation", "open_day", "general"];
const eventStatuses = ["draft", "upcoming", "ongoing", "completed", "cancelled"];

export function EntitySubModulesPanel({ entityId, entityName, onClose }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("programs");

  // === Programs ===
  const { data: programs } = useQuery({
    queryKey: ["admin-entity-programs", entityId],
    queryFn: async () => {
      const { data, error } = await supabase.from("entity_programs").select("*").eq("entity_id", entityId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [showProgramForm, setShowProgramForm] = useState(false);
  const [programForm, setProgramForm] = useState({ name: "", name_ar: "", description: "", program_type: "course", level: "beginner", duration_months: "", status: "draft", max_students: "", tuition_fee: "", start_date: "", end_date: "" });

  const saveProgramMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("entity_programs").insert({
        entity_id: entityId,
        name: programForm.name,
        name_ar: programForm.name_ar || null,
        description: programForm.description || null,
        program_type: programForm.program_type,
        level: programForm.level,
        duration_months: programForm.duration_months ? parseInt(programForm.duration_months) : null,
        status: programForm.status,
        max_students: programForm.max_students ? parseInt(programForm.max_students) : null,
        tuition_fee: programForm.tuition_fee ? parseFloat(programForm.tuition_fee) : null,
        start_date: programForm.start_date || null,
        end_date: programForm.end_date || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-entity-programs", entityId] });
      toast({ title: isAr ? "تم إضافة البرنامج" : "Program added" });
      setShowProgramForm(false);
      setProgramForm({ name: "", name_ar: "", description: "", program_type: "course", level: "beginner", duration_months: "", status: "draft", max_students: "", tuition_fee: "", start_date: "", end_date: "" });
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

  // === Events ===
  const { data: events } = useQuery({
    queryKey: ["admin-entity-events", entityId],
    queryFn: async () => {
      const { data, error } = await supabase.from("entity_events").select("*").eq("entity_id", entityId).order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ title: "", title_ar: "", description: "", event_type: "general", start_date: "", end_date: "", location: "", is_virtual: false, max_attendees: "", status: "upcoming" });

  const saveEventMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("entity_events").insert({
        entity_id: entityId,
        title: eventForm.title,
        title_ar: eventForm.title_ar || null,
        description: eventForm.description || null,
        event_type: eventForm.event_type,
        start_date: eventForm.start_date || null,
        end_date: eventForm.end_date || null,
        location: eventForm.location || null,
        is_virtual: eventForm.is_virtual,
        max_attendees: eventForm.max_attendees ? parseInt(eventForm.max_attendees) : null,
        status: eventForm.status,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-entity-events", entityId] });
      toast({ title: isAr ? "تم إضافة الفعالية" : "Event added" });
      setShowEventForm(false);
      setEventForm({ title: "", title_ar: "", description: "", event_type: "general", start_date: "", end_date: "", location: "", is_virtual: false, max_attendees: "", status: "upcoming" });
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

  // === Competitions ===
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

  const [showCompForm, setShowCompForm] = useState(false);
  const [compForm, setCompForm] = useState({ competition_id: "", participation_type: "participant", student_count: "" });

  const saveCompMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("entity_competition_participations").insert({
        entity_id: entityId,
        competition_id: compForm.competition_id,
        participation_type: compForm.participation_type,
        student_count: compForm.student_count ? parseInt(compForm.student_count) : 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-entity-competitions", entityId] });
      toast({ title: isAr ? "تم ربط المسابقة" : "Competition linked" });
      setShowCompForm(false);
      setCompForm({ competition_id: "", participation_type: "participant", student_count: "" });
    },
  });

  const deleteCompMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("entity_competition_participations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-entity-competitions", entityId] });
    },
  });

  // === Memberships ===
  const { data: memberships } = useQuery({
    queryKey: ["admin-entity-memberships", entityId],
    queryFn: async () => {
      const { data, error } = await supabase.from("entity_memberships").select("*").eq("entity_id", entityId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // === Degrees ===
  const { data: degrees } = useQuery({
    queryKey: ["admin-entity-degrees", entityId],
    queryFn: async () => {
      const { data, error } = await supabase.from("entity_degrees").select("*").eq("entity_id", entityId).order("graduation_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{isAr ? "إدارة:" : "Manage:"} {entityName}</CardTitle>
        <Button variant="outline" size="sm" onClick={onClose}>{isAr ? "إغلاق" : "Close"}</Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="programs" className="gap-1"><BookOpen className="h-3.5 w-3.5" />{isAr ? "البرامج" : "Programs"}</TabsTrigger>
            <TabsTrigger value="events" className="gap-1"><Calendar className="h-3.5 w-3.5" />{isAr ? "الفعاليات" : "Events"}</TabsTrigger>
            <TabsTrigger value="competitions" className="gap-1"><Trophy className="h-3.5 w-3.5" />{isAr ? "المسابقات" : "Competitions"}</TabsTrigger>
            <TabsTrigger value="members" className="gap-1"><Users className="h-3.5 w-3.5" />{isAr ? "الأعضاء" : "Members"} ({memberships?.length || 0})</TabsTrigger>
            <TabsTrigger value="degrees" className="gap-1"><GraduationCap className="h-3.5 w-3.5" />{isAr ? "الشهادات" : "Degrees"} ({degrees?.length || 0})</TabsTrigger>
          </TabsList>

          {/* Programs Tab */}
          <TabsContent value="programs" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{programs?.length || 0} {isAr ? "برنامج" : "programs"}</p>
              <Button size="sm" onClick={() => setShowProgramForm(!showProgramForm)}>
                <Plus className="me-1 h-3.5 w-3.5" />{isAr ? "برنامج جديد" : "Add Program"}
              </Button>
            </div>

            {showProgramForm && (
              <Card className="p-4 space-y-3 bg-muted/30">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Name *</Label><Input value={programForm.name} onChange={e => setProgramForm(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><Label>Name (AR)</Label><Input value={programForm.name_ar} onChange={e => setProgramForm(p => ({ ...p, name_ar: e.target.value }))} dir="rtl" /></div>
                </div>
                <div><Label>Description</Label><Textarea value={programForm.description} onChange={e => setProgramForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={programForm.program_type} onValueChange={v => setProgramForm(p => ({ ...p, program_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{programTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Level</Label>
                    <Select value={programForm.level} onValueChange={v => setProgramForm(p => ({ ...p, level: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{programLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Duration (months)</Label><Input type="number" value={programForm.duration_months} onChange={e => setProgramForm(p => ({ ...p, duration_months: e.target.value }))} /></div>
                  <div>
                    <Label>Status</Label>
                    <Select value={programForm.status} onValueChange={v => setProgramForm(p => ({ ...p, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{programStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div><Label>Max Students</Label><Input type="number" value={programForm.max_students} onChange={e => setProgramForm(p => ({ ...p, max_students: e.target.value }))} /></div>
                  <div><Label>Tuition Fee</Label><Input type="number" value={programForm.tuition_fee} onChange={e => setProgramForm(p => ({ ...p, tuition_fee: e.target.value }))} /></div>
                  <div><Label>Start Date</Label><Input type="date" value={programForm.start_date} onChange={e => setProgramForm(p => ({ ...p, start_date: e.target.value }))} /></div>
                  <div><Label>End Date</Label><Input type="date" value={programForm.end_date} onChange={e => setProgramForm(p => ({ ...p, end_date: e.target.value }))} /></div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveProgramMutation.mutate()} disabled={!programForm.name || saveProgramMutation.isPending}>
                    {saveProgramMutation.isPending ? "Saving..." : "Save Program"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowProgramForm(false)}>Cancel</Button>
                </div>
              </Card>
            )}

            {programs && programs.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "البرنامج" : "Program"}</TableHead>
                    <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                    <TableHead>{isAr ? "المستوى" : "Level"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isAr ? "المدة" : "Duration"}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{isAr && p.name_ar ? p.name_ar : p.name}</TableCell>
                      <TableCell><Badge variant="secondary">{p.program_type}</Badge></TableCell>
                      <TableCell>{p.level || "-"}</TableCell>
                      <TableCell><Badge variant={p.status === "open" ? "default" : "secondary"}>{p.status}</Badge></TableCell>
                      <TableCell>{p.duration_months ? `${p.duration_months}m` : "-"}</TableCell>
                      <TableCell><Button size="icon" variant="ghost" onClick={() => deleteProgramMutation.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{events?.length || 0} {isAr ? "فعالية" : "events"}</p>
              <Button size="sm" onClick={() => setShowEventForm(!showEventForm)}>
                <Plus className="me-1 h-3.5 w-3.5" />{isAr ? "فعالية جديدة" : "Add Event"}
              </Button>
            </div>

            {showEventForm && (
              <Card className="p-4 space-y-3 bg-muted/30">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Title *</Label><Input value={eventForm.title} onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))} /></div>
                  <div><Label>Title (AR)</Label><Input value={eventForm.title_ar} onChange={e => setEventForm(p => ({ ...p, title_ar: e.target.value }))} dir="rtl" /></div>
                </div>
                <div><Label>Description</Label><Textarea value={eventForm.description} onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={eventForm.event_type} onValueChange={v => setEventForm(p => ({ ...p, event_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{eventTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Location</Label><Input value={eventForm.location} onChange={e => setEventForm(p => ({ ...p, location: e.target.value }))} /></div>
                  <div><Label>Start</Label><Input type="datetime-local" value={eventForm.start_date} onChange={e => setEventForm(p => ({ ...p, start_date: e.target.value }))} /></div>
                  <div><Label>End</Label><Input type="datetime-local" value={eventForm.end_date} onChange={e => setEventForm(p => ({ ...p, end_date: e.target.value }))} /></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2"><Switch checked={eventForm.is_virtual} onCheckedChange={v => setEventForm(p => ({ ...p, is_virtual: v }))} /><Label>Virtual</Label></div>
                  <div className="w-32"><Label>Max Attendees</Label><Input type="number" value={eventForm.max_attendees} onChange={e => setEventForm(p => ({ ...p, max_attendees: e.target.value }))} /></div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveEventMutation.mutate()} disabled={!eventForm.title || saveEventMutation.isPending}>Save Event</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowEventForm(false)}>Cancel</Button>
                </div>
              </Card>
            )}

            {events && events.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "الفعالية" : "Event"}</TableHead>
                    <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                    <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{isAr && e.title_ar ? e.title_ar : e.title}</TableCell>
                      <TableCell><Badge variant="secondary">{e.event_type}</Badge></TableCell>
                      <TableCell>{e.start_date ? format(new Date(e.start_date), "MMM d, yyyy") : "-"}</TableCell>
                      <TableCell><Badge variant={e.status === "upcoming" ? "default" : "secondary"}>{e.status}</Badge></TableCell>
                      <TableCell><Button size="icon" variant="ghost" onClick={() => deleteEventMutation.mutate(e.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          {/* Competitions Tab */}
          <TabsContent value="competitions" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{participations?.length || 0} {isAr ? "مشاركة" : "participations"}</p>
              <Button size="sm" onClick={() => setShowCompForm(!showCompForm)}>
                <Plus className="me-1 h-3.5 w-3.5" />{isAr ? "ربط مسابقة" : "Link Competition"}
              </Button>
            </div>

            {showCompForm && (
              <Card className="p-4 space-y-3 bg-muted/30">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label>Competition</Label>
                    <Select value={compForm.competition_id} onValueChange={v => setCompForm(p => ({ ...p, competition_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>{competitions?.map(c => <SelectItem key={c.id} value={c.id}>{isAr && c.title_ar ? c.title_ar : c.title}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select value={compForm.participation_type} onValueChange={v => setCompForm(p => ({ ...p, participation_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["participant", "organizer", "sponsor", "host", "partner"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Student Count</Label><Input type="number" value={compForm.student_count} onChange={e => setCompForm(p => ({ ...p, student_count: e.target.value }))} /></div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveCompMutation.mutate()} disabled={!compForm.competition_id || saveCompMutation.isPending}>Link</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowCompForm(false)}>Cancel</Button>
                </div>
              </Card>
            )}

            {participations && participations.length > 0 && (
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
                        <TableCell><Badge variant="secondary">{p.participation_type}</Badge></TableCell>
                        <TableCell>{p.student_count || 0}</TableCell>
                        <TableCell><Badge variant={p.status === "confirmed" ? "default" : "secondary"}>{p.status}</Badge></TableCell>
                        <TableCell><Button size="icon" variant="ghost" onClick={() => deleteCompMutation.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-4">
            {memberships && memberships.length > 0 ? (
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
                      <TableCell><Badge variant="secondary">{m.membership_type}</Badge></TableCell>
                      <TableCell>{m.department || "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{m.student_id || "-"}</TableCell>
                      <TableCell><Badge variant={m.status === "active" ? "default" : "secondary"}>{m.status}</Badge></TableCell>
                      <TableCell>{m.enrollment_date ? format(new Date(m.enrollment_date), "MMM yyyy") : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">{isAr ? "لا يوجد أعضاء بعد" : "No members yet"}</p>
            )}
          </TabsContent>

          {/* Degrees Tab */}
          <TabsContent value="degrees" className="mt-4">
            {degrees && degrees.length > 0 ? (
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
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">{isAr ? "لا توجد شهادات بعد" : "No degrees yet"}</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
