import { useState } from "react";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTableCard } from "@/components/admin/AdminTableCard";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { SortableTableHead } from "@/components/admin/SortableTableHead";
import { AdminTablePagination } from "@/components/admin/AdminTablePagination";
import { safeLazy } from "@/lib/safeLazy";

// Lazy-load heavy financial widgets
const RevenueAnalyticsWidget = safeLazy(() => import("@/components/admin/RevenueAnalyticsWidget").then(m => ({ default: m.RevenueAnalyticsWidget })));
const PaymentTrackerWidget = safeLazy(() => import("@/components/admin/PaymentTrackerWidget").then(m => ({ default: m.PaymentTrackerWidget })));
const WalletOverviewWidget = safeLazy(() => import("@/components/admin/WalletOverviewWidget").then(m => ({ default: m.WalletOverviewWidget })));
const OrdersRevenueWidget = safeLazy(() => import("@/components/admin/OrdersRevenueWidget").then(m => ({ default: m.OrdersRevenueWidget })));
const OrdersLiveStatsWidget = safeLazy(() => import("@/components/admin/OrdersLiveStatsWidget").then(m => ({ default: m.OrdersLiveStatsWidget })));
const InvoiceTrackerWidget = safeLazy(() => import("@/components/admin/InvoiceTrackerWidget").then(m => ({ default: m.InvoiceTrackerWidget })));
const FinancialSummaryWidget = safeLazy(() => import("@/components/admin/FinancialSummaryWidget").then(m => ({ default: m.FinancialSummaryWidget })));
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { FinanceQuickNav } from "@/components/admin/FinanceQuickNav";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useCSVExport } from "@/hooks/useCSVExport";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  Package, Search, Plus, Eye, CheckCircle, XCircle, Clock, ChevronLeft,
  Save, X, Send, MessageSquare, ArrowUpRight, ArrowDownLeft, Truck,
  Building2, ShoppingBag, Edit, Trash2, FileText, Download, Ban, User,
} from "lucide-react";
import { format } from "date-fns";

import {
  type OrderStatus, type OrderDirection, type OrderCategory,
  type OrderFormType, statusColors, categoryLabels, defaultOrderForm,
  getStatusLabel, getCategoryLabel,
} from "./orders/ordersAdminTypes";
import { CompanyOrderDetailView } from "./orders/CompanyOrderDetailView";
import { ShopOrderDetailView } from "./orders/ShopOrderDetailView";


