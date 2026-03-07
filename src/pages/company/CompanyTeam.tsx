import { useState } from "react";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Mail, Phone, Building, UserPlus, Shield, Crown, Eye, Pencil,
  Clock, CheckCircle2, XCircle, Send, RefreshCw, MoreHorizontal, Trash2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roleConfig: Record<string, { icon: any; color: string; bg: string; labelEn: string; labelAr: string }> = {
  owner: { icon: Crown, color: "text-chart-4", bg: "bg-chart-4/10", labelEn: "Owner", labelAr: "مالك" },
  admin: { icon: Shield, color: "text-destructive", bg: "bg-destructive/10", labelEn: "Admin", labelAr: "مدير" },
  manager: { icon: Users, color: "text-primary", bg: "bg-primary/10", labelEn: "Manager", labelAr: "مشرف" },
  editor: { icon: Pencil, color: "text-chart-2", bg: "bg-chart-2/10", labelEn: "Editor", labelAr: "محرر" },
  viewer: { icon: Eye, color: "text-muted-foreground", bg: "bg-muted", labelEn: "Viewer", labelAr: "مشاهد" },
};

export default function CompanyTeam() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { companyId } = useCompanyAccess();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("viewer");
  const [inviteDept, setInviteDept] = useState("");
  const [inviteTitle, setInviteTitle] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  // Fetch team members
  const { data: contacts, isLoading } = useQuery({
    queryKey: ["companyContacts", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_contacts")
        .select("id, company_id, user_id, name, name_ar, title, title_ar, email, phone, mobile, whatsapp, department, role, is_primary, can_login, avatar_url, invitation_status, invitation_token, invited_at, invited_by, accepted_at, created_at, updated_at")
        .eq("company_id", companyId)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch pending invitations from the employee invites table
  const { data: invitations } = useQuery({
    queryKey: ["companyEmployeeInvites", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_employee_invites")
        .select("id, company_id, email, role, department, title, title_ar, message, message_ar, status, token, invited_by, expires_at, accepted_at, accepted_by, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Current user's role in this company
  const myRole = contacts?.find((c) => c.user_id === user?.id)?.role || "viewer";
  const canManage = ["owner", "admin", "manager"].includes(myRole);

  // Send invitation mutation
  const sendInvite = useMutation({
    mutationFn: async () => {
      if (!companyId || !user) throw new Error("Missing data");
      const { error } = await supabase.from("company_employee_invites").insert({
        company_id: companyId,
        email: inviteEmail,
        role: inviteRole as any,
        invited_by: user.id,
        department: inviteDept || null,
        title: inviteTitle || null,
        message: inviteMessage || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyEmployeeInvites"] });
      toast({ title: isAr ? "تم إرسال الدعوة بنجاح!" : "Invitation sent successfully!" });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("viewer");
      setInviteDept("");
      setInviteTitle("");
      setInviteMessage("");
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    },
  });

  // Update contact role
  const updateRole = useMutation({
    mutationFn: async ({ contactId, newRole }: { contactId: string; newRole: string }) => {
      const { error } = await supabase
        .from("company_contacts")
        .update({ role: newRole as any })
        .eq("id", contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyContacts"] });
      toast({ title: isAr ? "تم تحديث الصلاحية" : "Role updated" });
    },
  });

  // Cancel invitation
  const cancelInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("company_employee_invites")
        .delete()
        .eq("id", inviteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyEmployeeInvites"] });
      toast({ title: isAr ? "تم إلغاء الدعوة" : "Invitation cancelled" });
    },
  });

  // Resend invitation
  const resendInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("company_employee_invites")
        .update({ 
          status: "pending", 
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", inviteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyEmployeeInvites"] });
      toast({ title: isAr ? "تم إعادة إرسال الدعوة" : "Invitation resent" });
    },
  });

  const pendingInvites = invitations?.filter((i) => i.status === "pending") || [];
  const pastInvites = invitations?.filter((i) => i.status !== "pending") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {isAr ? "فريق العمل" : "Team Members"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isAr ? "إدارة الموظفين والصلاحيات والدعوات" : "Manage employees, permissions, and invitations"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && contacts && (
            <Badge variant="secondary" className="text-sm">
              {contacts.length} {isAr ? "عضو" : "members"}
            </Badge>
          )}
          {canManage && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  {isAr ? "دعوة عضو" : "Invite Member"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    {isAr ? "دعوة عضو جديد" : "Invite New Member"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>{isAr ? "البريد الإلكتروني" : "Email Address"} *</Label>
                    <Input
                      type="email"
                      placeholder="employee@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label>{isAr ? "الصلاحية" : "Role"}</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleConfig)
                          .filter(([k]) => k !== "owner")
                          .map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                <cfg.icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                                {isAr ? cfg.labelAr : cfg.labelEn}
                              </span>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{isAr ? "المسمى الوظيفي" : "Job Title"}</Label>
                      <Input value={inviteTitle} onChange={(e) => setInviteTitle(e.target.value)} placeholder={isAr ? "مدير التسويق" : "Marketing Manager"} />
                    </div>
                    <div>
                      <Label>{isAr ? "القسم" : "Department"}</Label>
                      <Input value={inviteDept} onChange={(e) => setInviteDept(e.target.value)} placeholder={isAr ? "التسويق" : "Marketing"} />
                    </div>
                  </div>
                  <div>
                    <Label>{isAr ? "رسالة شخصية (اختياري)" : "Personal Message (optional)"}</Label>
                    <Textarea
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      placeholder={isAr ? "مرحباً! ندعوك للانضمام..." : "Hi! We'd like to invite you to join..."}
                      rows={3}
                    />
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={() => sendInvite.mutate()}
                    disabled={!inviteEmail || sendInvite.isPending}
                  >
                    <Send className="h-4 w-4" />
                    {sendInvite.isPending
                      ? (isAr ? "جاري الإرسال..." : "Sending...")
                      : (isAr ? "إرسال الدعوة" : "Send Invitation")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="h-4 w-4" />
            {isAr ? "الأعضاء" : "Members"}
            {contacts?.length ? <Badge variant="secondary" className="text-[10px] ms-1">{contacts.length}</Badge> : null}
          </TabsTrigger>
          <TabsTrigger value="invitations" className="gap-1.5">
            <Mail className="h-4 w-4" />
            {isAr ? "الدعوات" : "Invitations"}
            {pendingInvites.length > 0 && <Badge className="text-[10px] ms-1">{pendingInvites.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : contacts && contacts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contacts.map((contact, index) => {
                const role = (contact as any).role || "viewer";
                const rc = roleConfig[role] || roleConfig.viewer;
                const RoleIcon = rc.icon;

                return (
                  <Card
                    key={contact.id}
                    className="group animate-fade-in overflow-hidden border-border/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className={`h-1 transition-all ${contact.is_primary ? "bg-primary" : "bg-transparent group-hover:bg-primary/30"}`} />
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 shrink-0 ring-2 ring-transparent transition-all group-hover:ring-primary/20">
                          <AvatarImage src={(contact as any).avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {contact.name?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{contact.name}</h3>
                            {contact.is_primary && (
                              <Badge className="shrink-0 bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5">
                                {isAr ? "رئيسي" : "Primary"}
                              </Badge>
                            )}
                          </div>
                          {contact.title && (
                            <p className="text-sm text-muted-foreground truncate">{contact.title}</p>
                          )}
                          <div className="mt-1.5 flex items-center gap-2">
                            <Badge variant="outline" className={`text-[10px] gap-1 ${rc.color}`}>
                              <RoleIcon className="h-2.5 w-2.5" />
                              {isAr ? rc.labelAr : rc.labelEn}
                            </Badge>
                            {contact.department && (
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Building className="h-2.5 w-2.5" />
                                {contact.department}
                              </span>
                            )}
                          </div>
                        </div>
                        {canManage && role !== "owner" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {Object.entries(roleConfig)
                                .filter(([k]) => k !== "owner" && k !== role)
                                .map(([key, cfg]) => (
                                  <DropdownMenuItem
                                    key={key}
                                    onClick={() => updateRole.mutate({ contactId: contact.id, newRole: key })}
                                  >
                                    <cfg.icon className={`h-3.5 w-3.5 me-2 ${cfg.color}`} />
                                    {isAr ? `تعيين كـ ${cfg.labelAr}` : `Set as ${cfg.labelEn}`}
                                  </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      <div className="mt-4 space-y-2 border-t pt-3">
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{contact.email}</span>
                          </a>
                        )}
                        {contact.phone && (
                          <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{contact.phone}</span>
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">{isAr ? "لا يوجد أعضاء بعد" : "No team members yet"}</p>
                {canManage && (
                  <Button variant="outline" className="mt-3 gap-2" onClick={() => setInviteOpen(true)}>
                    <UserPlus className="h-4 w-4" />
                    {isAr ? "دعوة أول عضو" : "Invite first member"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4 mt-4">
          {/* Pending */}
          {pendingInvites.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                {isAr ? "في الانتظار" : "Pending"} ({pendingInvites.length})
              </h3>
              {pendingInvites.map((inv) => {
                const rc = roleConfig[(inv as any).role || "viewer"] || roleConfig.viewer;
                const RoleIcon = rc.icon;
                const expired = inv.expires_at && new Date(inv.expires_at) < new Date();

                return (
                  <Card key={inv.id} className="border-border/50">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${expired ? "bg-destructive/10" : "bg-chart-4/10"}`}>
                        {expired ? <XCircle className="h-5 w-5 text-destructive" /> : <Clock className="h-5 w-5 text-chart-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{inv.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={`text-[10px] gap-1 ${rc.color}`}>
                            <RoleIcon className="h-2.5 w-2.5" />
                            {isAr ? rc.labelAr : rc.labelEn}
                          </Badge>
                          {(inv as any).department && (
                            <span className="text-[10px] text-muted-foreground">{(inv as any).department}</span>
                          )}
                          {expired && (
                            <Badge variant="destructive" className="text-[10px]">
                              {isAr ? "منتهية" : "Expired"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {canManage && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => resendInvite.mutate(inv.id)}
                            disabled={resendInvite.isPending}
                          >
                            <RefreshCw className={`h-3 w-3 ${resendInvite.isPending ? "animate-spin" : ""}`} />
                            {isAr ? "إعادة" : "Resend"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs text-destructive hover:text-destructive"
                            onClick={() => cancelInvite.mutate(inv.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Past invitations */}
          {pastInvites.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                {isAr ? "السابقة" : "Past"} ({pastInvites.length})
              </h3>
              {pastInvites.map((inv) => {
                const isAccepted = inv.status === "accepted";
                const isCancelled = inv.status === "cancelled";
                return (
                  <Card key={inv.id} className="border-border/50 opacity-70">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isAccepted ? "bg-chart-2/10" : "bg-muted"}`}>
                        {isAccepted ? <CheckCircle2 className="h-5 w-5 text-chart-2" /> : <XCircle className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{inv.email}</p>
                        <Badge variant="outline" className="text-[10px] mt-0.5">
                          {isAccepted ? (isAr ? "مقبولة" : "Accepted") : isCancelled ? (isAr ? "ملغية" : "Cancelled") : inv.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {!invitations?.length && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
                  <Mail className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">{isAr ? "لا توجد دعوات" : "No invitations sent yet"}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
