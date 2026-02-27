import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { useToast } from "@/hooks/use-toast";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useApprovedSpecialties, useUserSpecialties } from "@/hooks/useSpecialties";
import { useFollowStats } from "@/hooks/useFollow";
import { UserPersonalDetailsTab } from "@/components/admin/UserPersonalDetailsTab";
import { UserCareerTimeline } from "@/components/admin/UserCareerTimeline";
import { UserModificationHistory } from "@/components/admin/UserModificationHistory";
import { UserBioOptimizer } from "@/components/admin/UserBioOptimizer";
import { BulkUserImport } from "@/components/admin/BulkUserImport";
import { UserQuickActions } from "@/components/admin/UserQuickActions";
import { UserAdvancedFilters, INITIAL_FILTERS, type FilterValues } from "@/components/admin/UserAdvancedFilters";
import { AdminUserDetailsDrawer } from "@/components/admin/AdminUserDetailsDrawer";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { UserStatsBar } from "@/components/admin/UserStatsBar";
import { UserCardView } from "@/components/admin/UserCardView";
import { UserGrowthTrendWidget } from "@/components/admin/UserGrowthTrendWidget";
import { UserAnalyticsWidget } from "@/components/admin/UserAnalyticsWidget";
import { UsersLiveStatsWidget } from "@/components/admin/UsersLiveStatsWidget";
import { UserActivityTimeline } from "@/components/admin/UserActivityTimeline";
import { UserSearchCommand } from "@/components/admin/UserSearchCommand";
import { AdminSessionTracker } from "@/components/admin/AdminSessionTracker";
import { AdminNotificationCenter } from "@/components/admin/AdminNotificationCenter";
import { SecurityAuditTimeline } from "@/components/admin/SecurityAuditTimeline";
import { SortableTableHead } from "@/components/admin/SortableTableHead";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { useTableSort } from "@/hooks/useTableSort";
import {
  Search, UserX, UserCheck, Eye, Edit, ChevronRight, ChevronLeft, X, Save,
  UserPlus, KeyRound, Mail, Loader2, Upload, Image as ImageIcon, Users, Plus,
  Trash2, Camera, CheckCircle2, AlertCircle, History, UserCircle, Languages, Briefcase,
  ChefHat, Pencil, Check, FileSpreadsheet, Download, Shield, BarChart3, SlidersHorizontal, LayoutGrid, List,
} from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type AccountStatus = Database["public"]["Enums"]["account_status"];
type AccountType = Database["public"]["Enums"]["account_type"];
type AppRole = Database["public"]["Enums"]["app_role"];
type MembershipTier = Database["public"]["Enums"]["membership_tier"];

