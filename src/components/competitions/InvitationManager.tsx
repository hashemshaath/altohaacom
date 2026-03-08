import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Send, Search, Users, UserCheck, UserX, Clock, BarChart3, Mail, Phone, Loader2, Trash2 } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface InvitationManagerProps {
  competitionId: string;
}

const ROLES = [
  { value: "visitor", labelEn: "Visitor", labelAr: "زائر" },
  { value: "student", labelEn: "Student", labelAr: "طالب" },
  { value: "judge", labelEn: "Judge", labelAr: "حكم" },
  { value: "coordinator", labelEn: "Coordinator", labelAr: "منسق" },
  { value: "vip", labelEn: "VIP", labelAr: "شخصية مهمة" },
  { value: "media", labelEn: "Media", labelAr: "إعلام" },
  { value: "sponsor", labelEn: "Sponsor", labelAr: "راعي" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  sent: "bg-chart-4/20 text-chart-4",
  accepted: "bg-chart-2/20 text-chart-2",
  declined: "bg-destructive/20 text-destructive",
  attended: "bg-primary/20 text-primary",
  no_show: "bg-chart-5/20 text-chart-5",
};

export const InvitationManager = memo(function InvitationManager({ competitionId }: InvitationManagerProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInvite, setNewInvite] = useState({ name: "", nameAr: "", email: "", phone: "", role: "visitor", channel: "in_app" });

  const { data: invitations, isLoading } = useQuery({
    queryKey: ["competition-invitations", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_invitations")
        .select("id, competition_id, invitee_name, invitee_name_ar, invitee_email, invitee_phone, invitee_role, invitation_channel, status, invited_by, sent_at, responded_at, checked_in_at, created_at")
        .eq("competition_id", competitionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("competition_invitations").insert({
        competition_id: competitionId,
        invitee_name: newInvite.name || null,
        invitee_name_ar: newInvite.nameAr || null,
        invitee_email: newInvite.email || null,
        invitee_phone: newInvite.phone || null,
        invitee_role: newInvite.role,
        invitation_channel: newInvite.channel,
        invited_by: user?.id,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-invitations", competitionId] });
      setNewInvite({ name: "", nameAr: "", email: "", phone: "", role: "visitor", channel: "in_app" });
      setShowAddForm(false);
      toast({ title: isAr ? "تمت إضافة الدعوة" : "Invitation added" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "sent") updates.sent_at = new Date().toISOString();
      if (status === "accepted" || status === "declined") updates.responded_at = new Date().toISOString();
      if (status === "attended") updates.checked_in_at = new Date().toISOString();
      const { error } = await supabase.from("competition_invitations").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-invitations", competitionId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("competition_invitations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-invitations", competitionId] });
      toast({ title: isAr ? "تم حذف الدعوة" : "Invitation deleted" });
    },
  });

  const filtered = invitations?.filter((inv) => {
    const matchesSearch = !search ||
      inv.invitee_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.invitee_name_ar?.toLowerCase().includes(search.toLowerCase()) ||
      inv.invitee_email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || inv.invitee_role === roleFilter;
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Stats
  const stats = {
    total: invitations?.length || 0,
    pending: invitations?.filter((i) => i.status === "pending").length || 0,
    sent: invitations?.filter((i) => i.status === "sent").length || 0,
    accepted: invitations?.filter((i) => i.status === "accepted").length || 0,
    declined: invitations?.filter((i) => i.status === "declined").length || 0,
    attended: invitations?.filter((i) => i.status === "attended").length || 0,
    noShow: invitations?.filter((i) => i.status === "no_show").length || 0,
  };

  const roleLabel = (role: string) => ROLES.find((r) => r.value === role)?.[isAr ? "labelAr" : "labelEn"] || role;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {[
          { label: isAr ? "الإجمالي" : "Total", value: stats.total, icon: Users },
          { label: isAr ? "معلقة" : "Pending", value: stats.pending, icon: Clock },
          { label: isAr ? "مرسلة" : "Sent", value: stats.sent, icon: Send },
          { label: isAr ? "مقبولة" : "Accepted", value: stats.accepted, icon: UserCheck },
          { label: isAr ? "مرفوضة" : "Declined", value: stats.declined, icon: UserX },
          { label: isAr ? "حاضرون" : "Attended", value: stats.attended, icon: BarChart3 },
        ].map((stat) => (
          <Card key={stat.label} className="p-2.5 text-center">
            <stat.icon className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
            <AnimatedCounter value={stat.value} className="text-lg font-bold" />
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters & Add */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              {isAr ? "قائمة الدعوات" : "Invitations List"}
            </CardTitle>
            <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {isAr ? "إضافة" : "Add"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add form */}
          {showAddForm && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2.5">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input placeholder={isAr ? "الاسم (إنجليزي)" : "Name (English)"} value={newInvite.name} onChange={(e) => setNewInvite({ ...newInvite, name: e.target.value })} className="h-8 text-sm" />
                <Input placeholder="الاسم (عربي)" value={newInvite.nameAr} onChange={(e) => setNewInvite({ ...newInvite, nameAr: e.target.value })} className="h-8 text-sm" dir="rtl" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input placeholder={isAr ? "البريد الإلكتروني" : "Email"} type="email" value={newInvite.email} onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })} className="h-8 text-sm" />
                <Input placeholder={isAr ? "رقم الهاتف" : "Phone"} value={newInvite.phone} onChange={(e) => setNewInvite({ ...newInvite, phone: e.target.value })} className="h-8 text-sm" />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <Select value={newInvite.role} onValueChange={(v) => setNewInvite({ ...newInvite, role: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{isAr ? r.labelAr : r.labelEn}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={newInvite.channel} onValueChange={(v) => setNewInvite({ ...newInvite, channel: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_app">{isAr ? "داخل التطبيق" : "In-App"}</SelectItem>
                    <SelectItem value="email">{isAr ? "بريد إلكتروني" : "Email"}</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || (!newInvite.name && !newInvite.email)} className="h-8">
                  {addMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5 me-1" />}
                  {isAr ? "إضافة" : "Add"}
                </Button>
              </div>
            </div>
          )}

          {/* Filter bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 h-8 text-sm" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue placeholder={isAr ? "الدور" : "Role"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{isAr ? r.labelAr : r.labelEn}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue placeholder={isAr ? "الحالة" : "Status"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                <SelectItem value="pending">{isAr ? "معلقة" : "Pending"}</SelectItem>
                <SelectItem value="sent">{isAr ? "مرسلة" : "Sent"}</SelectItem>
                <SelectItem value="accepted">{isAr ? "مقبولة" : "Accepted"}</SelectItem>
                <SelectItem value="declined">{isAr ? "مرفوضة" : "Declined"}</SelectItem>
                <SelectItem value="attended">{isAr ? "حاضر" : "Attended"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered?.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              {isAr ? "لا توجد دعوات" : "No invitations yet"}
            </p>
          ) : (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {filtered?.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 rounded-xl border p-2.5 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {isAr && inv.invitee_name_ar ? inv.invitee_name_ar : inv.invitee_name || inv.invitee_email || "—"}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      <Badge variant="outline" className="text-[9px] h-4">{roleLabel(inv.invitee_role || "visitor")}</Badge>
                      <Badge className={`text-[9px] h-4 ${STATUS_COLORS[inv.status] || ""}`}>{inv.status}</Badge>
                      {inv.invitee_email && (
                        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                          <Mail className="h-2.5 w-2.5" />{inv.invitee_email}
                        </span>
                      )}
                      {inv.invitee_phone && (
                        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                          <Phone className="h-2.5 w-2.5" />{inv.invitee_phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {inv.status === "pending" && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateStatusMutation.mutate({ id: inv.id, status: "sent" })} title={isAr ? "إرسال" : "Send"}>
                        <Send className="h-3 w-3" />
                      </Button>
                    )}
                    {inv.status === "accepted" && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateStatusMutation.mutate({ id: inv.id, status: "attended" })} title={isAr ? "تأكيد الحضور" : "Check in"}>
                        <UserCheck className="h-3 w-3" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(inv.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
