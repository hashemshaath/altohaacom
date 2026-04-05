import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useCSVExport } from "@/hooks/useCSVExport";
import { Search, UserCog, Download, Loader2, Filter } from "lucide-react";
import { ROLE_META, ALL_ROLES, type AppRole } from "./types";

interface Props {
  isAr: boolean;
  t: (en: string, ar: string) => string;
}

export default function UsersTab({ isAr, t }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<AppRole | "all">("all");

  const { data: usersForAssignment = [], isLoading } = useQuery({
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
      const userIds = data?.map(u => u.user_id) || [];
      if (userIds.length === 0) return [];
      const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("user_id", userIds);
      return data.map(u => ({
        ...u,
        roles: (roles?.filter(r => r.user_id === u.user_id) || []).map(r => r.role),
      }));
    },
    staleTime: 1000 * 30,
  });

  const filteredUsers = roleFilter === "all"
    ? usersForAssignment
    : usersForAssignment.filter(u => u.roles.includes(roleFilter));

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
    onError: (err: Error) => {
      toast({ variant: "destructive", title: t("Error", "خطأ"), description: err instanceof Error ? err.message : String(err) });
    },
  });

  const { exportCSV } = useCSVExport({
    columns: [
      { header: t("Name", "الاسم"), accessor: (u) => u.full_name || "" },
      { header: t("Username", "اسم المستخدم"), accessor: (u) => u.username || "" },
      { header: t("Email", "البريد"), accessor: (u) => u.email || "" },
      { header: t("Account #", "رقم الحساب"), accessor: (u) => u.account_number || "" },
      { header: t("Roles", "الأدوار"), accessor: (u) => u.roles?.join(", ") || "" },
    ],
    filename: "role-assignments",
  });

  return (
    <Card className="rounded-2xl border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <UserCog className="h-4 w-4 text-primary" />
              {t("Assign Roles to Users", "تعيين الأدوار للمستخدمين")}
              <Badge variant="secondary" className="text-[10px]">{filteredUsers.length}</Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              {t("Search for a user and assign or remove roles directly", "ابحث عن مستخدم وعيّن أو أزل الأدوار مباشرة")}
            </CardDescription>
          </div>
          {filteredUsers.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => exportCSV(filteredUsers)}>
              <Download className="h-3.5 w-3.5" />{t("Export", "تصدير")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("Search by name, email, or account number...", "ابحث بالاسم أو البريد أو رقم الحساب...")}
              value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="ps-9 rounded-xl" />
          </div>
        </div>

        {/* Role filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <Button variant={roleFilter === "all" ? "default" : "outline"} size="sm"
            className="h-7 text-[11px] gap-1 rounded-xl" onClick={() => setRoleFilter("all")}>
            <Filter className="h-3 w-3" /> {t("All", "الكل")}
          </Button>
          {ALL_ROLES.map(role => {
            const meta = ROLE_META[role];
            const Icon = meta.icon;
            const count = usersForAssignment.filter(u => u.roles.includes(role)).length;
            return (
              <Button key={role} variant={roleFilter === role ? "default" : "outline"} size="sm"
                className={`h-7 text-[11px] gap-1 rounded-xl ${roleFilter !== role ? "opacity-60 hover:opacity-90" : ""}`}
                onClick={() => setRoleFilter(role)}>
                <Icon className="h-3 w-3" />
                {isAr ? meta.labelAr : meta.labelEn}
                {count > 0 && <span className="text-[9px] opacity-70">({count})</span>}
              </Button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2">
              {filteredUsers.map((user) => (
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
                                className={`h-7 w-7 p-0 rounded-lg active:scale-[0.98] touch-manipulation ${hasRole ? "" : "opacity-25 hover:opacity-60"}`}
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
              {filteredUsers.length === 0 && (
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
  );
}
