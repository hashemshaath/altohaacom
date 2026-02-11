import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTastingSessions, useUpdateTastingSession, useDeleteTastingSession, SessionStatus } from "@/hooks/useTasting";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  UtensilsCrossed, Search, MoreHorizontal, Eye, Trash2, RefreshCw,
  Plus, BarChart3, Clock, CheckCircle2, FileEdit, AlertCircle,
  Calendar, MapPin, Star, Hash
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const statusConfig: Record<string, { color: string; icon: any; en: string; ar: string }> = {
  draft: { color: "bg-muted text-muted-foreground", icon: FileEdit, en: "Draft", ar: "مسودة" },
  open: { color: "bg-chart-4/10 text-chart-4 border-chart-4/30", icon: Clock, en: "Open", ar: "مفتوح" },
  in_progress: { color: "bg-primary/10 text-primary border-primary/30", icon: RefreshCw, en: "In Progress", ar: "قيد التقييم" },
  completed: { color: "bg-chart-5/10 text-chart-5 border-chart-5/30", icon: CheckCircle2, en: "Completed", ar: "مكتمل" },
  cancelled: { color: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertCircle, en: "Cancelled", ar: "ملغى" },
};

const evalMethodLabels: Record<string, { en: string; ar: string; icon: any }> = {
  numeric: { en: "Numeric", ar: "رقمي", icon: Hash },
  stars: { en: "Stars", ar: "نجوم", icon: Star },
  pass_fail: { en: "Pass/Fail", ar: "نجاح/رسوب", icon: CheckCircle2 },
};

const statusOptions: SessionStatus[] = ["draft", "open", "in_progress", "completed", "cancelled"];

