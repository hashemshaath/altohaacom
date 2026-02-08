import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, MoreHorizontal, UserX, UserCheck, Eye } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AccountStatus = Database["public"]["Enums"]["account_status"];
type AppRole = Database["public"]["Enums"]["app_role"];

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  account_number: string | null;
  account_status: AccountStatus | null;
  membership_tier: Database["public"]["Enums"]["membership_tier"] | null;
  avatar_url: string | null;
  created_at: string;
  roles?: { role: AppRole }[];
}

export default function UserManagement() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch users with their roles
  const { data: users, isLoading } = useQuery({
    queryKey: ["adminUsers", searchQuery, roleFilter, statusFilter],
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
          created_at
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%,account_number.ilike.%${searchQuery}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("account_status", statusFilter as AccountStatus);
      }

      const { data: profiles, error } = await query;
      if (error) throw error;

      // Fetch roles for each user
      const userIds = profiles?.map(p => p.user_id) || [];
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      // Merge roles with profiles
      return profiles?.map(profile => ({
        ...profile,
        roles: roles?.filter(r => r.user_id === profile.user_id) || [],
      })) as UserProfile[];
    },
  });

  // Filter by role client-side
  const filteredUsers = users?.filter(u => {
    if (roleFilter === "all") return true;
    return u.roles?.some(r => r.role === roleFilter);
  });

  // Suspend/Activate user mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, newStatus, reason }: { userId: string; newStatus: AccountStatus; reason?: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          account_status: newStatus,
          suspended_reason: newStatus === "suspended" ? reason : null,
          suspended_at: newStatus === "suspended" ? new Date().toISOString() : null,
        })
        .eq("user_id", userId);

      if (error) throw error;

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user!.id,
        target_user_id: userId,
        action_type: newStatus === "suspended" ? "suspend_user" : "activate_user",
        details: { reason },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: "User status updated" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const getStatusBadge = (status: AccountStatus | null) => {
    const variants: Record<AccountStatus, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      pending: "secondary",
      suspended: "destructive",
      banned: "destructive",
    };
    return (
      <Badge variant={variants[status || "pending"]}>
        {t(status || "pending")}
      </Badge>
    );
  };

  const getMembershipBadge = (tier: Database["public"]["Enums"]["membership_tier"] | null) => {
    const colors: Record<string, string> = {
      basic: "bg-gray-100 text-gray-800",
      professional: "bg-blue-100 text-blue-800",
      enterprise: "bg-purple-100 text-purple-800",
    };
    return (
      <Badge className={colors[tier || "basic"]} variant="outline">
        {tier === "professional" ? t("professionalTier") : t(tier || "basic")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold">{t("userManagement")}</h1>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap gap-4 pt-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchUsers")}
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
              <SelectItem value="chef">{t("chef")}</SelectItem>
              <SelectItem value="judge">{t("judge")}</SelectItem>
              <SelectItem value="student">{t("student")}</SelectItem>
              <SelectItem value="organizer">{t("organizer")}</SelectItem>
              <SelectItem value="volunteer">{t("volunteer")}</SelectItem>
              <SelectItem value="sponsor">{t("sponsor")}</SelectItem>
              <SelectItem value="assistant">{t("assistant")}</SelectItem>
              <SelectItem value="supervisor">{t("supervisor")}</SelectItem>
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
              <SelectItem value="banned">{t("banned")}</SelectItem>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>{t("accountNumber")}</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>{t("membershipTier")}</TableHead>
                  <TableHead>{t("accountStatus")}</TableHead>
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
                          <p className="font-medium">{profile.full_name || "No name"}</p>
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
                      </div>
                    </TableCell>
                    <TableCell>{getMembershipBadge(profile.membership_tier)}</TableCell>
                    <TableCell>{getStatusBadge(profile.account_status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            {t("viewProfile")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {profile.account_status === "suspended" ? (
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({
                                userId: profile.user_id,
                                newStatus: "active",
                              })}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              {t("activateUser")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => updateStatusMutation.mutate({
                                userId: profile.user_id,
                                newStatus: "suspended",
                                reason: "Admin action",
                              })}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              {t("suspendUser")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
