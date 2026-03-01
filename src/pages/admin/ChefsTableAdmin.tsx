import { useState, useMemo, lazy, Suspense } from "react";
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
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { InvitationManager } from "@/components/evaluation/InvitationManager";
import { ChefsTableAnalytics } from "@/components/admin/chefs-table/ChefsTableAnalytics";
import { ChefsTablePipeline } from "@/components/admin/chefs-table/ChefsTablePipeline";
import { ChefsTableSessionDetail } from "@/components/admin/chefs-table/ChefsTableSessionDetail";
import { ChefsTablePricing } from "@/components/admin/chefs-table/ChefsTablePricing";
import { ChefsTableChefRegistrations } from "@/components/admin/chefs-table/ChefsTableChefRegistrations";

import {
  ChefHat, Search, Eye, Package, Calendar, FileText,
  Clock, Check, X, ThumbsUp, ThumbsDown, MapPin, Image,
  Send, Gavel, Printer, ChevronDown, DollarSign, Download,
  Users, AlertCircle, BarChart3, UserPlus, Receipt,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { Checkbox } from "@/components/ui/checkbox";

const JudgesAdmin = lazy(() => import("./JudgesAdmin"));

const experienceLabels: Record<string, { en: string; ar: string }> = {
  venue: { en: "On-Site Venue", ar: "في الموقع" },
  chef_kitchen: { en: "Chef's Kitchen", ar: "مطبخ الشيف" },
  sample_delivery: { en: "Sample Delivery", ar: "توصيل عينات" },
};

const statusConfig: Record<string, { variant: "secondary" | "default" | "destructive" | "outline"; icon: any; color: string }> = {
  pending: { variant: "secondary", icon: Clock, color: "text-chart-4" },
  approved: { variant: "default", icon: Check, color: "text-chart-5" },
  rejected: { variant: "destructive", icon: X, color: "text-destructive" },
  cancelled: { variant: "outline", icon: X, color: "text-muted-foreground" },
};

const sessionStatusConfig: Record<string, { variant: "secondary" | "default" | "destructive" | "outline"; color: string }> = {
  scheduled: { variant: "outline", color: "bg-primary/10 text-primary border-primary/20" },
  in_progress: { variant: "secondary", color: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  completed: { variant: "default", color: "bg-chart-5/10 text-chart-5 border-chart-5/20" },
  cancelled: { variant: "destructive", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function ChefsTableAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const { data: sessions = [], isLoading: sessionsLoading } = useChefsTableSessions();
  const { data: requests = [], isLoading: requestsLoading } = useChefsTableRequests();
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();

  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [requestStatusFilter, setRequestStatusFilter] = useState("all");
  const [sessionSort, setSessionSort] = useState<"date" | "title" | "status">("date");
  const [sessionSortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filteredSessions = useMemo(() => {
    let list = sessions.filter(s => {
      const q = search.toLowerCase();
      const matchSearch = s.title.toLowerCase().includes(q) || s.product_name.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
    list.sort((a, b) => {
      let cmp = 0;
      if (sessionSort === "date") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sessionSort === "title") cmp = a.title.localeCompare(b.title);
      else cmp = a.status.localeCompare(b.status);
      return sessionSortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [sessions, search, statusFilter, sessionSort, sessionSortDir]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchStatus = requestStatusFilter === "all" || r.status === requestStatusFilter;
      return matchStatus;
    });
  }, [requests, requestStatusFilter]);

  const pendingRequests = requests.filter(r => r.status === "pending");

  const bulkSessions = useAdminBulkActions(filteredSessions);

  const { exportCSV: exportSessionsCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الجلسة" : "Session", accessor: (r: any) => isAr && r.title_ar ? r.title_ar : r.title },
      { header: isAr ? "المنتج" : "Product", accessor: (r: any) => isAr && r.product_name_ar ? r.product_name_ar : r.product_name },
      { header: isAr ? "النوع" : "Type", accessor: (r: any) => r.experience_type },
      { header: isAr ? "الحالة" : "Status", accessor: (r: any) => r.status },
      { header: isAr ? "التاريخ" : "Date", accessor: (r: any) => r.session_date ? format(new Date(r.session_date), "yyyy-MM-dd") : "" },
      { header: isAr ? "الطهاة" : "Max Chefs", accessor: (r: any) => r.max_chefs },
    ],
    filename: "chefs-table-sessions",
  });

  const handleApprove = async (req: any) => {
    setProcessingId(req.id);
    try {
      await approveRequest.mutateAsync({ id: req.id });
      toast.success(isAr ? "تمت الموافقة وإنشاء الجلسة" : "Approved & session created");
      setExpandedRequestId(null);
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Failed to approve");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: any) => {
    if (!rejectionReason.trim()) return;
    setProcessingId(req.id);
    try {
      await rejectRequest.mutateAsync({ id: req.id, rejection_reason: rejectionReason });
      toast.success(isAr ? "تم رفض الطلب" : "Request rejected");
      setRejectingId(null);
      setRejectionReason("");
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Failed to reject");
    } finally {
      setProcessingId(null);
    }
  };

  const toggleSort = (col: typeof sessionSort) => {
    if (sessionSort === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSessionSort(col); setSortDir("desc"); }
  };

  const SortIndicator = ({ col }: { col: typeof sessionSort }) => (
    sessionSort === col ? <ChevronDown className={`h-3 w-3 inline-block ms-0.5 transition-transform ${sessionSortDir === "asc" ? "rotate-180" : ""}`} /> : null
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <AdminPageHeader
          icon={ChefHat}
          title={isAr ? "طاولة الشيف" : "Chef's Table"}
          description={isAr ? "إدارة طلبات التقييم والجلسات" : "Evaluations, sessions & judges"}
        />
        <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 sm:gap-1.5 shrink-0 print:hidden" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">{isAr ? "طباعة" : "Print"}</span>
        </Button>
      </div>

      {/* Pipeline - always visible */}
      {!requestsLoading && !sessionsLoading && (
        <ChefsTablePipeline requests={requests} sessions={sessions} />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto scrollbar-none -mx-1 px-1 print:hidden">
          <TabsList className="rounded-2xl border border-border/40 bg-muted/30 backdrop-blur p-1.5 h-auto gap-0.5 w-max">
            <TabsTrigger value="overview" className="gap-1 text-xs rounded-xl data-[state=active]:shadow-sm px-2 sm:px-3">
              <BarChart3 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {isAr ? "عامة" : "Overview"}
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-1 text-xs rounded-xl data-[state=active]:shadow-sm px-2 sm:px-3">
              <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {isAr ? "طلبات" : "Requests"}
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ms-0.5 h-4 min-w-4 px-1 text-[9px]">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-1 text-xs rounded-xl data-[state=active]:shadow-sm px-2 sm:px-3">
              <ChefHat className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {isAr ? "جلسات" : "Sessions"}
            </TabsTrigger>
            <TabsTrigger value="invitations" className="gap-1 text-xs rounded-xl data-[state=active]:shadow-sm px-2 sm:px-3">
              <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {isAr ? "دعوات" : "Invite"}
            </TabsTrigger>
            <TabsTrigger value="judges" className="gap-1 text-xs rounded-xl data-[state=active]:shadow-sm px-2 sm:px-3">
              <Gavel className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {isAr ? "محكمين" : "Judges"}
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-1 text-xs rounded-xl data-[state=active]:shadow-sm px-2 sm:px-3">
              <Receipt className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {isAr ? "تسعير" : "Pricing"}
            </TabsTrigger>
            <TabsTrigger value="registrations" className="gap-1 text-xs rounded-xl data-[state=active]:shadow-sm px-2 sm:px-3">
              <UserPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {isAr ? "تسجيل" : "Register"}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ──────────── Overview / Analytics ──────────── */}
        <TabsContent value="overview">
          {requestsLoading || sessionsLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
              <Skeleton className="h-64 rounded-xl" />
            </div>
          ) : (
            <ChefsTableAnalytics requests={requests} sessions={sessions} />
          )}
        </TabsContent>

        {/* ──────────── Requests Tab ──────────── */}
        <TabsContent value="requests" className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 sm:gap-3 print:hidden">
            <Select value={requestStatusFilter} onValueChange={setRequestStatusFilter}>
              <SelectTrigger className="w-28 sm:w-40 h-8 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                <SelectItem value="pending">{isAr ? "معلق" : "Pending"}</SelectItem>
                <SelectItem value="approved">{isAr ? "موافق" : "Approved"}</SelectItem>
                <SelectItem value="rejected">{isAr ? "مرفوض" : "Rejected"}</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-[10px] sm:text-xs text-muted-foreground ms-auto">
              {filteredRequests.length} {isAr ? "طلب" : "requests"}
            </span>
          </div>

          {requestsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
          ) : filteredRequests.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/20" />
                <p className="mt-4 font-semibold">{isAr ? "لا توجد طلبات" : "No requests found"}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map(req => {
                const isExpanded = expandedRequestId === req.id;
                const isRejecting = rejectingId === req.id;
                const sc = statusConfig[req.status] || statusConfig.pending;
                const StatusIcon = sc.icon;

                return (
                  <Card key={req.id} className={`rounded-2xl border-border/40 transition-all ${isExpanded ? "ring-1 ring-primary/20" : ""}`}>
                    <CardContent className="p-0">
                      {/* Summary Row */}
                      <div
                        className="flex items-start sm:items-center gap-2.5 sm:gap-4 p-3 sm:p-4 cursor-pointer hover:bg-muted/30 transition-colors active:scale-[0.99]"
                        onClick={() => setExpandedRequestId(isExpanded ? null : req.id)}
                      >
                        <div className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-muted ${sc.color}`}>
                          <StatusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <h3 className="font-bold text-xs sm:text-sm truncate">
                              {isAr && req.title_ar ? req.title_ar : req.title}
                            </h3>
                            <Badge variant={sc.variant} className="text-[9px] sm:text-[10px] uppercase tracking-wider shrink-0">
                              {req.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 mt-0.5 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-0.5 sm:gap-1"><Package className="h-2.5 w-2.5 sm:h-3 sm:w-3" />{isAr && req.product_name_ar ? req.product_name_ar : req.product_name}</span>
                            <span className="hidden sm:inline">{req.product_category}</span>
                            <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5 sm:h-3 sm:w-3" />{req.chef_count}</span>
                            <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3" />{req.budget?.toLocaleString()}</span>
                          </div>
                        </div>
                        {req.status === "pending" && (
                          <div className="flex items-center gap-1 shrink-0 print:hidden" onClick={e => e.stopPropagation()}>
                            <Button size="icon" className="h-7 w-7 sm:h-8 sm:w-auto sm:px-2 sm:gap-1" disabled={processingId === req.id} onClick={() => handleApprove(req)}>
                              <ThumbsUp className="h-3 w-3" />
                              <span className="hidden sm:inline text-xs">{isAr ? "موافقة" : "OK"}</span>
                            </Button>
                            <Button size="icon" variant="outline" className="h-7 w-7 sm:h-8 sm:w-auto sm:px-2 sm:gap-1 text-destructive hover:text-destructive" disabled={processingId === req.id}
                              onClick={() => { setRejectingId(isRejecting ? null : req.id); setRejectionReason(""); }}
                            >
                              <ThumbsDown className="h-3 w-3" />
                              <span className="hidden sm:inline text-xs">{isAr ? "رفض" : "No"}</span>
                            </Button>
                          </div>
                        )}
                        <ChevronDown className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0 transition-transform mt-1 sm:mt-0 ${isExpanded ? "rotate-180" : ""}`} />
                      </div>

                      {/* Inline Rejection Form */}
                      {isRejecting && (
                        <div className="px-4 pb-4 border-t border-border/40" onClick={e => e.stopPropagation()}>
                          <div className="mt-3 rounded-lg bg-destructive/5 border border-destructive/20 p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                              <p className="text-sm font-bold text-destructive">{isAr ? "تأكيد الرفض" : "Confirm Rejection"}</p>
                            </div>
                            <Textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                              placeholder={isAr ? "اكتب سبب الرفض..." : "Enter rejection reason..."} rows={2} className="text-sm" />
                            <div className="flex items-center gap-2 justify-end">
                              <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectionReason(""); }}>{isAr ? "إلغاء" : "Cancel"}</Button>
                              <Button size="sm" variant="destructive" disabled={!rejectionReason.trim() || processingId === req.id} onClick={() => handleReject(req)}>
                                {isAr ? "تأكيد الرفض" : "Confirm Reject"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <div className="border-t border-border/40 bg-muted/20 p-5 space-y-5">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              { label: isAr ? "المنتج" : "Product", value: isAr && req.product_name_ar ? req.product_name_ar : req.product_name, icon: Package },
                              { label: isAr ? "الفئة" : "Category", value: req.product_category, icon: FileText },
                              { label: isAr ? "نوع التجربة" : "Experience", value: experienceLabels[req.experience_type]?.[isAr ? "ar" : "en"] || req.experience_type, icon: MapPin },
                              { label: isAr ? "عدد الطهاة" : "Chefs", value: req.chef_count, icon: ChefHat },
                              { label: isAr ? "الميزانية" : "Budget", value: `${req.budget?.toLocaleString() || 0} ${req.currency}`, icon: DollarSign },
                              { label: isAr ? "المدينة" : "City", value: req.preferred_city || "—", icon: MapPin },
                              { label: isAr ? "تاريخ البدء" : "Start", value: req.preferred_date_start ? format(new Date(req.preferred_date_start), "MMM d, yyyy") : "—", icon: Calendar },
                              { label: isAr ? "تاريخ الانتهاء" : "End", value: req.preferred_date_end ? format(new Date(req.preferred_date_end), "MMM d, yyyy") : "—", icon: Calendar },
                            ].map((item, i) => (
                              <div key={i} className="rounded-lg border border-border/30 bg-background p-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <item.icon className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{item.label}</span>
                                </div>
                                <p className="text-sm font-bold">{item.value}</p>
                              </div>
                            ))}
                          </div>
                          {req.product_description && (
                            <div className="rounded-lg border border-border/30 bg-background p-4">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{isAr ? "وصف المنتج" : "Product Description"}</p>
                              <p className="text-sm leading-relaxed whitespace-pre-line">{req.product_description}</p>
                            </div>
                          )}
                          {req.product_images && (req.product_images as string[]).length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Image className="h-3 w-3" />{isAr ? "صور المنتج" : "Product Images"} ({(req.product_images as string[]).length})
                              </p>
                              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                                {(req.product_images as string[]).map((url: string, i: number) => (
                                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border/30 bg-background">
                                    <img src={url} alt="" className="h-full w-full object-cover hover:scale-105 transition-transform" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {req.special_requirements && (
                            <div className="rounded-lg border border-chart-4/20 bg-chart-4/5 p-4">
                              <p className="text-[10px] font-bold text-chart-4 uppercase tracking-wider mb-2">{isAr ? "متطلبات خاصة" : "Special Requirements"}</p>
                              <p className="text-sm">{req.special_requirements}</p>
                            </div>
                          )}
                          {req.preferred_venue && (
                            <div className="rounded-lg border border-border/30 bg-background p-4">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{isAr ? "المكان المفضل" : "Preferred Venue"}</p>
                              <p className="text-sm font-medium">{isAr && req.preferred_venue_ar ? req.preferred_venue_ar : req.preferred_venue}</p>
                            </div>
                          )}
                          {req.rejection_reason && (
                            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4">
                              <p className="text-[10px] font-bold text-destructive uppercase tracking-wider mb-2">{isAr ? "سبب الرفض" : "Rejection Reason"}</p>
                              <p className="text-sm text-destructive/80">{req.rejection_reason}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ──────────── Sessions Tab ──────────── */}
        <TabsContent value="sessions" className="space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 print:hidden">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} className="ps-8 h-8 text-xs sm:text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-28 sm:w-40 h-8 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="scheduled">{isAr ? "مجدول" : "Scheduled"}</SelectItem>
                  <SelectItem value="in_progress">{isAr ? "جاري" : "In Progress"}</SelectItem>
                  <SelectItem value="completed">{isAr ? "مكتمل" : "Completed"}</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-[10px] sm:text-xs text-muted-foreground ms-auto">
                {filteredSessions.length} {isAr ? "جلسة" : "sessions"}
              </span>
            </div>
          </div>

          <BulkActionBar count={bulkSessions.count} onClear={bulkSessions.clearSelection} onExport={() => exportSessionsCSV(bulkSessions.selectedItems)} />

          {sessionsLoading ? (
            <div className="space-y-2 sm:space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 sm:h-20 rounded-xl" />)}</div>
          ) : filteredSessions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 sm:py-16 text-center">
                <ChefHat className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/20" />
                <p className="mt-3 font-semibold text-sm">{isAr ? "لا توجد جلسات" : "No sessions yet"}</p>
                <p className="text-xs text-muted-foreground mt-1">{isAr ? "وافق على طلب لإنشاء جلسة" : "Approve a request to create one"}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="sm:hidden space-y-2">
                {filteredSessions.map(session => {
                  const sc = sessionStatusConfig[session.status] || sessionStatusConfig.scheduled;
                  const isExpanded = expandedSessionId === session.id;
                  return (
                    <Card key={session.id} className={`border-border/40 ${isExpanded ? "ring-1 ring-primary/20" : ""}`}>
                      <CardContent className="p-0">
                        <div
                          className="flex items-start gap-2.5 p-3 cursor-pointer active:scale-[0.99]"
                          onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-xs truncate">{isAr && session.title_ar ? session.title_ar : session.title}</p>
                              <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase border ${sc.color}`}>
                                {session.status.replace("_", " ")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-0.5"><Package className="h-2.5 w-2.5" />{isAr && session.product_name_ar ? session.product_name_ar : session.product_name}</span>
                              <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{session.max_chefs}</span>
                              <span>{session.session_date ? format(new Date(session.session_date), "MMM d") : "—"}</span>
                            </div>
                          </div>
                          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </div>
                        {isExpanded && (
                          <div className="border-t p-0">
                            <ChefsTableSessionDetail session={session} onNavigate={(id) => navigate(`/chefs-table/${id}`)} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop table */}
              <Card className="hidden sm:block border-border/40 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-10">
                        <Checkbox checked={bulkSessions.isAllSelected} onCheckedChange={bulkSessions.toggleAll} />
                      </TableHead>
                      <TableHead className="font-bold text-[11px] uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort("title")}>
                        {isAr ? "الجلسة" : "Session"}<SortIndicator col="title" />
                      </TableHead>
                      <TableHead className="font-bold text-[11px] uppercase tracking-wider">{isAr ? "المنتج" : "Product"}</TableHead>
                      <TableHead className="font-bold text-[11px] uppercase tracking-wider">{isAr ? "النوع" : "Type"}</TableHead>
                      <TableHead className="font-bold text-[11px] uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort("status")}>
                        {isAr ? "الحالة" : "Status"}<SortIndicator col="status" />
                      </TableHead>
                      <TableHead className="font-bold text-[11px] uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort("date")}>
                        {isAr ? "التاريخ" : "Date"}<SortIndicator col="date" />
                      </TableHead>
                      <TableHead className="font-bold text-[11px] uppercase tracking-wider">{isAr ? "الطهاة" : "Chefs"}</TableHead>
                      <TableHead className="print:hidden w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map(session => {
                      const sc = sessionStatusConfig[session.status] || sessionStatusConfig.scheduled;
                      const isExpanded = expandedSessionId === session.id;
                      return (
                        <>
                          <TableRow
                            key={session.id}
                            className={`cursor-pointer transition-colors ${bulkSessions.isSelected(session.id) ? "bg-primary/5" : isExpanded ? "bg-muted/40" : "hover:bg-muted/40"}`}
                            onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                          >
                            <TableCell onClick={e => e.stopPropagation()}>
                              <Checkbox checked={bulkSessions.isSelected(session.id)} onCheckedChange={() => bulkSessions.toggleOne(session.id)} />
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-bold text-sm">{isAr && session.title_ar ? session.title_ar : session.title}</p>
                                {session.session_number && <p className="text-[10px] text-muted-foreground font-mono">#{session.session_number}</p>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-sm">{isAr && session.product_name_ar ? session.product_name_ar : session.product_name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[10px]">
                                {experienceLabels[session.experience_type]?.[isAr ? "ar" : "en"] || session.experience_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${sc.color}`}>
                                {session.status.replace("_", " ")}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground tabular-nums">
                              {session.session_date ? format(new Date(session.session_date), "MMM d, yyyy") : "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm font-medium">{session.max_chefs}</span>
                              </div>
                            </TableCell>
                            <TableCell className="print:hidden">
                              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${session.id}-detail`}>
                              <TableCell colSpan={8} className="p-0">
                                <ChefsTableSessionDetail session={session} onNavigate={(id) => navigate(`/chefs-table/${id}`)} />
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations">
          <InvitationManager />
        </TabsContent>

        {/* Judges Tab */}
        <TabsContent value="judges">
          <Suspense fallback={<Skeleton className="h-96" />}>
            <JudgesAdmin />
          </Suspense>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing">
          <ChefsTablePricing />
        </TabsContent>

        {/* Chef Registration Tab */}
        <TabsContent value="registrations">
          <ChefsTableChefRegistrations />
        </TabsContent>

      </Tabs>
    </div>
  );
}
