import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { SortableTableHead } from "@/components/admin/SortableTableHead";
import { AdminTablePagination } from "@/components/admin/AdminTablePagination";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTableCard } from "@/components/admin/AdminTableCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Trash2, ShieldAlert, Search, Download, Filter,
  Clock, AlertTriangle, CheckCircle2, Activity, BarChart3, Eye, FileSearch,
} from "lucide-react";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { format, subDays, isAfter } from "date-fns";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { QUERY_LIMIT_MEDIUM } from "@/lib/constants";

interface AdminAction {
  id: string;
  admin_id: string;
  target_user_id: string | null;
  action_type: string;
  details: Record<string, any> | null;
  created_at: string;
}

interface ContentAuditEntry {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  author_id: string | null;
  content_snapshot: string | null;
  reason: string | null;
  reason_ar: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export default function AuditLog() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30d");
  const [contentSearch, setContentSearch] = useState("");
  const [contentActionFilter, setContentActionFilter] = useState("all");

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ["auditLog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_actions")
        .select("id, admin_id, action_type, target_user_id, details, created_at")
        .order("created_at", { ascending: false })
        .limit(QUERY_LIMIT_MEDIUM);
      if (error) throw error;
      return data as AdminAction[];
    },
  });

  const { data: contentAudit = [], isLoading: contentLoading } = useQuery({
    queryKey: ["contentAuditLog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_audit_log")
        .select("id, entity_type, entity_id, action_type, user_id, author_id, reason, reason_ar, content_snapshot, image_urls, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(QUERY_LIMIT_MEDIUM);
      if (error) throw error;
      return data as ContentAuditEntry[];
    },
  });

  // Date filter
  const cutoffDate = useMemo(() => {
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 365;
    return subDays(new Date(), days);
  }, [dateRange]);

  // Filtered admin actions
  const filteredActions = useMemo(() => {
    return actions.filter(a => {
      if (!isAfter(new Date(a.created_at), cutoffDate)) return false;
      if (actionFilter !== "all" && a.action_type !== actionFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return a.action_type.includes(s) || JSON.stringify(a.details).toLowerCase().includes(s);
      }
      return true;
    });
  }, [actions, cutoffDate, actionFilter, search]);

  // Filtered content audit
  const filteredContent = useMemo(() => {
    return contentAudit.filter(c => {
      if (!isAfter(new Date(c.created_at), cutoffDate)) return false;
      if (contentActionFilter !== "all" && c.action_type !== contentActionFilter) return false;
      if (contentSearch) {
        const s = contentSearch.toLowerCase();
        return (c.content_snapshot || "").toLowerCase().includes(s) ||
               (c.reason || "").toLowerCase().includes(s);
      }
      return true;
    });
  }, [contentAudit, cutoffDate, contentActionFilter, contentSearch]);

  // Stats
  const stats = useMemo(() => {
    const today = subDays(new Date(), 1);
    const todayActions = actions.filter(a => isAfter(new Date(a.created_at), today)).length;
    const todayContent = contentAudit.filter(c => isAfter(new Date(c.created_at), today)).length;
    const uniqueActionTypes = new Set(actions.map(a => a.action_type)).size;
    const deletions = contentAudit.filter(c => c.action_type.includes("deleted")).length;
    return { todayActions, todayContent, uniqueActionTypes, deletions };
  }, [actions, contentAudit]);

  const uniqueAdminActionTypes = useMemo(() => {
    return [...new Set(actions.map(a => a.action_type))].sort();
  }, [actions]);

  const uniqueContentActionTypes = useMemo(() => {
    return [...new Set(contentAudit.map(c => c.action_type))].sort();
  }, [contentAudit]);

  const { sorted: sortedContent, sortColumn: cSortCol, sortDirection: cSortDir, toggleSort: cToggleSort } = useTableSort(filteredContent, "created_at", "desc");
  const contentPagination = usePagination(sortedContent, { defaultPageSize: 15 });
  const bulkContent = useAdminBulkActions(contentPagination.paginated);

  const { sorted: sortedActions, sortColumn: aSortCol, sortDirection: aSortDir, toggleSort: aToggleSort } = useTableSort(filteredActions, "created_at", "desc");
  const actionPagination = usePagination(sortedActions, { defaultPageSize: 15 });
  const bulkAdmin = useAdminBulkActions(actionPagination.paginated);

  const { exportCSV: exportAdminCSV } = useCSVExport({
    columns: [
      { header: isAr ? "التاريخ" : "Date", accessor: (r: AdminAction) => format(new Date(r.created_at), "yyyy-MM-dd HH:mm") },
      { header: isAr ? "الإجراء" : "Action", accessor: (r: AdminAction) => r.action_type },
      { header: isAr ? "التفاصيل" : "Details", accessor: (r: AdminAction) => JSON.stringify(r.details || "") },
    ],
    filename: "audit-admin",
  });

  const { exportCSV: exportContentCSV } = useCSVExport({
    columns: [
      { header: isAr ? "التاريخ" : "Date", accessor: (r: ContentAuditEntry) => format(new Date(r.created_at), "yyyy-MM-dd HH:mm") },
      { header: isAr ? "الإجراء" : "Action", accessor: (r: ContentAuditEntry) => r.action_type },
      { header: isAr ? "النوع" : "Entity", accessor: (r: ContentAuditEntry) => r.entity_type || "" },
      { header: isAr ? "المحتوى" : "Content", accessor: (r: ContentAuditEntry) => r.content_snapshot || "" },
      { header: isAr ? "السبب" : "Reason", accessor: (r: ContentAuditEntry) => (isAr ? r.reason_ar : r.reason) || "" },
    ],
    filename: "audit-content",
  });

  const getActionBadge = (actionType: string) => {
    const colors: Record<string, string> = {
      suspend_user: "bg-destructive/10 text-destructive",
      activate_user: "bg-chart-5/10 text-chart-5",
      change_membership: "bg-chart-1/10 text-chart-1",
      resolve_report: "bg-chart-2/10 text-chart-2",
      assign_role: "bg-chart-4/10 text-chart-4",
    };
    return (
      <Badge className={colors[actionType] || "bg-muted text-muted-foreground"} variant="outline">
        {actionType.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getContentActionBadge = (actionType: string) => {
    const config: Record<string, { color: string; label: string; labelAr: string }> = {
      post_deleted: { color: "bg-destructive/10 text-destructive", label: "Deleted", labelAr: "محذوف" },
      post_rejected: { color: "bg-chart-1/10 text-chart-1", label: "Rejected", labelAr: "مرفوض" },
      post_flagged: { color: "bg-chart-3/10 text-chart-3", label: "Flagged", labelAr: "مُعلَّم" },
      post_cancelled: { color: "bg-muted text-muted-foreground", label: "Cancelled", labelAr: "ملغي" },
      comment_deleted: { color: "bg-destructive/10 text-destructive", label: "Comment Deleted", labelAr: "تعليق محذوف" },
    };
    const c = config[actionType] || { color: "bg-muted text-muted-foreground", label: actionType, labelAr: actionType };
    return <Badge className={c.color} variant="outline">{isAr ? c.labelAr : c.label}</Badge>;
  };

  // legacy export removed – now using useCSVExport

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={FileText}
        title={t("auditLog")}
        description={isAr ? "سجل جميع الإجراءات الإدارية مع التصفية والتصدير" : "Track all administrative actions with filtering & export"}
        actions={
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-28 h-8 text-xs rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 {isAr ? "أيام" : "days"}</SelectItem>
              <SelectItem value="30d">30 {isAr ? "يوم" : "days"}</SelectItem>
              <SelectItem value="90d">90 {isAr ? "يوم" : "days"}</SelectItem>
              <SelectItem value="365d">1 {isAr ? "سنة" : "year"}</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Activity, value: stats.todayActions, label: isAr ? "إجراءات اليوم" : "Today's Actions", color: "text-primary", bg: "bg-primary/10" },
          { icon: ShieldAlert, value: stats.todayContent, label: isAr ? "إجراءات المحتوى" : "Content Actions", color: "text-chart-4", bg: "bg-chart-4/10" },
          { icon: BarChart3, value: stats.uniqueActionTypes, label: isAr ? "أنواع الإجراءات" : "Action Types", color: "text-chart-2", bg: "bg-chart-2/10" },
          { icon: Trash2, value: stats.deletions, label: isAr ? "عمليات الحذف" : "Total Deletions", color: "text-destructive", bg: "bg-destructive/10" },
        ].map((s, i) => (
          <Card key={i} className="rounded-2xl border-border/40 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg} transition-transform duration-300 group-hover:scale-110`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <AnimatedCounter value={s.value} className="text-2xl font-bold" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList className="rounded-2xl border border-border/40 bg-muted/30 backdrop-blur p-1.5 h-auto gap-1">
          <TabsTrigger value="content" className="gap-1.5 rounded-xl data-[state=active]:shadow-sm transition-all duration-300">
            <ShieldAlert className="h-3.5 w-3.5" />
            {isAr ? "سجل المحتوى" : "Content Log"} ({filteredContent.length})
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-1.5 rounded-xl data-[state=active]:shadow-sm transition-all duration-300">
            <FileText className="h-3.5 w-3.5" />
            {isAr ? "إجراءات المشرفين" : "Admin Actions"} ({filteredActions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <BulkActionBar
            count={bulkContent.count}
            onClear={bulkContent.clearSelection}
            onExport={() => exportContentCSV(bulkContent.selectedItems)}
          />
          <AdminFilterBar
            searchValue={contentSearch}
            onSearchChange={setContentSearch}
            searchPlaceholder={isAr ? "بحث..." : "Search..."}
          >
            <Select value={contentActionFilter} onValueChange={setContentActionFilter}>
              <SelectTrigger className="w-40 h-9 text-xs rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع الإجراءات" : "All Actions"}</SelectItem>
                {uniqueContentActionTypes.map(t => (
                  <SelectItem key={t} value={t} className="text-xs">{t.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl" onClick={() => exportContentCSV(filteredContent)}>
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
          </AdminFilterBar>
          <AdminTableCard title={isAr ? "سجل الحذف والرفض" : "Deletions & Rejections Log"}>
              {contentLoading ? (
                <AdminTableSkeleton rows={5} columns={5} showActions={false} />
              ) : filteredContent.length === 0 ? (
                <AdminEmptyState
                  icon={FileSearch}
                  title="No records"
                  titleAr="لا توجد سجلات"
                  description="Content audit entries will appear here"
                  descriptionAr="ستظهر سجلات تدقيق المحتوى هنا"
                />
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <Table>
                    <TableHeader>
                     <TableRow className="bg-muted/30">
                        <TableHead className="w-8"><Checkbox checked={bulkContent.isAllSelected} onCheckedChange={bulkContent.toggleAll} /></TableHead>
                        <SortableTableHead column="action_type" label={isAr ? "الإجراء" : "Action"} sortColumn={cSortCol} sortDirection={cSortDir} onSort={cToggleSort} className="text-xs" />
                        <SortableTableHead column="entity_type" label={isAr ? "النوع" : "Entity"} sortColumn={cSortCol} sortDirection={cSortDir} onSort={cToggleSort} className="text-xs" />
                        <TableHead className="text-xs">{isAr ? "المحتوى" : "Content"}</TableHead>
                        <TableHead className="text-xs">{isAr ? "السبب" : "Reason"}</TableHead>
                        <SortableTableHead column="created_at" label={isAr ? "التاريخ" : "Date"} sortColumn={cSortCol} sortDirection={cSortDir} onSort={cToggleSort} className="text-xs" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contentPagination.paginated.map(entry => (
                        <TableRow key={entry.id} className={`transition-colors duration-200 hover:bg-muted/40 ${bulkContent.isSelected(entry.id) ? "bg-primary/5" : ""}`}>
                          <TableCell><Checkbox checked={bulkContent.isSelected(entry.id)} onCheckedChange={() => bulkContent.toggleOne(entry.id)} /></TableCell>
                          <TableCell>{getContentActionBadge(entry.action_type)}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{entry.content_snapshot || "—"}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                            {isAr ? (entry.reason_ar || entry.reason) : (entry.reason || "—")}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(entry.created_at), "MMM d, HH:mm")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <AdminTablePagination page={contentPagination.page} totalPages={contentPagination.totalPages} totalItems={contentPagination.totalItems} startItem={contentPagination.startItem} endItem={contentPagination.endItem} pageSize={contentPagination.pageSize} pageSizeOptions={contentPagination.pageSizeOptions} hasNext={contentPagination.hasNext} hasPrev={contentPagination.hasPrev} onPageChange={contentPagination.goTo} onPageSizeChange={contentPagination.changePageSize} />
                </ScrollArea>
              )}
            </AdminTableCard>
        </TabsContent>

        <TabsContent value="admin">
          <BulkActionBar
            count={bulkAdmin.count}
            onClear={bulkAdmin.clearSelection}
            onExport={() => exportAdminCSV(bulkAdmin.selectedItems)}
          />
          <AdminFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder={isAr ? "بحث..." : "Search..."}
          >
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40 h-9 text-xs rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع الإجراءات" : "All Actions"}</SelectItem>
                {uniqueAdminActionTypes.map(t => (
                  <SelectItem key={t} value={t} className="text-xs">{t.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl" onClick={() => exportAdminCSV(filteredActions)}>
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
          </AdminFilterBar>
          <AdminTableCard title={isAr ? "إجراءات المشرفين الأخيرة" : "Recent Admin Actions"}>
              {isLoading ? (
                <AdminTableSkeleton rows={5} columns={3} showActions={false} />
              ) : filteredActions.length === 0 ? (
                <AdminEmptyState
                  icon={FileText}
                  title="No results"
                  titleAr="لا توجد نتائج"
                  description="Admin actions will appear here"
                  descriptionAr="ستظهر إجراءات المشرفين هنا"
                />
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="w-8"><Checkbox checked={bulkAdmin.isAllSelected} onCheckedChange={bulkAdmin.toggleAll} /></TableHead>
                        <SortableTableHead column="action_type" label={isAr ? "الإجراء" : "Action"} sortColumn={aSortCol} sortDirection={aSortDir} onSort={aToggleSort} className="text-xs" />
                        <TableHead className="text-xs">{isAr ? "التفاصيل" : "Details"}</TableHead>
                        <SortableTableHead column="created_at" label={isAr ? "التاريخ" : "Date"} sortColumn={aSortCol} sortDirection={aSortDir} onSort={aToggleSort} className="text-xs" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {actionPagination.paginated.map(action => (
                        <TableRow key={action.id} className={`transition-colors duration-200 hover:bg-muted/40 ${bulkAdmin.isSelected(action.id) ? "bg-primary/5" : ""}`}>
                          <TableCell><Checkbox checked={bulkAdmin.isSelected(action.id)} onCheckedChange={() => bulkAdmin.toggleOne(action.id)} /></TableCell>
                          <TableCell>{getActionBadge(action.action_type)}</TableCell>
                          <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                            {action.details ? JSON.stringify(action.details) : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(action.created_at), "MMM d, HH:mm")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <AdminTablePagination page={actionPagination.page} totalPages={actionPagination.totalPages} totalItems={actionPagination.totalItems} startItem={actionPagination.startItem} endItem={actionPagination.endItem} pageSize={actionPagination.pageSize} pageSizeOptions={actionPagination.pageSizeOptions} hasNext={actionPagination.hasNext} hasPrev={actionPagination.hasPrev} onPageChange={actionPagination.goTo} onPageSizeChange={actionPagination.changePageSize} />
                </ScrollArea>
              )}
            </AdminTableCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}