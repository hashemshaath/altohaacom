import { memo, useState, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useApprovedSpecialties, useUserSpecialties } from "@/hooks/useSpecialties";
import { useFollowStats } from "@/hooks/useFollow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { UserPersonalDetailsTab } from "@/components/admin/UserPersonalDetailsTab";
import { UserCareerTimeline } from "@/components/admin/UserCareerTimeline";
import { UserModificationHistory } from "@/components/admin/UserModificationHistory";
import { UserBioOptimizer } from "@/components/admin/UserBioOptimizer";
import { TranslatableInput } from "@/components/profile/edit/TranslatableInput";
import {
  Edit, UserCircle, Users, Briefcase, History, ImageIcon, X, Save,
  Loader2, Upload, Camera, KeyRound, Mail, AlertCircle,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AccountStatus = Database["public"]["Enums"]["account_status"];
type AccountType = Database["public"]["Enums"]["account_type"];
type AppRole = Database["public"]["Enums"]["app_role"];
type MembershipTier = Database["public"]["Enums"]["membership_tier"];

const ALL_ROLES: AppRole[] = ["chef", "judge", "student", "organizer", "content_writer", "volunteer", "sponsor", "assistant", "supervisor", "admin" as unknown as AppRole];

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  full_name_ar?: string | null;
  display_name?: string | null;
  display_name_ar?: string | null;
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
  city?: string | null;
  specialization: string | null;
  specialization_ar?: string | null;
  bio?: string | null;
  bio_ar?: string | null;
  is_verified: boolean | null;
  email: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  preferred_language?: string | null;
  nationality?: string | null;
  roles?: { role: AppRole }[];
}

interface UserEditPanelProps {
  user: UserProfile;
  onClose: () => void;
  onResetPassword: (userId: string, name: string) => void;
  onInvite: (email: string) => void;
}

