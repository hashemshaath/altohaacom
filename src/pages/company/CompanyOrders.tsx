import { useState, useMemo } from "react";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Plus, Search, Filter } from "lucide-react";
import { CompanyOrder, OrderFormData, defaultOrderForm, ORDER_STATUSES, ORDER_CATEGORIES } from "@/components/company/orders/orderTypes";
import { OrderStats } from "@/components/company/orders/OrderStats";
import { OrdersTable } from "@/components/company/orders/OrdersTable";
import { OrderFormDialog } from "@/components/company/orders/OrderFormDialog";
import { OrderDetailDialog } from "@/components/company/orders/OrderDetailDialog";

export default function CompanyOrders() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<OrderFormData>(defaultOrderForm);
  const [selectedOrder, setSelectedOrder] = useState<CompanyOrder | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["companyOrders", companyId, searchQuery, statusFilter],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from("company_orders")
        .select("id, company_id, order_number, title, title_ar, description, description_ar, direction, category, status, items, subtotal, discount_amount, tax_amount, total_amount, currency, delivery_date, due_date, order_date, notes, internal_notes, branch_id, competition_id, driver_id, created_by, approved_by, approved_at, rejected_by, rejected_at, rejection_reason, completed_at, created_at, updated_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,order_number.ilike.%${searchQuery}%`);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as CompanyOrder[];
    },
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      if (!companyId) throw new Error("No company");
      const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
      const { error } = await supabase.from("company_orders").insert([{
        company_id: companyId,
        title: data.title,
        title_ar: data.title_ar || null,
        description: data.description || null,
        description_ar: data.description_ar || null,
        direction: data.direction as any,
        category: data.category as any,
        currency: data.currency,
        delivery_date: data.delivery_date || null,
        due_date: data.due_date || null,
        notes: data.notes || null,
        items: data.items as any,
        subtotal,
        total_amount: subtotal,
        status: "draft" as any,
        created_by: user?.id || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyOrders"] });
      setCreateOpen(false);
      setForm(defaultOrderForm);
      toast({ title: isAr ? "تم إنشاء الطلب" : "Order created" });
    },
    onError: () => {
      toast({ title: isAr ? "حدث خطأ" : "Error creating order", variant: "destructive" });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("company_orders")
        .update({ status: "pending" })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyOrders"] });
      setSelectedOrder(null);
      toast({ title: isAr ? "تم إرسال الطلب للمراجعة" : "Order submitted for review" });
    },
  });

  const { pending, completed, rejected } = useMemo(() => ({
    pending: orders.filter(o => o.status === "pending").length,
    completed: orders.filter(o => o.status === "completed").length,
    rejected: orders.filter(o => o.status === "rejected").length,
  }), [orders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            {isAr ? "الطلبيات" : "Orders"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isAr ? "عرض وإدارة جميع الطلبيات" : "View and manage all orders"}
          </p>
        </div>
        <Button onClick={() => { setForm(defaultOrderForm); setCreateOpen(true); }}>
          <Plus className="me-2 h-4 w-4" />{isAr ? "طلب جديد" : "New Order"}
        </Button>
      </div>

      <OrderStats total={orders.length} pending={pending} completed={completed} rejected={rejected} isLoading={isLoading} language={language} />

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث بالعنوان أو رقم الطلب..." : "Search by title or order number..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="me-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل الحالات" : "All Statuses"}</SelectItem>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{isAr ? s.ar : s.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <OrdersTable orders={orders} isLoading={isLoading} language={language} onView={setSelectedOrder} />

      <OrderFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        form={form}
        setForm={setForm}
        onSave={() => createMutation.mutate(form)}
        isPending={createMutation.isPending}
        language={language}
      />

      <OrderDetailDialog
        open={!!selectedOrder}
        onOpenChange={(v) => { if (!v) setSelectedOrder(null); }}
        order={selectedOrder}
        language={language}
        onSubmit={(id) => submitMutation.mutate(id)}
        isSubmitting={submitMutation.isPending}
      />
    </div>
  );
}
