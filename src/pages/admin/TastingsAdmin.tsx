import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTastingSessions, SessionStatus } from "@/hooks/useTasting";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UtensilsCrossed, Search, MoreHorizontal, Eye, Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  open: "bg-chart-4/10 text-chart-4",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-chart-5/10 text-chart-5",
  cancelled: "bg-destructive/10 text-destructive",
};

const statusOptions: SessionStatus[] = ["draft", "open", "in_progress", "completed", "cancelled"];

export default function TastingsAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: sessions, isLoading } = useTastingSessions();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = sessions?.filter(s => {
    const matchesSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (id: string, newStatus: SessionStatus) => {
    const { error } = await supabase
      .from("tasting_sessions" as any)
      .update({ status: newStatus } as any)
      .eq("id", id);
    if (error) {
      toast.error(isAr ? "خطأ في التحديث" : "Failed to update");
    } else {
      toast.success(isAr ? "تم التحديث" : "Status updated");
      queryClient.invalidateQueries({ queryKey: ["tasting-sessions"] });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase
      .from("tasting_sessions" as any)
      .delete()
      .eq("id", deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (error) {
      toast.error(isAr ? "خطأ في الحذف" : "Failed to delete");
    } else {
      toast.success(isAr ? "تم الحذف" : "Session deleted");
      queryClient.invalidateQueries({ queryKey: ["tasting-sessions"] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? "إدارة جلسات التذوق" : "Tasting Sessions"}</h1>
          <p className="text-sm text-muted-foreground">{isAr ? "إدارة ومراقبة جميع جلسات التذوق" : "Manage and monitor all tasting sessions"}</p>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <UtensilsCrossed className="h-3.5 w-3.5" />
          {filtered?.length ?? 0}
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} className="ps-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All Status"}</SelectItem>
            {statusOptions.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead>{isAr ? "الطريقة" : "Method"}</TableHead>
                <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                <TableHead>{isAr ? "المكان" : "Venue"}</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    {isAr ? "لا توجد جلسات" : "No sessions found"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered?.map(session => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{isAr && session.title_ar ? session.title_ar : session.title}</p>
                        {session.is_blind_tasting && <Badge variant="outline" className="mt-1 text-xs">{isAr ? "أعمى" : "Blind"}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={session.status} onValueChange={v => handleStatusChange(session.id, v as SessionStatus)}>
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <Badge variant="outline" className={`${statusColors[session.status]} text-xs`}>{session.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {session.eval_method === "numeric" ? "Numeric" : session.eval_method === "stars" ? "Stars" : "Pass/Fail"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {session.session_date ? format(new Date(session.session_date), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {session.venue || "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/tastings/${session.id}`)} className="gap-2">
                            <Eye className="h-4 w-4" />{isAr ? "عرض" : "View"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteId(session.id)} className="gap-2 text-destructive">
                            <Trash2 className="h-4 w-4" />{isAr ? "حذف" : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "تأكيد الحذف" : "Confirm Delete"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{isAr ? "هل أنت متأكد من حذف هذه الجلسة؟ لا يمكن التراجع." : "Are you sure you want to delete this session? This cannot be undone."}</p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <RefreshCw className="h-4 w-4 animate-spin" /> : (isAr ? "حذف" : "Delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