export const UserEditPanel = memo(function UserEditPanel({ user: editingUser, onClose, onResetPassword, onInvite }: UserEditPanelProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [editTab, setEditTab] = useState("profile");
  const [editRoles, setEditRoles] = useState<AppRole[]>(editingUser.roles?.map((r) => r.role) || []);
  const [editMembership, setEditMembership] = useState<MembershipTier>(editingUser.membership_tier || "basic");
  const [editStatus, setEditStatus] = useState<AccountStatus>(editingUser.account_status || "pending");
  const [editVerified, setEditVerified] = useState(editingUser.is_verified || false);
  const [editFullName, setEditFullName] = useState(editingUser.full_name || "");
  const [editDisplayName, setEditDisplayName] = useState(editingUser.display_name || "");
  const [editUsername, setEditUsername] = useState(editingUser.username || "");
  const [editEmail] = useState(editingUser.email || "");
  const [editPhone, setEditPhone] = useState(editingUser.phone || "");
  const [editBio, setEditBio] = useState(editingUser.bio || "");
  const [editBioAr, setEditBioAr] = useState(editingUser.bio_ar || "");
  const [editCountryCode, setEditCountryCode] = useState(editingUser.country_code || "");
  const [editCity, setEditCity] = useState(editingUser.city || "");
  const [editSpecialization, setEditSpecialization] = useState(editingUser.specialization || "");
  const [editSpecializationAr, setEditSpecializationAr] = useState(editingUser.specialization_ar || "");
  const [editFullNameAr, setEditFullNameAr] = useState(editingUser.full_name_ar || "");
  const [editDisplayNameAr, setEditDisplayNameAr] = useState(editingUser.display_name_ar || "");
  const [editPersonal, setEditPersonal] = useState({
    dateOfBirth: editingUser.date_of_birth || "",
    gender: editingUser.gender || "",
    preferredLanguage: editingUser.preferred_language || "",
    nationality: editingUser.nationality || "",
  });
  const [usernameError, setUsernameError] = useState("");
  const [usernameChecking, setUsernameChecking] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { data: approvedSpecialties = [] } = useApprovedSpecialties();
  const { data: editUserSpecialties = [], refetch: refetchUserSpecialties } = useUserSpecialties(editingUser.user_id);
  const { data: editFollowStats } = useFollowStats(editingUser.user_id);

  const editUserSpecialtyIds = new Set(editUserSpecialties.map((us) => us.specialty_id));

  const validateUsername = async (username: string) => {
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
      const { data } = await supabase.from("profiles").select("user_id").eq("username", username.toLowerCase()).neq("user_id", editingUser.user_id).maybeSingle();
      if (data) { setUsernameError(isAr ? "اسم المستخدم مأخوذ بالفعل" : "Username is already taken"); return false; }
      setUsernameError("");
      return true;
    } finally { setUsernameChecking(false); }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error } = await supabase.from("profiles").update(updates).eq("user_id", editingUser.user_id);
      if (error) throw error;
      await supabase.from("admin_actions").insert([{ admin_id: user!.id, target_user_id: editingUser.user_id, action_type: "update_profile", details: updates as Record<string, unknown> as Database["public"]["Tables"]["admin_actions"]["Insert"]["details"] }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: isAr ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully" });
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e instanceof Error ? e.message : String(e) }),
  });

  const updateRolesMutation = useMutation({
    mutationFn: async (roles: AppRole[]) => {
      const { data: existingRoles } = await supabase.from("user_roles").select("role").eq("user_id", editingUser.user_id);
      const existingSet = new Set(existingRoles?.map((r) => r.role) || []);
      const newSet = new Set(roles);
      const toDelete = [...existingSet].filter((r) => !newSet.has(r as AppRole));
      if (toDelete.length > 0) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", editingUser.user_id).in("role", toDelete);
        if (error) throw error;
      }
      const toInsert = [...newSet].filter((r) => !existingSet.has(r));
      if (toInsert.length > 0) {
        const { error } = await supabase.from("user_roles").insert(toInsert.map((role) => ({ user_id: editingUser.user_id, role })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: isAr ? "تم تحديث الأدوار" : "Roles updated" });
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e instanceof Error ? e.message : String(e) }),
  });

  const uploadMediaMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: "avatar" | "cover" }) => {
      const ext = file.name.split(".").pop();
      const path = `${editingUser.user_id}/${type}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("user-media").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("user-media").getPublicUrl(path);
      const updateField = type === "avatar" ? "avatar_url" : "cover_image_url";
      const { error: updateError } = await supabase.from("profiles").update({ [updateField]: publicUrl }).eq("user_id", editingUser.user_id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: isAr ? "تم رفع الصورة" : "Image uploaded" });
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e instanceof Error ? e.message : String(e) }),
  });

  const addSpecialtyMutation = useMutation({
    mutationFn: async (specialtyId: string) => {
      const { error } = await supabase.from("user_specialties").insert({ user_id: editingUser.user_id, specialty_id: specialtyId });
      if (error) throw error;
    },
    onSuccess: () => { refetchUserSpecialties(); toast({ title: isAr ? "تمت الإضافة" : "Added" }); },
    onError: (e) => toast({ variant: "destructive", title: "Error", description: e instanceof Error ? e.message : String(e) }),
  });

  const removeSpecialtyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_specialties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { refetchUserSpecialties(); toast({ title: isAr ? "تمت الإزالة" : "Removed" }); },
    onError: (e) => toast({ variant: "destructive", title: "Error", description: e instanceof Error ? e.message : String(e) }),
  });

  const handleFileUpload = (file: File, type: "avatar" | "cover") => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: isAr ? "الملف كبير جداً" : "File too large" });
      return;
    }
    uploadMediaMutation.mutate({ file, type });
  };

  const toggleRole = (role: AppRole) => {
    setEditRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);
  };

  const handleSave = async () => {
    if (editUsername) {
      const valid = await validateUsername(editUsername);
      if (!valid) return;
    }
    await updateProfileMutation.mutateAsync({
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
    });
    await updateRolesMutation.mutateAsync(editRoles);
    onClose();
  };

  const isSaving = updateProfileMutation.isPending || updateRolesMutation.isPending;
  const statusBadge = (status: AccountStatus | null) => {
    const cfg: Record<AccountStatus, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      active: { variant: "default", label: isAr ? "نشط" : "Active" },
      pending: { variant: "secondary", label: isAr ? "معلق" : "Pending" },
      suspended: { variant: "destructive", label: isAr ? "موقوف" : "Suspended" },
      banned: { variant: "destructive", label: isAr ? "محظور" : "Banned" },
    };
    const c = cfg[status || "pending"];
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <Card className="border-primary/20 shadow-lg shadow-primary/5 rounded-2xl animate-in fade-in-0 slide-in-from-top-2 duration-300" dir={isAr ? "rtl" : "ltr"}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border-2 border-primary/20 ring-2 ring-primary/10 ring-offset-2 ring-offset-background">
              <AvatarImage src={editingUser.avatar_url || undefined} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">{(editingUser.full_name || "U")[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {isAr ? (editingUser.display_name_ar || editingUser.full_name_ar || editingUser.full_name) : (editingUser.display_name || editingUser.full_name || "Unknown")}
                {statusBadge(editingUser.account_status)}
                {editingUser.is_verified && <Badge variant="outline" className="text-[12px] border-primary/30 text-primary">✓ {isAr ? "موثق" : "Verified"}</Badge>}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded-md" dir="ltr">{editingUser.account_number}</span>
                <span className="mx-1.5">·</span><span dir="ltr">@{editingUser.username}</span>
                <span className="mx-1.5">·</span><span dir="ltr">{editingUser.email}</span>
              </p>
              {editFollowStats && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span className="font-medium">{editFollowStats.followers}</span> {isAr ? "متابع" : "followers"}
                  <span className="mx-1">·</span>
                  <span className="font-medium">{editFollowStats.following}</span> {isAr ? "يتابع" : "following"}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-destructive/10 hover:text-destructive">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={editTab} onValueChange={setEditTab}>
          <TabsList className="mb-4 flex-wrap rounded-2xl border border-border/40 bg-muted/30 backdrop-blur p-1.5 h-auto">
            <TabsTrigger value="profile" className="gap-1.5"><Edit className="h-3.5 w-3.5" />{isAr ? "الملف" : "Profile"}</TabsTrigger>
            <TabsTrigger value="personal" className="gap-1.5"><UserCircle className="h-3.5 w-3.5" />{isAr ? "شخصي" : "Personal"}</TabsTrigger>
            <TabsTrigger value="roles" className="gap-1.5"><Users className="h-3.5 w-3.5" />{isAr ? "الأدوار" : "Roles"}</TabsTrigger>
            <TabsTrigger value="media" className="gap-1.5"><ImageIcon className="h-3.5 w-3.5" />{isAr ? "الوسائط" : "Media"}</TabsTrigger>
            <TabsTrigger value="career" className="gap-1.5"><Briefcase className="h-3.5 w-3.5" />{isAr ? "المهني" : "Career"}</TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5"><History className="h-3.5 w-3.5" />{isAr ? "السجل" : "History"}</TabsTrigger>
          </TabsList>

          {/* ── Profile Tab ────── */}
          <TabsContent value="profile" className="space-y-5">
            {/* Name & Identity - Arabic first */}
            <div className="rounded-xl border p-4 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><UserCircle className="h-4 w-4" />{isAr ? "الاسم والهوية" : "Name & Identity"}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <TranslatableInput
                  label={isAr ? "الاسم الكامل (عربي)" : "Full Name (AR)"}
                  value={editFullNameAr}
                  onChange={setEditFullNameAr}
                  dir="rtl"
                  pairedValue={editFullName}
                  onTranslated={setEditFullName}
                  lang="ar"
                  placeholder={isAr ? "الاسم بالعربية" : "Name in Arabic"}
                  fieldType="title"
                />
                <TranslatableInput
                  label={isAr ? "الاسم الكامل (إنجليزي)" : "Full Name (EN)"}
                  value={editFullName}
                  onChange={setEditFullName}
                  dir="ltr"
                  pairedValue={editFullNameAr}
                  onTranslated={setEditFullNameAr}
                  lang="en"
                  placeholder="Full name in English"
                  fieldType="title"
                />
                <TranslatableInput
                  label={isAr ? "الاسم المعروض (عربي)" : "Display Name (AR)"}
                  value={editDisplayNameAr}
                  onChange={setEditDisplayNameAr}
                  dir="rtl"
                  pairedValue={editDisplayName}
                  onTranslated={setEditDisplayName}
                  lang="ar"
                  placeholder={isAr ? "الاسم المعروض بالعربية" : "Display name in Arabic"}
                  fieldType="title"
                />
                <TranslatableInput
                  label={isAr ? "الاسم المعروض (إنجليزي)" : "Display Name (EN)"}
                  value={editDisplayName}
                  onChange={setEditDisplayName}
                  dir="ltr"
                  pairedValue={editDisplayNameAr}
                  onTranslated={setEditDisplayNameAr}
                  lang="en"
                  placeholder="Display name in English"
                  fieldType="title"
                />
              </div>
            </div>

            {/* Account Details */}
            <div className="rounded-xl border p-4 space-y-4">
              <h3 className="text-sm font-semibold">{isAr ? "بيانات الحساب" : "Account Details"}</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{isAr ? "اسم المستخدم" : "Username"}</Label>
                  <div className="relative">
                    <Input value={editUsername} onChange={(e) => { setEditUsername(e.target.value); setUsernameError(""); }} onBlur={() => editUsername && validateUsername(editUsername)} dir="ltr" className={usernameError ? "border-destructive" : ""} />
                    {usernameChecking && <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  {usernameError && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{usernameError}</p>}
                </div>
                <div className="space-y-2"><Label>{isAr ? "البريد" : "Email"}</Label><Input value={editEmail} disabled dir="ltr" className="opacity-60" /></div>
                <div className="space-y-2"><Label>{isAr ? "الهاتف" : "Phone"}</Label><Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} dir="ltr" placeholder="+966..." /></div>
              </div>
            </div>

            {/* Location */}
            <div className="rounded-xl border p-4 space-y-4">
              <h3 className="text-sm font-semibold">{isAr ? "الموقع" : "Location"}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <CountrySelector value={editCountryCode} onChange={setEditCountryCode} label={isAr ? "الدولة" : "Country"} />
                <div className="space-y-1.5"><Label className="text-xs">{isAr ? "المدينة" : "City"}</Label><Input value={editCity} onChange={(e) => setEditCity(e.target.value)} /></div>
              </div>
            </div>

            {/* Biography - Arabic first */}
            <div className="rounded-xl border p-4 space-y-3">
              <h3 className="text-sm font-semibold">{isAr ? "النبذة التعريفية" : "Biography"}</h3>
              <UserBioOptimizer bio={editBioAr} onBioChange={setEditBioAr} lang="ar" onTranslatedBioChange={setEditBio} />
              <Separator />
              <UserBioOptimizer bio={editBio} onBioChange={setEditBio} lang="en" onTranslatedBioChange={setEditBioAr} />
            </div>

            {/* Specialization - Arabic first */}
            <div className="rounded-xl border p-4 space-y-4">
              <h3 className="text-sm font-semibold">{isAr ? "التخصص" : "Specialization"}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <TranslatableInput
                  label={isAr ? "التخصص (عربي)" : "Specialization (AR)"}
                  value={editSpecializationAr}
                  onChange={setEditSpecializationAr}
                  dir="rtl"
                  pairedValue={editSpecialization}
                  onTranslated={setEditSpecialization}
                  lang="ar"
                  placeholder={isAr ? "التخصص بالعربية" : "Specialization in Arabic"}
                  fieldType="title"
                />
                <TranslatableInput
                  label={isAr ? "التخصص (إنجليزي)" : "Specialization (EN)"}
                  value={editSpecialization}
                  onChange={setEditSpecialization}
                  dir="ltr"
                  pairedValue={editSpecializationAr}
                  onTranslated={setEditSpecializationAr}
                  lang="en"
                  placeholder="Specialization in English"
                  fieldType="title"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="personal" className="space-y-4">
            <UserPersonalDetailsTab form={editPersonal} onChange={(u) => setEditPersonal((p) => ({ ...p, ...u }))} isAr={isAr} />
          </TabsContent>

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
                <Label>{isAr ? "العضوية" : "Membership"}</Label>
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
              <Checkbox id="verified-edit" checked={editVerified} onCheckedChange={(c) => setEditVerified(!!c)} />
              <Label htmlFor="verified-edit" className="cursor-pointer">{isAr ? "حساب موثق" : "Verified Account"}</Label>
            </div>
            <div className="space-y-3">
              <Label>{isAr ? "الأدوار" : "Roles"}</Label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {ALL_ROLES.map((role) => (
                  <div key={role} onClick={() => toggleRole(role)} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 transition-all duration-200 hover:shadow-sm active:scale-[0.98] touch-manipulation ${editRoles.includes(role) ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40"}`}>
                    <Checkbox checked={editRoles.includes(role)} onCheckedChange={() => toggleRole(role)} />
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- role enum not in i18n keys */}
                    <span className="text-sm capitalize">{t(role as any)}</span>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onResetPassword(editingUser.user_id, editingUser.full_name || "")}>
                <KeyRound className="me-2 h-4 w-4" />{isAr ? "إعادة تعيين كلمة المرور" : "Reset Password"}
              </Button>
              {editingUser.email && (
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onInvite(editingUser.email || "")}>
                  <Mail className="me-2 h-4 w-4" />{isAr ? "إرسال دعوة تفعيل" : "Send Activation"}
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "avatar")} />
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "cover")} />
            <div className="space-y-2">
              <Label>{isAr ? "صورة الغلاف" : "Cover Image"}</Label>
              <div className="relative rounded-xl border overflow-hidden h-40 bg-muted/30 group cursor-pointer" onClick={() => coverInputRef.current?.click()}>
                {editingUser.cover_image_url ? <img src={editingUser.cover_image_url} alt="Cover" className="w-full h-full object-cover" loading="lazy" /> : <div className="flex items-center justify-center h-full"><ImageIcon className="h-8 w-8 text-muted-foreground/40" /></div>}
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center"><div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-full p-2"><Upload className="h-5 w-5" /></div></div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "صورة الملف الشخصي" : "Profile Photo"}</Label>
              <div className="flex items-center gap-4">
                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <Avatar className="h-24 w-24 border-2 border-border"><AvatarImage src={editingUser.avatar_url || undefined} /><AvatarFallback className="text-2xl">{(editingUser.full_name || "U")[0].toUpperCase()}</AvatarFallback></Avatar>
                  <div className="absolute inset-0 rounded-full bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center"><Camera className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-background" /></div>
                </div>
                <div>
                  <Button variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()}><Upload className="me-2 h-4 w-4" />{isAr ? "رفع صورة" : "Upload"}</Button>
                  <p className="text-xs text-muted-foreground mt-1">{isAr ? "JPG, PNG بحد أقصى 5MB" : "JPG, PNG up to 5MB"}</p>
                </div>
              </div>
            </div>
            {uploadMediaMutation.isPending && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{isAr ? "جاري الرفع..." : "Uploading..."}</div>}
          </TabsContent>

          <TabsContent value="career"><UserCareerTimeline userId={editingUser.user_id} isAr={isAr} /></TabsContent>
          <TabsContent value="history"><UserModificationHistory userId={editingUser.user_id} isAr={isAr} /></TabsContent>
        </Tabs>

        {/* Save bar */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/60">
          <Button variant="outline" onClick={onClose} className="rounded-xl">{isAr ? "إلغاء" : "Cancel"}</Button>
          <Button onClick={handleSave} disabled={isSaving || !!usernameError} className="rounded-xl gap-2 min-w-[140px]">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isAr ? "حفظ جميع التغييرات" : "Save All Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
