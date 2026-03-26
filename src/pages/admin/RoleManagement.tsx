import { useState, useMemo, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCSVExport } from "@/hooks/useCSVExport";
import { usePermissions, useRolePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Progress } from "@/components/ui/progress";
import {
  Shield, ChefHat, Award, Users, Hand, Heart, Headphones, Eye, Save, Loader2, Lock,
  Search, CheckCircle2, XCircle, Grid3X3, UserCog, ShieldCheck, ShieldOff,
  ChevronDown, ChevronUp, AlertTriangle, Activity, Download, PenTool, Copy,
  RotateCcw, Trash2, Info,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_META: Record<AppRole, { icon: typeof Shield; color: string; labelEn: string; labelAr: string; descEn: string; descAr: string }> = {
  chef: { icon: ChefHat, color: "bg-chart-2/10 text-chart-2", labelEn: "Chef", labelAr: "شيف", descEn: "Professional chefs", descAr: "الطهاة المحترفين" },
  judge: { icon: Award, color: "bg-chart-3/10 text-chart-3", labelEn: "Judge", labelAr: "حَكَم", descEn: "Competition judges", descAr: "حكام المسابقات" },
  student: { icon: Users, color: "bg-primary/10 text-primary", labelEn: "Student", labelAr: "طالب", descEn: "Culinary students", descAr: "طلاب الطهي" },
  organizer: { icon: Shield, color: "bg-destructive/10 text-destructive", labelEn: "Organizer", labelAr: "منظم", descEn: "Event organizers", descAr: "منظمو الفعاليات" },
  volunteer: { icon: Hand, color: "bg-chart-5/10 text-chart-5", labelEn: "Volunteer", labelAr: "متطوع", descEn: "Platform volunteers", descAr: "المتطوعون" },
  sponsor: { icon: Heart, color: "bg-chart-1/10 text-chart-1", labelEn: "Sponsor", labelAr: "راعي", descEn: "Corporate sponsors", descAr: "الرعاة" },
  assistant: { icon: Headphones, color: "bg-accent text-accent-foreground", labelEn: "Assistant", labelAr: "مساعد", descEn: "Support assistants", descAr: "مساعدو الدعم" },
  supervisor: { icon: Eye, color: "bg-chart-4/10 text-chart-4", labelEn: "Supervisor", labelAr: "مشرف", descEn: "Platform supervisors", descAr: "مشرفو المنصة" },
  content_writer: { icon: PenTool, color: "bg-chart-1/10 text-chart-1", labelEn: "Content Writer", labelAr: "كاتب محتوى", descEn: "Content & SEO specialists", descAr: "متخصصو المحتوى والسيو" },
};

const ALL_ROLES: AppRole[] = ["supervisor", "organizer", "content_writer", "judge", "chef", "student", "volunteer", "sponsor", "assistant"];

export default function RoleManagement() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => isAr ? ar : en;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("overview");
  const [activeRole, setActiveRole] = useState<AppRole>("chef");
  const [saving, setSaving] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [lastSyncedRole, setLastSyncedRole] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [matrixSearch, setMatrixSearch] = useState("");
  const [compareRoles, setCompareRoles] = useState<AppRole[]>([]);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [permSearch, setPermSearch] = useState("");

  const { data: permissions = [] } = usePermissions();
  const { data: rolePerms = [], isLoading: rolePermsLoading } = useRolePermissions(activeRole);
  const { data: allRolePerms = [] } = useRolePermissions();

  // Stats
  const { data: roleStats = [] } = useQuery({
    queryKey: ["roleStats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((r) => { counts[r.role] = (counts[r.role] || 0) + 1; });
      return ALL_ROLES.map((role) => ({ role, count: counts[role] || 0 }));
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: recentChanges = [] } = useQuery({
    queryKey: ["roleActivityLog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_actions")
        .select("id, admin_id, action_type, target_user_id, details, created_at")
        .in("action_type", ["assign_role", "remove_role", "change_membership"])
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: activeTab === "activity",
    staleTime: 1000 * 60,
  });

  const { data: usersForAssignment = [], isLoading: usersLoading } = useQuery({
    queryKey: ["usersForRoleAssignment", userSearch],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, username, avatar_url, account_number, email")
        .order("full_name")
        .limit(50);
      if (userSearch.trim()) {
        query = query.or(`full_name.ilike.%${userSearch}%,username.ilike.%${userSearch}%,email.ilike.%${userSearch}%,account_number.ilike.%${userSearch}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      const userIds = data?.map((u) => u.user_id) || [];
      if (userIds.length === 0) return [];
      const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("user_id", userIds);
      return data.map((u) => ({
        ...u,
        roles: (roles?.filter((r) => r.user_id === u.user_id) || []).map((r) => r.role),
      }));
    },
    enabled: activeTab === "users",
    staleTime: 1000 * 30,
  });

  const { data: overrides = [], isLoading: overridesLoading } = useQuery({
    queryKey: ["permissionOverrides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_permission_overrides")
        .select("*, permissions(name, name_ar, code, category)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const userIds = [...new Set(data?.map((o) => o.user_id) || [])];
      if (userIds.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, username, avatar_url")
        .in("user_id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      return data.map((o) => ({ ...o, profile: profileMap.get(o.user_id) }));
    },
    enabled: activeTab === "overrides",
    staleTime: 1000 * 60,
  });

  // Sync selectedPerms
  if (!rolePermsLoading && lastSyncedRole !== activeRole) {
    const ids = new Set(rolePerms.map((rp: any) => rp.permission_id as string));
    setSelectedPerms(ids);
    setLastSyncedRole(activeRole);
  }

  const handleRoleChange = useCallback((role: AppRole) => {
    setActiveRole(role);
    setLastSyncedRole(null);
  }, []);

  const togglePerm = useCallback((permId: string) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId); else next.add(permId);
      return next;
    });
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }, []);

  const selectAllInCategory = useCallback((catPerms: any[]) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      catPerms.forEach((p) => next.add(p.id));
      return next;
    });
  }, []);

  const deselectAllInCategory = useCallback((catPerms: any[]) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      catPerms.forEach((p) => next.delete(p.id));
      return next;
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from("role_permissions").delete().eq("role", activeRole);
      if (selectedPerms.size > 0) {
        const inserts = Array.from(selectedPerms).map((pid) => ({ role: activeRole, permission_id: pid }));
        const { error } = await supabase.from("role_permissions").insert(inserts);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["rolePermissions"] });
      queryClient.invalidateQueries({ queryKey: ["roleStats"] });
      toast({ title: t("Permissions saved successfully", "تم حفظ الصلاحيات بنجاح") });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("Error", "خطأ"), description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const copyPermsFromRole = useCallback((sourceRole: AppRole) => {
    const sourcePerms = allRolePerms.filter((rp: any) => rp.role === sourceRole).map((rp: any) => rp.permission_id as string);
    setSelectedPerms(new Set(sourcePerms));
    toast({ title: t(`Copied permissions from ${ROLE_META[sourceRole].labelEn}`, `تم نسخ الصلاحيات من ${ROLE_META[sourceRole].labelAr}`) });
  }, [allRolePerms, toast, t]);

  const toggleUserRole = useMutation({
    mutationFn: async ({ userId, role, add }: { userId: string; role: AppRole; add: boolean }) => {
      if (add) {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usersForRoleAssignment"] });
      queryClient.invalidateQueries({ queryKey: ["roleStats"] });
      toast({ title: t("Roles updated", "تم تحديث الأدوار") });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: t("Error", "خطأ"), description: err.message });
    },
  });

  const deleteOverride = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_permission_overrides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setConfirmingDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["permissionOverrides"] });
      toast({ title: t("Override removed", "تم حذف الاستثناء") });
    },
  });

  // Group permissions by category
  const grouped = useMemo(() => permissions.reduce<Record<string, typeof permissions>>((acc, p) => {
    const cat = p.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {}), [permissions]);

  // Filtered groups for permissions tab
  const filteredGrouped = useMemo(() => {
    if (!permSearch.trim()) return grouped;
    const result: Record<string, typeof permissions> = {};
    Object.entries(grouped).forEach(([cat, perms]) => {
      const filtered = perms.filter(p =>
        p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(permSearch.toLowerCase()) ||
        (p.name_ar && p.name_ar.includes(permSearch))
      );
      if (filtered.length > 0) result[cat] = filtered;
    });
    return result;
  }, [grouped, permSearch]);

  // Matrix data
  const matrixData = useMemo(() => {
    const rolesToShow = compareRoles.length >= 2 ? compareRoles : ALL_ROLES;
    return Object.entries(grouped).map(([category, perms]) => ({
      category,
      perms: perms
        .filter(p => !matrixSearch || p.name.toLowerCase().includes(matrixSearch.toLowerCase()) || p.code.toLowerCase().includes(matrixSearch.toLowerCase()) || (p.name_ar && p.name_ar.includes(matrixSearch)))
        .map((p) => ({
          ...p,
          roles: rolesToShow.reduce<Record<string, boolean>>((acc, role) => {
            acc[role] = allRolePerms.some((rp: any) => rp.role === role && rp.permission_id === p.id);
            return acc;
          }, {}),
        })),
    })).filter(g => g.perms.length > 0);
  }, [grouped, allRolePerms, matrixSearch, compareRoles]);

  const rolesToShow = compareRoles.length >= 2 ? compareRoles : ALL_ROLES;

  // Security score
  const securityScore = useMemo(() => {
    const totalRoles = ALL_ROLES.length;
    const rolesWithPerms = ALL_ROLES.filter(r => allRolePerms.some((rp: any) => rp.role === r)).length;
    const overrideCount = overrides.length;
    const score = Math.round((rolesWithPerms / totalRoles) * 100) - Math.min(overrideCount * 2, 20);
    return Math.max(0, Math.min(100, score));
  }, [allRolePerms, overrides]);

  const totalPerms = permissions.length;
  const totalUsers = useMemo(() => roleStats.reduce((s, r) => s + r.count, 0), [roleStats]);

  const { exportCSV: exportUsersCSV } = useCSVExport({
    columns: [
      { header: t("Name", "الاسم"), accessor: (u: any) => u.full_name || "" },
      { header: t("Username", "اسم المستخدم"), accessor: (u: any) => u.username || "" },
      { header: t("Email", "البريد"), accessor: (u: any) => u.email || "" },
      { header: t("Account #", "رقم الحساب"), accessor: (u: any) => u.account_number || "" },
      { header: t("Roles", "الأدوار"), accessor: (u: any) => u.roles?.join(", ") || "" },
    ],
    filename: "role-assignments",
  });

  const { exportCSV: exportActivityCSV } = useCSVExport({
    columns: [
      { header: t("Action", "الإجراء"), accessor: (r: any) => r.action_type?.replace(/_/g, " ") || "" },
      { header: t("Details", "التفاصيل"), accessor: (r: any) => r.details ? JSON.stringify(r.details) : "" },
      { header: t("Date", "التاريخ"), accessor: (r: any) => format(new Date(r.created_at), "yyyy-MM-dd HH:mm") },
    ],
    filename: "role-activity-log",
  });

  const exportMatrixCSV = () => {
    const headers = [t("Category", "التصنيف"), t("Permission", "الصلاحية"), t("Code", "الكود"), ...rolesToShow.map(r => ROLE_META[r].labelEn)];
    const rows = matrixData.flatMap(({ category, perms }) =>
      perms.map(p => [category, p.name, p.code, ...rolesToShow.map(r => p.roles[r] ? "✓" : "")])
    );
    const csv = "\uFEFF" + [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `permission-matrix-${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleCompareRole = (role: AppRole) => {
    setCompareRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <AdminPageHeader
        icon={Shield}
        title={t("Roles & Permissions", "الأدوار والصلاحيات")}
        description={t("Full control center for roles, permissions, and overrides", "مركز التحكم الكامل في الأدوار والصلاحيات والاستثناءات")}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={securityScore >= 80 ? "default" : securityScore >= 50 ? "secondary" : "destructive"} className="gap-1.5 px-3 py-1">
              <Shield className="h-3 w-3" />
              {securityScore}% {t("Secure", "أمان")}
            </Badge>
            <Badge variant="outline" className="gap-1.5 px-3 py-1">
              <Lock className="h-3 w-3" />
              {totalPerms} {t("Perms", "صلاحية")}
            </Badge>
            <Badge variant="outline" className="gap-1.5 px-3 py-1">
              <Users className="h-3 w-3" />
              {totalUsers} {t("Assigned", "معيّن")}
            </Badge>
          </div>
        }
      />

      {/* ─── Summary Stats ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
        {roleStats.map(({ role, count }) => {
          const meta = ROLE_META[role];
          const Icon = meta.icon;
          const permCount = allRolePerms.filter((rp: any) => rp.role === role).length;
          const permPercent = totalPerms > 0 ? Math.round((permCount / totalPerms) * 100) : 0;
          return (
            <Card
              key={role}
              className={`rounded-2xl cursor-pointer group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] ${
                activeRole === role && activeTab === "permissions" ? "ring-2 ring-primary border-primary/40" : "border-border/40 hover:border-primary/30"
              }`}
              onClick={() => { setActiveTab("permissions"); handleRoleChange(role); }}
            >
              <CardContent className="p-3 text-center space-y-1">
                <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${meta.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold truncate">{isAr ? meta.labelAr : meta.labelEn}</p>
                <AnimatedCounter value={count} className="text-lg font-bold leading-none" />
                <Progress value={permPercent} className="h-1 mt-1" />
                <p className="text-[10px] text-muted-foreground">{permCount}/{totalPerms}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── Main Tabs ─── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap gap-1 rounded-2xl border border-border/40 bg-muted/30 backdrop-blur p-1.5">
          <TabsTrigger value="overview" className="gap-1.5 text-xs rounded-xl data-[state=active]:shadow-sm">
            <Grid3X3 className="h-3.5 w-3.5" />
            {t("Matrix", "المصفوفة")}
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-1.5 text-xs rounded-xl data-[state=active]:shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("Permissions", "الصلاحيات")}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs rounded-xl data-[state=active]:shadow-sm">
            <UserCog className="h-3.5 w-3.5" />
            {t("Assign Roles", "تعيين الأدوار")}
          </TabsTrigger>
          <TabsTrigger value="overrides" className="gap-1.5 text-xs rounded-xl data-[state=active]:shadow-sm">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t("Overrides", "الاستثناءات")}
            {overrides.length > 0 && <Badge variant="destructive" className="text-[10px] h-4 px-1 ms-1">{overrides.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5 text-xs rounded-xl data-[state=active]:shadow-sm">
            <Activity className="h-3.5 w-3.5" />
            {t("Activity", "سجل النشاط")}
          </TabsTrigger>
        </TabsList>

        {/* ══════════════ MATRIX TAB ══════════════ */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Compare Role Selector */}
          <Card className="rounded-2xl border-border/40">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-medium text-muted-foreground">{t("Compare roles:", "مقارنة الأدوار:")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_ROLES.map(role => {
                    const meta = ROLE_META[role];
                    const Icon = meta.icon;
                    const selected = compareRoles.includes(role);
                    return (
                      <Button key={role} variant={selected ? "default" : "outline"} size="sm"
                        className={`h-7 text-[11px] gap-1 rounded-xl ${!selected ? "opacity-50 hover:opacity-80" : ""}`}
                        onClick={() => toggleCompareRole(role)}>
                        <Icon className="h-3 w-3" />
                        {isAr ? meta.labelAr : meta.labelEn}
                      </Button>
                    );
                  })}
                </div>
                {compareRoles.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1" onClick={() => setCompareRoles([])}>
                    <RotateCcw className="h-3 w-3" /> {t("Reset", "إعادة")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/40">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4 text-primary" />
                  {t("Role-Permission Matrix", "مصفوفة الصلاحيات لكل دور")}
                </CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder={t("Filter...", "بحث...")} value={matrixSearch} onChange={e => setMatrixSearch(e.target.value)} className="ps-8 h-8 w-48 text-xs rounded-xl" />
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl" onClick={exportMatrixCSV}>
                    <Download className="h-3.5 w-3.5" /> CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full" dir="ltr">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky start-0 bg-background z-10 w-[220px]">
                          {t("Permission", "الصلاحية")}
                        </TableHead>
                        {rolesToShow.map((role) => {
                          const meta = ROLE_META[role];
                          const Icon = meta.icon;
                          return (
                            <TableHead key={role} className="text-center w-[85px]">
                              <div className="flex flex-col items-center gap-1">
                                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.color}`}>
                                  <Icon className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-[10px] font-medium">{isAr ? meta.labelAr : meta.labelEn}</span>
                              </div>
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matrixData.map(({ category, perms }) => (
                        <>
                          <TableRow key={`cat-${category}`} className="bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={rolesToShow.length + 1} className="py-1.5">
                              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{category}</span>
                            </TableCell>
                          </TableRow>
                          {perms.map((perm) => (
                            <TableRow key={perm.id} className="hover:bg-muted/20">
                              <TableCell className="sticky start-0 bg-background z-10">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="text-xs cursor-help">{isAr ? perm.name_ar || perm.name : perm.name}</span>
                                    </TooltipTrigger>
                                    <TooltipContent side={isAr ? "left" : "right"}>
                                      <span className="font-mono text-[10px]">{perm.code}</span>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              {rolesToShow.map((role) => (
                                <TableCell key={role} className="text-center">
                                  {perm.roles[role] ? (
                                    <CheckCircle2 className="mx-auto h-4 w-4 text-chart-2" />
                                  ) : (
                                    <XCircle className="mx-auto h-4 w-4 text-muted-foreground/15" />
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════ PERMISSIONS TAB ══════════════ */}
        <TabsContent value="permissions" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {ALL_ROLES.map((role) => {
              const meta = ROLE_META[role];
              const Icon = meta.icon;
              return (
                <Button key={role} variant={activeRole === role ? "default" : "outline"} size="sm"
                  onClick={() => handleRoleChange(role)} className="gap-1.5 text-xs rounded-xl active:scale-[0.98]">
                  <Icon className="h-3.5 w-3.5" />
                  {isAr ? meta.labelAr : meta.labelEn}
                </Button>
              );
            })}
          </div>

          <Card className="rounded-2xl border-border/40">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl p-2.5 ${ROLE_META[activeRole].color}`}>
                    {(() => { const Icon = ROLE_META[activeRole].icon; return <Icon className="h-5 w-5" />; })()}
                  </div>
                  <div>
                    <CardTitle className="text-base">{isAr ? ROLE_META[activeRole].labelAr : ROLE_META[activeRole].labelEn}</CardTitle>
                    <CardDescription className="text-xs">{isAr ? ROLE_META[activeRole].descAr : ROLE_META[activeRole].descEn}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{selectedPerms.size}/{totalPerms}</Badge>
                  {/* Copy from another role */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative group/copy">
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl">
                            <Copy className="h-3.5 w-3.5" /> {t("Copy from", "نسخ من")}
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                          <div className="absolute end-0 top-full mt-1 hidden group-hover/copy:block z-20 bg-popover border rounded-xl shadow-lg p-1 min-w-[140px]">
                            {ALL_ROLES.filter(r => r !== activeRole).map(role => {
                              const meta = ROLE_META[role];
                              const Icon = meta.icon;
                              return (
                                <button key={role} onClick={() => copyPermsFromRole(role)}
                                  className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-lg hover:bg-muted transition-colors text-start">
                                  <Icon className="h-3.5 w-3.5" />
                                  {isAr ? meta.labelAr : meta.labelEn}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{t("Copy permissions from another role", "نسخ الصلاحيات من دور آخر")}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Permission search */}
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder={t("Search permissions...", "ابحث في الصلاحيات...")} value={permSearch} onChange={e => setPermSearch(e.target.value)} className="ps-9 h-8 text-xs rounded-xl" />
              </div>

              {rolePermsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : (
                Object.entries(filteredGrouped).map(([category, perms]) => {
                  const catSelected = perms.filter((p) => selectedPerms.has(p.id)).length;
                  const allSelected = catSelected === perms.length;
                  const isExpanded = expandedCategories.has(category) || catSelected > 0;
                  return (
                    <div key={category} className="rounded-xl border border-border/60 overflow-hidden">
                      <button onClick={() => toggleCategory(category)}
                        className="flex w-full items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-2">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          <h3 className="text-sm font-semibold capitalize">{category}</h3>
                          <Badge variant={catSelected > 0 ? "default" : "outline"} className="text-[10px] h-5">{catSelected}/{perms.length}</Badge>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      {isExpanded && (
                        <div className="border-t px-3 pb-3 pt-2 space-y-2 bg-muted/5">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] rounded-lg"
                              onClick={() => selectAllInCategory(perms)} disabled={allSelected}>
                              {t("Select All", "تحديد الكل")}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] rounded-lg"
                              onClick={() => deselectAllInCategory(perms)} disabled={catSelected === 0}>
                              {t("Deselect All", "إلغاء الكل")}
                            </Button>
                          </div>
                          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                            {perms.map((perm) => (
                              <label key={perm.id}
                                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 transition-all duration-200 hover:bg-muted/50 active:scale-[0.98] ${
                                  selectedPerms.has(perm.id) ? "border-primary/40 bg-primary/5 shadow-sm" : "border-border/40"
                                }`}>
                                <Checkbox checked={selectedPerms.has(perm.id)} onCheckedChange={() => togglePerm(perm.id)} />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium leading-tight">{isAr ? perm.name_ar || perm.name : perm.name}</p>
                                  <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">{perm.code}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={saving} className="gap-1.5 rounded-xl active:scale-[0.98]">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {t("Save Permissions", "حفظ الصلاحيات")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════ USER ASSIGNMENT TAB ══════════════ */}
        <TabsContent value="users" className="mt-4 space-y-4">
          <Card className="rounded-2xl border-border/40">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-primary" />
                    {t("Assign Roles to Users", "تعيين الأدوار للمستخدمين")}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t("Search for a user and assign or remove roles directly", "ابحث عن مستخدم وعيّن أو أزل الأدوار مباشرة")}
                  </CardDescription>
                </div>
                {usersForAssignment.length > 0 && (
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => exportUsersCSV(usersForAssignment)}>
                    <Download className="h-3.5 w-3.5" />{t("Export", "تصدير")}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t("Search by name, email, or account number...", "ابحث بالاسم أو البريد أو رقم الحساب...")}
                  value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="ps-9 rounded-xl" />
              </div>

              {/* Role legend */}
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-muted/20 border border-border/30">
                {ALL_ROLES.map(role => {
                  const meta = ROLE_META[role];
                  const Icon = meta.icon;
                  return (
                    <div key={role} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Icon className="h-3 w-3" />
                      <span>{isAr ? meta.labelAr : meta.labelEn}</span>
                    </div>
                  );
                })}
              </div>

              {usersLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {usersForAssignment.map((user) => (
                      <div key={user.user_id} className="flex items-center gap-3 rounded-xl border border-border/40 p-3 hover:bg-muted/20 transition-colors">
                        <Avatar className="h-9 w-9 rounded-xl">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="text-xs rounded-xl">
                            {(user.full_name || user.username || "?").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{isAr ? user.full_name_ar || user.full_name : user.full_name}</p>
                          <p className="text-[10px] text-muted-foreground" dir="ltr">@{user.username} · {user.account_number}</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {ALL_ROLES.map((role) => {
                            const hasRole = user.roles.includes(role);
                            const meta = ROLE_META[role];
                            const Icon = meta.icon;
                            return (
                              <TooltipProvider key={role}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant={hasRole ? "default" : "outline"} size="sm"
                                      className={`h-7 w-7 p-0 rounded-lg active:scale-[0.98] ${hasRole ? "" : "opacity-25 hover:opacity-60"}`}
                                      onClick={() => toggleUserRole.mutate({ userId: user.user_id, role, add: !hasRole })}
                                      disabled={toggleUserRole.isPending}>
                                      <Icon className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <span className="text-xs">
                                      {hasRole ? t("Remove", "إزالة") : t("Add", "إضافة")} {isAr ? meta.labelAr : meta.labelEn}
                                    </span>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {usersForAssignment.length === 0 && (
                      <div className="flex flex-col items-center py-12 text-muted-foreground">
                        <Search className="h-8 w-8 mb-2 opacity-30" />
                        <p className="text-sm">{t("No results found", "لا توجد نتائج")}</p>
                        <p className="text-xs">{t("Try a different search term", "جرب كلمة بحث مختلفة")}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════ OVERRIDES TAB ══════════════ */}
        <TabsContent value="overrides" className="mt-4">
          <Card className="rounded-2xl border-border/40">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-chart-4" />
                    {t("Permission Overrides", "استثناءات الصلاحيات")}
                    {overrides.length > 0 && <Badge variant="destructive" className="text-[10px]">{overrides.length}</Badge>}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t("Permissions individually granted or revoked from specific users", "صلاحيات مُمنوحة أو مسحوبة من مستخدمين بشكل فردي")}
                  </CardDescription>
                </div>
                {overrides.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-chart-4">
                    <Info className="h-3.5 w-3.5" />
                    {t("Overrides bypass role permissions", "الاستثناءات تتجاوز صلاحيات الدور")}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {overridesLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : overrides.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-muted-foreground">
                  <ShieldCheck className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">{t("No overrides configured", "لا توجد استثناءات حالياً")}</p>
                  <p className="text-xs">{t("All users follow their role permissions", "جميع المستخدمين يتبعون صلاحيات أدوارهم")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {overrides.map((o: any) => (
                    <div key={o.id} className="flex items-center gap-3 rounded-xl border border-border/40 p-3 hover:bg-muted/20 transition-colors">
                      <div className={`rounded-xl p-2 ${o.granted ? "bg-chart-2/10" : "bg-destructive/10"}`}>
                        {o.granted ? <ShieldCheck className="h-4 w-4 text-chart-2" /> : <ShieldOff className="h-4 w-4 text-destructive" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {o.profile ? (isAr ? o.profile.full_name_ar || o.profile.full_name : o.profile.full_name) : t("Unknown", "غير معروف")}
                          {o.profile?.username && <span className="text-muted-foreground text-xs ms-1.5" dir="ltr">@{o.profile.username}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isAr ? o.permissions?.name_ar || o.permissions?.name : o.permissions?.name}
                          <span className="font-mono ms-1.5" dir="ltr">({o.permissions?.code})</span>
                        </p>
                        {o.reason && <p className="text-[10px] text-muted-foreground mt-0.5">{o.reason}</p>}
                        {o.expires_at && (
                          <p className="text-[10px] text-chart-4 mt-0.5">
                            {t("Expires:", "ينتهي:")} {new Date(o.expires_at).toLocaleDateString(isAr ? "ar" : "en")}
                          </p>
                        )}
                      </div>
                      <Badge variant={o.granted ? "default" : "destructive"} className="text-[10px] shrink-0">
                        {o.granted ? t("Granted", "ممنوح") : t("Revoked", "محجوب")}
                      </Badge>
                      {confirmingDeleteId === o.id ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="destructive" size="sm" className="h-7 text-[10px] rounded-lg gap-1"
                            onClick={() => deleteOverride.mutate(o.id)} disabled={deleteOverride.isPending}>
                            {deleteOverride.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            {t("Confirm", "تأكيد")}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() => setConfirmingDeleteId(null)}>
                            {t("Cancel", "إلغاء")}
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg hover:bg-destructive/10"
                          onClick={() => setConfirmingDeleteId(o.id)}>
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════ ACTIVITY LOG TAB ══════════════ */}
        <TabsContent value="activity" className="mt-4">
          <Card className="rounded-2xl border-border/40">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    {t("Role Change Activity Log", "سجل تغييرات الأدوار")}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t("Last 50 role and permission changes", "آخر 50 تغيير في الأدوار والصلاحيات")}
                  </CardDescription>
                </div>
                {recentChanges.length > 0 && (
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => exportActivityCSV(recentChanges)}>
                    <Download className="h-3.5 w-3.5" />{t("Export", "تصدير")}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recentChanges.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-muted-foreground">
                  <Activity className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">{t("No changes recorded", "لا توجد تغييرات")}</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {recentChanges.map((change: any) => (
                      <div key={change.id} className="flex items-center gap-3 rounded-xl border border-border/40 p-3 hover:bg-muted/20 transition-colors">
                        <div className="rounded-xl p-2 bg-primary/10 shrink-0">
                          <Activity className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold capitalize">{change.action_type.replace(/_/g, " ")}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {change.details ? (typeof change.details === "object" ? JSON.stringify(change.details) : change.details) : "—"}
                          </p>
                        </div>
                        <p className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0" dir="ltr">
                          {format(new Date(change.created_at), "MMM d, HH:mm")}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
