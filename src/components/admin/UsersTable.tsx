import { memo, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SortableTableHead } from "@/components/admin/SortableTableHead";
import { UserQuickActions } from "@/components/admin/UserQuickActions";
import { UserCardView } from "@/components/admin/UserCardView";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useTableSort } from "@/hooks/useTableSort";
import { Edit, ChevronRight, ChevronLeft, List, LayoutGrid, SlidersHorizontal, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type AccountStatus = Database["public"]["Enums"]["account_status"];
type MembershipTier = Database["public"]["Enums"]["membership_tier"];

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  username: string | null;
  account_number: string | null;
  account_status: AccountStatus | null;
  account_type: Database["public"]["Enums"]["account_type"];
  membership_tier: MembershipTier | null;
  avatar_url: string | null;
  created_at: string;
  country_code: string | null;
  is_verified: boolean | null;
  email: string | null;
  roles?: { role: Database["public"]["Enums"]["app_role"] }[];
}

type ColumnKey = "user" | "account_number" | "type" | "roles" | "membership" | "status" | "country" | "created" | "actions";

const DEFAULT_COLUMNS: Record<ColumnKey, boolean> = {
  user: true, account_number: true, type: true, roles: true,
  membership: true, status: true, country: true, created: true, actions: true,
};

interface UsersTableProps {
  users: UserProfile[];
  isLoading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  editingUserId: string | null;
  onEdit: (profile: UserProfile) => void;
  onCancelEdit: () => void;
  onViewProfile: (userId: string) => void;
  onResetPassword: (userId: string, name: string) => void;
  onSuspend: (userId: string, name: string, email: string | null) => void;
  onSendNotification: (userId: string, name: string) => void;
  onActivate: (userId: string) => void;
  selected: Set<string>;
  toggleOne: (id: string) => void;
  toggleAll: () => void;
  isAllSelected: boolean;
  isSelected: (id: string) => boolean;
}

