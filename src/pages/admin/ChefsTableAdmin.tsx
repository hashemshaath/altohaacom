import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  useChefsTableSessions, useChefsTableRequests,
  useApproveRequest, useRejectRequest,
} from "@/hooks/useChefsTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  ChefHat, Search, Eye, Package, Calendar, FileText,
  Clock, Check, X, Building2, ThumbsUp, ThumbsDown, MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const experienceLabels: Record<string, { en: string; ar: string }> = {
  venue: { en: "On-Site", ar: "في الموقع" },
  chef_kitchen: { en: "Chef's Kitchen", ar: "مطبخ الشيف" },
  sample_delivery: { en: "Sample Delivery", ar: "توصيل عينات" },
};

export default function ChefsTableAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const { data: sessions, isLoading: sessionsLoading } = useChefsTableSessions();
  const { data: requests, isLoading: requestsLoading } = useChefsTableRequests();
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredSessions = useMemo(() => {
    return sessions?.filter(s => {
      const q = search.toLowerCase();
      const matchSearch = s.title.toLowerCase().includes(q) || s.product_name.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [sessions, search, statusFilter]);

  const pendingRequests = requests?.filter(r => r.status === "pending") || [];

  const handleApprove = async (req: any) => {
    setProcessingId(req.id);
    try {
      await approveRequest.mutateAsync({ id: req.id });
      toast.success(isAr ? "تمت الموافقة وإنشاء الجلسة" : "Approved & session created");
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Failed to approve");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) return;
    setProcessingId(selectedRequest.id);
    try {
      await rejectRequest.mutateAsync({ id: selectedRequest.id, rejection_reason: rejectionReason });
      toast.success(isAr ? "تم رفض الطلب" : "Request rejected");
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedRequest(null);
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Failed to reject");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={ChefHat}
        title={isAr ? "طاولة الشيف" : "Chef's Table"}
        description={isAr ? "إدارة طلبات وجلسات تقييم المنتجات" : "Manage product evaluation requests & sessions"}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: isAr ? "الطلبات المعلقة" : "Pending Requests", count: pendingRequests.length, icon: Clock, color: "text-chart-4" },
          { label: isAr ? "الجلسات المجدولة" : "Scheduled", count: sessions?.filter(s => s.status === "scheduled").length || 0, icon: Calendar, color: "text-primary" },
          { label: isAr ? "قيد التنفيذ" : "In Progress", count: sessions?.filter(s => s.status === "in_progress").length || 0, icon: ChefHat, color: "text-chart-5" },
          { label: isAr ? "مكتملة" : "Completed", count: sessions?.filter(s => s.status === "completed").length || 0, icon: Check, color: "text-chart-5" },
        ].map((stat, i) => (
          <Card key={i} className="border-border/40">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-black">{stat.count}</p>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {isAr ? "الطلبات" : "Requests"}
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ms-1 h-5 min-w-5 px-1.5 text-[10px]">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-1.5">
            <ChefHat className="h-3.5 w-3.5" />
            {isAr ? "الجلسات" : "Sessions"}
          </TabsTrigger>
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {requestsLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : requests?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="mt-3 font-medium">{isAr ? "لا توجد طلبات" : "No requests"}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {requests?.map(req => (
                <Card key={req.id} className="border-border/40">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base">
                            {isAr && req.title_ar ? req.title_ar : req.title}
                          </h3>
                          <Badge
                            variant={req.status === "pending" ? "secondary" : req.status === "approved" ? "default" : "destructive"}
                            className="text-[10px] uppercase tracking-wider"
                          >
                            {req.status === "pending" && <Clock className="h-3 w-3 me-1" />}
                            {req.status === "approved" && <Check className="h-3 w-3 me-1" />}
                            {req.status === "rejected" && <X className="h-3 w-3 me-1" />}
                            {req.status}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5" />
                            {isAr && req.product_name_ar ? req.product_name_ar : req.product_name}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">{req.product_category}</Badge>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {experienceLabels[req.experience_type]?.[isAr ? "ar" : "en"] || req.experience_type}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <ChefHat className="h-3.5 w-3.5" />
                            {req.chef_count} {isAr ? "طاهٍ" : "chefs"}
                          </span>
                        </div>

                        {req.product_description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{req.product_description}</p>
                        )}

                        <p className="text-xs text-muted-foreground">
                          {format(new Date(req.created_at), "MMM d, yyyy 'at' HH:mm")}
                        </p>

                        {req.rejection_reason && (
                          <div className="mt-2 rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                            <p className="text-xs font-bold text-destructive mb-1">{isAr ? "سبب الرفض" : "Rejection Reason"}</p>
                            <p className="text-sm text-destructive/80">{req.rejection_reason}</p>
                          </div>
                        )}
                      </div>

                      {req.status === "pending" && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            className="gap-1.5"
                            disabled={processingId === req.id}
                            onClick={() => handleApprove(req)}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            {isAr ? "موافقة" : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-destructive hover:text-destructive"
                            disabled={processingId === req.id}
                            onClick={() => {
                              setSelectedRequest(req);
                              setRejectDialogOpen(true);
                            }}
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                            {isAr ? "رفض" : "Reject"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} className="ps-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                <SelectItem value="scheduled">{isAr ? "مجدول" : "Scheduled"}</SelectItem>
                <SelectItem value="in_progress">{isAr ? "قيد التنفيذ" : "In Progress"}</SelectItem>
                <SelectItem value="completed">{isAr ? "مكتمل" : "Completed"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sessionsLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : filteredSessions?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ChefHat className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="mt-3 font-medium">{isAr ? "لا توجد جلسات" : "No sessions yet"}</p>
                <p className="text-sm text-muted-foreground mt-1">{isAr ? "وافق على طلب لإنشاء جلسة تلقائياً" : "Approve a request to auto-create a session"}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/40">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "الجلسة" : "Session"}</TableHead>
                    <TableHead>{isAr ? "المنتج" : "Product"}</TableHead>
                    <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions?.map(session => (
                    <TableRow key={session.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/chefs-table/${session.id}`)}>
                      <TableCell className="font-medium">{isAr && session.title_ar ? session.title_ar : session.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          {isAr && session.product_name_ar ? session.product_name_ar : session.product_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {experienceLabels[session.experience_type]?.[isAr ? "ar" : "en"] || session.experience_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase">{session.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {session.session_date ? format(new Date(session.session_date), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "رفض الطلب" : "Reject Request"}</DialogTitle>
            <DialogDescription>
              {isAr ? "يرجى تقديم سبب الرفض" : "Please provide a reason for rejecting this request"}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder={isAr ? "سبب الرفض..." : "Rejection reason..."}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processingId !== null}
            >
              {isAr ? "رفض الطلب" : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
