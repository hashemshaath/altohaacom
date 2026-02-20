import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
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
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Shield, ChefHat, Award, Users, Hand, Heart, Headphones, Eye, Save, Loader2, Lock,
  Search, UserPlus, UserMinus, CheckCircle2, XCircle, BarChart3, Grid3X3, UserCog,
  ShieldCheck, ShieldOff, ChevronDown, ChevronUp, AlertTriangle, Activity, Download,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_META: Record<AppRole, { icon: typeof Shield; color: string; labelEn: string; labelAr: string; descEn: string; descAr: string }> = {
  chef: { icon: ChefHat, color: "bg-chart-2/10 text-chart-2", labelEn: "Chef", labelAr: "شيف", descEn: "Professional chefs on the platform", descAr: "الطهاة المحترفين على المنصة" },
  judge: { icon: Award, color: "bg-chart-3/10 text-chart-3", labelEn: "Judge", labelAr: "حَكَم", descEn: "Competition judges and evaluators", descAr: "حكام ومقيمو المسابقات" },
  student: { icon: Users, color: "bg-primary/10 text-primary", labelEn: "Student", labelAr: "طالب", descEn: "Culinary students and learners", descAr: "طلاب ومتعلمي الطهي" },
  organizer: { icon: Shield, color: "bg-destructive/10 text-destructive", labelEn: "Organizer", labelAr: "منظم", descEn: "Event and competition organizers", descAr: "منظمو الفعاليات والمسابقات" },
  volunteer: { icon: Hand, color: "bg-chart-5/10 text-chart-5", labelEn: "Volunteer", labelAr: "متطوع", descEn: "Platform volunteers and helpers", descAr: "المتطوعون والمساعدون" },
  sponsor: { icon: Heart, color: "bg-chart-1/10 text-chart-1", labelEn: "Sponsor", labelAr: "راعي", descEn: "Corporate sponsors and partners", descAr: "الرعاة والشركاء" },
  assistant: { icon: Headphones, color: "bg-accent text-accent-foreground", labelEn: "Assistant", labelAr: "مساعد", descEn: "Support assistants", descAr: "مساعدو الدعم" },
  supervisor: { icon: Eye, color: "bg-chart-4/10 text-chart-4", labelEn: "Supervisor", labelAr: "مشرف", descEn: "Full platform supervisors (admin)", descAr: "مشرفو المنصة (مدراء)" },
};

const ALL_ROLES: AppRole[] = ["supervisor", "organizer", "judge", "chef", "student", "volunteer", "sponsor", "assistant"];

