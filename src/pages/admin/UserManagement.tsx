import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InlinePanel } from "@/components/ui/InlinePanel";
import { InlineConfirm } from "@/components/ui/InlineConfirm";
import { useToast } from "@/hooks/use-toast";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { BulkUserImport } from "@/components/admin/BulkUserImport";
import { UserAdvancedFilters, INITIAL_FILTERS, type FilterValues } from "@/components/admin/UserAdvancedFilters";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { UserStatsBar } from "@/components/admin/UserStatsBar";
import { UserEditPanel } from "@/components/admin/UserEditPanel";
import { UsersTable } from "@/components/admin/UsersTable";
import { UserDetailsSidePanel } from "@/components/admin/UserDetailsSidePanel";
import { UserGrowthTrendWidget } from "@/components/admin/UserGrowthTrendWidget";
import { UserAnalyticsWidget } from "@/components/admin/UserAnalyticsWidget";
import { UserDemographicsWidget } from "@/components/admin/UserDemographicsWidget";
import { UsersLiveStatsWidget } from "@/components/admin/UsersLiveStatsWidget";
import { UserActivityTimeline } from "@/components/admin/UserActivityTimeline";
import { InlineUserSearch } from "@/components/admin/InlineUserSearch";
import { AdminSessionTracker } from "@/components/admin/AdminSessionTracker";
import { AdminNotificationCenter } from "@/components/admin/AdminNotificationCenter";
import { SecurityAuditTimeline } from "@/components/admin/SecurityAuditTimeline";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import {
  Search, UserPlus, Mail, Loader2, Users, FileSpreadsheet, Download,
  BarChart3, X, ChevronRight, KeyRound,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AccountStatus = Database["public"]["Enums"]["account_status"];
type AppRole = Database["public"]["Enums"]["app_role"];

const ALL_ROLES: AppRole[] = ["chef", "judge", "student", "organizer", "content_writer", "volunteer", "sponsor", "assistant", "supervisor"];
const PAGE_SIZE = 20;

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  username: string | null;
  account_number: string | null;
  account_status: AccountStatus | null;
  account_type: Database["public"]["Enums"]["account_type"];
  membership_tier: Database["public"]["Enums"]["membership_tier"] | null;
  avatar_url: string | null;
  cover_image_url?: string | null;
  created_at: string;
  location: string | null;
  country_code: string | null;
  city: string | null;
  specialization: string | null;
  is_verified: boolean | null;
  email: string | null;
  phone?: string | null;
  bio?: string | null;
  roles?: { role: AppRole }[];
}