export default function TastingsAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const { data: sessions, isLoading } = useTastingSessions();
  const updateSession = useUpdateTastingSession();
  const deleteSession = useDeleteTastingSession();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return sessions?.filter(s => {
      const q = search.toLowerCase();
      const matchesSearch = !q || s.title.toLowerCase().includes(q) || s.title_ar?.toLowerCase().includes(q) || s.venue?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      const matchesMethod = methodFilter === "all" || s.eval_method === methodFilter;
      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [sessions, search, statusFilter, methodFilter]);

  const stats = useMemo(() => {
    if (!sessions) return { total: 0, active: 0, completed: 0, draft: 0 };
    return {
      total: sessions.length,
      active: sessions.filter(s => s.status === "open" || s.status === "in_progress").length,
      completed: sessions.filter(s => s.status === "completed").length,
      draft: sessions.filter(s => s.status === "draft").length,
    };
  }, [sessions]);

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const handleStatusChange = async (id: string, newStatus: SessionStatus) => {
    try {
      await updateSession.mutateAsync({ id, status: newStatus } as any);
      toast.success(isAr ? "تم تحديث الحالة" : "Status updated");
    } catch {
      toast.error(isAr ? "خطأ في التحديث" : "Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteSession.mutateAsync(deleteId);
      toast.success(isAr ? "تم حذف الجلسة" : "Session deleted");
    } catch {
      toast.error(isAr ? "خطأ في الحذف" : "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{isAr ? "إدارة جلسات التذوق" : "Tasting Sessions"}</h1>
            <p className="text-sm text-muted-foreground">{isAr ? "إدارة ومراقبة جميع جلسات التقييم" : "Manage and monitor all evaluation sessions"}</p>
          </div>
        </div>
        <Button onClick={() => navigate("/tastings/create")} className="gap-2">
          <Plus className="h-4 w-4" />
          {isAr ? "جلسة جديدة" : "New Session"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: isAr ? "إجمالي الجلسات" : "Total Sessions", value: stats.total, icon: UtensilsCrossed, accent: "text-primary bg-primary/10" },
          { label: isAr ? "نشطة حالياً" : "Active Now", value: stats.active, icon: RefreshCw, accent: "text-chart-4 bg-chart-4/10" },
          { label: isAr ? "مكتملة" : "Completed", value: stats.completed, icon: CheckCircle2, accent: "text-chart-5 bg-chart-5/10" },
          { label: isAr ? "مسودات" : "Drafts", value: stats.draft, icon: FileEdit, accent: "text-muted-foreground bg-muted" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="truncate text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Completion Rate */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <BarChart3 className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">{isAr ? "معدل الإنجاز" : "Completion Rate"}</span>
              <span className="text-muted-foreground">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={isAr ? "بحث بالعنوان أو المكان..." : "Search by title or venue..."} value={search} onChange={e => setSearch(e.target.value)} className="ps-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={isAr ? "الحالة" : "Status"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "كل الحالات" : "All Status"}</SelectItem>
            {statusOptions.map(s => (
              <SelectItem key={s} value={s}>{isAr ? statusConfig[s].ar : statusConfig[s].en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={isAr ? "الطريقة" : "Method"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "كل الطرق" : "All Methods"}</SelectItem>
            {Object.entries(evalMethodLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "الجلسة" : "Session"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead className="hidden md:table-cell">{isAr ? "الطريقة" : "Method"}</TableHead>
                <TableHead className="hidden lg:table-cell">{isAr ? "التاريخ" : "Date"}</TableHead>
                <TableHead className="hidden lg:table-cell">{isAr ? "الموقع" : "Location"}</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                        <UtensilsCrossed className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                      <p className="font-medium text-muted-foreground">{isAr ? "لا توجد جلسات" : "No sessions found"}</p>
                      <p className="text-xs text-muted-foreground/60">{isAr ? "جرب تغيير الفلاتر" : "Try adjusting your filters"}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered?.map(session => {
                  const sc = statusConfig[session.status] || statusConfig.draft;
                  const em = evalMethodLabels[session.eval_method] || evalMethodLabels.numeric;
                  const StatusIcon = sc.icon;
                  const MethodIcon = em.icon;

                  return (
                    <TableRow key={session.id} className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => navigate(`/tastings/${session.id}`)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/5">
                            <UtensilsCrossed className="h-4 w-4 text-primary/70" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-sm">{isAr && session.title_ar ? session.title_ar : session.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {session.is_blind_tasting && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{isAr ? "أعمى" : "Blind"}</Badge>
                              )}
                              {session.country && (
                                <span className="text-xs text-muted-foreground">{session.country}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Select value={session.status} onValueChange={v => handleStatusChange(session.id, v as SessionStatus)}>
                          <SelectTrigger className="h-7 w-auto border-none bg-transparent p-0 shadow-none">
                            <Badge variant="outline" className={`${sc.color} gap-1 text-xs`}>
                              <StatusIcon className="h-3 w-3" />
                              {isAr ? sc.ar : sc.en}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(s => {
                              const cfg = statusConfig[s];
                              const Icon = cfg.icon;
                              return (
                                <SelectItem key={s} value={s}>
                                  <span className="flex items-center gap-2">
                                    <Icon className="h-3.5 w-3.5" />
                                    {isAr ? cfg.ar : cfg.en}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <MethodIcon className="h-3 w-3" />
                              {isAr ? em.ar : em.en}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>{isAr ? "طريقة التقييم" : "Evaluation method"}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {session.session_date ? (
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(session.session_date), "MMM d, yyyy")}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {session.venue ? (
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[120px]">{session.venue}</span>
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/tastings/${session.id}`)} className="gap-2">
                              <Eye className="h-4 w-4" />{isAr ? "عرض التفاصيل" : "View Details"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteId(session.id)} className="gap-2 text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4" />{isAr ? "حذف" : "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Results Summary */}
      {filtered && filtered.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {isAr ? `عرض ${filtered.length} من ${sessions?.length ?? 0} جلسة` : `Showing ${filtered.length} of ${sessions?.length ?? 0} sessions`}
        </p>
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "تأكيد الحذف" : "Confirm Delete"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{isAr ? "هل أنت متأكد من حذف هذه الجلسة؟ سيتم حذف جميع الأطباق والتقييمات المرتبطة بها. لا يمكن التراجع." : "Are you sure you want to delete this session? All associated entries and scores will be removed. This cannot be undone."}</p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteSession.isPending}>
              {deleteSession.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : (isAr ? "حذف" : "Delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
