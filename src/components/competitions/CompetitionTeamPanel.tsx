import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Pencil, Users, Save, X, Loader2,
  Phone, Mail, UserCheck,
} from "lucide-react";

interface CompetitionTeamPanelProps {
  competitionId: string;
  isOrganizer?: boolean;
}

const ROLES = [
  { value: "assistant", en: "Assistant", ar: "مساعد" },
  { value: "volunteer", en: "Volunteer", ar: "متطوع" },
  { value: "coordinator", en: "Coordinator", ar: "منسق" },
  { value: "kitchen_marshal", en: "Kitchen Marshal", ar: "مشرف المطبخ" },
  { value: "timekeeper", en: "Timekeeper", ar: "ضابط الوقت" },
  { value: "photographer", en: "Photographer", ar: "مصور" },
  { value: "mc", en: "MC / Host", ar: "مقدم الحفل" },
  { value: "other", en: "Other", ar: "أخرى" },
];

interface MemberForm {
  name: string;
  name_ar: string;
  role: string;
  email: string;
  phone: string;
  notes: string;
}

const emptyForm: MemberForm = { name: "", name_ar: "", role: "assistant", email: "", phone: "", notes: "" };

export function CompetitionTeamPanel({ competitionId, isOrganizer }: CompetitionTeamPanelProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [filterRole, setFilterRole] = useState("all");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["competition-team", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_team_members")
        .select("*")
        .eq("competition_id", competitionId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase.from("competition_team_members").update({
          name: form.name, name_ar: form.name_ar || null,
          role: form.role, email: form.email || null,
          phone: form.phone || null, notes: form.notes || null,
        }).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("competition_team_members").insert({
          competition_id: competitionId,
          name: form.name, name_ar: form.name_ar || null,
          role: form.role, email: form.email || null,
          phone: form.phone || null, notes: form.notes || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-team", competitionId] });
      toast({ title: isAr ? "تم الحفظ" : "Saved" });
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("competition_team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-team", competitionId] });
      toast({ title: isAr ? "تم الحذف" : "Member removed" });
    },
  });

  const filtered = filterRole === "all" ? members : members.filter((m: any) => m.role === filterRole);

  const getRoleLabel = (role: string) => {
    const r = ROLES.find((r) => r.value === role);
    return isAr ? r?.ar || role : r?.en || role;
  };

  const roleColor = (role: string) => {
    const map: Record<string, string> = {
      assistant: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      volunteer: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      coordinator: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      kitchen_marshal: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      timekeeper: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      photographer: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
      mc: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    };
    return map[role] || "bg-muted text-muted-foreground";
  };

  const grouped = ROLES.reduce((acc, role) => {
    const roleMembers = filtered.filter((m: any) => m.role === role.value);
    if (roleMembers.length > 0) acc.push({ ...role, members: roleMembers });
    return acc;
  }, [] as any[]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <UserCheck className="h-4 w-4 text-primary" />
          </div>
          {isAr ? "فريق العمل" : "Support Team"}
          <Badge variant="secondary" className="ms-1">{members.length}</Badge>
        </h3>
        <div className="flex gap-2">
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "الكل" : "All Roles"}</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{isAr ? r.ar : r.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isOrganizer && (
            <Button size="sm" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}>
              <Plus className="me-1.5 h-4 w-4" />
              {isAr ? "إضافة عضو" : "Add Member"}
            </Button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {editingId ? (isAr ? "تعديل العضو" : "Edit Member") : (isAr ? "إضافة عضو جديد" : "Add New Member")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الاسم (إنجليزي)" : "Name (English)"} *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} dir="rtl" className="h-9" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الدور" : "Role"}</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{isAr ? r.ar : r.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "البريد" : "Email"}</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الهاتف" : "Phone"}</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "ملاحظات" : "Notes"}</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="h-9" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!form.name.trim() || saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="me-1.5 h-3.5 w-3.5" />}
                {isAr ? "حفظ" : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>
                <X className="me-1.5 h-3.5 w-3.5" />
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
            <Users className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">{isAr ? "لا يوجد أعضاء فريق بعد" : "No team members yet"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((group: any) => (
            <div key={group.value}>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                <Badge className={roleColor(group.value)} variant="outline">{isAr ? group.ar : group.en}</Badge>
                <span>({group.members.length})</span>
              </h4>
              <div className="space-y-2">
                {group.members.map((member: any) => (
                  <Card key={member.id} className="overflow-hidden">
                    <CardContent className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                          {member.name[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{isAr && member.name_ar ? member.name_ar : member.name}</p>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            {member.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{member.email}</span>}
                            {member.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{member.phone}</span>}
                          </div>
                        </div>
                      </div>
                      {isOrganizer && (
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                            setEditingId(member.id);
                            setForm({ name: member.name, name_ar: member.name_ar || "", role: member.role, email: member.email || "", phone: member.phone || "", notes: member.notes || "" });
                            setShowForm(true);
                          }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
                            if (confirm(isAr ? "حذف هذا العضو؟" : "Remove this member?")) {
                              deleteMutation.mutate(member.id);
                            }
                          }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
