import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { sendNotification } from "@/lib/notifications";
import { executeWorkflow } from "@/lib/workflowAutomation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  ChefHat,
  Eye,
  Loader2,
} from "lucide-react";

interface Registration {
  id: string;
  registration_number: string | null;
  dish_name: string | null;
  dish_description: string | null;
  dish_image_url: string | null;
  status: string;
  registered_at: string;
  category_id: string | null;
  participant: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
  } | null;
  category: {
    id: string;
    name: string;
    name_ar: string | null;
  } | null;
}

interface RegistrationApprovalPanelProps {
  competitionId: string;
}

const STATUS_BADGE: Record<string, { className: string; icon: React.ElementType }> = {
  pending: { className: "bg-warning/20 text-warning", icon: Clock },
  approved: { className: "bg-primary/20 text-primary", icon: CheckCircle },
  rejected: { className: "bg-destructive/20 text-destructive", icon: XCircle },
  withdrawn: { className: "bg-muted text-muted-foreground", icon: XCircle },
};

export function RegistrationApprovalPanel({ competitionId }: RegistrationApprovalPanelProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: registrations, isLoading } = useQuery({
    queryKey: ["competition-registrations", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_registrations")
        .select(`
          id,
          registration_number,
          dish_name,
          dish_description,
          dish_image_url,
          status,
          registered_at,
          category_id,
          participant_id
        `)
        .eq("competition_id", competitionId)
        .order("registered_at", { ascending: false });

      if (error) throw error;

      // Fetch participant profiles separately
      const participantIds = data.map((r) => r.participant_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username")
        .in("user_id", participantIds);

      // Fetch categories
      const { data: categories } = await supabase
        .from("competition_categories")
        .select("id, name, name_ar")
        .eq("competition_id", competitionId);

      // Map registrations with participant and category info
      return data.map((reg) => ({
        ...reg,
        participant: profiles?.find((p) => p.user_id === reg.participant_id) || null,
        category: categories?.find((c) => c.id === reg.category_id) || null,
      })) as Registration[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (registration: Registration) => {
      const { error } = await supabase
        .from("competition_registrations")
        .update({
          status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", registration.id);

      if (error) throw error;

      // Send notification to participant
      if (registration.participant?.user_id) {
        sendNotification({
          userId: registration.participant.user_id,
          title: "Registration Approved!",
          titleAr: "تمت الموافقة على التسجيل!",
          body: `Your registration for ${registration.dish_name || "the competition"} has been approved.`,
          bodyAr: `تمت الموافقة على تسجيلك في ${registration.dish_name || "المسابقة"}.`,
          type: "success",
          link: `/competitions/${competitionId}`,
          channels: ["in_app", "email"],
        });
      }

      // Trigger workflow
      executeWorkflow("registration_approved", {
        competitionId,
        userId: registration.participant?.user_id,
      }).catch(() => {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-registrations", competitionId] });
      toast({
        title: language === "ar" ? "تمت الموافقة!" : "Approved!",
        description: language === "ar"
          ? "تم قبول تسجيل المشارك"
          : "The participant's registration has been approved.",
      });
      setViewDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: language === "ar" ? "فشلت الموافقة" : "Approval failed",
        description: error.message,
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ registration, reason }: { registration: Registration; reason: string }) => {
      const { error } = await supabase
        .from("competition_registrations")
        .update({
          status: "rejected",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", registration.id);

      if (error) throw error;

      // Send notification to participant
      if (registration.participant?.user_id) {
        sendNotification({
          userId: registration.participant.user_id,
          title: "Registration Update",
          titleAr: "تحديث التسجيل",
          body: `Your registration has been reviewed.${reason ? ` Reason: ${reason}` : ""}`,
          bodyAr: `تم مراجعة تسجيلك.${reason ? ` السبب: ${reason}` : ""}`,
          type: "warning",
          link: `/competitions/${competitionId}`,
          channels: ["in_app", "email"],
        });
      }

      // Trigger workflow
      executeWorkflow("registration_rejected", {
        competitionId,
        userId: registration.participant?.user_id,
        metadata: { reason },
      }).catch(() => {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-registrations", competitionId] });
      toast({
        title: language === "ar" ? "تم الرفض" : "Rejected",
        description: language === "ar"
          ? "تم رفض تسجيل المشارك"
          : "The participant's registration has been rejected.",
      });
      setRejectDialogOpen(false);
      setViewDialogOpen(false);
      setRejectReason("");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: language === "ar" ? "فشل الرفض" : "Rejection failed",
        description: error.message,
      });
    },
  });

  const filteredRegistrations = registrations?.filter((reg) =>
    statusFilter === "all" ? true : reg.status === statusFilter
  );

  const statusCounts = registrations?.reduce(
    (acc, reg) => {
      acc[reg.status] = (acc[reg.status] || 0) + 1;
      acc.all += 1;
      return acc;
    },
    { all: 0, pending: 0, approved: 0, rejected: 0, withdrawn: 0 } as Record<string, number>
  ) || { all: 0, pending: 0, approved: 0, rejected: 0, withdrawn: 0 };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">
          {language === "ar" ? "إدارة التسجيلات" : "Manage Registrations"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {language === "ar"
            ? "راجع تسجيلات المشاركين وقم بالموافقة عليها أو رفضها"
            : "Review and approve or reject participant registrations"}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: language === "ar" ? "الكل" : "All" },
          { key: "pending", label: language === "ar" ? "معلق" : "Pending" },
          { key: "approved", label: language === "ar" ? "موافق عليه" : "Approved" },
          { key: "rejected", label: language === "ar" ? "مرفوض" : "Rejected" },
        ].map((filter) => (
          <Button
            key={filter.key}
            variant={statusFilter === filter.key ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(filter.key)}
            className="gap-1"
          >
            {filter.label}
            <Badge variant="secondary" className="ml-1">
              {statusCounts[filter.key] || 0}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Registrations List */}
      {filteredRegistrations && filteredRegistrations.length > 0 ? (
        <div className="space-y-4">
          {filteredRegistrations.map((registration) => {
            const StatusIcon = STATUS_BADGE[registration.status]?.icon || Clock;
            const statusClass = STATUS_BADGE[registration.status]?.className || "";

            return (
              <Card key={registration.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  {/* Dish Image */}
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {registration.dish_image_url ? (
                      <img
                        src={registration.dish_image_url}
                        alt={registration.dish_name || "Dish"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ChefHat className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        {registration.dish_name || (language === "ar" ? "طبق بدون اسم" : "Unnamed Dish")}
                      </h4>
                      {registration.registration_number && (
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {registration.registration_number}
                        </Badge>
                      )}
                      <Badge className={statusClass}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {registration.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={registration.participant?.avatar_url || undefined} />
                        <AvatarFallback>
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {registration.participant?.full_name ||
                          registration.participant?.username ||
                          (language === "ar" ? "مشارك" : "Participant")}
                      </span>
                    </div>

                    {registration.category && (
                      <p className="text-xs text-muted-foreground">
                        {language === "ar" && registration.category.name_ar
                          ? registration.category.name_ar
                          : registration.category.name}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRegistration(registration);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      {language === "ar" ? "عرض" : "View"}
                    </Button>
                    {registration.status === "pending" && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => approveMutation.mutate(registration)}
                          disabled={approveMutation.isPending}
                        >
                          {approveMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedRegistration(registration);
                            setRejectDialogOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              {language === "ar" ? "لا توجد تسجيلات حتى الآن" : "No registrations yet"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* View Registration Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === "ar" ? "تفاصيل التسجيل" : "Registration Details"}
            </DialogTitle>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-4">
              {/* Dish Image */}
              {selectedRegistration.dish_image_url && (
                <img
                  src={selectedRegistration.dish_image_url}
                  alt={selectedRegistration.dish_name || "Dish"}
                  className="h-48 w-full rounded-lg object-cover"
                />
              )}

              {/* Participant Info */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedRegistration.participant?.avatar_url || undefined} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {selectedRegistration.participant?.full_name ||
                      selectedRegistration.participant?.username ||
                      (language === "ar" ? "مشارك" : "Participant")}
                  </p>
                  {selectedRegistration.participant?.username && (
                    <p className="text-sm text-muted-foreground">
                      @{selectedRegistration.participant.username}
                    </p>
                  )}
                </div>
              </div>

              {/* Dish Info */}
              <div className="space-y-2">
                <div>
                  <Label className="text-muted-foreground">
                    {language === "ar" ? "اسم الطبق" : "Dish Name"}
                  </Label>
                  <p className="font-medium">
                    {selectedRegistration.dish_name || (language === "ar" ? "غير محدد" : "Not specified")}
                  </p>
                </div>

                {selectedRegistration.dish_description && (
                  <div>
                    <Label className="text-muted-foreground">
                      {language === "ar" ? "الوصف" : "Description"}
                    </Label>
                    <p className="whitespace-pre-wrap text-sm">
                      {selectedRegistration.dish_description}
                    </p>
                  </div>
                )}

                {selectedRegistration.category && (
                  <div>
                    <Label className="text-muted-foreground">
                      {language === "ar" ? "الفئة" : "Category"}
                    </Label>
                    <p>
                      {language === "ar" && selectedRegistration.category.name_ar
                        ? selectedRegistration.category.name_ar
                        : selectedRegistration.category.name}
                    </p>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground">
                    {language === "ar" ? "الحالة" : "Status"}
                  </Label>
                  <Badge className={STATUS_BADGE[selectedRegistration.status]?.className || ""}>
                    {selectedRegistration.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {selectedRegistration?.status === "pending" && (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="destructive"
                onClick={() => {
                  setRejectDialogOpen(true);
                }}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {language === "ar" ? "رفض" : "Reject"}
              </Button>
              <Button
                onClick={() => approveMutation.mutate(selectedRegistration)}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                {language === "ar" ? "موافقة" : "Approve"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "ar" ? "رفض التسجيل" : "Reject Registration"}
            </DialogTitle>
            <DialogDescription>
              {language === "ar"
                ? "هل أنت متأكد من رفض هذا التسجيل؟"
                : "Are you sure you want to reject this registration?"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reject-reason">
              {language === "ar" ? "سبب الرفض (اختياري)" : "Reason for rejection (optional)"}
            </Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={
                language === "ar"
                  ? "أدخل سبب الرفض..."
                  : "Enter reason for rejection..."
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedRegistration &&
                rejectMutation.mutate({
                  registration: selectedRegistration,
                  reason: rejectReason,
                })
              }
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              {language === "ar" ? "تأكيد الرفض" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