export const UsersTable = memo(function UsersTable({
  users, isLoading, totalCount, page, pageSize, onPageChange,
  editingUserId, onEdit, onCancelEdit, onViewProfile,
  onResetPassword, onSuspend, onSendNotification, onActivate,
  selected, toggleOne, toggleAll, isAllSelected, isSelected,
}: UsersTableProps) {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(DEFAULT_COLUMNS);

  const { sorted: sortedUsers, sortColumn, sortDirection, toggleSort } = useTableSort(users, "created_at", "desc");
  const totalPages = Math.ceil(totalCount / pageSize);

  const toggleColumn = (col: ColumnKey) => {
    if (col === "user" || col === "actions") return; // Always visible
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const statusBadge = (status: AccountStatus | null) => {
    const map: Record<AccountStatus, { cls: string; label: string }> = {
      active: { cls: "bg-chart-3/15 text-chart-3 border-chart-3/20", label: isAr ? "نشط" : "Active" },
      pending: { cls: "bg-chart-4/15 text-chart-4 border-chart-4/20", label: isAr ? "معلق" : "Pending" },
      suspended: { cls: "bg-destructive/15 text-destructive border-destructive/20", label: isAr ? "موقوف" : "Suspended" },
      banned: { cls: "bg-destructive/15 text-destructive border-destructive/20", label: isAr ? "محظور" : "Banned" },
    };
    const c = map[status || "pending"];
    return <Badge variant="outline" className={cn("text-[10px] font-medium", c.cls)}>{c.label}</Badge>;
  };

  const membershipBadge = (tier: MembershipTier | null) => {
    const map: Record<MembershipTier, { cls: string; label: string }> = {
      basic: { cls: "bg-muted text-muted-foreground", label: isAr ? "أساسي" : "Basic" },
      professional: { cls: "bg-primary/15 text-primary border-primary/20", label: isAr ? "محترف" : "Pro" },
      enterprise: { cls: "bg-chart-2/15 text-chart-2 border-chart-2/20", label: isAr ? "مؤسسي" : "Enterprise" },
    };
    const c = map[tier || "basic"];
    return <Badge variant="outline" className={cn("text-[10px]", c.cls)}>{c.label}</Badge>;
  };

  const columnHeaders: { key: ColumnKey; sortKey?: string; label: string; width?: string }[] = [
    { key: "user", sortKey: "full_name", label: isAr ? "المستخدم" : "User" },
    { key: "account_number", sortKey: "account_number", label: isAr ? "رقم الحساب" : "Account #", width: "w-28" },
    { key: "type", sortKey: "account_type", label: isAr ? "النوع" : "Type", width: "w-24" },
    { key: "roles", label: isAr ? "الأدوار" : "Roles" },
    { key: "membership", sortKey: "membership_tier", label: isAr ? "العضوية" : "Membership", width: "w-24" },
    { key: "status", sortKey: "account_status", label: isAr ? "الحالة" : "Status", width: "w-24" },
    { key: "country", sortKey: "country_code", label: isAr ? "الدولة" : "Country", width: "w-20" },
    { key: "created", sortKey: "created_at", label: isAr ? "الإنشاء" : "Created", width: "w-28" },
    { key: "actions", label: isAr ? "الإجراءات" : "Actions", width: "w-36" },
  ];

  const activeColumns = columnHeaders.filter((c) => visibleColumns[c.key]);

  return (
    <Card className="border-border/40 rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          {isAr ? "المستخدمون" : "Users"}
          <Badge variant="outline" className="text-[10px] font-normal rounded-xl tabular-nums">
            <AnimatedCounter value={users.length} className="inline" /> {isAr ? "نتيجة" : "results"}
          </Badge>
        </CardTitle>
        <div className="flex items-center gap-1.5">
          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl">
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {columnHeaders.filter((c) => c.key !== "user" && c.key !== "actions").map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={visibleColumns[col.key]}
                  onCheckedChange={() => toggleColumn(col.key)}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View mode */}
          <div className="flex items-center gap-0.5 border rounded-xl p-0.5 bg-muted/30">
            <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="icon" className="h-7 w-7 rounded-xl" onClick={() => setViewMode("table")}>
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button variant={viewMode === "card" ? "secondary" : "ghost"} size="icon" className="h-7 w-7 rounded-xl" onClick={() => setViewMode("card")}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5">
        {isLoading ? (
          <SkeletonTable columns={activeColumns.length + 1} rows={8} />
        ) : users.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">{t("noResults")}</p>
        ) : viewMode === "card" ? (
          <UserCardView users={users} onViewUser={onViewProfile} />
        ) : (
          <>
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-10"><Checkbox checked={isAllSelected} onCheckedChange={toggleAll} /></TableHead>
                    {activeColumns.map((col) =>
                      col.sortKey ? (
                        <SortableTableHead key={col.key} column={col.sortKey} label={col.label} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} className={col.width} />
                      ) : (
                        <TableHead key={col.key} className={col.width}>{col.label}</TableHead>
                      )
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((profile) => (
                    <TableRow
                      key={profile.id}
                      className={cn(
                        "transition-all cursor-pointer group",
                        editingUserId === profile.user_id ? "bg-primary/5 border-s-2 border-s-primary" : isSelected(profile.id) ? "bg-primary/5" : "hover:bg-muted/40",
                      )}
                      onClick={() => onViewProfile(profile.user_id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSelected(profile.id)} onCheckedChange={() => toggleOne(profile.id)} />
                      </TableCell>

                      {/* User */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 ring-1 ring-border">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">{(profile.full_name || "U")[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-sm truncate">{(profile as any).display_name || profile.full_name || "—"}</p>
                              {profile.is_verified && <span className="text-primary text-[10px]">✓</span>}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {profile.username && `@${profile.username}`}
                              {profile.email && ` · ${profile.email}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {visibleColumns.account_number && <TableCell className="font-mono text-xs text-muted-foreground">{profile.account_number || "—"}</TableCell>}
                      {visibleColumns.type && (
                        <TableCell>
                          <Badge variant={profile.account_type === "fan" ? "secondary" : "outline"} className="text-[10px]">
                            {profile.account_type === "fan" ? (isAr ? "متابع" : "Fan") : (isAr ? "محترف" : "Pro")}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.roles && (
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {profile.roles?.slice(0, 3).map((r) => <Badge key={r.role} variant="outline" className="text-[10px]">{t(r.role as any)}</Badge>)}
                            {(profile.roles?.length || 0) > 3 && <Badge variant="outline" className="text-[10px]">+{(profile.roles?.length || 0) - 3}</Badge>}
                            {(!profile.roles || profile.roles.length === 0) && <span className="text-xs text-muted-foreground">—</span>}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.membership && <TableCell>{membershipBadge(profile.membership_tier)}</TableCell>}
                      {visibleColumns.status && <TableCell>{statusBadge(profile.account_status)}</TableCell>}
                      {visibleColumns.country && <TableCell className="text-xs text-muted-foreground">{profile.country_code || "—"}</TableCell>}
                      {visibleColumns.created && <TableCell className="text-xs text-muted-foreground tabular-nums">{format(new Date(profile.created_at), "MMM d, yyyy")}</TableCell>}

                      {visibleColumns.actions && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant={editingUserId === profile.user_id ? "secondary" : "ghost"}
                              size="icon" className="h-7 w-7 rounded-xl"
                              onClick={() => editingUserId === profile.user_id ? onCancelEdit() : onEdit(profile)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <UserQuickActions
                              userId={profile.user_id}
                              userName={profile.full_name || profile.username || ""}
                              email={profile.email}
                              status={profile.account_status}
                              isVerified={profile.is_verified}
                              onViewProfile={() => onViewProfile(profile.user_id)}
                              onResetPassword={onResetPassword}
                              onSuspend={onSuspend}
                              onSendNotification={onSendNotification}
                              onActivate={onActivate}
                            />
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/20 border border-border/30 px-4 py-3">
                <p className="text-xs text-muted-foreground tabular-nums">
                  {isAr ? `${page * pageSize + 1}-${Math.min((page + 1) * pageSize, totalCount)} من ${totalCount}` : `${page * pageSize + 1}-${Math.min((page + 1) * pageSize, totalCount)} of ${totalCount}`}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => onPageChange(0)} disabled={page === 0} className="h-8 w-8 p-0 rounded-xl">
                    <ChevronLeft className="h-3 w-3" /><ChevronLeft className="h-3 w-3 -ms-2" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0} className="h-8 w-8 p-0 rounded-xl">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(0, Math.min(page - 2, totalPages - 5));
                    const num = start + i;
                    if (num >= totalPages) return null;
                    return (
                      <Button key={num} variant={num === page ? "default" : "outline"} size="sm" className="h-8 w-8 p-0 text-xs rounded-xl" onClick={() => onPageChange(num)}>
                        {num + 1}
                      </Button>
                    );
                  })}
                  <Button variant="outline" size="sm" onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="h-8 w-8 p-0 rounded-xl">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onPageChange(totalPages - 1)} disabled={page >= totalPages - 1} className="h-8 w-8 p-0 rounded-xl">
                    <ChevronRight className="h-3 w-3" /><ChevronRight className="h-3 w-3 -ms-2" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
});
