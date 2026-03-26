import { useState, memo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  FileText, Search, Download, Clock, CheckCircle2, XCircle,
  Receipt, AlertTriangle, Plus, Ban, CreditCard, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useCSVExport } from "@/hooks/useCSVExport";
import { useToast } from "@/hooks/use-toast";
import { createMembershipInvoice, markInvoicePaid, voidInvoice } from "@/lib/membershipInvoice";

const MembershipInvoicesTab = memo(function MembershipInvoicesTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ user_id: string; full_name: string | null; username: string | null; avatar_url: string | null; membership_tier: string | null } | null>(null);
  const [newInvoice, setNewInvoice] = useState({
    userId: "",
    tier: "professional",
    action: "subscription" as const,
    amount: 19,
  });

  // Search users for invoice creation
  const { data: searchedUsers = [] } = useQuery({
    queryKey: ["invoice-user-search", userSearch],
    queryFn: async () => {
      if (userSearch.length < 2) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url, membership_tier, account_number")
        .or(`full_name.ilike.%${userSearch}%,username.ilike.%${userSearch}%,account_number.ilike.%${userSearch}%`)
        .limit(6);
      return data || [];
    },
    enabled: userSearch.length >= 2,
    staleTime: 10000,
  });

  const { data: invoiceStats } = useQuery({
    queryKey: ["membership-invoice-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices")
        .select("status, amount");

      const total = data?.length || 0;
      const paid = data?.filter(i => i.status === "paid") || [];
      const pending = data?.filter(i => i.status === "pending") || [];
      const overdue = data?.filter(i => i.status === "overdue") || [];

      return {
        total,
        paidAmount: paid.reduce((s, i) => s + (i.amount || 0), 0),
        pendingAmount: pending.reduce((s, i) => s + (i.amount || 0), 0),
        overdueCount: overdue.length,
      };
    },
  });

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["membership-invoices", search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select("id, invoice_number, user_id, amount, currency, status, title, title_ar, due_date, paid_at, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (search) query = query.ilike("invoice_number", `%${search}%`);

      const { data } = await query;
      return data || [];
    },
  });

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "رقم الفاتورة" : "Invoice #", accessor: (r: any) => r.invoice_number || "" },
      { header: isAr ? "المبلغ" : "Amount", accessor: (r: any) => r.amount || 0 },
      { header: isAr ? "العملة" : "Currency", accessor: (r: any) => r.currency || "SAR" },
      { header: isAr ? "الحالة" : "Status", accessor: (r: any) => r.status || "" },
      { header: isAr ? "التاريخ" : "Date", accessor: (r: any) => r.created_at ? format(new Date(r.created_at), "yyyy-MM-dd") : "" },
    ],
    filename: "membership-invoices",
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["membership-invoices"] });
    queryClient.invalidateQueries({ queryKey: ["membership-invoice-stats"] });
  }, [queryClient]);

  const createInvoiceMutation = useMutation({
    mutationFn: () => createMembershipInvoice(newInvoice),
    onSuccess: (data) => {
      invalidate();
      setShowCreateDialog(false);
      toast({
        title: isAr ? "تم إنشاء الفاتورة" : "Invoice created",
        description: data?.invoice_number || "",
      });
    },
    onError: () => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error" }),
  });

  const markPaidMutation = useMutation({
    mutationFn: markInvoicePaid,
    onSuccess: () => {
      invalidate();
      toast({ title: isAr ? "تم تحديث الحالة" : "Invoice marked as paid" });
    },
  });

  const voidMutation = useMutation({
    mutationFn: voidInvoice,
    onSuccess: () => {
      invalidate();
      toast({ title: isAr ? "تم إلغاء الفاتورة" : "Invoice voided" });
    },
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "paid": return <Badge variant="default" className="gap-1 text-xs"><CheckCircle2 className="h-3 w-3" />{isAr ? "مدفوعة" : "Paid"}</Badge>;
      case "pending": return <Badge variant="secondary" className="gap-1 text-xs"><Clock className="h-3 w-3" />{isAr ? "معلقة" : "Pending"}</Badge>;
      case "overdue": return <Badge variant="destructive" className="gap-1 text-xs"><AlertTriangle className="h-3 w-3" />{isAr ? "متأخرة" : "Overdue"}</Badge>;
      case "void": return <Badge variant="outline" className="gap-1 text-xs"><XCircle className="h-3 w-3" />{isAr ? "ملغاة" : "Void"}</Badge>;
      default: return <Badge variant="outline" className="text-xs">{status || "N/A"}</Badge>;
    }
  };

  const statCards = [
    { icon: Receipt, label: isAr ? "إجمالي الفواتير" : "Total Invoices", value: invoiceStats?.total || 0, color: "text-primary" },
    { icon: CheckCircle2, label: isAr ? "المبلغ المحصّل" : "Collected", value: invoiceStats?.paidAmount || 0, suffix: " SAR", color: "text-chart-2" },
    { icon: Clock, label: isAr ? "قيد الانتظار" : "Pending", value: invoiceStats?.pendingAmount || 0, suffix: " SAR", color: "text-chart-4" },
    { icon: AlertTriangle, label: isAr ? "فواتير متأخرة" : "Overdue", value: invoiceStats?.overdueCount || 0, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(card => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <AnimatedCounter value={card.value} className="text-2xl" />
                {card.suffix && <span className="text-sm text-muted-foreground">{card.suffix}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invoice Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {isAr ? "فواتير العضويات" : "Membership Invoices"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-48">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={isAr ? "رقم الفاتورة..." : "Invoice #..."}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="ps-9 h-8 text-xs"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="paid">{isAr ? "مدفوعة" : "Paid"}</SelectItem>
                  <SelectItem value="pending">{isAr ? "معلقة" : "Pending"}</SelectItem>
                  <SelectItem value="overdue">{isAr ? "متأخرة" : "Overdue"}</SelectItem>
                  <SelectItem value="void">{isAr ? "ملغاة" : "Void"}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => invoices && exportCSV(invoices)}>
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" className="gap-1.5 h-8" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-3.5 w-3.5" />
                {isAr ? "إنشاء" : "Create"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">{isAr ? "رقم الفاتورة" : "Invoice #"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "العنوان" : "Title"}</TableHead>
                    <TableHead className="text-xs text-end">{isAr ? "المبلغ" : "Amount"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "الاستحقاق" : "Due"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "التاريخ" : "Created"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "إجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices?.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                      <TableCell className="text-sm truncate max-w-[200px]">
                        {isAr ? (inv.title_ar || inv.title || "—") : (inv.title || "—")}
                      </TableCell>
                      <TableCell className="text-end font-medium tabular-nums">
                        {(inv.amount || 0).toFixed(2)}
                        <span className="text-xs text-muted-foreground ms-1">{inv.currency || "SAR"}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(inv.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {inv.due_date ? format(new Date(inv.due_date), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(inv.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {inv.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title={isAr ? "تحديد كمدفوعة" : "Mark paid"}
                                onClick={() => markPaidMutation.mutate(inv.id)}
                                disabled={markPaidMutation.isPending}
                              >
                                <CreditCard className="h-3.5 w-3.5 text-chart-2" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title={isAr ? "إلغاء" : "Void"}
                                onClick={() => voidMutation.mutate(inv.id)}
                                disabled={voidMutation.isPending}
                              >
                                <Ban className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </>
                          )}
                          {inv.status === "overdue" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title={isAr ? "تحديد كمدفوعة" : "Mark paid"}
                              onClick={() => markPaidMutation.mutate(inv.id)}
                              disabled={markPaidMutation.isPending}
                            >
                              <CreditCard className="h-3.5 w-3.5 text-chart-2" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!invoices?.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {isAr ? "لا توجد فواتير" : "No invoices found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) { setSelectedUser(null); setUserSearch(""); }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isAr ? "إنشاء فاتورة عضوية" : "Create Membership Invoice"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isAr ? "العضو" : "Member"}</Label>
              {selectedUser ? (
                <div className="flex items-center gap-3 rounded-xl border p-3 bg-muted/30">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {(selectedUser.full_name || "U")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedUser.full_name || selectedUser.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedUser.username ? `@${selectedUser.username}` : ""} · <span className="capitalize">{selectedUser.membership_tier || "basic"}</span>
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setSelectedUser(null); setNewInvoice(p => ({ ...p, userId: "" })); }}>
                    {isAr ? "تغيير" : "Change"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={isAr ? "ابحث بالاسم أو رقم الحساب..." : "Search by name or account..."}
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="ps-9"
                    />
                  </div>
                  {searchedUsers.length > 0 && (
                    <div className="space-y-1 max-h-40 overflow-y-auto rounded-lg border p-1">
                      {searchedUsers.map((u: any) => (
                        <button
                          key={u.user_id}
                          onClick={() => {
                            setSelectedUser(u);
                            setNewInvoice(p => ({ ...p, userId: u.user_id }));
                            setUserSearch("");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={u.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {(u.full_name || "U")[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{u.full_name || u.username || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{u.account_number || u.username}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] capitalize shrink-0">{u.membership_tier || "basic"}</Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{isAr ? "المستوى" : "Tier"}</Label>
                <Select
                  value={newInvoice.tier}
                  onValueChange={v => setNewInvoice(p => ({
                    ...p,
                    tier: v,
                    amount: v === "enterprise" ? 99 : 19,
                  }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">{isAr ? "احترافي" : "Professional"}</SelectItem>
                    <SelectItem value="enterprise">{isAr ? "مؤسسي" : "Enterprise"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "النوع" : "Action"}</Label>
                <Select
                  value={newInvoice.action}
                  onValueChange={v => setNewInvoice(p => ({ ...p, action: v as any }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subscription">{isAr ? "اشتراك" : "Subscription"}</SelectItem>
                    <SelectItem value="renewal">{isAr ? "تجديد" : "Renewal"}</SelectItem>
                    <SelectItem value="upgrade">{isAr ? "ترقية" : "Upgrade"}</SelectItem>
                    <SelectItem value="downgrade">{isAr ? "تخفيض" : "Downgrade"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "المبلغ (ر.س)" : "Amount (SAR)"}</Label>
              <Input
                type="number"
                value={newInvoice.amount}
                onChange={e => setNewInvoice(p => ({ ...p, amount: Number(e.target.value) }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={() => createInvoiceMutation.mutate()}
              disabled={!newInvoice.userId || createInvoiceMutation.isPending}
              className="gap-1.5"
            >
              {createInvoiceMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isAr ? "إنشاء" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default MembershipInvoicesTab;
