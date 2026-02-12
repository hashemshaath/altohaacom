import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  UserX,
  UserCheck,
  Eye,
  Edit,
  ChevronRight,
  ChevronLeft,
  X,
  Save,
  UserPlus,
  KeyRound,
  Mail,
  Trash2,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type AccountStatus = Database["public"]["Enums"]["account_status"];
type AppRole = Database["public"]["Enums"]["app_role"];
type MembershipTier = Database["public"]["Enums"]["membership_tier"];

const ALL_ROLES: AppRole[] = ["chef", "judge", "student", "organizer", "volunteer", "sponsor", "assistant", "supervisor"];

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  account_number: string | null;
  account_status: AccountStatus | null;
  membership_tier: MembershipTier | null;
  avatar_url: string | null;
  created_at: string;
  location: string | null;
  specialization: string | null;
  is_verified: boolean | null;
  email: string | null;
  roles?: { role: AppRole }[];
}

export default function UserManagement() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Edit user inline state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRoles, setEditRoles] = useState<AppRole[]>([]);
  const [editMembership, setEditMembership] = useState<MembershipTier>("basic");
  const [editStatus, setEditStatus] = useState<AccountStatus>("active");
  const [editVerified, setEditVerified] = useState(false);

  // Create user dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("chef");

  // Reset password dialog
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState("");
  const [resetUserName, setResetUserName] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["adminUsers", searchQuery, roleFilter, statusFilter, page],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(`id, user_id, full_name, username, account_number, account_status, membership_tier, avatar_url, created_at, location, specialization, is_verified, email`, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%,account_number.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      if (statusFilter !== "all") {
        query = query.eq("account_status", statusFilter as AccountStatus);
      }

      const { data: profiles, error, count } = await query;
      if (error) throw error;

      const userIds = profiles?.map((p) => p.user_id) || [];
      const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("user_id", userIds);

      const users = profiles?.map((profile) => ({
        ...profile,
        roles: roles?.filter((r) => r.user_id === profile.user_id) || [],
      })) as UserProfile[];

      return { users, totalCount: count || 0 };
    },
  });

  const filteredUsers = usersData?.users?.filter((u) => {
    if (roleFilter === "all") return true;
    return u.roles?.some((r) => r.role === roleFilter);
  });

  const totalPages = Math.ceil((usersData?.totalCount || 0) / pageSize);
  const editingUser = filteredUsers?.find((u) => u.user_id === editingUserId);

  // Edge function caller
  const callAdminFn = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-user-management", { body });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, newStatus, reason }: { userId: string; newStatus: AccountStatus; reason?: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          account_status: newStatus,
          suspended_reason: newStatus === "suspended" || newStatus === "banned" ? reason : null,
          suspended_at: newStatus === "suspended" || newStatus === "banned" ? new Date().toISOString() : null,
        })
        .eq("user_id", userId);
      if (error) throw error;
      await supabase.from("admin_actions").insert([{ admin_id: user!.id, target_user_id: userId, action_type: `${newStatus}_user`, details: { reason } }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

  const updateRolesMutation = useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: AppRole[] }) => {
      // Delete existing roles first and check for errors
      const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (deleteError) throw deleteError;
      
      // Insert new roles
      if (roles.length > 0) {
        const { error: insertError } = await supabase.from("user_roles").insert(roles.map((role) => ({ user_id: userId, role })));
        if (insertError) throw insertError;
      }
      await supabase.from("admin_actions").insert([{ admin_id: user!.id, target_user_id: userId, action_type: "update_roles", details: { roles } }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: isAr ? "تم تحديث الأدوار" : "Roles updated" });
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase.from("profiles").update(updates).eq("user_id", userId);
      if (error) throw error;
      await supabase.from("admin_actions").insert([{ admin_id: user!.id, target_user_id: userId, action_type: "update_profile", details: updates as any }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: isAr ? "تم تحديث الملف الشخصي" : "Profile updated" });
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

  const createUserMutation = useMutation({
    mutationFn: async () => callAdminFn({ action: "create_user", email: newEmail, password: newPassword, full_name: newFullName, username: newUsername, phone: newPhone, role: newRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: isAr ? "تم إنشاء المستخدم" : "User created successfully" });
      setCreateOpen(false);
      setNewEmail(""); setNewPassword(""); setNewFullName(""); setNewUsername(""); setNewPhone("");
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => callAdminFn({ action: "reset_password", user_id: resetUserId, new_password: resetNewPassword }),
    onSuccess: () => {
      toast({ title: isAr ? "تم إعادة تعيين كلمة المرور" : "Password reset successfully" });
      setResetOpen(false);
      setResetNewPassword("");
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

  const inviteMutation = useMutation({
    mutationFn: async () => callAdminFn({ action: "send_invitation", email: inviteEmail }),
    onSuccess: () => {
      toast({ title: isAr ? "تم إرسال الدعوة" : "Invitation sent successfully" });
      setInviteOpen(false);
      setInviteEmail("");
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

  const handleOpenEdit = (profile: UserProfile) => {
    setEditingUserId(profile.user_id);
    setEditRoles(profile.roles?.map((r) => r.role) || []);
    setEditMembership(profile.membership_tier || "basic");
    setEditStatus(profile.account_status || "pending");
    setEditVerified(profile.is_verified || false);
  };

  const handleSaveEdit = async () => {
    if (!editingUserId) return;
    await updateProfileMutation.mutateAsync({ userId: editingUserId, updates: { membership_tier: editMembership, account_status: editStatus, is_verified: editVerified } });
    await updateRolesMutation.mutateAsync({ userId: editingUserId, roles: editRoles });
    setEditingUserId(null);
  };

  const toggleRole = (role: AppRole) => {
    setEditRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);
  };

  const getStatusBadge = (status: AccountStatus | null) => {
    const config: Record<AccountStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      active: { variant: "default", label: isAr ? "نشط" : "Active" },
      pending: { variant: "secondary", label: isAr ? "معلق" : "Pending" },
      suspended: { variant: "destructive", label: isAr ? "موقوف" : "Suspended" },
      banned: { variant: "destructive", label: isAr ? "محظور" : "Banned" },
    };
    const cfg = config[status || "pending"];
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  const getMembershipBadge = (tier: MembershipTier | null) => {
    const colors: Record<MembershipTier, string> = {
      basic: "bg-muted text-muted-foreground",
      professional: "bg-primary/20 text-primary",
      enterprise: "bg-accent/20 text-accent-foreground",
    };
    return (
      <Badge className={colors[tier || "basic"]} variant="outline">
        {tier === "professional" ? t("professionalTier") : t(tier || "basic")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">{t("userManagement")}</h1>
          <p className="text-sm text-muted-foreground">
            {isAr ? "إدارة المستخدمين وإنشاء الحسابات وإعادة تعيين كلمات المرور والدعوات" : "Manage users, create accounts, reset passwords, and send invitations"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {usersData?.totalCount || 0} {isAr ? "مستخدم" : "users"}
          </Badge>
          <UserStatsQuickView language={language} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="me-2 h-4 w-4" />
              {isAr ? "إنشاء مستخدم" : "Create User"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{isAr ? "إنشاء حساب جديد" : "Create New Account"}</DialogTitle>
              <DialogDescription>{isAr ? "أنشئ حساب مستخدم جديد مع بيانات الدخول الأولية" : "Create a new user account with initial login credentials"}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{isAr ? "الاسم الكامل" : "Full Name"} *</Label>
                <Input value={newFullName} onChange={(e) => setNewFullName(e.target.value)} placeholder={isAr ? "أدخل الاسم الكامل" : "Enter full name"} />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "البريد الإلكتروني" : "Email"} *</Label>
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "كلمة المرور" : "Password"} *</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={isAr ? "كلمة المرور الأولية" : "Initial password"} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "اسم المستخدم" : "Username"}</Label>
                <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="username" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "رقم الهاتف" : "Phone"}</Label>
                <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+966..." dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "الدور" : "Role"}</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>{t(role as any)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={() => createUserMutation.mutate()} disabled={!newEmail || !newPassword || !newFullName || createUserMutation.isPending}>
                {createUserMutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {isAr ? "إنشاء الحساب" : "Create Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Mail className="me-2 h-4 w-4" />
              {isAr ? "إرسال دعوة" : "Send Invitation"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{isAr ? "إرسال دعوة" : "Send Invitation"}</DialogTitle>
              <DialogDescription>{isAr ? "أرسل دعوة عبر البريد الإلكتروني لتفعيل الحساب وتغيير كلمة المرور" : "Send an email invitation to activate account and change password"}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@example.com" dir="ltr" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={() => inviteMutation.mutate()} disabled={!inviteEmail || inviteMutation.isPending}>
                {inviteMutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {isAr ? "إرسال الدعوة" : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isAr ? "إعادة تعيين كلمة المرور" : "Reset Password"}</DialogTitle>
            <DialogDescription>{isAr ? `إعادة تعيين كلمة المرور للمستخدم: ${resetUserName}` : `Reset password for user: ${resetUserName}`}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isAr ? "كلمة المرور الجديدة" : "New Password"}</Label>
              <Input type="password" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} placeholder={isAr ? "كلمة المرور الجديدة" : "New password"} dir="ltr" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => resetPasswordMutation.mutate()} disabled={!resetNewPassword || resetPasswordMutation.isPending}>
              {resetPasswordMutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {isAr ? "إعادة التعيين" : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap gap-4 pt-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "بحث بالاسم أو البريد أو رقم الحساب..." : "Search by name, email, or account number..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder={t("filterByRole")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allUsers")}</SelectItem>
              {ALL_ROLES.map((role) => (
                <SelectItem key={role} value={role}>{t(role as any)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder={t("filterByStatus")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allUsers")}</SelectItem>
              <SelectItem value="active">{t("active")}</SelectItem>
              <SelectItem value="pending">{t("pending")}</SelectItem>
              <SelectItem value="suspended">{t("suspended")}</SelectItem>
              <SelectItem value="banned">{isAr ? "محظور" : "Banned"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Inline Edit Panel */}
      {editingUser && (
        <Card className="border-primary/30 shadow-lg shadow-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={editingUser.avatar_url || undefined} />
                  <AvatarFallback>{(editingUser.full_name || "U")[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{editingUser.full_name || "Unknown"}</CardTitle>
                  <p className="text-sm text-muted-foreground">@{editingUser.username} · {editingUser.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingUserId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{isAr ? "حالة الحساب" : "Account Status"}</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as AccountStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{isAr ? "معلق" : "Pending"}</SelectItem>
                    <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
                    <SelectItem value="suspended">{isAr ? "موقوف" : "Suspended"}</SelectItem>
                    <SelectItem value="banned">{isAr ? "محظور" : "Banned"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "مستوى العضوية" : "Membership Tier"}</Label>
                <Select value={editMembership} onValueChange={(v) => setEditMembership(v as MembershipTier)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">{t("basic")}</SelectItem>
                    <SelectItem value="professional">{t("professionalTier")}</SelectItem>
                    <SelectItem value="enterprise">{t("enterprise")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox id="verified" checked={editVerified} onCheckedChange={(checked) => setEditVerified(!!checked)} />
              <Label htmlFor="verified" className="cursor-pointer">{isAr ? "حساب موثق" : "Verified Account"}</Label>
            </div>
            <div className="space-y-3">
              <Label>{isAr ? "الأدوار" : "Roles"}</Label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {ALL_ROLES.map((role) => (
                  <div key={role} onClick={() => toggleRole(role)} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 transition-all duration-200 hover:shadow-sm ${editRoles.includes(role) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                    <Checkbox checked={editRoles.includes(role)} onCheckedChange={() => toggleRole(role)} />
                    <span className="text-sm capitalize">{t(role as any)}</span>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2 justify-between">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setResetUserId(editingUser.user_id); setResetUserName(editingUser.full_name || ""); setResetOpen(true); }}>
                  <KeyRound className="me-2 h-4 w-4" />
                  {isAr ? "إعادة تعيين كلمة المرور" : "Reset Password"}
                </Button>
                {editingUser.email && (
                  <Button variant="outline" size="sm" onClick={() => { setInviteEmail(editingUser.email || ""); setInviteOpen(true); }}>
                    <Mail className="me-2 h-4 w-4" />
                    {isAr ? "إرسال دعوة" : "Send Invitation"}
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingUserId(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
                <Button onClick={handleSaveEdit} disabled={updateProfileMutation.isPending || updateRolesMutation.isPending}>
                  <Save className="me-2 h-4 w-4" />
                  {isAr ? "حفظ التغييرات" : "Save Changes"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("allUsers")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredUsers?.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{t("noResults")}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "المستخدم" : "User"}</TableHead>
                    <TableHead>{t("accountNumber")}</TableHead>
                    <TableHead>{isAr ? "الأدوار" : "Roles"}</TableHead>
                    <TableHead>{t("membershipTier")}</TableHead>
                    <TableHead>{t("accountStatus")}</TableHead>
                    <TableHead>{isAr ? "تاريخ الإنشاء" : "Created"}</TableHead>
                    <TableHead className="w-40">{isAr ? "الإجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((profile) => (
                    <TableRow key={profile.id} className={editingUserId === profile.user_id ? "bg-primary/5" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback>{(profile.full_name || "U")[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1">
                              <p className="font-medium">{profile.full_name || "No name"}</p>
                              {profile.is_verified && <Badge variant="secondary" className="h-4 px-1 text-[10px]">✓</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {profile.username && `@${profile.username}`}
                              {profile.email && ` · ${profile.email}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{profile.account_number || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {profile.roles?.map((r) => (
                            <Badge key={r.role} variant="outline" className="text-xs">{t(r.role as any)}</Badge>
                          ))}
                          {(!profile.roles || profile.roles.length === 0) && <span className="text-xs text-muted-foreground">-</span>}
                        </div>
                      </TableCell>
                      <TableCell>{getMembershipBadge(profile.membership_tier)}</TableCell>
                      <TableCell>{getStatusBadge(profile.account_status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(profile.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/admin/users/${profile.user_id}`}><Eye className="h-4 w-4" /></Link>
                          </Button>
                          <Button variant={editingUserId === profile.user_id ? "secondary" : "ghost"} size="sm" onClick={() => editingUserId === profile.user_id ? setEditingUserId(null) : handleOpenEdit(profile)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setResetUserId(profile.user_id); setResetUserName(profile.full_name || ""); setResetOpen(true); }}>
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          {profile.account_status === "active" ? (
                            <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({ userId: profile.user_id, newStatus: "suspended", reason: "Admin action" })}>
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({ userId: profile.user_id, newStatus: "active" })}>
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {isAr ? `صفحة ${page + 1} من ${totalPages}` : `Page ${page + 1} of ${totalPages}`}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UserStatsQuickView({ language }: { language: string }) {
  const isAr = language === "ar";
  const { data } = useQuery({
    queryKey: ["admin-user-quick-stats"],
    queryFn: async () => {
      const [activeRes, pendingRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "active"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "pending"),
      ]);
      return { active: activeRes.count || 0, pending: pendingRes.count || 0 };
    },
    staleTime: 1000 * 60 * 5,
  });

  if (!data) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge className="bg-chart-3/15 text-chart-3 border-chart-3/20">
        {data.active} {isAr ? "نشط" : "active"}
      </Badge>
      {data.pending > 0 && (
        <Badge variant="secondary">
          {data.pending} {isAr ? "معلق" : "pending"}
        </Badge>
      )}
    </div>
  );
}
