import { useState } from "react";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail, CheckCircle, XCircle, Clock, CalendarCheck, Trophy, Eye, Send,
} from "lucide-react";
import { format } from "date-fns";

export default function CompanyInvitations() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [viewInvitation, setViewInvitation] = useState<any>(null);
  const [responseNotes, setResponseNotes] = useState("");

  const { data: invitations, isLoading } = useQuery({
    queryKey: ["companyInvitations", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_invitations")
        .select("*, competitions(title, title_ar, competition_start)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "accepted" | "declined" }) => {
      const { error } = await supabase
        .from("company_invitations")
        .update({
          status,
          responded_at: new Date().toISOString(),
          responded_by: user?.id || null,
          response_notes: responseNotes || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["companyInvitations"] });
      setViewInvitation(null);
      setResponseNotes("");
      toast({
        title: vars.status === "accepted"
          ? (language === "ar" ? "تم قبول الدعوة" : "Invitation accepted")
          : (language === "ar" ? "تم رفض الدعوة" : "Invitation declined"),
      });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const statusConfig: Record<string, { color: "default" | "destructive" | "outline" | "secondary"; icon: any; label: string; labelAr: string }> = {
    pending: { color: "secondary", icon: Clock, label: "Pending", labelAr: "قيد الانتظار" },
    accepted: { color: "default", icon: CheckCircle, label: "Accepted", labelAr: "مقبولة" },
    declined: { color: "destructive", icon: XCircle, label: "Declined", labelAr: "مرفوضة" },
    expired: { color: "outline", icon: Clock, label: "Expired", labelAr: "منتهية" },
  };

  const pendingCount = invitations?.filter(i => i.status === "pending").length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === "ar" ? "الدعوات" : "Invitations"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {language === "ar" ? "دعوات المشاركة والرعاية" : "Participation and sponsorship invitations"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Mail className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{invitations?.length || 0}</p>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "إجمالي الدعوات" : "Total Invitations"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-chart-4" />
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "بانتظار الرد" : "Awaiting Response"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle className="h-8 w-8 text-chart-5" />
            <div>
              <p className="text-2xl font-bold">{invitations?.filter(i => i.status === "accepted").length || 0}</p>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "مقبولة" : "Accepted"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "ar" ? "قائمة الدعوات" : "Invitations List"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : invitations && invitations.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
                    <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
                    <TableHead>{language === "ar" ? "المسابقة" : "Competition"}</TableHead>
                    <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((inv) => {
                    const sc = statusConfig[inv.status || "pending"] || statusConfig.pending;
                    const Icon = sc.icon;
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">
                          {language === "ar" && inv.title_ar ? inv.title_ar : inv.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{inv.invitation_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {inv.competitions
                            ? (language === "ar" && (inv.competitions as any).title_ar
                              ? (inv.competitions as any).title_ar
                              : (inv.competitions as any).title)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {inv.event_date ? format(new Date(inv.event_date), "yyyy-MM-dd") : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sc.color} className="gap-1">
                            <Icon className="h-3 w-3" />
                            {language === "ar" ? sc.labelAr : sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => { setViewInvitation(inv); setResponseNotes(""); }}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {inv.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => respondMutation.mutate({ id: inv.id, status: "accepted" })}
                                  disabled={respondMutation.isPending}
                                >
                                  <CheckCircle className="me-1 h-3.5 w-3.5" />
                                  {language === "ar" ? "قبول" : "Accept"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => { setViewInvitation(inv); setResponseNotes(""); }}
                                >
                                  <XCircle className="me-1 h-3.5 w-3.5" />
                                  {language === "ar" ? "رفض" : "Decline"}
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Mail className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">
                {language === "ar" ? "لا توجد دعوات" : "No invitations found"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invitation Detail Dialog */}
      <Dialog open={!!viewInvitation} onOpenChange={(o) => { if (!o) setViewInvitation(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === "ar" && viewInvitation?.title_ar ? viewInvitation.title_ar : viewInvitation?.title}
            </DialogTitle>
          </DialogHeader>
          {viewInvitation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">{language === "ar" ? "النوع" : "Type"}</p>
                  <p className="font-medium">{viewInvitation.invitation_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{language === "ar" ? "التاريخ" : "Event Date"}</p>
                  <p className="font-medium">
                    {viewInvitation.event_date ? format(new Date(viewInvitation.event_date), "yyyy-MM-dd") : "—"}
                  </p>
                </div>
                {viewInvitation.expires_at && (
                  <div>
                    <p className="text-muted-foreground">{language === "ar" ? "ينتهي في" : "Expires"}</p>
                    <p className="font-medium">{format(new Date(viewInvitation.expires_at), "yyyy-MM-dd")}</p>
                  </div>
                )}
              </div>

              {(viewInvitation.description || viewInvitation.description_ar) && (
                <>
                  <Separator />
                  <p className="text-sm">
                    {language === "ar" && viewInvitation.description_ar ? viewInvitation.description_ar : viewInvitation.description}
                  </p>
                </>
              )}

              {viewInvitation.competitions && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 rounded-xl border p-3">
                    <Trophy className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">
                        {language === "ar" && (viewInvitation.competitions as any).title_ar
                          ? (viewInvitation.competitions as any).title_ar
                          : (viewInvitation.competitions as any).title}
                      </p>
                      {(viewInvitation.competitions as any).competition_start && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date((viewInvitation.competitions as any).competition_start), "yyyy-MM-dd")}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {viewInvitation.status === "pending" && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Textarea
                      placeholder={language === "ar" ? "ملاحظات (اختياري)" : "Response notes (optional)"}
                      value={responseNotes}
                      onChange={(e) => setResponseNotes(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => respondMutation.mutate({ id: viewInvitation.id, status: "accepted" })}
                        disabled={respondMutation.isPending}
                      >
                        <CheckCircle className="me-2 h-4 w-4" />
                        {language === "ar" ? "قبول الدعوة" : "Accept Invitation"}
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => respondMutation.mutate({ id: viewInvitation.id, status: "declined" })}
                        disabled={respondMutation.isPending}
                      >
                        <XCircle className="me-2 h-4 w-4" />
                        {language === "ar" ? "رفض" : "Decline"}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {viewInvitation.response_notes && viewInvitation.status !== "pending" && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{language === "ar" ? "ملاحظات الرد" : "Response Notes"}</p>
                    <p className="text-sm">{viewInvitation.response_notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
