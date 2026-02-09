import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { sendNotification } from "@/lib/notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Send, Building2, Clock, CheckCircle, XCircle } from "lucide-react";

const REQUEST_STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  viewed: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  partially_accepted: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  fulfilled: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};

interface Props {
  listId: string;
  competitionId: string;
}

export function SponsorshipRequestPanel({ listId, competitionId }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRequest, setNewRequest] = useState({
    sponsor_company_id: "", title: "", title_ar: "", description: "", request_type: "sponsorship", deadline: "",
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ["sponsorship-requests", listId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_sponsorship_requests")
        .select("*, companies:sponsor_company_id(id, name, name_ar, logo_url)")
        .eq("list_id", listId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: sponsors } = useQuery({
    queryKey: ["available-sponsors", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, name_ar, logo_url")
        .in("type", ["sponsor", "supplier", "partner"])
        .eq("status", "active")
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: showCreateDialog,
  });

  // Get list items to include in request
  const { data: listItems } = useQuery({
    queryKey: ["requirement-list-items-for-request", listId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_list_items")
        .select("*, requirement_items(name, name_ar)")
        .eq("list_id", listId);
      if (error) throw error;
      return data;
    },
    enabled: showCreateDialog,
  });

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      const itemsSnapshot = listItems?.map((item) => ({
        item_id: item.item_id || item.id,
        name: item.requirement_items ? (item.requirement_items as any).name : item.custom_name,
        quantity: item.quantity,
        estimated_cost: item.estimated_cost,
      }));
      const totalCost = listItems?.reduce((sum, item) => sum + (Number(item.estimated_cost) || 0) * (item.quantity || 1), 0) || 0;

      const { error } = await supabase.from("requirement_sponsorship_requests").insert({
        list_id: listId,
        competition_id: competitionId,
        sponsor_company_id: newRequest.sponsor_company_id,
        requested_by: user!.id,
        request_type: newRequest.request_type,
        title: newRequest.title,
        title_ar: newRequest.title_ar || null,
        description: newRequest.description || null,
        items: itemsSnapshot,
        total_estimated_cost: totalCost,
        deadline: newRequest.deadline || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsorship-requests", listId] });
      setShowCreateDialog(false);
      setNewRequest({ sponsor_company_id: "", title: "", title_ar: "", description: "", request_type: "sponsorship", deadline: "" });
      toast({ title: language === "ar" ? "تم إنشاء طلب الرعاية" : "Sponsorship request created" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, requestTitle }: { id: string; status: string; requestTitle?: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === "sent") updates.sent_at = new Date().toISOString();
      const { error } = await supabase.from("requirement_sponsorship_requests").update(updates).eq("id", id);
      if (error) throw error;

      // Notify the organizer who created the request about status changes from sponsor side
      if (user && ["accepted", "declined", "partially_accepted", "fulfilled"].includes(status)) {
        // Find the request creator
        const { data: req } = await supabase
          .from("requirement_sponsorship_requests")
          .select("requested_by, title")
          .eq("id", id)
          .single();
        if (req?.requested_by && req.requested_by !== user.id) {
          sendNotification({
            userId: req.requested_by,
            title: `Sponsorship ${status.replace(/_/g, " ")}: ${req.title}`,
            titleAr: `تحديث طلب الرعاية: ${req.title}`,
            body: `Your sponsorship request "${req.title}" has been ${status.replace(/_/g, " ")}.`,
            bodyAr: `تم تحديث طلب الرعاية "${req.title}".`,
            type: status === "accepted" || status === "fulfilled" ? "success" : status === "declined" ? "warning" : "info",
            channels: ["in_app"],
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsorship-requests", listId] });
      toast({ title: language === "ar" ? "تم تحديث الحالة" : "Status updated" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{language === "ar" ? "طلبات الرعاية والدعم" : "Sponsorship & Support Requests"}</h4>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm"><Send className="mr-2 h-4 w-4" />{language === "ar" ? "إرسال طلب" : "Send Request"}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === "ar" ? "إرسال طلب رعاية" : "Create Sponsorship Request"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{language === "ar" ? "الراعي / الشركة" : "Sponsor / Company"}</Label>
                <Select value={newRequest.sponsor_company_id} onValueChange={(v) => setNewRequest({ ...newRequest, sponsor_company_id: v })}>
                  <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر شركة" : "Select company"} /></SelectTrigger>
                  <SelectContent>
                    {sponsors?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {language === "ar" && s.name_ar ? s.name_ar : s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === "ar" ? "نوع الطلب" : "Request Type"}</Label>
                <Select value={newRequest.request_type} onValueChange={(v) => setNewRequest({ ...newRequest, request_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sponsorship">{language === "ar" ? "رعاية" : "Sponsorship"}</SelectItem>
                    <SelectItem value="provision">{language === "ar" ? "توفير مواد" : "Provision"}</SelectItem>
                    <SelectItem value="payment">{language === "ar" ? "دفع" : "Payment"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === "ar" ? "العنوان" : "Title"}</Label>
                <Input value={newRequest.title} onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })} />
              </div>
              <div>
                <Label>{language === "ar" ? "الوصف" : "Description"}</Label>
                <Textarea value={newRequest.description} onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })} />
              </div>
              <div>
                <Label>{language === "ar" ? "الموعد النهائي" : "Deadline"}</Label>
                <Input type="date" value={newRequest.deadline} onChange={(e) => setNewRequest({ ...newRequest, deadline: e.target.value })} />
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "ar"
                  ? `سيتم تضمين ${listItems?.length || 0} عنصر من القائمة في هذا الطلب`
                  : `${listItems?.length || 0} items from the list will be included in this request`}
              </p>
              <Button
                onClick={() => createRequestMutation.mutate()}
                disabled={!newRequest.sponsor_company_id || !newRequest.title || createRequestMutation.isPending}
                className="w-full"
              >
                {language === "ar" ? "إنشاء الطلب" : "Create Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !requests?.length ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Send className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">{language === "ar" ? "لا توجد طلبات رعاية بعد" : "No sponsorship requests yet"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const company = req.companies as any;
            return (
              <Card key={req.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      {company?.logo_url ? (
                        <img src={company.logo_url} alt="" className="h-8 w-8 rounded object-contain" />
                      ) : (
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{req.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {language === "ar" && company?.name_ar ? company.name_ar : company?.name}
                        {req.total_estimated_cost ? ` · $${Number(req.total_estimated_cost).toLocaleString()}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={REQUEST_STATUS_COLORS[req.status] || ""} variant="outline">
                      {req.status.replace(/_/g, " ")}
                    </Badge>
                    {req.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: req.id, status: "sent" })}>
                        <Send className="mr-1 h-3 w-3" /> {language === "ar" ? "إرسال" : "Send"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
