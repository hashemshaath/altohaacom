import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Trash2, ShieldAlert, Search, Download, Filter,
  Clock, AlertTriangle, CheckCircle2, Activity, BarChart3, Eye,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format, subDays, isAfter } from "date-fns";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";

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
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as AdminAction[];
    },
  });

  const { data: contentAudit = [], isLoading: contentLoading } = useQuery({
    queryKey: ["contentAuditLog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
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

  const bulkAdmin = useAdminBulkActions(filteredActions);
  const bulkContent = useAdminBulkActions(filteredContent);

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
            <SelectTrigger className="w-28 h-8 text-xs">
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
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-2xl font-bold">{stats.todayActions}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "إجراءات اليوم" : "Today's Actions"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ShieldAlert className="mx-auto mb-1 h-5 w-5 text-chart-4" />
            <p className="text-2xl font-bold">{stats.todayContent}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "إجراءات المحتوى" : "Content Actions"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="mx-auto mb-1 h-5 w-5 text-chart-2" />
            <p className="text-2xl font-bold">{stats.uniqueActionTypes}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "أنواع الإجراءات" : "Action Types"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Trash2 className="mx-auto mb-1 h-5 w-5 text-destructive" />
            <p className="text-2xl font-bold">{stats.deletions}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "عمليات الحذف" : "Total Deletions"}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content" className="gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            {isAr ? "سجل المحتوى" : "Content Log"} ({filteredContent.length})
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-1.5">
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
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Trash2 className="h-4 w-4 text-destructive" />
                  {isAr ? "سجل الحذف والرفض" : "Deletions & Rejections Log"}
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => exportContentCSV(filteredContent)}>
                  <Download className="h-3.5 w-3.5" /> CSV
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder={isAr ? "بحث..." : "Search..."} value={contentSearch} onChange={e => setContentSearch(e.target.value)} className="ps-8 h-8 text-xs" />
                </div>
                <Select value={contentActionFilter} onValueChange={setContentActionFilter}>
                  <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "جميع الإجراءات" : "All Actions"}</SelectItem>
                    {uniqueContentActionTypes.map(t => (
                      <SelectItem key={t} value={t} className="text-xs">{t.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {contentLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : filteredContent.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">{isAr ? "لا توجد سجلات" : "No records"}</p>
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <Table>
                    <TableHeader>
                     <TableRow>
                        <TableHead className="w-8"><Checkbox checked={bulkContent.isAllSelected} onCheckedChange={bulkContent.toggleAll} /></TableHead>
                        <TableHead className="text-xs">{isAr ? "الإجراء" : "Action"}</TableHead>
                        <TableHead className="text-xs">{isAr ? "النوع" : "Entity"}</TableHead>
                        <TableHead className="text-xs">{isAr ? "المحتوى" : "Content"}</TableHead>
                        <TableHead className="text-xs">{isAr ? "السبب" : "Reason"}</TableHead>
                        <TableHead className="text-xs">{isAr ? "التاريخ" : "Date"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContent.map(entry => (
                        <TableRow key={entry.id} className={bulkContent.isSelected(entry.id) ? "bg-primary/5" : ""}>
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
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <BulkActionBar
            count={bulkAdmin.count}
            onClear={bulkAdmin.clearSelection}
            onExport={() => exportAdminCSV(bulkAdmin.selectedItems)}
          />
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm">{isAr ? "إجراءات المشرفين الأخيرة" : "Recent Admin Actions"}</CardTitle>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => exportAdminCSV(filteredActions)}>
                  <Download className="h-3.5 w-3.5" /> CSV
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} className="ps-8 h-8 text-xs" />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "جميع الإجراءات" : "All Actions"}</SelectItem>
                    {uniqueAdminActionTypes.map(t => (
                      <SelectItem key={t} value={t} className="text-xs">{t.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : filteredActions.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">{t("noResults")}</p>
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"><Checkbox checked={bulkAdmin.isAllSelected} onCheckedChange={bulkAdmin.toggleAll} /></TableHead>
                        <TableHead className="text-xs">{isAr ? "الإجراء" : "Action"}</TableHead>
                        <TableHead className="text-xs">{isAr ? "التفاصيل" : "Details"}</TableHead>
                        <TableHead className="text-xs">{isAr ? "التاريخ" : "Date"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActions.map(action => (
                        <TableRow key={action.id} className={bulkAdmin.isSelected(action.id) ? "bg-primary/5" : ""}>
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
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}