export default function UserManagement() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  // ── State ──
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [page, setPage] = useState(0);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterValues>(INITIAL_FILTERS);

  // Inline panels state
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState("");
  const [resetUserName, setResetUserName] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");

  const [suspendTarget, setSuspendTarget] = useState<{ userId: string; userName: string; email: string | null } | null>(null);
  const [notifyTarget, setNotifyTarget] = useState<{ userId: string; userName: string } | null>(null);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyMessageAr, setNotifyMessageAr] = useState("");

  // Create user form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newFullNameAr, setNewFullNameAr] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("chef");
  const [newAccountType, setNewAccountType] = useState<"professional" | "fan">("professional");
  const [newSendInvite, setNewSendInvite] = useState(true);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("chef");
  const [inviteMessageEn, setInviteMessageEn] = useState("");
  const [inviteMessageAr, setInviteMessageAr] = useState("");

  const [userSearchOpen, setUserSearchOpen] = useState(false);

  // ── Keyboard shortcut ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "u") { e.preventDefault(); setUserSearchOpen(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Queries ──
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["adminUsers", searchQuery, roleFilter, statusFilter, accountTypeFilter, page],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(`id, user_id, full_name, full_name_ar, display_name, display_name_ar, username, account_number, account_status, account_type, membership_tier, avatar_url, created_at, location, country_code, city, specialization, specialization_ar, is_verified, email, phone, bio, bio_ar, cover_image_url, date_of_birth, gender, preferred_language, nationality, experience_level, education_level, education_institution, education_entity_id, years_of_experience`, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (searchQuery) query = query.or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%,account_number.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      if (statusFilter !== "all") query = query.eq("account_status", statusFilter as AccountStatus);
      if (accountTypeFilter !== "all") query = query.eq("account_type", accountTypeFilter as Database["public"]["Enums"]["account_type"]);

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
    staleTime: 1000 * 60 * 2,
  });

  const filteredUsers = usersData?.users?.filter((u) => {
    if (roleFilter === "all") return true;
    return u.roles?.some((r) => r.role === roleFilter);
  }) || [];

  const { selected, toggleOne, toggleAll, clearSelection, isAllSelected, count: bulkCount, selectedItems, isSelected } =
    useAdminBulkActions(filteredUsers);

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الاسم" : "Name", accessor: (r: UserProfile) => r.full_name || "" },
      { header: isAr ? "البريد" : "Email", accessor: (r: UserProfile) => r.email || "" },
      { header: isAr ? "اسم المستخدم" : "Username", accessor: (r: UserProfile) => r.username || "" },
      { header: isAr ? "رقم الحساب" : "Account #", accessor: (r: UserProfile) => r.account_number || "" },
      { header: isAr ? "الأدوار" : "Roles", accessor: (r: UserProfile) => r.roles?.map((ro) => ro.role).join(", ") || "" },
      { header: isAr ? "الحالة" : "Status", accessor: (r: UserProfile) => r.account_status || "" },
      { header: isAr ? "الدولة" : "Country", accessor: (r: UserProfile) => r.country_code || "" },
    ],
    filename: "users",
  });

  // ── Edge function caller ──
  const callAdminFn = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-user-management", { body });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  };

  // ── Mutations ──
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, newStatus, reason }: { userId: string; newStatus: AccountStatus; reason?: string }) => {
      const { error } = await supabase.from("profiles").update({
        account_status: newStatus,
        suspended_reason: newStatus === "suspended" || newStatus === "banned" ? reason : null,
        suspended_at: newStatus === "suspended" || newStatus === "banned" ? new Date().toISOString() : null,
      }).eq("user_id", userId);
      if (error) throw error;
      await supabase.from("admin_actions").insert([{ admin_id: user!.id, target_user_id: userId, action_type: `${newStatus}_user`, details: { reason } }]);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminUsers"] }); toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" }); },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

  const createUserMutation = useMutation({
    mutationFn: async () => callAdminFn({
      action: "create_user", email: newEmail, password: newPassword,
      full_name: newFullName, full_name_ar: newFullNameAr,
      username: newUsername, phone: newPhone, role: newRole,
      account_type: newAccountType, send_invite: newSendInvite,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: isAr ? "تم إنشاء المستخدم بنجاح" : "User created successfully", description: newSendInvite ? (isAr ? "تم إرسال دعوة التفعيل" : "Activation invite sent") : undefined });
      setCreateOpen(false);
      setNewEmail(""); setNewPassword(""); setNewFullName(""); setNewFullNameAr(""); setNewUsername(""); setNewPhone(""); setNewSendInvite(true);
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => callAdminFn({ action: "reset_password", user_id: resetUserId, new_password: resetNewPassword }),
    onSuccess: () => { toast({ title: isAr ? "تم إعادة تعيين كلمة المرور" : "Password reset" }); setResetOpen(false); setResetNewPassword(""); },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

  const inviteMutation = useMutation({
    mutationFn: async () => callAdminFn({
      action: "send_invitation", email: inviteEmail,
      full_name: inviteFullName, role: inviteRole,
      message_en: inviteMessageEn, message_ar: inviteMessageAr,
    }),
    onSuccess: () => {
      toast({ title: isAr ? "تم إرسال الدعوة بنجاح" : "Invitation sent successfully" });
      setInviteOpen(false); setInviteEmail(""); setInviteFullName(""); setInviteMessageEn(""); setInviteMessageAr("");
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

  const bulkActivate = async () => {
    const ids = Array.from(selected);
    await supabase.from("profiles").update({ account_status: "active" as AccountStatus, suspended_reason: null, suspended_at: null }).in("user_id", ids);
    queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    clearSelection();
    toast({ title: isAr ? `تم تفعيل ${ids.length} مستخدم` : `${ids.length} users activated` });
  };

  const bulkSuspend = async () => {
    const ids = Array.from(selected);
    await supabase.from("profiles").update({ account_status: "suspended" as AccountStatus, suspended_reason: "Admin bulk action", suspended_at: new Date().toISOString() }).in("user_id", ids);
    queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    clearSelection();
    toast({ title: isAr ? `تم إيقاف ${ids.length} مستخدم` : `${ids.length} users suspended` });
  };

  const editingUser = filteredUsers.find((u) => u.user_id === editingUserId);

  // ── Render ──
  return (
    <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
      {userSearchOpen && (
        <InlineUserSearch
          onSelectUser={(userId) => { setViewingUserId(userId); setUserSearchOpen(false); }}
          onClose={() => setUserSearchOpen(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <AdminPageHeader
          icon={Users}
          title={isAr ? "إدارة المستخدمين" : "User Management"}
          description={isAr ? "إدارة الحسابات والأدوار والمجموعات" : "Manage accounts, roles & groups"}
          actions={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm tabular-nums">
                <AnimatedCounter value={usersData?.totalCount || 0} className="inline" /> {isAr ? "مستخدم" : "users"}
              </Badge>
              <UserStatsQuickView isAr={isAr} />
            </div>
          }
        />
      </div>

      <UserStatsBar />

      {/* Analytics Toggle */}
      <Button variant={showAnalytics ? "secondary" : "outline"} size="sm" className="gap-1.5 text-xs rounded-xl" onClick={() => setShowAnalytics(!showAnalytics)}>
        <BarChart3 className="h-3.5 w-3.5" />
        {isAr ? "التحليلات والإحصائيات" : "Analytics & Insights"}
        {showAnalytics ? <X className="h-3 w-3" /> : <ChevronRight className={`h-3 w-3 ${isAr ? "rtl:rotate-180" : ""}`} />}
      </Button>

      {showAnalytics && (
        <div className="space-y-4 rounded-2xl border border-border/40 bg-muted/20 p-4 animate-in slide-in-from-top-2 duration-300">
          <UsersLiveStatsWidget />
          <UserActivityTimeline />
          <UserGrowthTrendWidget />
          <UserAnalyticsWidget />
          <UserDemographicsWidget />
          <div className="grid gap-4 md:grid-cols-2">
            <AdminNotificationCenter />
            <SecurityAuditTimeline />
          </div>
          <AdminSessionTracker />
        </div>
      )}

      {/* Toolbar */}
      <Card className="border-border/40 rounded-2xl">
        <CardContent className="p-3 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setUserSearchOpen(true)} className="gap-1.5 rounded-xl">
            <Search className="h-3.5 w-3.5" /><span className="hidden sm:inline">{isAr ? "بحث سريع" : "Quick Search"}</span>
            <kbd className="text-[9px] bg-muted px-1.5 py-0.5 rounded-md font-mono hidden sm:inline">⌘U</kbd>
          </Button>
          <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setCreateOpen(!createOpen)}>
            <UserPlus className="h-3.5 w-3.5" />{isAr ? "إنشاء حساب" : "Create User"}
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => setInviteOpen(!inviteOpen)}>
            <Mail className="h-3.5 w-3.5" />{isAr ? "إرسال دعوة" : "Invite"}
          </Button>
          <Separator orientation="vertical" className="h-5 mx-0.5" />
          <Button variant="outline" size="sm" onClick={() => setShowBulkImport(!showBulkImport)} className="gap-1.5 rounded-xl">
            <FileSpreadsheet className="h-3.5 w-3.5" /><span className="hidden sm:inline">{isAr ? "استيراد" : "Import"}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportCSV(filteredUsers)} className="gap-1.5 rounded-xl">
            <Download className="h-3.5 w-3.5" /><span className="hidden sm:inline">{isAr ? "تصدير" : "Export"}</span>
          </Button>
          <UserAdvancedFilters filters={advancedFilters} onChange={setAdvancedFilters} onReset={() => setAdvancedFilters(INITIAL_FILTERS)} />
        </CardContent>
      </Card>

      {/* ── Inline Panels ── */}
      <InlinePanel open={createOpen} onClose={() => setCreateOpen(false)} title={isAr ? "إنشاء حساب جديد" : "Create New Account"} description={isAr ? "أنشئ حساب مستخدم جديد مع إمكانية إرسال دعوة تلقائية" : "Create a new user account with optional auto-invitation"} icon={<UserPlus className="h-4 w-4 text-primary" />} size="lg"
        footer={<><Button variant="outline" onClick={() => setCreateOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button><Button onClick={() => createUserMutation.mutate()} disabled={!newEmail || !newPassword || !newFullName || createUserMutation.isPending} className="gap-2">{createUserMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}{isAr ? "إنشاء الحساب" : "Create Account"}</Button></>}
      >
        <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
          {/* Name section - Arabic first */}
          <div className="rounded-xl border border-border/50 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "الاسم والهوية" : "Name & Identity"}</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label className="text-xs">{isAr ? "الاسم الكامل (عربي)" : "Full Name (AR)"} *</Label><Input value={newFullNameAr} onChange={(e) => setNewFullNameAr(e.target.value)} dir="rtl" placeholder={isAr ? "الاسم بالعربية" : "Name in Arabic"} /></div>
              <div className="space-y-1.5"><Label className="text-xs">{isAr ? "الاسم الكامل (إنجليزي)" : "Full Name (EN)"} *</Label><Input value={newFullName} onChange={(e) => setNewFullName(e.target.value)} dir="ltr" placeholder="Full name in English" /></div>
            </div>
          </div>
          {/* Account section */}
          <div className="rounded-xl border border-border/50 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "بيانات الحساب" : "Account Details"}</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label className="text-xs">{isAr ? "البريد الإلكتروني" : "Email"} *</Label><Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} dir="ltr" placeholder="user@example.com" /></div>
              <div className="space-y-1.5"><Label className="text-xs">{isAr ? "كلمة المرور" : "Password"} *</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} dir="ltr" placeholder="••••••••" /></div>
              <div className="space-y-1.5"><Label className="text-xs">{isAr ? "اسم المستخدم" : "Username"}</Label><Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} dir="ltr" placeholder="username" /></div>
              <div className="space-y-1.5"><Label className="text-xs">{isAr ? "رقم الهاتف" : "Phone"}</Label><Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} dir="ltr" placeholder="+966..." /></div>
            </div>
          </div>
          {/* Role & Type */}
          <div className="rounded-xl border border-border/50 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "الدور ونوع الحساب" : "Role & Account Type"}</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الدور الأساسي" : "Primary Role"}</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{ALL_ROLES.map((role) => <SelectItem key={role} value={role}>{t(role as any)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "نوع الحساب" : "Account Type"}</Label>
                <Select value={newAccountType} onValueChange={(v) => setNewAccountType(v as "professional" | "fan")}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">{isAr ? "محترف" : "Professional"}</SelectItem>
                    <SelectItem value="fan">{isAr ? "متابع" : "Fan"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox id="send-invite" checked={newSendInvite} onCheckedChange={(c) => setNewSendInvite(!!c)} />
              <Label htmlFor="send-invite" className="text-xs cursor-pointer">{isAr ? "إرسال دعوة تفعيل بالبريد الإلكتروني تلقائياً" : "Automatically send activation invite via email"}</Label>
            </div>
          </div>
        </div>
      </InlinePanel>

      {/* ── Invite Panel ── */}
      <InlinePanel open={inviteOpen} onClose={() => { setInviteOpen(false); setInviteEmail(""); setInviteFullName(""); setInviteMessageEn(""); setInviteMessageAr(""); }} title={isAr ? "إرسال دعوة انضمام" : "Send Membership Invitation"} description={isAr ? "أرسل دعوة احترافية مخصصة بالعربية والإنجليزية" : "Send a professional bilingual invitation"} icon={<Mail className="h-4 w-4 text-primary" />} size="lg"
        footer={<><Button variant="outline" onClick={() => setInviteOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button><Button onClick={() => inviteMutation.mutate()} disabled={!inviteEmail || inviteMutation.isPending} className="gap-2">{inviteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}{isAr ? "إرسال الدعوة" : "Send Invitation"}</Button></>}
      >
        <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
          <div className="rounded-xl border border-border/50 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "بيانات المدعو" : "Invitee Details"}</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label className="text-xs">{isAr ? "البريد الإلكتروني" : "Email Address"} *</Label><Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} dir="ltr" placeholder="user@example.com" /></div>
              <div className="space-y-1.5"><Label className="text-xs">{isAr ? "اسم المدعو" : "Invitee Name"}</Label><Input value={inviteFullName} onChange={(e) => setInviteFullName(e.target.value)} dir={isAr ? "rtl" : "ltr"} placeholder={isAr ? "اسم المدعو (اختياري)" : "Name (optional)"} /></div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الدور المقترح" : "Suggested Role"}</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{ALL_ROLES.map((role) => <SelectItem key={role} value={role}>{t(role as any)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-xl border border-border/50 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "رسالة الدعوة" : "Invitation Message"}</h4>
            <div className="space-y-1.5"><Label className="text-xs flex items-center gap-1"><Badge variant="outline" className="text-[9px] px-1">ع</Badge> {isAr ? "الرسالة بالعربية" : "Message in Arabic"}</Label><Textarea value={inviteMessageAr} onChange={(e) => setInviteMessageAr(e.target.value)} rows={3} dir="rtl" placeholder="نتشرف بدعوتكم للانضمام إلى منصتنا..." /></div>
            <div className="space-y-1.5"><Label className="text-xs flex items-center gap-1"><Badge variant="outline" className="text-[9px] px-1">EN</Badge> {isAr ? "الرسالة بالإنجليزية" : "Message in English"}</Label><Textarea value={inviteMessageEn} onChange={(e) => setInviteMessageEn(e.target.value)} rows={3} dir="ltr" placeholder="We are honored to invite you to join our platform..." /></div>
          </div>
        </div>
      </InlinePanel>

      {/* ── Reset Password Panel ── */}
      <InlinePanel open={resetOpen} onClose={() => setResetOpen(false)} title={isAr ? "إعادة تعيين كلمة المرور" : "Reset Password"} description={resetUserName} icon={<KeyRound className="h-4 w-4 text-primary" />} size="md"
        footer={<><Button variant="outline" onClick={() => setResetOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button><Button onClick={() => resetPasswordMutation.mutate()} disabled={!resetNewPassword || resetPasswordMutation.isPending} className="gap-2">{resetPasswordMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}{isAr ? "إعادة التعيين" : "Reset Password"}</Button></>}
      >
        <div className="space-y-2" dir={isAr ? "rtl" : "ltr"}><Label>{isAr ? "كلمة المرور الجديدة" : "New Password"}</Label><Input type="password" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} dir="ltr" /></div>
      </InlinePanel>

      <InlineConfirm
        open={!!suspendTarget}
        onCancel={() => setSuspendTarget(null)}
        onConfirm={async () => { if (!suspendTarget) return; await updateStatusMutation.mutateAsync({ userId: suspendTarget.userId, newStatus: "suspended", reason: "Admin action" }); setSuspendTarget(null); }}
        title={isAr ? `تأكيد إيقاف حساب "${suspendTarget?.userName || ""}"` : `Confirm suspending "${suspendTarget?.userName || ""}"`}
        description={isAr ? "سيتم إيقاف الحساب ولن يتمكن المستخدم من الدخول" : "The account will be suspended and the user will not be able to log in"}
        confirmLabel={isAr ? "إيقاف الحساب" : "Suspend Account"}
        variant="destructive"
        loading={updateStatusMutation.isPending}
      />

      <InlinePanel open={!!notifyTarget} onClose={() => { setNotifyTarget(null); setNotifyMessage(""); }} title={isAr ? `إرسال إشعار إلى ${notifyTarget?.userName || ""}` : `Send Notification to ${notifyTarget?.userName || ""}`} icon={<Mail className="h-4 w-4 text-primary" />} size="md"
        footer={<><Button variant="outline" onClick={() => { setNotifyTarget(null); setNotifyMessage(""); }}>{isAr ? "إلغاء" : "Cancel"}</Button><Button disabled={!notifyMessage.trim()} onClick={async () => { if (!notifyTarget) return; await supabase.from("notifications").insert({ user_id: notifyTarget.userId, title: isAr ? "رسالة من الإدارة" : "Message from Admin", title_ar: "رسالة من الإدارة", body: notifyMessage, body_ar: notifyMessage, type: "admin_message" }); toast({ title: isAr ? "تم الإرسال بنجاح" : "Notification sent" }); setNotifyTarget(null); setNotifyMessage(""); }}>{isAr ? "إرسال" : "Send"}</Button></>}
      >
        <div className="space-y-2"><Label>{isAr ? "نص الرسالة" : "Message"}</Label><Textarea value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)} rows={4} dir={isAr ? "rtl" : "ltr"} placeholder={isAr ? "اكتب رسالتك هنا..." : "Type your message here..."} /></div>
      </InlinePanel>

      {/* Bulk Actions */}
      <BulkActionBar count={bulkCount} onClear={clearSelection} onExport={() => exportCSV(selectedItems)} onStatusChange={bulkActivate} onDelete={bulkSuspend} />
      {showBulkImport && <BulkUserImport />}

      {/* Filters */}
      <AdminFilterBar searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder={isAr ? "بحث بالاسم أو البريد أو رقم الحساب..." : "Search by name, email, or account #..."}>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36 h-9 text-sm rounded-xl"><SelectValue placeholder={isAr ? "الدور" : "Role"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "جميع الأدوار" : "All Roles"}</SelectItem>
            {ALL_ROLES.map((role) => <SelectItem key={role} value={role}>{t(role as any)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 text-sm rounded-xl"><SelectValue placeholder={isAr ? "الحالة" : "Status"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "جميع الحالات" : "All Statuses"}</SelectItem>
            <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
            <SelectItem value="pending">{isAr ? "معلق" : "Pending"}</SelectItem>
            <SelectItem value="suspended">{isAr ? "موقوف" : "Suspended"}</SelectItem>
            <SelectItem value="banned">{isAr ? "محظور" : "Banned"}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
          <SelectTrigger className="w-36 h-9 text-sm rounded-xl"><SelectValue placeholder={isAr ? "نوع الحساب" : "Account Type"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "جميع الأنواع" : "All Types"}</SelectItem>
            <SelectItem value="professional">{isAr ? "محترف" : "Professional"}</SelectItem>
            <SelectItem value="fan">{isAr ? "متابع" : "Follower"}</SelectItem>
          </SelectContent>
        </Select>
      </AdminFilterBar>

      {/* Edit Panel */}
      {editingUser && (
        <UserEditPanel
          user={editingUser}
          onClose={() => setEditingUserId(null)}
          onResetPassword={(uid, name) => { setResetUserId(uid); setResetUserName(name); setResetOpen(true); }}
          onInvite={(email) => { setInviteEmail(email); setInviteOpen(true); }}
        />
      )}

      {/* ── Main Content: Table + Side Panel ── */}
      <div className={`flex gap-4 items-start ${viewingUserId ? "flex-col lg:flex-row" : ""}`}>
        <div className={viewingUserId ? "flex-1 min-w-0 w-full lg:w-auto" : "w-full"}>
          <UsersTable
            users={filteredUsers}
            isLoading={isLoading}
            totalCount={usersData?.totalCount || 0}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            editingUserId={editingUserId}
            onEdit={(profile) => { setEditingUserId(profile.user_id); setViewingUserId(null); }}
            onCancelEdit={() => setEditingUserId(null)}
            onViewProfile={(userId) => { setViewingUserId(userId); setEditingUserId(null); }}
            onResetPassword={(uid, name) => { setResetUserId(uid); setResetUserName(name); setResetOpen(true); }}
            onSuspend={(uid, name, email) => setSuspendTarget({ userId: uid, userName: name, email })}
            onSendNotification={(uid, name) => setNotifyTarget({ userId: uid, userName: name })}
            onActivate={async (uid) => { await updateStatusMutation.mutateAsync({ userId: uid, newStatus: "active" }); }}
            selected={selected}
            toggleOne={toggleOne}
            toggleAll={toggleAll}
            isAllSelected={isAllSelected}
            isSelected={isSelected}
          />
        </div>

        {/* Side Panel - replaces drawer */}
        {viewingUserId && (
          <div className="w-full lg:w-[380px] shrink-0">
            <UserDetailsSidePanel
              userId={viewingUserId}
              onClose={() => setViewingUserId(null)}
              onEdit={(uid) => {
                const u = filteredUsers.find((p) => p.user_id === uid);
                if (u) { setEditingUserId(uid); setViewingUserId(null); }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small helper component ──
function UserStatsQuickView({ isAr }: { isAr: boolean }) {
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
      <Badge className="bg-chart-3/15 text-chart-3 border-chart-3/20">{data.active} {isAr ? "نشط" : "active"}</Badge>
      {data.pending > 0 && <Badge variant="secondary">{data.pending} {isAr ? "معلق" : "pending"}</Badge>}
    </div>
  );
}
