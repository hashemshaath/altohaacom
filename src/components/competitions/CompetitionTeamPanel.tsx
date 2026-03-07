import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Pencil, Users, Save, X, Loader2,
  Phone, Mail, UserCheck, CheckCircle, Clock,
} from "lucide-react";

interface CompetitionTeamPanelProps {
  competitionId: string;
  isOrganizer?: boolean;
}

const ROLE_GROUPS = [
  {
    group: "operations",
    groupEn: "Operations & Logistics",
    groupAr: "العمليات واللوجستيات",
    roles: [
      { value: "coordinator", en: "Coordinator", ar: "منسق" },
      { value: "kitchen_marshal", en: "Kitchen Marshal", ar: "مشرف المطبخ" },
      { value: "timekeeper", en: "Timekeeper", ar: "ضابط الوقت" },
      { value: "floor_manager", en: "Floor Manager", ar: "مدير القاعة" },
      { value: "logistics", en: "Logistics", ar: "لوجستيات" },
    ],
  },
  {
    group: "support",
    groupEn: "Support Staff",
    groupAr: "فريق الدعم",
    roles: [
      { value: "assistant", en: "Assistant", ar: "مساعد" },
      { value: "volunteer", en: "Volunteer", ar: "متطوع" },
      { value: "runner", en: "Runner", ar: "مساعد ميداني" },
      { value: "registration_desk", en: "Registration Desk", ar: "مكتب التسجيل" },
    ],
  },
  {
    group: "media",
    groupEn: "Media & Presentation",
    groupAr: "الإعلام والتقديم",
    roles: [
      { value: "photographer", en: "Photographer", ar: "مصور" },
      { value: "videographer", en: "Videographer", ar: "مصور فيديو" },
      { value: "mc", en: "MC / Host", ar: "مقدم الحفل" },
      { value: "social_media", en: "Social Media", ar: "وسائل التواصل" },
    ],
  },
  {
    group: "other",
    groupEn: "Other",
    groupAr: "أخرى",
    roles: [
      { value: "medical", en: "Medical / First Aid", ar: "إسعافات أولية" },
      { value: "security", en: "Security", ar: "أمن" },
      { value: "other", en: "Other", ar: "أخرى" },
    ],
  },
];

const ROLES = ROLE_GROUPS.flatMap(g => g.roles);

interface MemberForm {
  name: string;
  name_ar: string;
  role: string;
  email: string;
  phone: string;
  notes: string;
  title: string;
  title_ar: string;
  photo_url: string;
}