export default function RoleManagement() {
  const { language } = useLanguage();
  const isAr = language === "ar";
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

  // Recent role changes for activity log
  const { data: recentChanges = [] } = useQuery({
    queryKey: ["roleActivityLog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_actions")
        .select("*")
        .in("action_type", ["assign_role", "remove_role", "change_membership"])
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: activeTab === "activity",
    staleTime: 1000 * 60,
  });

  // Users with roles for assignment tab
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

  // Permission overrides
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

  // Sync selectedPerms when role data loads
  if (!rolePermsLoading && lastSyncedRole !== activeRole) {
    const ids = new Set(rolePerms.map((rp: any) => rp.permission_id as string));
    setSelectedPerms(ids);
    setLastSyncedRole(activeRole);
  }

  const handleRoleChange = (role: AppRole) => {
    setActiveRole(role);
    setLastSyncedRole(null);
  };

  const togglePerm = (permId: string) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId); else next.add(permId);
      return next;
    });
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const selectAllInCategory = (catPerms: any[]) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      catPerms.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const deselectAllInCategory = (catPerms: any[]) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      catPerms.forEach((p) => next.delete(p.id));
      return next;
    });
  };

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
      toast({ title: isAr ? "تم حفظ الصلاحيات بنجاح" : "Permissions saved successfully" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setSaving(false);
    }
  };

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
      toast({ title: isAr ? "تم تحديث الأدوار" : "Roles updated" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const deleteOverride = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_permission_overrides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissionOverrides"] });
      toast({ title: isAr ? "تم حذف الاستثناء" : "Override removed" });
    },
  });

  // Group permissions by category
  const grouped = permissions.reduce<Record<string, typeof permissions>>((acc, p) => {
    const cat = p.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  // Build matrix data with search filter
  const matrixData = useMemo(() => {
    return Object.entries(grouped).map(([category, perms]) => ({
      category,
      perms: perms
        .filter(p => !matrixSearch || p.name.toLowerCase().includes(matrixSearch.toLowerCase()) || p.code.toLowerCase().includes(matrixSearch.toLowerCase()))
        .map((p) => ({
          ...p,
          roles: ALL_ROLES.reduce<Record<string, boolean>>((acc, role) => {
            acc[role] = allRolePerms.some((rp: any) => rp.role === role && rp.permission_id === p.id);
            return acc;
          }, {}),
        })),
    })).filter(g => g.perms.length > 0);
  }, [grouped, allRolePerms, matrixSearch]);

  // Security score
  const securityScore = useMemo(() => {
    const totalRoles = ALL_ROLES.length;
    const rolesWithPerms = ALL_ROLES.filter(r => allRolePerms.some((rp: any) => rp.role === r)).length;
    const overrideCount = overrides.length;
    const score = Math.round((rolesWithPerms / totalRoles) * 100) - Math.min(overrideCount * 2, 20);
    return Math.max(0, Math.min(100, score));
  }, [allRolePerms, overrides]);

  const totalPerms = permissions.length;

  const exportMatrixCSV = () => {
    const headers = ["Category", "Permission", "Code", ...ALL_ROLES.map(r => ROLE_META[r].labelEn)];
    const rows = matrixData.flatMap(({ category, perms }) =>
      perms.map(p => [category, p.name, p.code, ...ALL_ROLES.map(r => p.roles[r] ? "✓" : "")])
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Shield}
        title={isAr ? "الأدوار والصلاحيات" : "Roles & Permissions"}
        description={isAr ? "مركز التحكم الكامل في الأدوار والصلاحيات والاستثناءات" : "Full control center for roles, permissions, and overrides"}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={securityScore >= 80 ? "default" : securityScore >= 50 ? "secondary" : "destructive"} className="gap-1">
              <Shield className="h-3 w-3" />
              {securityScore}% {isAr ? "أمان" : "Secure"}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Lock className="h-3 w-3" />
              {totalPerms} {isAr ? "صلاحية" : "Perms"}
            </Badge>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {roleStats.map(({ role, count }) => {
          const meta = ROLE_META[role];
          const Icon = meta.icon;
          const permCount = allRolePerms.filter((rp: any) => rp.role === role).length;
          return (
            <Card key={role} className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
              onClick={() => { setActiveTab("permissions"); handleRoleChange(role); }}>
              <CardContent className="p-3 text-center">
                <div className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${meta.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium truncate">{isAr ? meta.labelAr : meta.labelEn}</p>
                <p className="text-lg font-bold">{count}</p>
                <p className="text-[10px] text-muted-foreground">{permCount}/{totalPerms} {isAr ? "صلاحية" : "perms"}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap gap-1">
          <TabsTrigger value="overview" className="gap-1.5 text-xs">
            <Grid3X3 className="h-3.5 w-3.5" />
            {isAr ? "المصفوفة" : "Matrix"}
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-1.5 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            {isAr ? "الصلاحيات" : "Permissions"}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs">
            <UserCog className="h-3.5 w-3.5" />
            {isAr ? "تعيين الأدوار" : "Assign Roles"}
          </TabsTrigger>
          <TabsTrigger value="overrides" className="gap-1.5 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            {isAr ? "الاستثناءات" : "Overrides"}
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5 text-xs">
            <Activity className="h-3.5 w-3.5" />
            {isAr ? "سجل النشاط" : "Activity"}
          </TabsTrigger>
        </TabsList>

        {/* ─── MATRIX TAB ─── */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4 text-primary" />
                  {isAr ? "مصفوفة الصلاحيات لكل دور" : "Role-Permission Matrix"}
                </CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder={isAr ? "بحث..." : "Filter..."} value={matrixSearch} onChange={e => setMatrixSearch(e.target.value)} className="ps-8 h-8 w-48 text-xs" />
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={exportMatrixCSV}>
                    <Download className="h-3.5 w-3.5" /> CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background z-10 w-[200px]">
                          {isAr ? "الصلاحية" : "Permission"}
                        </TableHead>
                        {ALL_ROLES.map((role) => {
                          const meta = ROLE_META[role];
                          const Icon = meta.icon;
                          return (
                            <TableHead key={role} className="text-center w-[80px]">
                              <div className="flex flex-col items-center gap-1">
                                <Icon className="h-3.5 w-3.5" />
                                <span className="text-[10px]">{isAr ? meta.labelAr : meta.labelEn}</span>
                              </div>
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matrixData.map(({ category, perms }) => (
                        <>
                          <TableRow key={category} className="bg-muted/30">
                            <TableCell colSpan={ALL_ROLES.length + 1} className="py-1.5">
                              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {category}
                              </span>
                            </TableCell>
                          </TableRow>
                          {perms.map((perm) => (
                            <TableRow key={perm.id} className="hover:bg-muted/20">
                              <TableCell className="sticky left-0 bg-background z-10">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="text-xs cursor-help">
                                        {isAr ? perm.name_ar || perm.name : perm.name}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent><span className="font-mono text-[10px]">{perm.code}</span></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              {ALL_ROLES.map((role) => (
                                <TableCell key={role} className="text-center">
                                  {perm.roles[role] ? (
                                    <CheckCircle2 className="mx-auto h-4 w-4 text-chart-2" />
                                  ) : (
                                    <XCircle className="mx-auto h-4 w-4 text-muted-foreground/20" />
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

        {/* ─── PERMISSIONS TAB ─── */}
        <TabsContent value="permissions" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {ALL_ROLES.map((role) => {
              const meta = ROLE_META[role];
              const Icon = meta.icon;
              return (
                <Button key={role} variant={activeRole === role ? "default" : "outline"} size="sm"
                  onClick={() => handleRoleChange(role)} className="gap-1.5 text-xs">
                  <Icon className="h-3.5 w-3.5" />
                  {isAr ? meta.labelAr : meta.labelEn}
                </Button>
              );
            })}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${ROLE_META[activeRole].color}`}>
                    {(() => { const Icon = ROLE_META[activeRole].icon; return <Icon className="h-5 w-5" />; })()}
                  </div>
                  <div>
                    <CardTitle>{isAr ? ROLE_META[activeRole].labelAr : ROLE_META[activeRole].labelEn}</CardTitle>
                    <CardDescription className="text-xs">
                      {isAr ? ROLE_META[activeRole].descAr : ROLE_META[activeRole].descEn}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">{selectedPerms.size}/{totalPerms}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {rolePermsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                Object.entries(grouped).map(([category, perms]) => {
                  const catSelected = perms.filter((p) => selectedPerms.has(p.id)).length;
                  const allSelected = catSelected === perms.length;
                  const isExpanded = expandedCategories.has(category) || catSelected > 0;
                  return (
                    <div key={category} className="rounded-lg border">
                      <button onClick={() => toggleCategory(category)}
                        className="flex w-full items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-2">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          <h3 className="text-sm font-semibold capitalize">{category}</h3>
                          <Badge variant="outline" className="text-[10px] h-5">{catSelected}/{perms.length}</Badge>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {isExpanded && (
                        <div className="border-t px-3 pb-3 pt-2 space-y-2">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="h-6 text-[10px]"
                              onClick={() => selectAllInCategory(perms)} disabled={allSelected}>
                              {isAr ? "تحديد الكل" : "Select All"}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px]"
                              onClick={() => deselectAllInCategory(perms)} disabled={catSelected === 0}>
                              {isAr ? "إلغاء الكل" : "Deselect All"}
                            </Button>
                          </div>
                          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                            {perms.map((perm) => (
                              <label key={perm.id}
                                className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 transition-colors hover:bg-muted/50 ${
                                  selectedPerms.has(perm.id) ? "border-primary/40 bg-primary/5" : ""
                                }`}>
                                <Checkbox checked={selectedPerms.has(perm.id)} onCheckedChange={() => togglePerm(perm.id)} />
                                <div className="min-w-0">
                                  <p className="text-xs font-medium leading-tight">{isAr ? perm.name_ar || perm.name : perm.name}</p>
                                  <p className="text-[10px] text-muted-foreground font-mono">{perm.code}</p>
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
                <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {isAr ? "حفظ الصلاحيات" : "Save Permissions"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── USER ASSIGNMENT TAB ─── */}
        <TabsContent value="users" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserCog className="h-4 w-4 text-primary" />
                {isAr ? "تعيين الأدوار للمستخدمين" : "Assign Roles to Users"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr ? "ابحث عن مستخدم وعيّن أو أزل الأدوار مباشرة" : "Search for a user and assign or remove roles directly"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={isAr ? "ابحث بالاسم أو البريد أو رقم الحساب..." : "Search by name, email, or account number..."}
                  value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="ps-9" />
              </div>
              {usersLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {usersForAssignment.map((user) => (
                      <div key={user.user_id} className="flex items-center gap-3 rounded-lg border p-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {(user.full_name || user.username || "?").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{isAr ? user.full_name_ar || user.full_name : user.full_name}</p>
                          <p className="text-[10px] text-muted-foreground">@{user.username} · {user.account_number}</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {ALL_ROLES.map((role) => {
                            const hasRole = user.roles.includes(role);
                            const meta = ROLE_META[role];
                            return (
                              <TooltipProvider key={role}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant={hasRole ? "default" : "outline"} size="sm"
                                      className={`h-6 w-6 p-0 ${hasRole ? "" : "opacity-30 hover:opacity-70"}`}
                                      onClick={() => toggleUserRole.mutate({ userId: user.user_id, role, add: !hasRole })}
                                      disabled={toggleUserRole.isPending}>
                                      {(() => { const Icon = meta.icon; return <Icon className="h-3 w-3" />; })()}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <span className="text-xs">
                                      {hasRole ? (isAr ? "إزالة" : "Remove") : (isAr ? "إضافة" : "Add")} {isAr ? meta.labelAr : meta.labelEn}
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
                      <p className="text-center text-sm text-muted-foreground py-8">{isAr ? "لا توجد نتائج" : "No results found"}</p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── OVERRIDES TAB ─── */}
        <TabsContent value="overrides" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-chart-4" />
                {isAr ? "استثناءات الصلاحيات" : "Permission Overrides"}
                {overrides.length > 0 && <Badge variant="destructive" className="text-[10px]">{overrides.length}</Badge>}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr ? "صلاحيات مُمنوحة أو مسحوبة من مستخدمين بشكل فردي" : "Permissions individually granted or revoked from specific users"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overridesLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : overrides.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">{isAr ? "لا توجد استثناءات حالياً" : "No overrides currently configured"}</p>
              ) : (
                <div className="space-y-2">
                  {overrides.map((o: any) => (
                    <div key={o.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className={`rounded-full p-1.5 ${o.granted ? "bg-chart-2/10" : "bg-destructive/10"}`}>
                        {o.granted ? <ShieldCheck className="h-4 w-4 text-chart-2" /> : <ShieldOff className="h-4 w-4 text-destructive" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {o.profile ? (isAr ? o.profile.full_name_ar || o.profile.full_name : o.profile.full_name) : "Unknown"}
                          {o.profile?.username && <span className="text-muted-foreground text-xs ml-1">@{o.profile.username}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isAr ? o.permissions?.name_ar || o.permissions?.name : o.permissions?.name}
                          <span className="font-mono ml-1">({o.permissions?.code})</span>
                        </p>
                        {o.reason && <p className="text-[10px] text-muted-foreground mt-0.5">{o.reason}</p>}
                        {o.expires_at && (
                          <p className="text-[10px] text-chart-4 mt-0.5">
                            {isAr ? "ينتهي:" : "Expires:"} {new Date(o.expires_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge variant={o.granted ? "default" : "destructive"} className="text-[10px]">
                        {o.granted ? (isAr ? "ممنوح" : "Granted") : (isAr ? "محجوب" : "Revoked")}
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                        onClick={() => deleteOverride.mutate(o.id)} disabled={deleteOverride.isPending}>
                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── ACTIVITY LOG TAB ─── */}
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                {isAr ? "سجل تغييرات الأدوار" : "Role Change Activity Log"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr ? "آخر 50 تغيير في الأدوار والصلاحيات" : "Last 50 role and permission changes"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentChanges.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">{isAr ? "لا توجد تغييرات" : "No changes recorded"}</p>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {recentChanges.map((change: any) => (
                      <div key={change.id} className="flex items-center gap-3 rounded-lg border p-3">
                        <div className="rounded-full p-1.5 bg-primary/10">
                          <Activity className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{change.action_type.replace(/_/g, " ")}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {change.details ? JSON.stringify(change.details) : "—"}
                          </p>
                        </div>
                        <p className="text-[10px] text-muted-foreground whitespace-nowrap">
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