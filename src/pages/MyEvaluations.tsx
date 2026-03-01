import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ChefHat, Clock, Check, X, MapPin, Calendar,
  DollarSign, Timer, Package, Mail, Star,
} from "lucide-react";
import { format } from "date-fns";

interface Invitation {
  id: string;
  domain_slug: string;
  status: string;
  product_name: string | null;
  product_name_ar: string | null;
  product_description: string | null;
  product_description_ar: string | null;
  product_images: string[];
  evaluation_date: string | null;
  evaluation_location: string | null;
  evaluation_location_ar: string | null;
  expected_duration_minutes: number;
  offered_amount: number | null;
  currency: string;
  response_deadline: string | null;
  notes: string | null;
  notes_ar: string | null;
  created_at: string;
}

export default function MyEvaluations() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const { data: invitations, isLoading } = useQuery({
    queryKey: ["my-evaluation-invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluation_invitations" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Invitation[];
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, status, decline_reason }: { id: string; status: string; decline_reason?: string }) => {
      const { error } = await supabase
        .from("evaluation_invitations" as any)
        .update({
          status,
          decline_reason: decline_reason || null,
          responded_at: new Date().toISOString(),
        } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["my-evaluation-invitations"] });
      toast.success(
        vars.status === "accepted"
          ? (isAr ? "تم قبول الدعوة" : "Invitation accepted")
          : (isAr ? "تم رفض الدعوة" : "Invitation declined")
      );
      setDeclineId(null);
      setDeclineReason("");
    },
    onError: () => toast.error(isAr ? "حدث خطأ" : "Action failed"),
  });

  const pending = invitations?.filter(i => i.status === "pending") || [];
  const responded = invitations?.filter(i => i.status !== "pending") || [];

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Star className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{isAr ? "دعوات التقييم" : "My Evaluation Invitations"}</h1>
          <p className="text-sm text-muted-foreground">
            {isAr ? "إدارة دعوات تقييم المنتجات والمسابقات" : "Manage your product & competition evaluation invitations"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/40">
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto h-5 w-5 text-chart-4 mb-1" />
            <p className="text-2xl font-black">{pending.length}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "في الانتظار" : "Pending"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4 text-center">
            <Check className="mx-auto h-5 w-5 text-chart-5 mb-1" />
            <p className="text-2xl font-black">{invitations?.filter(i => i.status === "accepted").length || 0}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "مقبولة" : "Accepted"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4 text-center">
            <X className="mx-auto h-5 w-5 text-destructive mb-1" />
            <p className="text-2xl font-black">{invitations?.filter(i => i.status === "declined").length || 0}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "مرفوضة" : "Declined"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invitations */}
      {pending.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {isAr ? "دعوات في الانتظار" : "Pending Invitations"}
          </h2>
          {pending.map(inv => (
            <Card key={inv.id} className="border-primary/20 border-2">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg">
                      {isAr && inv.product_name_ar ? inv.product_name_ar : inv.product_name}
                    </h3>
                    <Badge variant="secondary" className="text-[10px] mt-1">{inv.domain_slug}</Badge>
                  </div>
                  {inv.response_deadline && (
                    <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
                      <Timer className="h-3 w-3" />
                      {isAr ? "آخر موعد:" : "Deadline:"} {format(new Date(inv.response_deadline), "MMM d")}
                    </Badge>
                  )}
                </div>

                {inv.product_description && (
                  <p className="text-sm text-muted-foreground">
                    {isAr && inv.product_description_ar ? inv.product_description_ar : inv.product_description}
                  </p>
                )}

                {/* Product images */}
                {inv.product_images?.length > 0 && (
                  <div className="flex gap-2">
                    {inv.product_images.slice(0, 4).map((url, i) => (
                      <div key={i} className="h-16 w-16 rounded-xl overflow-hidden border border-border/40">
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {inv.evaluation_date && (
                    <div className="rounded-xl border border-border/40 p-3">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">{isAr ? "التاريخ" : "Date"}</p>
                      <p className="text-sm font-bold">{format(new Date(inv.evaluation_date), "MMM d, yyyy")}</p>
                    </div>
                  )}
                  {inv.evaluation_location && (
                    <div className="rounded-xl border border-border/40 p-3">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">{isAr ? "الموقع" : "Location"}</p>
                      <p className="text-sm font-bold">{isAr && inv.evaluation_location_ar ? inv.evaluation_location_ar : inv.evaluation_location}</p>
                    </div>
                  )}
                  <div className="rounded-xl border border-border/40 p-3">
                    <Timer className="h-3.5 w-3.5 text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">{isAr ? "المدة" : "Duration"}</p>
                    <p className="text-sm font-bold">{inv.expected_duration_minutes} {isAr ? "دقيقة" : "min"}</p>
                  </div>
                  {inv.offered_amount && (
                    <div className="rounded-xl border border-border/40 p-3">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">{isAr ? "المبلغ" : "Amount"}</p>
                      <p className="text-sm font-bold">{inv.offered_amount} {inv.currency}</p>
                    </div>
                  )}
                </div>

                {inv.notes && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground mb-1">{isAr ? "ملاحظات" : "Notes"}</p>
                    <p className="text-sm">{isAr && inv.notes_ar ? inv.notes_ar : inv.notes}</p>
                  </div>
                )}

                <Separator />

                {declineId === inv.id ? (
                  <div className="space-y-3">
                    <Label>{isAr ? "سبب الرفض" : "Decline Reason"}</Label>
                    <Textarea value={declineReason} onChange={e => setDeclineReason(e.target.value)} rows={2} placeholder={isAr ? "اذكر السبب..." : "Provide reason..."} />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => setDeclineId(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => respondMutation.mutate({ id: inv.id, status: "declined", decline_reason: declineReason })}
                        disabled={!declineReason.trim()}
                      >
                        {isAr ? "تأكيد الرفض" : "Confirm Decline"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => setDeclineId(inv.id)}
                    >
                      <X className="h-4 w-4" />
                      {isAr ? "رفض" : "Decline"}
                    </Button>
                    <Button
                      className="gap-1.5"
                      onClick={() => respondMutation.mutate({ id: inv.id, status: "accepted" })}
                    >
                      <Check className="h-4 w-4" />
                      {isAr ? "قبول الدعوة" : "Accept Invitation"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Past Invitations */}
      {responded.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">{isAr ? "الدعوات السابقة" : "Past Invitations"}</h2>
          {responded.map(inv => (
            <Card key={inv.id} className="border-border/40">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{isAr && inv.product_name_ar ? inv.product_name_ar : inv.product_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {inv.evaluation_date ? format(new Date(inv.evaluation_date), "MMM d, yyyy") : ""}
                    {inv.offered_amount ? ` · ${inv.offered_amount} ${inv.currency}` : ""}
                  </p>
                </div>
                <Badge variant={inv.status === "accepted" ? "default" : "destructive"} className="text-[10px] uppercase">
                  {inv.status === "accepted" ? (isAr ? "مقبولة" : "Accepted") : (isAr ? "مرفوضة" : "Declined")}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && !invitations?.length && (
        <Card>
          <CardContent className="py-16 text-center">
            <ChefHat className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 font-medium text-lg">{isAr ? "لا توجد دعوات تقييم" : "No Evaluation Invitations"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isAr ? "ستظهر هنا عند تلقي دعوة لتقييم منتج أو مسابقة" : "Invitations will appear here when you're invited to evaluate a product or competition"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