const ALL_ROLES: AppRole[] = ["chef", "judge", "student", "organizer", "volunteer", "sponsor", "assistant", "supervisor"];

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  username: string | null;
  account_number: string | null;
  account_status: AccountStatus | null;
  account_type: AccountType;
  membership_tier: MembershipTier | null;
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

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  // Edit user state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRoles, setEditRoles] = useState<AppRole[]>([]);
  const [editMembership, setEditMembership] = useState<MembershipTier>("basic");
  const [editStatus, setEditStatus] = useState<AccountStatus>("active");
  const [editVerified, setEditVerified] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editBioAr, setEditBioAr] = useState("");
  const [editCountryCode, setEditCountryCode] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editSpecialization, setEditSpecialization] = useState("");
  const [editSpecializationAr, setEditSpecializationAr] = useState("");
  const [editFullNameAr, setEditFullNameAr] = useState("");
  const [editDisplayNameAr, setEditDisplayNameAr] = useState("");
  const [editTab, setEditTab] = useState("profile");

  // Personal details state
  const [editPersonal, setEditPersonal] = useState({
    dateOfBirth: "",
    gender: "",
    preferredLanguage: "",
    nationality: "",
  });

  // Validation state
  const [usernameError, setUsernameError] = useState("");
  const [usernameChecking, setUsernameChecking] = useState(false);

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

  // Group management
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupNameAr, setNewGroupNameAr] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("#3b82f6");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  // Media upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // ── Queries ──────────────────────────────────────

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["adminUsers", searchQuery, roleFilter, statusFilter, accountTypeFilter, page],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(`id, user_id, full_name, full_name_ar, display_name, display_name_ar, username, account_number, account_status, account_type, membership_tier, avatar_url, created_at, location, country_code, city, specialization, specialization_ar, is_verified, email, phone, bio, bio_ar, cover_image_url, date_of_birth, gender, preferred_language, nationality, experience_level, education_level, education_institution, education_entity_id, years_of_experience`, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%,account_number.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      if (statusFilter !== "all") {
        query = query.eq("account_status", statusFilter as AccountStatus);
      }
      if (accountTypeFilter !== "all") {
        query = query.eq("account_type", accountTypeFilter as AccountType);
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

  const { data: groups = [] } = useQuery({
    queryKey: ["customerGroups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customer_groups").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: userGroupMemberships = [] } = useQuery({
    queryKey: ["userGroupMemberships", editingUserId],
    queryFn: async () => {
      if (!editingUserId) return [];
      const { data, error } = await supabase
        .from("customer_group_members")
        .select("*, customer_groups(*)")
        .eq("user_id", editingUserId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!editingUserId,
  });

  const { data: approvedSpecialties = [] } = useApprovedSpecialties();
  const { data: editUserSpecialties = [], refetch: refetchUserSpecialties } = useUserSpecialties(editingUserId || undefined);
  const { data: editFollowStats } = useFollowStats(editingUserId || undefined);

  const filteredUsers = usersData?.users?.filter((u) => {
    if (roleFilter === "all") return true;
    return u.roles?.some((r) => r.role === roleFilter);
  });

  const { selected, toggleOne, toggleAll, clearSelection, isAllSelected, count: bulkCount, selectedItems, isSelected } =
    useAdminBulkActions(filteredUsers || []);

  const { sorted: sortedUsers, sortColumn, sortDirection, toggleSort } = useTableSort(filteredUsers || [], "created_at", "desc");

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الاسم" : "Name", accessor: (r: UserProfile) => r.full_name || "" },
      { header: isAr ? "البريد" : "Email", accessor: (r: UserProfile) => r.email || "" },
      { header: isAr ? "الهاتف" : "Phone", accessor: (r: UserProfile) => r.phone || "" },
      { header: isAr ? "اسم المستخدم" : "Username", accessor: (r: UserProfile) => r.username || "" },
      { header: isAr ? "رقم الحساب" : "Account #", accessor: (r: UserProfile) => r.account_number || "" },
      { header: isAr ? "الأدوار" : "Roles", accessor: (r: UserProfile) => r.roles?.map(ro => ro.role).join(", ") || "" },
      { header: isAr ? "نوع الحساب" : "Account Type", accessor: (r: UserProfile) => r.account_type || "professional" },
      { header: isAr ? "العضوية" : "Membership", accessor: (r: UserProfile) => r.membership_tier || "" },
      { header: isAr ? "الحالة" : "Status", accessor: (r: UserProfile) => r.account_status || "" },
      { header: isAr ? "الدولة" : "Country", accessor: (r: UserProfile) => r.country_code || "" },
    ],
    filename: "users",
  });

  const bulkActivate = async () => {
    const ids = Array.from(selected);
    const { error } = await supabase.from("profiles").update({ account_status: "active" as AccountStatus, suspended_reason: null, suspended_at: null }).in("user_id", ids);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    clearSelection();
    toast({ title: isAr ? `تم تفعيل ${ids.length} مستخدم` : `${ids.length} users activated` });
  };

  const bulkSuspend = async () => {
    const ids = Array.from(selected);
    const { error } = await supabase.from("profiles").update({ account_status: "suspended" as AccountStatus, suspended_reason: "Admin bulk action", suspended_at: new Date().toISOString() }).in("user_id", ids);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    clearSelection();
    toast({ title: isAr ? `تم إيقاف ${ids.length} مستخدم` : `${ids.length} users suspended` });
  };

  const totalPages = Math.ceil((usersData?.totalCount || 0) / pageSize);
  const editingUser = filteredUsers?.find((u) => u.user_id === editingUserId);

  // ── Username validation ──────────────────────────

  const validateUsername = useCallback(async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameError(isAr ? "اسم المستخدم يجب أن يكون 3 أحرف على الأقل" : "Username must be at least 3 characters");
      return false;
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_]{2,29}$/.test(username)) {
      setUsernameError(isAr ? "يجب أن يبدأ بحرف ويحتوي على أحرف وأرقام و _ فقط" : "Must start with letter, only letters, numbers and _");
      return false;
    }
    setUsernameChecking(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", username.toLowerCase())
        .neq("user_id", editingUserId || "")
        .maybeSingle();
      if (data) {
        setUsernameError(isAr ? "اسم المستخدم مأخوذ بالفعل" : "Username is already taken");
        return false;
      }
      setUsernameError("");
      return true;
    } finally {
      setUsernameChecking(false);
    }
  }, [editingUserId, isAr]);

  // ── Edge function caller ──────────────────────────

  const callAdminFn = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-user-management", { body });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  };

  // ── Mutations ──────────────────────────────────────

  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase.from("profiles").update(updates).eq("user_id", userId);
      if (error) throw error;
      await supabase.from("admin_actions").insert([{ admin_id: user!.id, target_user_id: userId, action_type: "update_profile", details: updates as any }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: isAr ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully" });
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ في التحديث" : "Update Error", description: e.message }),
  });

  const updateRolesMutation = useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: AppRole[] }) => {
      // Fetch existing roles to avoid duplicates
      const { data: existingRoles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      const existingSet = new Set(existingRoles?.map((r) => r.role) || []);
      const newSet = new Set(roles);

      // Delete removed roles
      const toDelete = [...existingSet].filter((r) => !newSet.has(r as AppRole));
      if (toDelete.length > 0) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).in("role", toDelete);
        if (error) throw error;
      }

      // Insert new roles
      const toInsert = [...newSet].filter((r) => !existingSet.has(r));
      if (toInsert.length > 0) {
        const { error } = await supabase.from("user_roles").insert(toInsert.map((role) => ({ user_id: userId, role })));
        if (error) throw error;
      }

      await supabase.from("admin_actions").insert([{ admin_id: user!.id, target_user_id: userId, action_type: "update_roles", details: { roles } }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: isAr ? "تم تحديث الأدوار" : "Roles updated" });
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

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

  const createUserMutation = useMutation({
    mutationFn: async () => callAdminFn({ action: "create_user", email: newEmail, password: newPassword, full_name: newFullName, username: newUsername, phone: newPhone, role: newRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: isAr ? "تم إنشاء المستخدم بنجاح" : "User created successfully" });
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

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("customer_groups").insert({
        name: newGroupName, name_ar: newGroupNameAr || null, color: newGroupColor, is_active: true, created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerGroups"] });
      toast({ title: isAr ? "تم إنشاء المجموعة" : "Group created" });
      setCreateGroupOpen(false);
      setNewGroupName(""); setNewGroupNameAr("");
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

  const addToGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      if (!editingUserId) throw new Error("No user selected");
      const { error } = await supabase.from("customer_group_members").insert({ group_id: groupId, user_id: editingUserId, added_by: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userGroupMemberships"] });
      toast({ title: isAr ? "تمت الإضافة للمجموعة" : "Added to group" });
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

  const removeFromGroupMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase.from("customer_group_members").delete().eq("id", membershipId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userGroupMemberships"] });
      toast({ title: isAr ? "تمت الإزالة من المجموعة" : "Removed from group" });
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

  const addSpecialtyMutation = useMutation({
    mutationFn: async (specialtyId: string) => {
      if (!editingUserId) throw new Error("No user");
      const { error } = await supabase.from("user_specialties").insert({ user_id: editingUserId, specialty_id: specialtyId });
      if (error) throw error;
    },
    onSuccess: () => {
      refetchUserSpecialties();
      toast({ title: isAr ? "تمت إضافة التخصص" : "Specialty added" });
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

  const removeSpecialtyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_specialties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchUserSpecialties();
      toast({ title: isAr ? "تمت إزالة التخصص" : "Specialty removed" });
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

  const uploadMediaMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: "avatar" | "cover" }) => {
      if (!editingUserId) throw new Error("No user selected");
      const ext = file.name.split(".").pop();
      const path = `${editingUserId}/${type}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("user-media").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("user-media").getPublicUrl(path);
      const updateField = type === "avatar" ? "avatar_url" : "cover_image_url";
      const { error: updateError } = await supabase.from("profiles").update({ [updateField]: publicUrl }).eq("user_id", editingUserId);
      if (updateError) throw updateError;
      return { type, url: publicUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: isAr ? "تم رفع الصورة بنجاح" : "Image uploaded successfully" });
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

  // ── Handlers ──────────────────────────────────────

  const handleOpenEdit = (profile: UserProfile) => {
    setEditingUserId(profile.user_id);
    setEditRoles(profile.roles?.map((r) => r.role) || []);
    setEditMembership(profile.membership_tier || "basic");
    setEditStatus(profile.account_status || "pending");
    setEditVerified(profile.is_verified || false);
    setEditFullName(profile.full_name || "");
    setEditDisplayName((profile as any).display_name || "");
    setEditUsername(profile.username || "");
    setEditEmail(profile.email || "");
    setEditPhone(profile.phone || "");
    setEditBio(profile.bio || "");
    setEditBioAr((profile as any).bio_ar || "");
    setEditCountryCode(profile.country_code || "");
    setEditCity((profile as any).city || "");
    setEditSpecialization(profile.specialization || "");
    setEditSpecializationAr((profile as any).specialization_ar || "");
    setEditFullNameAr((profile as any).full_name_ar || "");
    setEditDisplayNameAr((profile as any).display_name_ar || "");
    setEditTab("profile");
    setUsernameError("");
    setEditPersonal({
      dateOfBirth: (profile as any).date_of_birth || "",
      gender: (profile as any).gender || "",
      preferredLanguage: (profile as any).preferred_language || "",
      nationality: (profile as any).nationality || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUserId) return;

    // Validate username before saving
    if (editUsername) {
      const valid = await validateUsername(editUsername);
      if (!valid) return;
    }

    await updateProfileMutation.mutateAsync({
      userId: editingUserId,
      updates: {
        full_name: editFullName || null,
        full_name_ar: editFullNameAr || null,
        display_name: editDisplayName || null,
        display_name_ar: editDisplayNameAr || null,
        username: editUsername?.toLowerCase() || null,
        phone: editPhone || null,
        bio: editBio || null,
        bio_ar: editBioAr || null,
        country_code: editCountryCode || null,
        city: editCity || null,
        location: editCountryCode ? null : null,
        specialization: editSpecialization || null,
        specialization_ar: editSpecializationAr || null,
        membership_tier: editMembership,
        account_status: editStatus,
        is_verified: editVerified,
        suspended_reason: editStatus === "suspended" || editStatus === "banned" ? "Admin action" : null,
        suspended_at: editStatus === "suspended" || editStatus === "banned" ? new Date().toISOString() : null,
        date_of_birth: editPersonal.dateOfBirth || null,
        gender: editPersonal.gender || null,
        preferred_language: editPersonal.preferredLanguage || null,
        nationality: editPersonal.nationality || null,
      },
    });
    await updateRolesMutation.mutateAsync({ userId: editingUserId, roles: editRoles });
    setEditingUserId(null);
  };

  const toggleRole = (role: AppRole) => {
    setEditRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);
  };

  const handleFileUpload = (file: File, type: "avatar" | "cover") => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: isAr ? "الملف كبير جداً" : "File too large", description: isAr ? "الحد الأقصى 5 ميجابايت" : "Max 5MB allowed" });
      return;
    }
    uploadMediaMutation.mutate({ file, type });
  };

  const getStatusBadge = (status: AccountStatus | null) => {
    const config: Record<AccountStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; labelAr: string }> = {
      active: { variant: "default", label: "Active", labelAr: "نشط" },
      pending: { variant: "secondary", label: "Pending", labelAr: "معلق" },
      suspended: { variant: "destructive", label: "Suspended", labelAr: "موقوف" },
      banned: { variant: "destructive", label: "Banned", labelAr: "محظور" },
    };
    const cfg = config[status || "pending"];
    return <Badge variant={cfg.variant}>{isAr ? cfg.labelAr : cfg.label}</Badge>;
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

  const memberGroupIds = new Set(userGroupMemberships.map((m: any) => m.group_id));
  const availableGroups = groups.filter((g: any) => !memberGroupIds.has(g.id));
  const editUserSpecialtyIds = new Set(editUserSpecialties.map((us: any) => us.specialty_id));
  const availableSpecialties = approvedSpecialties.filter((s) => !editUserSpecialtyIds.has(s.id));

  const isSaving = updateProfileMutation.isPending || updateRolesMutation.isPending;

  const [showBulkImport, setShowBulkImport] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterValues>(INITIAL_FILTERS);
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState(false);

  // Keyboard shortcut: Cmd+U / Ctrl+U to open user search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "u") {
        e.preventDefault();
        setUserSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="space-y-6">
      {/* Quick User Search Command */}
      <UserSearchCommand
        open={userSearchOpen}
        onOpenChange={setUserSearchOpen}
        onSelectUser={(userId) => {
          setDrawerUserId(userId);
          setDrawerOpen(true);
        }}
      />
      <AdminPageHeader
        icon={Users}
        title={isAr ? "إدارة المستخدمين" : "User Management"}
        description={isAr ? "تحكم كامل بإدارة الحسابات والأدوار والمجموعات والتخصصات" : "Manage accounts, roles, groups, specialties and media"}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {usersData?.totalCount || 0} {isAr ? "مستخدم" : "users"}
            </Badge>
            <UserStatsQuickView language={language} />
          </div>
        }
      />

      {/* Users Live Stats */}
      <UsersLiveStatsWidget />
      <UserActivityTimeline />

      {/* User Growth Analytics */}
      <UserGrowthTrendWidget />

      {/* User Analytics - Registration, Roles, Geography */}
      <UserAnalyticsWidget />

      {/* Stats Bar */}
      <UserStatsBar />

      {/* Notification Center & Security Audit */}
      <div className="grid gap-4 md:grid-cols-2">
        <AdminNotificationCenter />
        <SecurityAuditTimeline />
      </div>

      {/* Security & Sessions */}
      <AdminSessionTracker />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setUserSearchOpen(true)}>
          <Search className="me-2 h-4 w-4" />{isAr ? "بحث سريع" : "Quick Search"}
          <kbd className="ms-2 text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">⌘U</kbd>
        </Button>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="me-2 h-4 w-4" />{isAr ? "إنشاء مستخدم" : "Create User"}</Button>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isAr ? "اسم المستخدم" : "Username"}</Label>
                  <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="username" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "رقم الهاتف" : "Phone"}</Label>
                  <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+966..." dir="ltr" />
                </div>
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
            <Button variant="outline"><Mail className="me-2 h-4 w-4" />{isAr ? "إرسال دعوة" : "Send Invitation"}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{isAr ? "إرسال دعوة بالبريد الإلكتروني" : "Send Email Invitation"}</DialogTitle>
              <DialogDescription>{isAr ? "أرسل دعوة للمستخدم لتفعيل حسابه وتعيين كلمة مرور جديدة" : "Invite user to activate their account and set a new password"}</DialogDescription>
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

        <Button variant="outline" onClick={() => setShowBulkImport(!showBulkImport)}>
          <FileSpreadsheet className="me-2 h-4 w-4" />
          {isAr ? "استيراد من ملف" : "Import from File"}
        </Button>

        <Button variant="outline" onClick={() => exportCSV(filteredUsers || [])}>
          <Download className="me-2 h-4 w-4" />
          {isAr ? "تصدير CSV" : "Export CSV"}
        </Button>

        <UserAdvancedFilters
          filters={advancedFilters}
          onChange={setAdvancedFilters}
          onReset={() => setAdvancedFilters(INITIAL_FILTERS)}
        />
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        count={bulkCount}
        onClear={clearSelection}
        onExport={() => exportCSV(selectedItems)}
        onStatusChange={() => bulkActivate()}
        onDelete={bulkSuspend}
      />

      {/* Bulk Import Panel */}
      {showBulkImport && <BulkUserImport />}

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isAr ? "إعادة تعيين كلمة المرور" : "Reset Password"}</DialogTitle>
            <DialogDescription>{isAr ? `إعادة تعيين كلمة المرور للمستخدم: ${resetUserName}` : `Reset password for: ${resetUserName}`}</DialogDescription>
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
            <SelectTrigger className="w-40"><SelectValue placeholder={isAr ? "تصفية حسب الدور" : "Filter by role"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allUsers")}</SelectItem>
              {ALL_ROLES.map((role) => (
                <SelectItem key={role} value={role}>{t(role as any)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder={isAr ? "تصفية حسب الحالة" : "Filter by status"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allUsers")}</SelectItem>
              <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
              <SelectItem value="pending">{isAr ? "معلق" : "Pending"}</SelectItem>
              <SelectItem value="suspended">{isAr ? "موقوف" : "Suspended"}</SelectItem>
              <SelectItem value="banned">{isAr ? "محظور" : "Banned"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder={isAr ? "نوع الحساب" : "Account Type"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
              <SelectItem value="professional">{isAr ? "محترف" : "Professional"}</SelectItem>
              <SelectItem value="fan">{isAr ? "متابع" : "Follower"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* ── Inline Edit Panel ─────────────────────────── */}
      {editingUser && (
        <Card className="border-primary/30 shadow-lg shadow-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 border-2 border-primary/20">
                  <AvatarImage src={editingUser.avatar_url || undefined} />
                  <AvatarFallback className="text-lg">{(editingUser.full_name || "U")[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {(editingUser as any).display_name || editingUser.full_name || "Unknown"}
                    {getStatusBadge(editingUser.account_status)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-mono">{editingUser.account_number}</span> · @{editingUser.username} · {editingUser.email}
                  </p>
                  {editFollowStats && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <Users className="inline h-3 w-3 me-1" />
                      {editFollowStats.followers} {isAr ? "متابع" : "followers"} · {editFollowStats.following} {isAr ? "يتابع" : "following"}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingUserId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={editTab} onValueChange={setEditTab}>
              <TabsList className="mb-4 flex-wrap">
                <TabsTrigger value="profile"><Edit className="me-1 h-3.5 w-3.5" />{isAr ? "الملف الشخصي" : "Profile"}</TabsTrigger>
                <TabsTrigger value="personal"><UserCircle className="me-1 h-3.5 w-3.5" />{isAr ? "البيانات الشخصية" : "Personal"}</TabsTrigger>
                <TabsTrigger value="roles"><Users className="me-1 h-3.5 w-3.5" />{isAr ? "الأدوار والحالة" : "Roles & Status"}</TabsTrigger>
                <TabsTrigger value="groups"><Users className="me-1 h-3.5 w-3.5" />{isAr ? "المجموعات" : "Groups"}</TabsTrigger>
                <TabsTrigger value="media"><ImageIcon className="me-1 h-3.5 w-3.5" />{isAr ? "الوسائط" : "Media"}</TabsTrigger>
                <TabsTrigger value="career"><Briefcase className="me-1 h-3.5 w-3.5" />{isAr ? "السيرة المهنية" : "Professional"}</TabsTrigger>
                <TabsTrigger value="history"><History className="me-1 h-3.5 w-3.5" />{isAr ? "سجل التعديلات" : "History"}</TabsTrigger>
              </TabsList>

              {/* ── Profile Tab ────── */}
              <TabsContent value="profile" className="space-y-5">
                {/* Bilingual Name Section */}
                <div className="rounded-lg border p-4 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    {isAr ? "الاسم والهوية" : "Name & Identity"}
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Full Name (EN)</Label>
                      <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} placeholder="Full name in English" dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <Label>الاسم الكامل (AR)</Label>
                      <Input value={editFullNameAr} onChange={(e) => setEditFullNameAr(e.target.value)} placeholder="الاسم الكامل بالعربية" dir="rtl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Display Name (EN)</Label>
                      <Input value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} placeholder="Public display name" dir="ltr" />
                      <p className="text-[10px] text-muted-foreground">Shown on public profile & search results</p>
                    </div>
                    <div className="space-y-2">
                      <Label>الاسم المعروض (AR)</Label>
                      <Input value={editDisplayNameAr} onChange={(e) => setEditDisplayNameAr(e.target.value)} placeholder="الاسم المعروض للعامة" dir="rtl" />
                      <p className="text-[10px] text-muted-foreground">يظهر في الملف العام ونتائج البحث</p>
                    </div>
                  </div>
                </div>

                {/* Username, Email, Phone */}
                <div className="rounded-lg border p-4 space-y-4">
                  <h3 className="text-sm font-semibold">{isAr ? "بيانات الحساب" : "Account Details"}</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>{isAr ? "اسم المستخدم" : "Username"}</Label>
                      <div className="relative">
                        <Input
                          value={editUsername}
                          onChange={(e) => { setEditUsername(e.target.value); setUsernameError(""); }}
                          onBlur={() => editUsername && validateUsername(editUsername)}
                          dir="ltr"
                          className={usernameError ? "border-destructive" : ""}
                        />
                        {usernameChecking && <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                      </div>
                      {usernameError && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />{usernameError}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                      <Input value={editEmail} disabled dir="ltr" className="opacity-60" />
                      <p className="text-[10px] text-muted-foreground">{isAr ? "لا يمكن تعديله من هنا" : "Cannot be changed here"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "رقم الهاتف" : "Phone"}</Label>
                      <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} dir="ltr" placeholder="+966..." />
                    </div>
                  </div>
                </div>

                {/* Country & City */}
                <div className="rounded-lg border p-4 space-y-4">
                  <h3 className="text-sm font-semibold">{isAr ? "الموقع" : "Location"}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <CountrySelector
                      value={editCountryCode}
                      onChange={(code) => setEditCountryCode(code)}
                      label={isAr ? "الدولة" : "Country"}
                    />
                    <div className="space-y-1.5">
                      <Label className="text-xs">{isAr ? "المدينة" : "City"}</Label>
                      <Input value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder={isAr ? "أدخل المدينة" : "Enter city"} />
                    </div>
                  </div>
                </div>

                {/* Specialization from DB with search */}
                <SpecializationSelector
                  editSpecialization={editSpecialization}
                  editSpecializationAr={editSpecializationAr}
                  onSpecializationChange={setEditSpecialization}
                  onSpecializationArChange={setEditSpecializationAr}
                  editUserSpecialties={editUserSpecialties}
                  availableSpecialties={availableSpecialties}
                  onAddSpecialty={(id) => addSpecialtyMutation.mutate(id)}
                  onRemoveSpecialty={(id) => removeSpecialtyMutation.mutate(id)}
                  isAr={isAr}
                />

                {/* Bio (EN) with AI Optimizer */}
                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="text-sm font-semibold">{isAr ? "النبذة التعريفية" : "Biography (SEO Optimized)"}</h3>
                  <UserBioOptimizer bio={editBio} onBioChange={setEditBio} lang="en" onTranslatedBioChange={setEditBioAr} />
                  <Separator />
                  <UserBioOptimizer bio={editBioAr} onBioChange={setEditBioAr} lang="ar" onTranslatedBioChange={setEditBio} />
                </div>
              </TabsContent>

              {/* ── Personal Details Tab ────── */}
              <TabsContent value="personal" className="space-y-4">
                <UserPersonalDetailsTab
                  form={editPersonal}
                  onChange={(updates) => setEditPersonal((prev) => ({ ...prev, ...updates }))}
                  isAr={isAr}
                />
              </TabsContent>

              {/* ── Career Timeline Tab ────── */}
              <TabsContent value="career" className="space-y-4">
                <UserCareerTimeline userId={editingUser.user_id} isAr={isAr} />
              </TabsContent>

              {/* ── Roles & Status Tab ────── */}
              <TabsContent value="roles" className="space-y-6">
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
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setResetUserId(editingUser.user_id); setResetUserName(editingUser.full_name || ""); setResetOpen(true); }}>
                    <KeyRound className="me-2 h-4 w-4" />{isAr ? "إعادة تعيين كلمة المرور" : "Reset Password"}
                  </Button>
                  {editingUser.email && (
                    <Button variant="outline" size="sm" onClick={() => { setInviteEmail(editingUser.email || ""); setInviteOpen(true); }}>
                      <Mail className="me-2 h-4 w-4" />{isAr ? "إرسال دعوة تفعيل" : "Send Activation"}
                    </Button>
                  )}
                </div>
              </TabsContent>

              {/* ── Groups Tab ────── */}
              <TabsContent value="groups" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">{isAr ? "المجموعات المنضمة" : "Joined Groups"}</Label>
                  <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm"><Plus className="me-1 h-3.5 w-3.5" />{isAr ? "مجموعة جديدة" : "New Group"}</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle>{isAr ? "إنشاء مجموعة جديدة" : "Create New Group"}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>{isAr ? "اسم المجموعة (EN)" : "Group Name (EN)"}</Label>
                          <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="VIP Members" />
                        </div>
                        <div className="space-y-2">
                          <Label>{isAr ? "اسم المجموعة (AR)" : "Group Name (AR)"}</Label>
                          <Input value={newGroupNameAr} onChange={(e) => setNewGroupNameAr(e.target.value)} placeholder="أعضاء مميزون" />
                        </div>
                        <div className="space-y-2">
                          <Label>{isAr ? "اللون" : "Color"}</Label>
                          <Input type="color" value={newGroupColor} onChange={(e) => setNewGroupColor(e.target.value)} className="h-10 w-20" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateGroupOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
                        <Button onClick={() => createGroupMutation.mutate()} disabled={!newGroupName || createGroupMutation.isPending}>
                          {createGroupMutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                          {isAr ? "إنشاء" : "Create"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {userGroupMemberships.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">{isAr ? "لم ينضم لأي مجموعة بعد" : "Not a member of any group yet"}</p>
                ) : (
                  <div className="space-y-2">
                    {userGroupMemberships.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: m.customer_groups?.color || "#888" }} />
                          <span className="text-sm font-medium">{isAr ? m.customer_groups?.name_ar || m.customer_groups?.name : m.customer_groups?.name}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeFromGroupMutation.mutate(m.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {availableGroups.length > 0 ? (
                  <div className="space-y-2">
                    <Label className="text-sm">{isAr ? "إضافة إلى مجموعة" : "Add to Group"}</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableGroups.map((g: any) => (
                        <Button key={g.id} variant="outline" size="sm" onClick={() => addToGroupMutation.mutate(g.id)} disabled={addToGroupMutation.isPending}>
                          <Plus className="me-1 h-3 w-3" />
                          {isAr ? g.name_ar || g.name : g.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : groups.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">{isAr ? "لا توجد مجموعات حتى الآن" : "No groups exist yet"}</p>
                    <Button variant="outline" size="sm" onClick={() => setCreateGroupOpen(true)}>
                      <Plus className="me-1 h-3.5 w-3.5" />{isAr ? "إنشاء أول مجموعة" : "Create First Group"}
                    </Button>
                  </div>
                ) : null}
              </TabsContent>

              {/* ── Media Tab ────── */}
              <TabsContent value="media" className="space-y-6">
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "avatar")} />
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "cover")} />

                <div className="space-y-2">
                  <Label>{isAr ? "صورة الغلاف" : "Cover Image"}</Label>
                  <div className="relative rounded-xl border overflow-hidden h-40 bg-muted/30 group cursor-pointer" onClick={() => coverInputRef.current?.click()}>
                    {editingUser.cover_image_url ? (
                      <img src={editingUser.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-full p-2">
                        <Upload className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{isAr ? "صورة الملف الشخصي" : "Profile Photo"}</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                      <Avatar className="h-24 w-24 border-2 border-border">
                        <AvatarImage src={editingUser.avatar_url || undefined} />
                        <AvatarFallback className="text-2xl">{(editingUser.full_name || "U")[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 rounded-full bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
                        <Camera className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-background" />
                      </div>
                    </div>
                    <div>
                      <Button variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()}>
                        <Upload className="me-2 h-4 w-4" />{isAr ? "رفع صورة" : "Upload Photo"}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">{isAr ? "JPG, PNG بحد أقصى 5MB" : "JPG, PNG up to 5MB"}</p>
                    </div>
                  </div>
                </div>

                {uploadMediaMutation.isPending && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isAr ? "جاري رفع الصورة..." : "Uploading..."}
                  </div>
                )}
              </TabsContent>

              {/* ── History Tab ────── */}
              <TabsContent value="history">
                <UserModificationHistory userId={editingUserId!} isAr={isAr} />
              </TabsContent>
            </Tabs>

            {/* Save bar */}
            <Separator className="my-4" />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setEditingUserId(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleSaveEdit} disabled={isSaving || !!usernameError}>
                {isSaving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                <Save className="me-2 h-4 w-4" />
                {isAr ? "حفظ جميع التغييرات" : "Save All Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Users Table ─────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("allUsers")}</CardTitle>
          <div className="flex items-center gap-1 border rounded-lg p-0.5">
            <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setViewMode("table")}>
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button variant={viewMode === "card" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setViewMode("card")}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable columns={9} rows={8} />
          ) : filteredUsers?.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{t("noResults")}</p>
          ) : viewMode === "card" ? (
            <UserCardView
              users={filteredUsers || []}
              onViewUser={(userId) => { setDrawerUserId(userId); setDrawerOpen(true); }}
            />
          ) : (
            <>
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} />
                    </TableHead>
                    <SortableTableHead column="full_name" label={isAr ? "المستخدم" : "User"} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    <SortableTableHead column="account_number" label={t("accountNumber")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    <SortableTableHead column="account_type" label={isAr ? "النوع" : "Type"} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    <TableHead>{isAr ? "الأدوار" : "Roles"}</TableHead>
                    <SortableTableHead column="membership_tier" label={t("membershipTier")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    <SortableTableHead column="account_status" label={t("accountStatus")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    <SortableTableHead column="created_at" label={isAr ? "تاريخ الإنشاء" : "Created"} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    <TableHead className="w-40">{isAr ? "الإجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers?.map((profile) => (
                    <TableRow key={profile.id} className={editingUserId === profile.user_id ? "bg-primary/5" : isSelected(profile.id) ? "bg-primary/5" : ""}>
                      <TableCell>
                        <Checkbox checked={isSelected(profile.id)} onCheckedChange={() => toggleOne(profile.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback>{(profile.full_name || "U")[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1">
                              <p className="font-medium">{(profile as any).display_name || profile.full_name || "No name"}</p>
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
                        <Badge variant={profile.account_type === "fan" ? "secondary" : "outline"} className="text-xs">
                          {profile.account_type === "fan" ? (isAr ? "متابع" : "Follower") : (isAr ? "محترف" : "Pro")}
                        </Badge>
                      </TableCell>
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
                        <div className="flex items-center gap-1">
                          <Button variant={editingUserId === profile.user_id ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => editingUserId === profile.user_id ? setEditingUserId(null) : handleOpenEdit(profile)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <UserQuickActions
                            userId={profile.user_id}
                            userName={profile.full_name || profile.username || ""}
                            email={profile.email}
                            status={profile.account_status}
                            isVerified={profile.is_verified}
                            onViewProfile={() => { setDrawerUserId(profile.user_id); setDrawerOpen(true); }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {isAr
                      ? `عرض ${page * pageSize + 1}-${Math.min((page + 1) * pageSize, usersData?.totalCount || 0)} من ${usersData?.totalCount || 0}`
                      : `Showing ${page * pageSize + 1}-${Math.min((page + 1) * pageSize, usersData?.totalCount || 0)} of ${usersData?.totalCount || 0}`}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => setPage(0)} disabled={page === 0} className="h-8 w-8 p-0">
                      <ChevronLeft className="h-3 w-3" /><ChevronLeft className="h-3 w-3 -ms-2" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="h-8 w-8 p-0">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const startPage = Math.max(0, Math.min(page - 2, totalPages - 5));
                      const pageNum = startPage + i;
                      if (pageNum >= totalPages) return null;
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === page ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-8 p-0 text-xs"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum + 1}
                        </Button>
                      );
                    })}
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="h-8 w-8 p-0">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="h-8 w-8 p-0">
                      <ChevronRight className="h-3 w-3" /><ChevronRight className="h-3 w-3 -ms-2" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Details Drawer */}
      <AdminUserDetailsDrawer userId={drawerUserId} open={drawerOpen} onOpenChange={setDrawerOpen} />
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

function SpecializationSelector({
  editSpecialization,
  editSpecializationAr,
  onSpecializationChange,
  onSpecializationArChange,
  editUserSpecialties,
  availableSpecialties,
  onAddSpecialty,
  onRemoveSpecialty,
  isAr,
}: {
  editSpecialization: string;
  editSpecializationAr: string;
  onSpecializationChange: (v: string) => void;
  onSpecializationArChange: (v: string) => void;
  editUserSpecialties: any[];
  availableSpecialties: any[];
  onAddSpecialty: (id: string) => void;
  onRemoveSpecialty: (id: string) => void;
  isAr: boolean;
}) {
  const [specSearch, setSpecSearch] = useState("");
  const [primarySearch, setPrimarySearch] = useState("");
  const [showPrimaryDropdown, setShowPrimaryDropdown] = useState(false);
  const [showNewSpecForm, setShowNewSpecForm] = useState(false);
  const [newSpecName, setNewSpecName] = useState("");
  const [newSpecNameAr, setNewSpecNameAr] = useState("");
  const [addingNewSpec, setAddingNewSpec] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // All specialties (including pending) for duplication check
  const { data: allSpecialties } = useQuery({
    queryKey: ["specialties", "all-for-check"],
    queryFn: async () => {
      const { data, error } = await supabase.from("specialties").select("id, name, name_ar, slug, is_approved, is_active").order("name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Filter approved specialties for primary selection
  const filteredPrimary = availableSpecialties.filter((s) => {
    if (!primarySearch.trim()) return true;
    const q = primarySearch.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.name_ar?.toLowerCase().includes(q);
  });

  // Filter for specialty tags
  const filteredSpecs = availableSpecialties.filter((s) => {
    if (!specSearch.trim()) return true;
    const q = specSearch.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.name_ar?.toLowerCase().includes(q);
  });

  // Select a primary specialty from the list
  const handleSelectPrimary = (spec: any) => {
    onSpecializationChange(spec.name || "");
    onSpecializationArChange(spec.name_ar || "");
    setPrimarySearch("");
    setShowPrimaryDropdown(false);
  };

  // Check duplication and add new specialty
  const handleAddNewSpecialty = async () => {
    if (!newSpecName.trim()) return;
    const slug = newSpecName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // Check for duplicates
    const duplicate = (allSpecialties || []).find(
      (s) => s.slug === slug || s.name?.toLowerCase() === newSpecName.trim().toLowerCase()
        || (newSpecNameAr.trim() && s.name_ar === newSpecNameAr.trim())
    );

    if (duplicate) {
      toast({
        variant: "destructive",
        title: isAr ? "تخصص مكرر" : "Duplicate Specialty",
        description: isAr
          ? `التخصص "${duplicate.name_ar || duplicate.name}" موجود بالفعل${!duplicate.is_approved ? " (قيد المراجعة)" : ""}`
          : `"${duplicate.name}" already exists${!duplicate.is_approved ? " (pending approval)" : ""}`,
      });
      return;
    }

    setAddingNewSpec(true);
    try {
      const { error } = await supabase.from("specialties").insert({
        name: newSpecName.trim(),
        name_ar: newSpecNameAr.trim() || null,
        slug,
        is_approved: false,
        is_active: true,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["specialties"] });
      toast({
        title: isAr ? "تم إرسال التخصص للمراجعة" : "Specialty submitted for review",
        description: isAr
          ? "سيتم مراجعته والموافقة عليه من قبل الإدارة"
          : "It will be reviewed and approved by an admin",
      });
      setNewSpecName("");
      setNewSpecNameAr("");
      setShowNewSpecForm(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setAddingNewSpec(false);
    }
  };

  // Current primary display
  const primaryDisplay = editSpecialization
    ? (isAr ? (editSpecializationAr || editSpecialization) : editSpecialization)
    : "";

  // Pending specialties count
  const pendingCount = (allSpecialties || []).filter((s) => !s.is_approved).length;

  return (
    <>
      {/* Primary Specialization - DB selector */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{isAr ? "التخصص الرئيسي" : "Primary Specialization"}</h3>
          {pendingCount > 0 && (
            <Badge variant="outline" className="text-[10px] gap-1 text-chart-4 border-chart-4/30">
              <AlertCircle className="h-3 w-3" />
              {isAr ? `${pendingCount} بانتظار الموافقة` : `${pendingCount} pending approval`}
            </Badge>
          )}
        </div>

        {/* Selected primary display */}
        {primaryDisplay && !showPrimaryDropdown && (
          <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2">
            <ChefHat className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{editSpecialization}</p>
              {editSpecializationAr && <p className="text-xs text-muted-foreground" dir="rtl">{editSpecializationAr}</p>}
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowPrimaryDropdown(true)}>
              <Pencil className="h-3 w-3" />{isAr ? "تغيير" : "Change"}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive/70 hover:text-destructive" onClick={() => { onSpecializationChange(""); onSpecializationArChange(""); }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Search & select dropdown */}
        {(!primaryDisplay || showPrimaryDropdown) && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={primarySearch}
                onChange={(e) => setPrimarySearch(e.target.value)}
                onFocus={() => setShowPrimaryDropdown(true)}
                placeholder={isAr ? "ابحث واختر التخصص الرئيسي..." : "Search and select primary specialization..."}
                className="ps-9 h-9 text-sm"
              />
            </div>
            {showPrimaryDropdown && (
              <div className="max-h-48 overflow-y-auto rounded-md border divide-y bg-popover">
                {filteredPrimary.slice(0, 30).map((s) => (
                  <button
                    key={s.id} type="button"
                    onClick={() => handleSelectPrimary(s)}
                    className="w-full text-start px-3 py-2 text-sm hover:bg-accent/50 transition-colors flex items-center justify-between"
                  >
                    <span>{isAr ? s.name_ar || s.name : s.name}</span>
                    <span className="text-xs text-muted-foreground">{isAr ? s.name : s.name_ar}</span>
                  </button>
                ))}
                {filteredPrimary.length === 0 && (
                  <div className="px-3 py-3 text-center">
                    <p className="text-xs text-muted-foreground mb-2">{isAr ? "لا توجد نتائج" : "No results found"}</p>
                    {!showNewSpecForm && (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { setShowNewSpecForm(true); setNewSpecName(primarySearch); }}>
                        <Plus className="h-3 w-3" />{isAr ? "إضافة تخصص جديد" : "Add new specialty"}
                      </Button>
                    )}
                  </div>
                )}
                {showPrimaryDropdown && filteredPrimary.length > 0 && !showNewSpecForm && (
                  <div className="px-3 py-2 border-t">
                    <Button variant="ghost" size="sm" className="w-full h-7 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={() => setShowNewSpecForm(true)}>
                      <Plus className="h-3 w-3" />{isAr ? "لم تجد تخصصك؟ أضف جديد" : "Can't find yours? Add new"}
                    </Button>
                  </div>
                )}
              </div>
            )}
            {showPrimaryDropdown && primaryDisplay && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowPrimaryDropdown(false)}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
            )}
          </div>
        )}

        {/* New specialty form (inline) */}
        {showNewSpecForm && (
          <div className="rounded-md border border-dashed border-chart-4/40 bg-chart-4/5 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-chart-4" />
                {isAr ? "إضافة تخصص جديد (يتطلب موافقة الإدارة)" : "Add new specialty (requires admin approval)"}
              </p>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowNewSpecForm(false)}><X className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "الاسم (EN)" : "Name (EN)"} *</Label>
                <Input value={newSpecName} onChange={(e) => setNewSpecName(e.target.value)} className="h-8 text-xs" dir="ltr" placeholder="e.g. Molecular Gastronomy" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "الاسم (AR)" : "Name (AR)"}</Label>
                <Input value={newSpecNameAr} onChange={(e) => setNewSpecNameAr(e.target.value)} className="h-8 text-xs" dir="rtl" placeholder="مثال: فن الطهي الجزيئي" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs flex-1" onClick={() => setShowNewSpecForm(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button size="sm" className="h-8 text-xs flex-1 gap-1" onClick={handleAddNewSpecialty} disabled={!newSpecName.trim() || addingNewSpec}>
                {addingNewSpec ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                {isAr ? "إرسال للمراجعة" : "Submit for Review"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Specialty Tags from DB with search */}
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="text-sm font-semibold">{isAr ? "التخصصات الفرعية" : "Secondary Specialties"}</h3>
        {editUserSpecialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {editUserSpecialties.map((us: any) => (
              <Badge key={us.id} variant="secondary" className="gap-1">
                {isAr ? us.specialties?.name_ar || us.specialties?.name : us.specialties?.name}
                <button onClick={() => onRemoveSpecialty(us.id)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={specSearch}
              onChange={(e) => setSpecSearch(e.target.value)}
              placeholder={isAr ? "ابحث عن تخصص..." : "Search specialties..."}
              className="ps-9 h-9 text-sm"
            />
          </div>
          {(specSearch.trim() || filteredSpecs.length <= 10) && filteredSpecs.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-md border divide-y">
              {filteredSpecs.slice(0, 20).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { onAddSpecialty(s.id); setSpecSearch(""); }}
                  className="w-full text-start px-3 py-2 text-sm hover:bg-accent/50 transition-colors flex items-center justify-between"
                >
                  <span>{isAr ? s.name_ar || s.name : s.name}</span>
                  {s.name_ar && s.name && (
                    <span className="text-xs text-muted-foreground">{isAr ? s.name : s.name_ar}</span>
                  )}
                </button>
              ))}
            </div>
          )}
          {specSearch.trim() && filteredSpecs.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              {isAr ? "لا توجد نتائج" : "No results found"}
            </p>
          )}
        </div>
      </div>
    </>
  );
}