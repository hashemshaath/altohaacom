import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Trash2, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

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

  const { data: actions, isLoading } = useQuery({
    queryKey: ["auditLog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as AdminAction[];
    },
  });

  const { data: contentAudit, isLoading: contentLoading } = useQuery({
    queryKey: ["contentAuditLog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as ContentAuditEntry[];
    },
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
    return (
      <Badge className={c.color} variant="outline">
        {isAr ? c.labelAr : c.label}
      </Badge>
    );
  };

  const isAr = language === "ar";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={FileText}
        title={t("auditLog")}
        description={isAr ? "سجل جميع الإجراءات الإدارية" : "Track all administrative actions"}
      />

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content" className="gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            {isAr ? "سجل المحتوى" : "Content Log"}
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {isAr ? "إجراءات المشرفين" : "Admin Actions"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                {isAr ? "سجل الحذف والرفض" : "Deletions & Rejections Log"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contentLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : !contentAudit?.length ? (
                <p className="py-8 text-center text-muted-foreground">{isAr ? "لا توجد سجلات" : "No records"}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isAr ? "الإجراء" : "Action"}</TableHead>
                      <TableHead>{isAr ? "المحتوى" : "Content"}</TableHead>
                      <TableHead>{isAr ? "السبب" : "Reason"}</TableHead>
                      <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contentAudit.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{getContentActionBadge(entry.action_type)}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {entry.content_snapshot || "-"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {isAr ? (entry.reason_ar || entry.reason) : (entry.reason || "-")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(entry.created_at), "MMM d, yyyy HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>{isAr ? "إجراءات المشرفين الأخيرة" : "Recent Admin Actions"}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : actions?.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">{t("noResults")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actions?.map((action) => (
                      <TableRow key={action.id}>
                        <TableCell>{getActionBadge(action.action_type)}</TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {action.details ? JSON.stringify(action.details) : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(action.created_at), "MMM d, yyyy HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}