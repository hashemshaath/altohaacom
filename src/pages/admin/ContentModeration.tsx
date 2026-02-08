import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CheckCircle, XCircle, Eye } from "lucide-react";

interface Report {
  id: string;
  reporter_id: string;
  content_type: string;
  content_id: string;
  reason: string;
  status: string;
  created_at: string;
  resolution_notes: string | null;
}

export default function ContentModeration() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["contentReports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Report[];
    },
  });

  const resolveReportMutation = useMutation({
    mutationFn: async ({ reportId, status, notes }: { reportId: string; status: string; notes: string }) => {
      const { error } = await supabase
        .from("content_reports")
        .update({
          status,
          resolution_notes: notes,
          resolved_by: user!.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user!.id,
        action_type: "resolve_report",
        details: { report_id: reportId, status, notes },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contentReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      toast({ title: "Report resolved" });
      setSelectedReport(null);
      setResolutionNotes("");
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      resolved: "default",
      dismissed: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const pendingCount = reports?.filter(r => r.status === "pending").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">{t("contentModeration")}</h1>
        {pendingCount > 0 && (
          <Badge variant="destructive">{pendingCount} pending</Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : reports?.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{t("noResults")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>{t("reason")}</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports?.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Badge variant="outline">{report.content_type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{report.reason}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(report.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedReport(report)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Resolution Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Content Type</p>
              <Badge variant="outline">{selectedReport?.content_type}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("reason")}</p>
              <p className="text-sm">{selectedReport?.reason}</p>
            </div>
            {selectedReport?.status === "pending" && (
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">Resolution Notes</p>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                />
              </div>
            )}
            {selectedReport?.resolution_notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolution Notes</p>
                <p className="text-sm">{selectedReport.resolution_notes}</p>
              </div>
            )}
          </div>
          {selectedReport?.status === "pending" && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => resolveReportMutation.mutate({
                  reportId: selectedReport.id,
                  status: "dismissed",
                  notes: resolutionNotes,
                })}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Dismiss
              </Button>
              <Button
                onClick={() => resolveReportMutation.mutate({
                  reportId: selectedReport.id,
                  status: "resolved",
                  notes: resolutionNotes,
                })}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Resolve
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