export default function OrdersAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [activeTab, setActiveTab] = useState("company");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [orderForm, setOrderForm] = useState({ ...defaultOrderForm });
  const [newItem, setNewItem] = useState({ name: "", quantity: 1, price: 0 });
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Shop orders state
  const [shopSearchQuery, setShopSearchQuery] = useState("");
  const [shopStatusFilter, setShopStatusFilter] = useState("all");
  const [selectedShopOrder, setSelectedShopOrder] = useState<string | null>(null);

  // ============ COMPANY ORDERS ============

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["all-orders", searchQuery, statusFilter, directionFilter, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from("company_orders")
        .select("*, companies:company_id (id, name, name_ar, logo_url)")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`order_number.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
      }
      if (statusFilter !== "all") query = query.eq("status", statusFilter as any);
      if (directionFilter !== "all") query = query.eq("direction", directionFilter as any);
      if (categoryFilter !== "all") query = query.eq("category", categoryFilter as any);

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: orderDetails } = useQuery({
    queryKey: ["order", selectedOrder],
    queryFn: async () => {
      if (!selectedOrder) return null;
      const { data, error } = await supabase
        .from("company_orders")
        .select("*, companies:company_id (id, name, name_ar, logo_url, email, phone)")
        .eq("id", selectedOrder)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedOrder,
  });

  const { data: communications = [] } = useQuery({
    queryKey: ["order-communications", selectedOrder],
    queryFn: async () => {
      if (!selectedOrder) return [];
      const { data, error } = await supabase
        .from("order_communications")
        .select("id, order_id, message, sender_type, sender_id, created_at")
        .eq("order_id", selectedOrder)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedOrder,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, name_ar")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // ============ SHOP ORDERS ============

  const { data: shopOrders = [], isLoading: shopLoading } = useQuery({
    queryKey: ["shop-orders-admin", shopSearchQuery, shopStatusFilter],
    queryFn: async () => {
      let query = supabase
        .from("shop_orders")
        .select("*, shop_order_items(*, shop_products(title, title_ar, image_url))")
        .order("created_at", { ascending: false });

      if (shopSearchQuery) {
        query = query.or(`order_number.ilike.%${shopSearchQuery}%,buyer_name.ilike.%${shopSearchQuery}%,buyer_email.ilike.%${shopSearchQuery}%`);
      }
      if (shopStatusFilter !== "all") query = query.eq("status", shopStatusFilter as any);

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: shopOrderDetails } = useQuery({
    queryKey: ["shop-order-detail", selectedShopOrder],
    queryFn: async () => {
      if (!selectedShopOrder) return null;
      const { data, error } = await supabase
        .from("shop_orders")
        .select("*, shop_order_items(*, shop_products(title, title_ar, image_url))")
        .eq("id", selectedShopOrder)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedShopOrder,
  });

  // ============ MUTATIONS ============

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: OrderStatus; reason?: string }) => {
      const updates: any = { status };
      if (status === "approved") updates.approved_at = new Date().toISOString();
      if (status === "rejected") {
        updates.rejected_at = new Date().toISOString();
        if (reason) updates.rejection_reason = reason;
      }
      if (status === "completed") updates.completed_at = new Date().toISOString();
      const { error } = await supabase.from("company_orders").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", selectedOrder] });
      setShowRejectDialog(false);
      setRejectionReason("");
      toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("company_orders").insert({
        company_id: orderForm.company_id,
        direction: orderForm.direction,
        category: orderForm.category,
        title: orderForm.title,
        title_ar: orderForm.title_ar || null,
        description: orderForm.description || null,
        description_ar: orderForm.description_ar || null,
        total_amount: orderForm.total_amount,
        subtotal: orderForm.subtotal,
        tax_amount: orderForm.tax_amount,
        discount_amount: orderForm.discount_amount,
        currency: orderForm.currency,
        order_date: orderForm.order_date,
        delivery_date: orderForm.delivery_date || null,
        due_date: orderForm.due_date || null,
        notes: orderForm.notes || null,
        internal_notes: orderForm.internal_notes || null,
        items: orderForm.items.length > 0 ? JSON.stringify(orderForm.items) : "[]",
        status: "pending",
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-orders"] });
      setShowOrderForm(false);
      setOrderForm({ ...defaultOrderForm });
      toast({ title: isAr ? "تم إنشاء الطلب" : "Order created" });
    },
    onError: (e: Error) => {
      toast({ title: isAr ? "خطأ" : "Error", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async () => {
      if (!editingOrder) return;
      const { error } = await supabase.from("company_orders").update({
        title: orderForm.title,
        title_ar: orderForm.title_ar || null,
        description: orderForm.description || null,
        description_ar: orderForm.description_ar || null,
        total_amount: orderForm.total_amount,
        subtotal: orderForm.subtotal,
        tax_amount: orderForm.tax_amount,
        discount_amount: orderForm.discount_amount,
        currency: orderForm.currency,
        delivery_date: orderForm.delivery_date || null,
        due_date: orderForm.due_date || null,
        notes: orderForm.notes || null,
        internal_notes: orderForm.internal_notes || null,
        items: orderForm.items.length > 0 ? JSON.stringify(orderForm.items) : "[]",
        direction: orderForm.direction,
        category: orderForm.category,
      }).eq("id", editingOrder);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", editingOrder] });
      setEditingOrder(null);
      setShowOrderForm(false);
      setOrderForm({ ...defaultOrderForm });
      toast({ title: isAr ? "تم تحديث الطلب" : "Order updated" });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-orders"] });
      setSelectedOrder(null);
      toast({ title: isAr ? "تم حذف الطلب" : "Order deleted" });
    },
  });

  const updateShopStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("shop_orders").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-orders-admin"] });
      queryClient.invalidateQueries({ queryKey: ["shop-order-detail", selectedShopOrder] });
      toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
    },
  });

  const [newMessage, setNewMessage] = useState("");
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder || !newMessage.trim()) return;
      const { error } = await supabase.from("order_communications").insert({
        order_id: selectedOrder,
        message: newMessage,
        sender_type: "admin",
        sender_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-communications", selectedOrder] });
      setNewMessage("");
    },
  });

  const updateInternalNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase.from("company_orders").update({ internal_notes: notes }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", selectedOrder] });
      toast({ title: isAr ? "تم حفظ الملاحظات" : "Notes saved" });
    },
  });

  // ============ HELPERS ============

  const getStatusLabelLocal = (status: string) => getStatusLabel(status, isAr);
  const getCategoryLabelLocal = (category: string) => getCategoryLabel(category, isAr);

  const addItemToOrder = () => {
    if (!newItem.name.trim()) return;
    const updatedItems = [...orderForm.items, { ...newItem }];
    const subtotal = updatedItems.reduce((sum, i) => sum + i.quantity * i.price, 0);
    setOrderForm(prev => ({
      ...prev,
      items: updatedItems,
      subtotal,
      total_amount: subtotal + prev.tax_amount - prev.discount_amount,
    }));
    setNewItem({ name: "", quantity: 1, price: 0 });
  };

  const removeItemFromOrder = (idx: number) => {
    const updatedItems = orderForm.items.filter((_, i) => i !== idx);
    const subtotal = updatedItems.reduce((sum, i) => sum + i.quantity * i.price, 0);
    setOrderForm(prev => ({
      ...prev,
      items: updatedItems,
      subtotal,
      total_amount: subtotal + prev.tax_amount - prev.discount_amount,
    }));
  };

  const recalcTotal = (field: string, value: number) => {
    setOrderForm(prev => {
      const updated = { ...prev, [field]: value };
      updated.total_amount = updated.subtotal + updated.tax_amount - updated.discount_amount;
      return updated;
    });
  };

  const openEditForm = (order) => {
    setEditingOrder(order.id);
    setOrderForm({
      company_id: order.company_id,
      direction: order.direction,
      category: order.category,
      title: order.title || "",
      title_ar: order.title_ar || "",
      description: order.description || "",
      description_ar: order.description_ar || "",
      total_amount: Number(order.total_amount) || 0,
      subtotal: Number(order.subtotal) || 0,
      tax_amount: Number(order.tax_amount) || 0,
      discount_amount: Number(order.discount_amount) || 0,
      currency: order.currency || "SAR",
      order_date: order.order_date || "",
      delivery_date: order.delivery_date || "",
      due_date: order.due_date || "",
      notes: order.notes || "",
      internal_notes: order.internal_notes || "",
      items: Array.isArray(order.items) ? order.items : [],
    });
    setShowOrderForm(true);
    setSelectedOrder(null);
  };

  const bulk = useAdminBulkActions(orders);

  const { exportCSV: exportOrdersCSV } = useCSVExport({
    columns: [
      { header: isAr ? "رقم الطلب" : "Order #", accessor: (o) => o.order_number },
      { header: isAr ? "الشركة" : "Company", accessor: (o) => o.companies?.name || "" },
      { header: isAr ? "العنوان" : "Title", accessor: (o) => o.title },
      { header: isAr ? "الاتجاه" : "Direction", accessor: (o) => o.direction },
      { header: isAr ? "الفئة" : "Category", accessor: (o) => getCategoryLabelLocal(o.category) },
      { header: isAr ? "المبلغ" : "Amount", accessor: (o) => o.total_amount },
      { header: isAr ? "العملة" : "Currency", accessor: (o) => o.currency },
      { header: isAr ? "الحالة" : "Status", accessor: (o) => getStatusLabelLocal(o.status) },
      { header: isAr ? "التاريخ" : "Date", accessor: (o) => o.created_at?.split("T")[0] || "" },
    ],
    filename: "orders",
  });

  const bulkStatusChange = async (status: string) => {
    const ids = [...bulk.selected];
    const { error } = await supabase.from("company_orders").update({ status: status as any }).in("id", ids);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["all-orders"] });
      bulk.clearSelection();
      toast({ title: isAr ? `تم تحديث ${ids.length} طلب` : `Updated ${ids.length} orders` });
    }
  };

  const bulkDelete = async () => {
    if (!confirm(isAr ? "هل أنت متأكد من حذف الطلبات المحددة؟" : "Delete selected orders?")) return;
    const ids = [...bulk.selected];
    const { error } = await supabase.from("company_orders").delete().in("id", ids);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["all-orders"] });
      bulk.clearSelection();
      toast({ title: isAr ? `تم حذف ${ids.length} طلب` : `Deleted ${ids.length} orders` });
    }
  };

  // ============ STATS ============

  const companyStats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    inProgress: orders.filter((o) => o.status === "in_progress" || o.status === "approved").length,
    completed: orders.filter((o) => o.status === "completed").length,
    incoming: orders.filter((o) => o.direction === "incoming").length,
    outgoing: orders.filter((o) => o.direction === "outgoing").length,
  };

  const shopStats = {
    total: shopOrders.length,
    pending: shopOrders.filter((o) => o.status === "pending").length,
    confirmed: shopOrders.filter((o) => ["confirmed", "processing"].includes(o.status)).length,
    shipped: shopOrders.filter((o) => o.status === "shipped").length,
    delivered: shopOrders.filter((o) => o.status === "delivered").length,
  };

  // ============ COMPANY ORDER DETAIL VIEW ============

  if (selectedOrder && orderDetails) {
    return (
      <CompanyOrderDetailView
        orderDetails={orderDetails}
        communications={communications}
        isAr={isAr}
        onBack={() => setSelectedOrder(null)}
        onEdit={openEditForm}
        onUpdateStatus={(params) => updateStatusMutation.mutate(params)}
        onDelete={(id) => deleteOrderMutation.mutate(id)}
        onSaveInternalNotes={(params) => updateInternalNotesMutation.mutate(params)}
        onSendMessage={() => sendMessageMutation.mutate()}
        newMessage={newMessage}
        onNewMessageChange={setNewMessage}
        showRejectDialog={showRejectDialog}
        onShowRejectDialog={setShowRejectDialog}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={setRejectionReason}
      />
    );
  }

  // ============ SHOP ORDER DETAIL VIEW ============

  if (selectedShopOrder && shopOrderDetails) {
    return (
      <ShopOrderDetailView
        shopOrderDetails={shopOrderDetails}
        isAr={isAr}
        onBack={() => setSelectedShopOrder(null)}
        onUpdateStatus={(params) => updateShopStatusMutation.mutate(params)}
      />
    );
  }

  // ============ CREATE/EDIT ORDER FORM ============

  if (showOrderForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setShowOrderForm(false); setEditingOrder(null); setOrderForm({ ...defaultOrderForm }); }}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {editingOrder ? (isAr ? "تعديل الطلب" : "Edit Order") : (isAr ? "طلب جديد" : "New Order")}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "المعلومات الأساسية" : "Basic Info"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{isAr ? "الشركة" : "Company"} *</Label>
                <Select value={orderForm.company_id} onValueChange={(v) => setOrderForm(prev => ({ ...prev, company_id: v }))}>
                  <SelectTrigger><SelectValue placeholder={isAr ? "اختر شركة" : "Select company"} /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{isAr ? c.name_ar || c.name : c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isAr ? "الاتجاه" : "Direction"}</Label>
                  <Select value={orderForm.direction} onValueChange={(v) => setOrderForm(prev => ({ ...prev, direction: v as OrderDirection }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outgoing">{isAr ? "صادر" : "Outgoing"}</SelectItem>
                      <SelectItem value="incoming">{isAr ? "وارد" : "Incoming"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isAr ? "الفئة" : "Category"}</Label>
                  <Select value={orderForm.category} onValueChange={(v) => setOrderForm(prev => ({ ...prev, category: v as OrderCategory }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{isAr ? val.ar : val.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>{isAr ? "العنوان (EN)" : "Title (EN)"} *</Label>
                <Input value={orderForm.title} onChange={(e) => setOrderForm(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "العنوان (AR)" : "Title (AR)"}</Label>
                <Input dir="rtl" value={orderForm.title_ar} onChange={(e) => setOrderForm(prev => ({ ...prev, title_ar: e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "الوصف (EN)" : "Description (EN)"}</Label>
                <Textarea value={orderForm.description} onChange={(e) => setOrderForm(prev => ({ ...prev, description: e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "الوصف (AR)" : "Description (AR)"}</Label>
                <Textarea dir="rtl" value={orderForm.description_ar} onChange={(e) => setOrderForm(prev => ({ ...prev, description_ar: e.target.value }))} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{isAr ? "التواريخ والمبالغ" : "Dates & Amounts"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isAr ? "العملة" : "Currency"}</Label>
                    <Select value={orderForm.currency} onValueChange={(v) => setOrderForm(prev => ({ ...prev, currency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAR">SAR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                        <SelectItem value="KWD">KWD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{isAr ? "تاريخ الطلب" : "Order Date"}</Label>
                    <Input type="date" value={orderForm.order_date} onChange={(e) => setOrderForm(prev => ({ ...prev, order_date: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isAr ? "تاريخ التسليم" : "Delivery Date"}</Label>
                    <Input type="date" value={orderForm.delivery_date} onChange={(e) => setOrderForm(prev => ({ ...prev, delivery_date: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{isAr ? "تاريخ الاستحقاق" : "Due Date"}</Label>
                    <Input type="date" value={orderForm.due_date} onChange={(e) => setOrderForm(prev => ({ ...prev, due_date: e.target.value }))} />
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>{isAr ? "الضريبة" : "Tax"}</Label>
                    <Input type="number" value={orderForm.tax_amount} onChange={(e) => recalcTotal("tax_amount", Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>{isAr ? "الخصم" : "Discount"}</Label>
                    <Input type="number" value={orderForm.discount_amount} onChange={(e) => recalcTotal("discount_amount", Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>{isAr ? "الإجمالي" : "Total"}</Label>
                    <Input type="number" value={orderForm.total_amount} readOnly className="bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isAr ? "العناصر" : "Items"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderForm.items.length > 0 && (
                  <div className="space-y-2">
                    {orderForm.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                        <span className="flex-1 text-sm">{item.name}</span>
                        <span className="text-sm text-muted-foreground">{item.quantity} × {item.price}</span>
                        <span className="text-sm font-medium">{(item.quantity * item.price).toLocaleString()}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItemFromOrder(idx)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input placeholder={isAr ? "اسم الصنف" : "Item name"} value={newItem.name} onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))} className="flex-1" />
                  <Input type="number" placeholder={isAr ? "الكمية" : "Qty"} value={newItem.quantity} onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))} className="w-20" />
                  <Input type="number" placeholder={isAr ? "السعر" : "Price"} value={newItem.price} onChange={(e) => setNewItem(prev => ({ ...prev, price: Number(e.target.value) }))} className="w-24" />
                  <Button variant="outline" size="icon" onClick={addItemToOrder}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isAr ? "الملاحظات" : "Notes"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{isAr ? "ملاحظات عامة" : "General Notes"}</Label>
                  <Textarea value={orderForm.notes} onChange={(e) => setOrderForm(prev => ({ ...prev, notes: e.target.value }))} />
                </div>
                <div>
                  <Label>{isAr ? "ملاحظات داخلية" : "Internal Notes"}</Label>
                  <Textarea value={orderForm.internal_notes} onChange={(e) => setOrderForm(prev => ({ ...prev, internal_notes: e.target.value }))} placeholder={isAr ? "مرئية للمسؤولين فقط" : "Visible to admins only"} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => { setShowOrderForm(false); setEditingOrder(null); setOrderForm({ ...defaultOrderForm }); }}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            onClick={() => editingOrder ? updateOrderMutation.mutate() : createOrderMutation.mutate()}
            disabled={!orderForm.company_id || !orderForm.title || createOrderMutation.isPending || updateOrderMutation.isPending}
          >
            <Save className="h-4 w-4 me-1" />
            {editingOrder ? (isAr ? "حفظ التعديلات" : "Save Changes") : (isAr ? "إنشاء الطلب" : "Create Order")}
          </Button>
        </div>
      </div>
    );
  }

  // ============ MAIN LIST VIEW ============

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Package}
        title={isAr ? "إدارة الطلبات" : "Order Management"}
        description={isAr ? "إدارة طلبات الشركات وطلبات المتجر" : "Manage company orders and shop orders"}
      />

      <FinanceQuickNav />

      {/* Financial Summary & Orders Live Stats */}
      <FinancialSummaryWidget />
      <OrdersLiveStatsWidget />
      <InvoiceTrackerWidget />

      {/* Revenue & Payment Tracking */}
      <OrdersRevenueWidget />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueAnalyticsWidget />
        </div>
        <div className="space-y-4">
          <PaymentTrackerWidget />
          <WalletOverviewWidget />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="rounded-2xl border border-border/40 bg-muted/30 backdrop-blur p-1.5 h-auto">
          <TabsTrigger value="company" className="gap-1.5 rounded-xl data-[state=active]:shadow-sm">
            <Building2 className="h-3.5 w-3.5" />
            {isAr ? "طلبات الشركات" : "Company Orders"}
            <Badge variant="secondary" className="ms-1 text-[12px]">{companyStats.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="shop" className="gap-1.5 rounded-xl data-[state=active]:shadow-sm">
            <ShoppingBag className="h-3.5 w-3.5" />
            {isAr ? "طلبات المتجر" : "Shop Orders"}
            <Badge variant="secondary" className="ms-1 text-[12px]">{shopStats.total}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ============ COMPANY ORDERS TAB ============ */}
        <TabsContent value="company" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <StatCard value={companyStats.total} label={isAr ? "إجمالي" : "Total"} />
            <StatCard value={companyStats.pending} label={isAr ? "قيد الانتظار" : "Pending"} color="text-chart-4" />
            <StatCard value={companyStats.inProgress} label={isAr ? "جاري" : "In Progress"} color="text-chart-3" />
            <StatCard value={companyStats.completed} label={isAr ? "مكتمل" : "Completed"} color="text-chart-5" />
            <StatCard value={companyStats.incoming} label={isAr ? "وارد" : "Incoming"} color="text-chart-1" />
            <StatCard value={companyStats.outgoing} label={isAr ? "صادر" : "Outgoing"} color="text-chart-2" />
          </div>

          <Card className="rounded-2xl border-border/40 overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{isAr ? "جميع الطلبات" : "All Orders"}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportOrdersCSV(bulk.count > 0 ? bulk.selectedItems : orders)}>
                    <Download className="h-4 w-4 me-1" />
                    {isAr ? "تصدير" : "Export"}
                  </Button>
                  <Button size="sm" onClick={() => { setShowOrderForm(true); setEditingOrder(null); setOrderForm({ ...defaultOrderForm }); }}>
                    <Plus className="h-4 w-4 me-1" />
                    {isAr ? "طلب جديد" : "New Order"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input
                      placeholder={isAr ? "بحث برقم الطلب أو العنوان..." : "Search by order number or title..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="ps-10 rounded-xl"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "جميع الحالات" : "All Status"}</SelectItem>
                    <SelectItem value="draft">{isAr ? "مسودة" : "Draft"}</SelectItem>
                    <SelectItem value="pending">{isAr ? "قيد الانتظار" : "Pending"}</SelectItem>
                    <SelectItem value="approved">{isAr ? "معتمد" : "Approved"}</SelectItem>
                    <SelectItem value="in_progress">{isAr ? "جاري" : "In Progress"}</SelectItem>
                    <SelectItem value="completed">{isAr ? "مكتمل" : "Completed"}</SelectItem>
                    <SelectItem value="rejected">{isAr ? "مرفوض" : "Rejected"}</SelectItem>
                    <SelectItem value="cancelled">{isAr ? "ملغي" : "Cancelled"}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={directionFilter} onValueChange={setDirectionFilter}>
                  <SelectTrigger className="w-[130px] rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                    <SelectItem value="incoming">{isAr ? "وارد" : "Incoming"}</SelectItem>
                    <SelectItem value="outgoing">{isAr ? "صادر" : "Outgoing"}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px] rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "جميع الفئات" : "All Categories"}</SelectItem>
                    {Object.entries(categoryLabels).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{isAr ? val.ar : val.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <BulkActionBar
                count={bulk.count}
                onClear={bulk.clearSelection}
                onDelete={bulkDelete}
                onStatusChange={bulkStatusChange}
                onExport={() => exportOrdersCSV(bulk.selectedItems)}
              />

              {(() => {
                const { sorted: sortedOrders, sortColumn: orderSortCol, sortDirection: orderSortDir, toggleSort: toggleOrderSort } = useTableSort(orders, "created_at", "desc");
                const orderPagination = usePagination(sortedOrders, { defaultPageSize: 15 });

                return (
                  <>
                    <ScrollArea className="h-[500px]">
                      <Table>
                        <TableHeader>
                         <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="w-10">
                              <Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} />
                            </TableHead>
                            <SortableTableHead column="order_number" label={isAr ? "رقم الطلب" : "Order #"} sortColumn={orderSortCol} sortDirection={orderSortDir} onSort={toggleOrderSort} />
                            <TableHead className="font-semibold">{isAr ? "الشركة" : "Company"}</TableHead>
                            <SortableTableHead column="title" label={isAr ? "العنوان" : "Title"} sortColumn={orderSortCol} sortDirection={orderSortDir} onSort={toggleOrderSort} />
                            <SortableTableHead column="direction" label={isAr ? "الاتجاه" : "Dir"} sortColumn={orderSortCol} sortDirection={orderSortDir} onSort={toggleOrderSort} />
                            <SortableTableHead column="category" label={isAr ? "الفئة" : "Category"} sortColumn={orderSortCol} sortDirection={orderSortDir} onSort={toggleOrderSort} />
                            <SortableTableHead column="total_amount" label={isAr ? "المبلغ" : "Amount"} sortColumn={orderSortCol} sortDirection={orderSortDir} onSort={toggleOrderSort} />
                            <SortableTableHead column="status" label={isAr ? "الحالة" : "Status"} sortColumn={orderSortCol} sortDirection={orderSortDir} onSort={toggleOrderSort} />
                            <SortableTableHead column="created_at" label={isAr ? "التاريخ" : "Date"} sortColumn={orderSortCol} sortDirection={orderSortDir} onSort={toggleOrderSort} />
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderPagination.paginated.map((order) => (
                            <TableRow key={order.id} className={`cursor-pointer transition-colors duration-150 hover:bg-muted/40 ${bulk.isSelected(order.id) ? "bg-primary/5" : ""}`} onClick={() => setSelectedOrder(order.id)}>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox checked={bulk.isSelected(order.id)} onCheckedChange={() => bulk.toggleOne(order.id)} />
                              </TableCell>
                              <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {order.companies?.logo_url ? (
                                    <img src={order.companies.logo_url} alt="Company" className="h-6 w-6 rounded object-cover" loading="lazy" />
                                  ) : (
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className="truncate max-w-[120px]">{order.companies?.name || "-"}</span>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[180px] truncate">{order.title}</TableCell>
                              <TableCell>
                                {order.direction === "incoming" ? (
                                  <ArrowDownLeft className="h-4 w-4 text-chart-5" />
                                ) : (
                                  <ArrowUpRight className="h-4 w-4 text-chart-1" />
                                )}
                              </TableCell>
                              <TableCell className="text-sm">{getCategoryLabelLocal(order.category)}</TableCell>
                              <TableCell className="font-medium tabular-nums">{Number(order.total_amount).toLocaleString()} {order.currency}</TableCell>
                              <TableCell>
                                <AdminStatusBadge status={order.status} label={getStatusLabelLocal(order.status)} />
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">{format(new Date(order.created_at), "yyyy-MM-dd")}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {orders.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={10} className="p-0">
                                <AdminEmptyState
                                  icon={Package}
                                  title="No orders found"
                                  titleAr="لا توجد طلبات"
                                  description="Try adjusting your filters or create a new order"
                                  descriptionAr="جرب تعديل الفلاتر أو أنشئ طلباً جديداً"
                                  actionLabel="New Order"
                                  actionLabelAr="طلب جديد"
                                  onAction={() => setShowOrderForm(true)}
                                />
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                    <AdminTablePagination
                      page={orderPagination.page}
                      totalPages={orderPagination.totalPages}
                      totalItems={orderPagination.totalItems}
                      startItem={orderPagination.startItem}
                      endItem={orderPagination.endItem}
                      pageSize={orderPagination.pageSize}
                      pageSizeOptions={orderPagination.pageSizeOptions}
                      hasNext={orderPagination.hasNext}
                      hasPrev={orderPagination.hasPrev}
                      onPageChange={orderPagination.goTo}
                      onPageSizeChange={orderPagination.changePageSize}
                    />
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ SHOP ORDERS TAB ============ */}
        <TabsContent value="shop" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard value={shopStats.total} label={isAr ? "إجمالي" : "Total"} />
            <StatCard value={shopStats.pending} label={isAr ? "قيد الانتظار" : "Pending"} color="text-chart-4" />
            <StatCard value={shopStats.confirmed} label={isAr ? "مؤكد/معالجة" : "Confirmed"} color="text-chart-1" />
            <StatCard value={shopStats.shipped} label={isAr ? "تم الشحن" : "Shipped"} color="text-chart-3" />
            <StatCard value={shopStats.delivered} label={isAr ? "تم التوصيل" : "Delivered"} color="text-chart-5" />
          </div>

          <Card className="rounded-2xl border-border/40 overflow-hidden">
            <CardHeader>
              <CardTitle>{isAr ? "طلبات المتجر" : "Shop Orders"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input
                      placeholder={isAr ? "بحث برقم الطلب أو اسم المشتري..." : "Search by order # or buyer..."}
                      value={shopSearchQuery}
                      onChange={(e) => setShopSearchQuery(e.target.value)}
                      className="ps-10 rounded-xl"
                    />
                  </div>
                </div>
                <Select value={shopStatusFilter} onValueChange={setShopStatusFilter}>
                  <SelectTrigger className="w-[150px] rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "جميع الحالات" : "All"}</SelectItem>
                    <SelectItem value="pending">{isAr ? "قيد الانتظار" : "Pending"}</SelectItem>
                    <SelectItem value="confirmed">{isAr ? "مؤكد" : "Confirmed"}</SelectItem>
                    <SelectItem value="processing">{isAr ? "معالجة" : "Processing"}</SelectItem>
                    <SelectItem value="shipped">{isAr ? "شحن" : "Shipped"}</SelectItem>
                    <SelectItem value="delivered">{isAr ? "تم التوصيل" : "Delivered"}</SelectItem>
                    <SelectItem value="cancelled">{isAr ? "ملغي" : "Cancelled"}</SelectItem>
                    <SelectItem value="refunded">{isAr ? "مسترد" : "Refunded"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                   <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold">{isAr ? "رقم الطلب" : "Order #"}</TableHead>
                      <TableHead className="font-semibold">{isAr ? "المشتري" : "Buyer"}</TableHead>
                      <TableHead className="font-semibold">{isAr ? "المنتجات" : "Products"}</TableHead>
                      <TableHead className="font-semibold">{isAr ? "المبلغ" : "Amount"}</TableHead>
                      <TableHead className="font-semibold">{isAr ? "الدفع" : "Payment"}</TableHead>
                      <TableHead className="font-semibold">{isAr ? "الحالة" : "Status"}</TableHead>
                      <TableHead className="font-semibold">{isAr ? "التاريخ" : "Date"}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shopOrders.map((order) => (
                      <TableRow key={order.id} className="cursor-pointer transition-colors duration-150 hover:bg-muted/40" onClick={() => setSelectedShopOrder(order.id)}>
                        <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{order.buyer_name || "-"}</p>
                            <p className="text-xs text-muted-foreground">{order.buyer_email || "-"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{order.shop_order_items?.length || 0} {isAr ? "منتج" : "items"}</TableCell>
                        <TableCell className="font-medium tabular-nums">{order.currency} {Number(order.total_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{getStatusLabelLocal(order.payment_status || "pending")}</Badge>
                        </TableCell>
                        <TableCell>
                          <AdminStatusBadge status={order.status} label={getStatusLabelLocal(order.status)} />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{format(new Date(order.created_at), "yyyy-MM-dd")}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {shopOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="p-0">
                          <AdminEmptyState
                            icon={ShoppingBag}
                            title="No shop orders found"
                            titleAr="لا توجد طلبات"
                            description="Shop orders will appear here once customers place orders"
                            descriptionAr="ستظهر الطلبات هنا بمجرد أن يقوم العملاء بالطلب"
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============ SUB-COMPONENTS ============

function StatCard({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <Card className="rounded-2xl border-border/40 group hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <CardContent className="pt-4 pb-3">
        <div className="text-center">
          <AnimatedCounter value={value} className={`text-2xl font-bold tabular-nums ${color || ""}`} />
          <p className="text-[12px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