const emptyForm: MemberForm = {
  name: "", name_ar: "", role: "coordinator", email: "", phone: "",
  notes: "", title: "", title_ar: "", photo_url: "",
};

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
        .select("id, competition_id, name, name_ar, role, email, phone, title, title_ar, photo_url, notes, is_checked_in, checked_in_at, is_active, created_at")
        .eq("competition_id", competitionId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name, name_ar: form.name_ar || null,
        role: form.role, email: form.email || null,
        phone: form.phone || null, notes: form.notes || null,
        title: form.title || null, title_ar: form.title_ar || null,
        photo_url: form.photo_url || null,
      };
      if (editingId) {
        const { error } = await supabase.from("competition_team_members").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("competition_team_members").insert({
          competition_id: competitionId, ...payload,
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

  const checkInMutation = useMutation({
    mutationFn: async ({ id, checkedIn }: { id: string; checkedIn: boolean }) => {
      const { error } = await supabase.from("competition_team_members").update({
        is_checked_in: checkedIn,
        checked_in_at: checkedIn ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-team", competitionId] });
      toast({ title: isAr ? "تم التحديث" : "Updated" });
    },
  });

  const filtered = filterRole === "all" ? members : members.filter((m: any) => m.role === filterRole);

  const getRoleLabel = (role: string) => {
    const r = ROLES.find((r) => r.value === role);
    return isAr ? r?.ar || role : r?.en || role;
  };

  const roleColor = (role: string): "default" | "secondary" | "outline" | "destructive" => {
    const map: Record<string, "default" | "secondary" | "outline"> = {
      coordinator: "default",
      kitchen_marshal: "default",
      floor_manager: "default",
      logistics: "default",
      assistant: "secondary",
      volunteer: "secondary",
      runner: "secondary",
      registration_desk: "secondary",
      photographer: "outline",
      videographer: "outline",
      mc: "outline",
      social_media: "outline",
    };
    return map[role] || "secondary";
  };

  const grouped = useMemo(() => ROLES.reduce((acc, role) => {
    const roleMembers = filtered.filter((m: any) => m.role === role.value);
    if (roleMembers.length > 0) acc.push({ ...role, members: roleMembers });
    return acc;
  }, [] as any[]), [filtered]);

  const checkedInCount = useMemo(() => members.filter((m: any) => m.is_checked_in).length, [members]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
            <UserCheck className="h-4 w-4 text-primary" />
          </div>
          {isAr ? "فريق العمل" : "Support Team"}
          <Badge variant="secondary" className="ms-1">{members.length}</Badge>
          {members.length > 0 && (
            <Badge variant="outline" className="ms-1 gap-1 text-[10px]">
              <CheckCircle className="h-2.5 w-2.5" />
              {checkedInCount}/{members.length}
            </Badge>
          )}
        </h3>
        <div className="flex gap-2">
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "الكل" : "All Roles"}</SelectItem>
              {ROLE_GROUPS.map((group) => (
                <div key={group.group}>
                  <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? group.groupAr : group.groupEn}
                  </div>
                  {group.roles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{isAr ? r.ar : r.en}</SelectItem>
                  ))}
                </div>
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
          <CardHeader className="pb-3">
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "المسمى الوظيفي" : "Job Title"}</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-9" placeholder={isAr ? "شيف تنفيذي" : "Executive Chef"} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "المسمى (عربي)" : "Title (Arabic)"}</Label>
                <Input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} dir="rtl" className="h-9" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الدور" : "Role"}</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLE_GROUPS.map((group) => (
                      <div key={group.group}>
                        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {isAr ? group.groupAr : group.groupEn}
                        </div>
                        {group.roles.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{isAr ? r.ar : r.en}</SelectItem>
                        ))}
                      </div>
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
              <Label className="text-xs">{isAr ? "رابط الصورة" : "Photo URL"}</Label>
              <Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} className="h-9" placeholder="https://..." />
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
        <div className="space-y-6">
          {ROLE_GROUPS.map((roleGroup) => {
            const groupMembers = roleGroup.roles.flatMap(role => 
              filtered.filter((m: any) => m.role === role.value)
            );
            if (groupMembers.length === 0) return null;
            return (
              <div key={roleGroup.group}>
                <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2 font-semibold">
                  {isAr ? roleGroup.groupAr : roleGroup.groupEn}
                  <span className="text-muted-foreground/50">({groupMembers.length})</span>
                </h4>
                <div className="space-y-3">
                  {grouped.filter((g: any) => roleGroup.roles.some(r => r.value === g.value)).map((group: any) => (
                    <div key={group.value}>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={roleColor(group.value)} className="text-[10px]">{isAr ? group.ar : group.en}</Badge>
                        <span className="text-[10px] text-muted-foreground/60">({group.members.length})</span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                {group.members.map((member: any) => {
                  const name = isAr && member.name_ar ? member.name_ar : member.name;
                  const title = isAr && member.title_ar ? member.title_ar : member.title;
                  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

                  return (
                    <Card key={member.id} className="overflow-hidden group hover:shadow-md transition-all hover:-translate-y-0.5">
                      <CardContent className="p-0">
                        <div className="flex gap-3 p-4">
                          <Avatar className="h-12 w-12 rounded-xl shrink-0 ring-2 ring-background shadow-sm">
                            <AvatarImage src={member.photo_url || undefined} alt={name} className="object-cover" />
                            <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold truncate">{name}</span>
                              {member.is_checked_in && (
                                <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                              )}
                            </div>
                            {title && (
                              <p className="text-xs text-primary/80 font-medium truncate">{title}</p>
                            )}
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              {member.email && (
                                <span className="flex items-center gap-1 truncate">
                                  <Mail className="h-3 w-3 shrink-0" />{member.email}
                                </span>
                              )}
                              {member.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3 shrink-0" />{member.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Footer with actions */}
                        <div className="border-t bg-muted/20 px-4 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {member.is_checked_in ? (
                              <Badge variant="default" className="text-[9px] h-5 gap-0.5">
                                <CheckCircle className="h-2.5 w-2.5" />
                                {isAr ? "حاضر" : "Checked In"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] h-5 gap-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                {isAr ? "لم يحضر" : "Not arrived"}
                              </Badge>
                            )}
                          </div>
                          {isOrganizer && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={() => checkInMutation.mutate({ id: member.id, checkedIn: !member.is_checked_in })}
                              >
                                {member.is_checked_in ? (isAr ? "إلغاء" : "Undo") : (isAr ? "تسجيل حضور" : "Check In")}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                setEditingId(member.id);
                                setForm({
                                  name: member.name, name_ar: member.name_ar || "", role: member.role,
                                  email: member.email || "", phone: member.phone || "", notes: member.notes || "",
                                  title: member.title || "", title_ar: member.title_ar || "", photo_url: member.photo_url || "",
                                });
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
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
