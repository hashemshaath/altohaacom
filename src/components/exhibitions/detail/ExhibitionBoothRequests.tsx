import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock, Building, Loader2, Eye } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

export function ExhibitionBoothRequests({ exhibitionId, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["booth-requests", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_booth_requests")
        .select("id, company_name, company_name_ar, contact_name, contact_email, contact_phone, status, preferred_size, preferred_category, preferred_hall, special_requirements, admin_notes, booth_id, user_id, created_at, reviewed_at")
        .eq("exhibition_id", exhibitionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const updateRequest = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: string }) => {
      const { error } = await supabase
        .from("exhibition_booth_requests")
        .update({
          status,
          admin_notes: adminNotes || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booth-requests", exhibitionId] });
      toast({ title: t("Request updated ✅", "تم تحديث الطلب ✅") });
      setExpandedId(null);
      setAdminNotes("");
    },
    onError: () => {
      toast({ title: t("Update failed", "فشل التحديث"), variant: "destructive" });
    },
  });

  const pendingCount = requests.filter((r: any) => r.status === "pending").length;

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-chart-3/10 text-chart-3 text-[10px]"><CheckCircle2 className="me-1 h-2.5 w-2.5" />{t("Approved", "مقبول")}</Badge>;
      case "rejected": return <Badge className="bg-destructive/10 text-destructive text-[10px]"><XCircle className="me-1 h-2.5 w-2.5" />{t("Declined", "مرفوض")}</Badge>;
      default: return <Badge variant="outline" className="text-[10px]"><Clock className="me-1 h-2.5 w-2.5" />{t("Pending", "بانتظار")}</Badge>;
    }
  };

  if (requests.length === 0 && !isLoading) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-10 text-center">
          <Building className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{t("No booth requests yet", "لا توجد طلبات أجنحة بعد")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{t("Booth Requests", "طلبات الأجنحة")} ({requests.length})</CardTitle>
          {pendingCount > 0 && (
            <Badge className="bg-chart-4/10 text-chart-4 text-[10px]">{pendingCount} {t("pending", "بانتظار")}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{t("Company", "الشركة")}</TableHead>
                <TableHead className="text-xs">{t("Contact", "المسؤول")}</TableHead>
                <TableHead className="text-xs">{t("Category", "الفئة")}</TableHead>
                <TableHead className="text-xs">{t("Size", "الحجم")}</TableHead>
                <TableHead className="text-xs">{t("Status", "الحالة")}</TableHead>
                <TableHead className="text-xs">{t("Date", "التاريخ")}</TableHead>
                <TableHead className="text-xs w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req: any) => (
                <>
                  <TableRow key={req.id} className={expandedId === req.id ? "bg-muted/30" : ""}>
                    <TableCell className="text-xs font-medium">{req.company_name}</TableCell>
                    <TableCell className="text-xs">
                      <div>{req.contact_name}</div>
                      <div className="text-[10px] text-muted-foreground">{req.contact_email}</div>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px] capitalize">{req.preferred_category}</Badge></TableCell>
                    <TableCell className="text-xs capitalize">{req.preferred_size}</TableCell>
                    <TableCell>{statusBadge(req.status)}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">{format(new Date(req.created_at), "MMM d")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {req.status === "pending" && (
                          <>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-chart-3 hover:text-chart-3" onClick={() => updateRequest.mutate({ requestId: req.id, status: "approved" })} disabled={updateRequest.isPending}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => updateRequest.mutate({ requestId: req.id, status: "rejected" })} disabled={updateRequest.isPending}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedId === req.id && (
                    <TableRow key={`${req.id}-detail`}>
                      <TableCell colSpan={7} className="bg-muted/20 p-4">
                        <div className="space-y-3 max-w-2xl">
                          {req.description && (
                            <div>
                              <p className="text-[10px] font-medium text-muted-foreground mb-0.5">{t("Description", "الوصف")}</p>
                              <p className="text-xs">{req.description}</p>
                            </div>
                          )}
                          {req.special_requirements && (
                            <div>
                              <p className="text-[10px] font-medium text-muted-foreground mb-0.5">{t("Special Requirements", "متطلبات خاصة")}</p>
                              <p className="text-xs">{req.special_requirements}</p>
                            </div>
                          )}
                          {req.website_url && (
                            <p className="text-xs"><a href={req.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{req.website_url}</a></p>
                          )}
                          {req.status === "pending" && (
                            <div className="space-y-2 pt-2 border-t border-border/40">
                              <Textarea
                                value={adminNotes}
                                onChange={e => setAdminNotes(e.target.value)}
                                placeholder={t("Add notes (optional)...", "أضف ملاحظات (اختياري)...")}
                                className="text-xs min-h-[50px]"
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
