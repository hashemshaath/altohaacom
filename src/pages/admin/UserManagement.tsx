import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  MoreHorizontal, 
  UserX, 
  UserCheck, 
  Eye, 
  Shield, 
  Ban, 
  CreditCard,
  Trash2,
  Edit,
  ChevronRight,
  ChevronLeft,
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
  roles?: { role: AppRole }[];
}

export default function UserManagement() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Edit user dialog state
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editRoles, setEditRoles] = useState<AppRole[]>([]);
  const [editMembership, setEditMembership] = useState<MembershipTier>("basic");
  const [editStatus, setEditStatus] = useState<AccountStatus>("active");
  const [editVerified, setEditVerified] = useState(false);

  // Fetch users with their roles
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["adminUsers", searchQuery, roleFilter, statusFilter, page],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(`
          id,
          user_id,
          full_name,
          username,
          account_number,
          account_status,
          membership_tier,
          avatar_url,
          created_at,
          location,
          specialization,
          is_verified
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%,account_number.ilike.%${searchQuery}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("account_status", statusFilter as AccountStatus);
      }

      const { data: profiles, error, count } = await query;
      if (error) throw error;

      // Fetch roles for each user
      const userIds = profiles?.map(p => p.user_id) || [];
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      // Merge roles with profiles
      const users = profiles?.map(profile => ({
        ...profile,
        roles: roles?.filter(r => r.user_id === profile.user_id) || [],
      })) as UserProfile[];

      return { users, totalCount: count || 0 };
    },
  });

  // Filter by role client-side
  const filteredUsers = usersData?.users?.filter(u => {
    if (roleFilter === "all") return true;
    return u.roles?.some(r => r.role === roleFilter);
  });

  const totalPages = Math.ceil((usersData?.totalCount || 0) / pageSize);

  // Update user status mutation
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

      await supabase.from("admin_actions").insert({
        admin_id: user!.id,
        target_user_id: userId,
        action_type: `${newStatus}_user`,
        details: { reason },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: language === "ar" ? "تم تحديث الحالة" : "Status updated" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  // Update user roles mutation
  const updateRolesMutation = useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: AppRole[] }) => {
      // Delete existing roles
      await supabase.from("user_roles").delete().eq("user_id", userId);
      
      // Insert new roles
      if (roles.length > 0) {
        const roleInserts = roles.map(role => ({ user_id: userId, role }));
        const { error } = await supabase.from("user_roles").insert(roleInserts);
        if (error) throw error;
      }

      await supabase.from("admin_actions").insert({
        admin_id: user!.id,
        target_user_id: userId,
        action_type: "update_roles",
        details: { roles },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: language === "ar" ? "تم تحديث الأدوار" : "Roles updated" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  // Update user profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<UserProfile> }) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", userId);

      if (error) throw error;

      await supabase.from("admin_actions").insert({
        admin_id: user!.id,
        target_user_id: userId,
        action_type: "update_profile",
        details: updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: language === "ar" ? "تم تحديث الملف الشخصي" : "Profile updated" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleOpenEdit = (profile: UserProfile) => {
    setEditUser(profile);
    setEditRoles(profile.roles?.map(r => r.role) || []);
    setEditMembership(profile.membership_tier || "basic");
    setEditStatus(profile.account_status || "pending");
    setEditVerified(profile.is_verified || false);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;

    // Update profile details
    await updateProfileMutation.mutateAsync({
      userId: editUser.user_id,
      updates: {
        membership_tier: editMembership,
        account_status: editStatus,
        is_verified: editVerified,
      },
    });

    // Update roles
    await updateRolesMutation.mutateAsync({
      userId: editUser.user_id,
      roles: editRoles,
    });

    setEditUser(null);
  };

  const toggleRole = (role: AppRole) => {
    setEditRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const getStatusBadge = (status: AccountStatus | null) => {
    const config: Record<AccountStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      active: { variant: "default", label: language === "ar" ? "نشط" : "Active" },
      pending: { variant: "secondary", label: language === "ar" ? "معلق" : "Pending" },
      suspended: { variant: "destructive", label: language === "ar" ? "موقوف" : "Suspended" },
      banned: { variant: "destructive", label: language === "ar" ? "محظور" : "Banned" },
    };
    const cfg = config[status || "pending"];
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  const getMembershipBadge = (tier: MembershipTier | null) => {
    const colors: Record<MembershipTier, string> = {
      basic: "bg-muted text-muted-foreground",
      professional: "bg-primary/20 text-primary",
      enterprise: "bg-purple-500/20 text-purple-600",
    };
    return (
      <Badge className={colors[tier || "basic"]} variant="outline">
        {tier === "professional" ? t("professionalTier") : t(tier || "basic")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">{t("userManagement")}</h1>
        <Badge variant="outline" className="text-sm">
          {usersData?.totalCount || 0} {language === "ar" ? "مستخدم" : "users"}
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap gap-4 pt-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={language === "ar" ? "بحث بالاسم أو اسم المستخدم أو رقم الحساب..." : "Search by name, username, or account number..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("filterByRole")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allUsers")}</SelectItem>
              {ALL_ROLES.map(role => (
                <SelectItem key={role} value={role}>{t(role as any)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allUsers")}</SelectItem>
              <SelectItem value="active">{t("active")}</SelectItem>
              <SelectItem value="pending">{t("pending")}</SelectItem>
              <SelectItem value="suspended">{t("suspended")}</SelectItem>
              <SelectItem value="banned">{language === "ar" ? "محظور" : "Banned"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

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
                    <TableHead>{language === "ar" ? "المستخدم" : "User"}</TableHead>
                    <TableHead>{t("accountNumber")}</TableHead>
                    <TableHead>{language === "ar" ? "الأدوار" : "Roles"}</TableHead>
                    <TableHead>{t("membershipTier")}</TableHead>
                    <TableHead>{t("accountStatus")}</TableHead>
                    <TableHead>{language === "ar" ? "تاريخ الإنشاء" : "Created"}</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback>
                              {(profile.full_name || "U")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1">
                              <p className="font-medium">{profile.full_name || "No name"}</p>
                              {profile.is_verified && (
                                <Badge variant="secondary" className="h-4 px-1 text-[10px]">✓</Badge>
                              )}
                            </div>
                            {profile.username && (
                              <p className="text-xs text-muted-foreground">@{profile.username}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {profile.account_number || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {profile.roles?.map((r) => (
                            <Badge key={r.role} variant="outline" className="text-xs">
                              {t(r.role as any)}
                            </Badge>
                          ))}
                          {(!profile.roles || profile.roles.length === 0) && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getMembershipBadge(profile.membership_tier)}</TableCell>
                      <TableCell>{getStatusBadge(profile.account_status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(profile.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/${profile.username || profile.user_id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t("viewProfile")}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(profile)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {language === "ar" ? "تعديل" : "Edit User"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {profile.account_status === "active" ? (
                              <>
                                <DropdownMenuItem
                                  onClick={() => updateStatusMutation.mutate({
                                    userId: profile.user_id,
                                    newStatus: "suspended",
                                    reason: "Admin action",
                                  })}
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  {t("suspendUser")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => updateStatusMutation.mutate({
                                    userId: profile.user_id,
                                    newStatus: "banned",
                                    reason: "Admin action",
                                  })}
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  {language === "ar" ? "حظر" : "Ban User"}
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => updateStatusMutation.mutate({
                                  userId: profile.user_id,
                                  newStatus: "active",
                                })}
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                {t("activateUser")}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" ? `صفحة ${page + 1} من ${totalPages}` : `Page ${page + 1} of ${totalPages}`}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={editUser?.avatar_url || undefined} />
                <AvatarFallback>{(editUser?.full_name || "U")[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p>{editUser?.full_name || "Unknown"}</p>
                <p className="text-sm font-normal text-muted-foreground">@{editUser?.username}</p>
              </div>
            </DialogTitle>
            <DialogDescription>
              {language === "ar" ? "تعديل بيانات المستخدم والصلاحيات" : "Edit user details and permissions"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Account Status */}
            <div className="space-y-2">
              <Label>{language === "ar" ? "حالة الحساب" : "Account Status"}</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as AccountStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{language === "ar" ? "معلق" : "Pending"}</SelectItem>
                  <SelectItem value="active">{language === "ar" ? "نشط" : "Active"}</SelectItem>
                  <SelectItem value="suspended">{language === "ar" ? "موقوف" : "Suspended"}</SelectItem>
                  <SelectItem value="banned">{language === "ar" ? "محظور" : "Banned"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Membership Tier */}
            <div className="space-y-2">
              <Label>{language === "ar" ? "مستوى العضوية" : "Membership Tier"}</Label>
              <Select value={editMembership} onValueChange={(v) => setEditMembership(v as MembershipTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">{t("basic")}</SelectItem>
                  <SelectItem value="professional">{t("professionalTier")}</SelectItem>
                  <SelectItem value="enterprise">{t("enterprise")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Verified Status */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="verified"
                checked={editVerified}
                onCheckedChange={(checked) => setEditVerified(!!checked)}
              />
              <Label htmlFor="verified" className="cursor-pointer">
                {language === "ar" ? "حساب موثق" : "Verified Account"}
              </Label>
            </div>

            {/* Roles */}
            <div className="space-y-3">
              <Label>{language === "ar" ? "الأدوار" : "Roles"}</Label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_ROLES.map(role => (
                  <div
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors ${
                      editRoles.includes(role)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Checkbox
                      checked={editRoles.includes(role)}
                      onCheckedChange={() => toggleRole(role)}
                    />
                    <span className="text-sm capitalize">{t(role as any)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={updateProfileMutation.isPending || updateRolesMutation.isPending}
            >
              <Shield className="mr-2 h-4 w-4" />
              {language === "ar" ? "حفظ التغييرات" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
