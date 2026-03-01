import { useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { RevenueAnalyticsWidget } from "@/components/admin/RevenueAnalyticsWidget";
import { PaymentTrackerWidget } from "@/components/admin/PaymentTrackerWidget";
import { WalletOverviewWidget } from "@/components/admin/WalletOverviewWidget";
import { OrdersRevenueWidget } from "@/components/admin/OrdersRevenueWidget";
import { OrdersLiveStatsWidget } from "@/components/admin/OrdersLiveStatsWidget";
import { InvoiceTrackerWidget } from "@/components/admin/InvoiceTrackerWidget";
import { FinancialSummaryWidget } from "@/components/admin/FinancialSummaryWidget";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
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
  Package,
  Search,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  Save,
  X,
  Send,
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft,
  Truck,
  Building2,
  ShoppingBag,
  Edit,
  Trash2,
  FileText,
  Download,
  Ban,
  User,
} from "lucide-react";
import { format } from "date-fns";

type OrderStatus = "draft" | "pending" | "approved" | "rejected" | "in_progress" | "completed" | "cancelled";
type OrderDirection = "outgoing" | "incoming";
type OrderCategory = "promotional" | "equipment" | "materials" | "services" | "catering" | "venue" | "transport" | "other";

const statusColors: Record<string, string> = {
  draft: "bg-muted-foreground/15 text-muted-foreground",
  pending: "bg-chart-4/15 text-chart-4",
  approved: "bg-chart-1/15 text-chart-1",
  rejected: "bg-destructive/15 text-destructive",
  in_progress: "bg-chart-3/15 text-chart-3",
  completed: "bg-chart-5/15 text-chart-5",
  cancelled: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/15 text-primary",
  processing: "bg-chart-3/15 text-chart-3",
  shipped: "bg-chart-1/15 text-chart-1",
  delivered: "bg-chart-5/15 text-chart-5",
  refunded: "bg-muted text-muted-foreground",
};

const categoryLabels: Record<OrderCategory, { en: string; ar: string }> = {
  promotional: { en: "Promotional", ar: "ترويجية" },
  equipment: { en: "Equipment", ar: "معدات" },
  materials: { en: "Materials", ar: "مواد" },
  services: { en: "Services", ar: "خدمات" },
  catering: { en: "Catering", ar: "تموين" },
  venue: { en: "Venue", ar: "مكان" },
  transport: { en: "Transport", ar: "نقل" },
  other: { en: "Other", ar: "أخرى" },
};

const defaultOrderForm = {
  company_id: "",
  direction: "outgoing" as OrderDirection,
  category: "other" as OrderCategory,
  title: "",
  title_ar: "",
  description: "",
  description_ar: "",
  total_amount: 0,
  subtotal: 0,
  tax_amount: 0,
  discount_amount: 0,
  currency: "SAR",
  order_date: new Date().toISOString().split("T")[0],
  delivery_date: "",
  due_date: "",
  notes: "",
  internal_notes: "",
  items: [] as { name: string; quantity: number; price: number }[],
};

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
        .select("*")
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
    onError: (e: any) => {
      toast({ title: isAr ? "خطأ" : "Error", description: e.message, variant: "destructive" });
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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      draft: { en: "Draft", ar: "مسودة" },
      pending: { en: "Pending", ar: "قيد الانتظار" },
      approved: { en: "Approved", ar: "معتمد" },
      rejected: { en: "Rejected", ar: "مرفوض" },
      in_progress: { en: "In Progress", ar: "قيد التنفيذ" },
      completed: { en: "Completed", ar: "مكتمل" },
      cancelled: { en: "Cancelled", ar: "ملغي" },
      confirmed: { en: "Confirmed", ar: "مؤكد" },
      processing: { en: "Processing", ar: "قيد المعالجة" },
      shipped: { en: "Shipped", ar: "تم الشحن" },
      delivered: { en: "Delivered", ar: "تم التوصيل" },
      refunded: { en: "Refunded", ar: "مسترد" },
    };
    return isAr ? labels[status]?.ar || status : labels[status]?.en || status;
  };

  const getCategoryLabel = (category: string) => {
    const c = categoryLabels[category as OrderCategory];
    return c ? (isAr ? c.ar : c.en) : category;
  };

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

  const openEditForm = (order: any) => {
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
      { header: isAr ? "رقم الطلب" : "Order #", accessor: (o: any) => o.order_number },
      { header: isAr ? "الشركة" : "Company", accessor: (o: any) => o.companies?.name || "" },
      { header: isAr ? "العنوان" : "Title", accessor: (o: any) => o.title },
      { header: isAr ? "الاتجاه" : "Direction", accessor: (o: any) => o.direction },
      { header: isAr ? "الفئة" : "Category", accessor: (o: any) => getCategoryLabel(o.category) },
      { header: isAr ? "المبلغ" : "Amount", accessor: (o: any) => o.total_amount },
      { header: isAr ? "العملة" : "Currency", accessor: (o: any) => o.currency },
      { header: isAr ? "الحالة" : "Status", accessor: (o: any) => getStatusLabel(o.status) },
      { header: isAr ? "التاريخ" : "Date", accessor: (o: any) => o.created_at?.split("T")[0] || "" },
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
    pending: orders.filter((o: any) => o.status === "pending").length,
    inProgress: orders.filter((o: any) => o.status === "in_progress" || o.status === "approved").length,
    completed: orders.filter((o: any) => o.status === "completed").length,
    incoming: orders.filter((o: any) => o.direction === "incoming").length,
    outgoing: orders.filter((o: any) => o.direction === "outgoing").length,
  };

  const shopStats = {
    total: shopOrders.length,
    pending: shopOrders.filter((o: any) => o.status === "pending").length,
    confirmed: shopOrders.filter((o: any) => ["confirmed", "processing"].includes(o.status)).length,
    shipped: shopOrders.filter((o: any) => o.status === "shipped").length,
    delivered: shopOrders.filter((o: any) => o.status === "delivered").length,
  };

  // ============ COMPANY ORDER DETAIL VIEW ============

  if (selectedOrder && orderDetails) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">{orderDetails.order_number}</h1>
                <p className="text-muted-foreground">{orderDetails.title}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => openEditForm(orderDetails)}>
              <Edit className="h-4 w-4 me-1" />
              {isAr ? "تعديل" : "Edit"}
            </Button>
            {orderDetails.status === "pending" && (
              <>
                <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: orderDetails.id, status: "approved" })}>
                  <CheckCircle className="h-4 w-4 me-1" />
                  {isAr ? "اعتماد" : "Approve"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setShowRejectDialog(true)}>
                  <XCircle className="h-4 w-4 me-1" />
                  {isAr ? "رفض" : "Reject"}
                </Button>
              </>
            )}
            {orderDetails.status === "approved" && (
              <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: orderDetails.id, status: "in_progress" })}>
                <Truck className="h-4 w-4 me-1" />
                {isAr ? "بدء التنفيذ" : "Start Processing"}
              </Button>
            )}
            {orderDetails.status === "in_progress" && (
              <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: orderDetails.id, status: "completed" })}>
                <CheckCircle className="h-4 w-4 me-1" />
                {isAr ? "إكمال" : "Complete"}
              </Button>
            )}
            {["draft", "pending"].includes(orderDetails.status) && (
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
                if (confirm(isAr ? "هل أنت متأكد من الحذف؟" : "Delete this order?")) {
                  deleteOrderMutation.mutate(orderDetails.id);
                }
              }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Rejection dialog */}
        {showRejectDialog && (
          <Card className="border-destructive">
            <CardContent className="pt-4 space-y-3">
              <Label>{isAr ? "سبب الرفض" : "Rejection Reason"}</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={isAr ? "أدخل سبب الرفض..." : "Enter rejection reason..."}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowRejectDialog(false)}>
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button variant="destructive" size="sm" onClick={() =>
                  updateStatusMutation.mutate({ id: orderDetails.id, status: "rejected", reason: rejectionReason })
                }>
                  {isAr ? "تأكيد الرفض" : "Confirm Reject"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle>{isAr ? "تفاصيل الطلب" : "Order Details"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{isAr ? "الحالة" : "Status"}</p>
                    <Badge className={statusColors[orderDetails.status] || "bg-muted text-muted-foreground"}>
                      {getStatusLabel(orderDetails.status)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{isAr ? "الاتجاه" : "Direction"}</p>
                    <Badge variant={orderDetails.direction === "incoming" ? "default" : "secondary"}>
                      {orderDetails.direction === "incoming" ? (isAr ? "وارد" : "Incoming") : (isAr ? "صادر" : "Outgoing")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{isAr ? "الفئة" : "Category"}</p>
                    <p className="font-medium">{getCategoryLabel(orderDetails.category)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{isAr ? "المبلغ" : "Amount"}</p>
                    <p className="font-bold text-lg"><AnimatedCounter value={Math.round(Number(orderDetails.total_amount))} className="inline" format /> {orderDetails.currency}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{isAr ? "المجموع الفرعي" : "Subtotal"}</p>
                    <p className="font-medium"><AnimatedCounter value={Math.round(Number(orderDetails.subtotal || 0))} className="inline" format /> {orderDetails.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{isAr ? "الضريبة" : "Tax"}</p>
                    <p className="font-medium"><AnimatedCounter value={Math.round(Number(orderDetails.tax_amount || 0))} className="inline" format /> {orderDetails.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{isAr ? "الخصم" : "Discount"}</p>
                    <p className="font-medium"><AnimatedCounter value={Math.round(Number(orderDetails.discount_amount || 0))} className="inline" format /> {orderDetails.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{isAr ? "تاريخ الطلب" : "Order Date"}</p>
                    <p className="font-medium">{orderDetails.order_date}</p>
                  </div>
                </div>

                {(orderDetails.delivery_date || orderDetails.due_date) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      {orderDetails.delivery_date && (
                        <div>
                          <p className="text-sm text-muted-foreground">{isAr ? "تاريخ التسليم" : "Delivery Date"}</p>
                          <p className="font-medium">{orderDetails.delivery_date}</p>
                        </div>
                      )}
                      {orderDetails.due_date && (
                        <div>
                          <p className="text-sm text-muted-foreground">{isAr ? "تاريخ الاستحقاق" : "Due Date"}</p>
                          <p className="font-medium">{orderDetails.due_date}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {orderDetails.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{isAr ? "الوصف" : "Description"}</p>
                      <p>{orderDetails.description}</p>
                    </div>
                  </>
                )}

                {orderDetails.rejection_reason && (
                  <>
                    <Separator />
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                      <p className="text-sm font-medium text-destructive mb-1">{isAr ? "سبب الرفض" : "Rejection Reason"}</p>
                      <p className="text-sm">{orderDetails.rejection_reason}</p>
                    </div>
                  </>
                )}

                {orderDetails.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{isAr ? "ملاحظات" : "Notes"}</p>
                      <p className="text-sm">{orderDetails.notes}</p>
                    </div>
                  </>
                )}

                {/* Items table */}
                {orderDetails.items && Array.isArray(orderDetails.items) && orderDetails.items.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{isAr ? "العناصر" : "Items"}</p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{isAr ? "الصنف" : "Item"}</TableHead>
                            <TableHead>{isAr ? "الكمية" : "Qty"}</TableHead>
                            <TableHead>{isAr ? "السعر" : "Price"}</TableHead>
                            <TableHead>{isAr ? "المجموع" : "Total"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(orderDetails.items as any[]).map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{item.price}</TableCell>
                              <TableCell><AnimatedCounter value={Math.round(item.quantity * item.price)} className="inline" format /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Internal Notes */}
            <InternalNotesCard
              notes={orderDetails.internal_notes || ""}
              onSave={(notes) => updateInternalNotesMutation.mutate({ id: orderDetails.id, notes })}
              isAr={isAr}
            />

            {/* Communications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {isAr ? "المراسلات" : "Communications"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] mb-4">
                  <div className="space-y-4">
                    {communications.map((msg: any) => (
                      <div key={msg.id} className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-xl p-3 ${
                          msg.sender_type === "admin" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}>
                          <p>{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {format(new Date(msg.created_at), "yyyy-MM-dd HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))}
                    {communications.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        {isAr ? "لا توجد رسائل" : "No messages yet"}
                      </p>
                    )}
                  </div>
                </ScrollArea>
                <div className="flex gap-2">
                  <Input
                    placeholder={isAr ? "اكتب رسالة..." : "Type a message..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessageMutation.mutate()}
                  />
                  <Button onClick={() => sendMessageMutation.mutate()} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{isAr ? "معلومات الشركة" : "Company Info"}</CardTitle>
              </CardHeader>
              <CardContent>
                {orderDetails.companies && (
                  <div className="flex items-center gap-3">
                    {orderDetails.companies.logo_url ? (
                      <img src={orderDetails.companies.logo_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{orderDetails.companies.name}</p>
                      {orderDetails.companies.email && <p className="text-sm text-muted-foreground">{orderDetails.companies.email}</p>}
                      {orderDetails.companies.phone && <p className="text-sm text-muted-foreground">{orderDetails.companies.phone}</p>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isAr ? "الجدول الزمني" : "Timeline"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <TimelineItem label={isAr ? "تم الإنشاء" : "Created"} date={orderDetails.created_at} color="bg-chart-5" />
                  {orderDetails.approved_at && <TimelineItem label={isAr ? "تم الاعتماد" : "Approved"} date={orderDetails.approved_at} color="bg-chart-1" />}
                  {orderDetails.rejected_at && <TimelineItem label={isAr ? "تم الرفض" : "Rejected"} date={orderDetails.rejected_at} color="bg-destructive" />}
                  {orderDetails.completed_at && <TimelineItem label={isAr ? "مكتمل" : "Completed"} date={orderDetails.completed_at} color="bg-chart-5" />}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ============ SHOP ORDER DETAIL VIEW ============

  if (selectedShopOrder && shopOrderDetails) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedShopOrder(null)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">{shopOrderDetails.order_number}</h1>
                <p className="text-muted-foreground">{shopOrderDetails.buyer_name || shopOrderDetails.buyer_email}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {shopOrderDetails.status === "pending" && (
              <Button size="sm" onClick={() => updateShopStatusMutation.mutate({ id: shopOrderDetails.id, status: "confirmed" })}>
                <CheckCircle className="h-4 w-4 me-1" />
                {isAr ? "تأكيد" : "Confirm"}
              </Button>
            )}
            {shopOrderDetails.status === "confirmed" && (
              <Button size="sm" onClick={() => updateShopStatusMutation.mutate({ id: shopOrderDetails.id, status: "processing" })}>
                <Package className="h-4 w-4 me-1" />
                {isAr ? "معالجة" : "Process"}
              </Button>
            )}
            {shopOrderDetails.status === "processing" && (
              <Button size="sm" onClick={() => updateShopStatusMutation.mutate({ id: shopOrderDetails.id, status: "shipped" })}>
                <Truck className="h-4 w-4 me-1" />
                {isAr ? "شحن" : "Ship"}
              </Button>
            )}
            {shopOrderDetails.status === "shipped" && (
              <Button size="sm" onClick={() => updateShopStatusMutation.mutate({ id: shopOrderDetails.id, status: "delivered" })}>
                <CheckCircle className="h-4 w-4 me-1" />
                {isAr ? "تم التوصيل" : "Delivered"}
              </Button>
            )}
            {!["cancelled", "refunded", "delivered"].includes(shopOrderDetails.status) && (
              <Button size="sm" variant="destructive" onClick={() => updateShopStatusMutation.mutate({ id: shopOrderDetails.id, status: "cancelled" })}>
                <Ban className="h-4 w-4 me-1" />
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{isAr ? "تفاصيل الطلب" : "Order Details"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{isAr ? "الحالة" : "Status"}</p>
                    <Badge className={statusColors[shopOrderDetails.status] || "bg-muted text-muted-foreground"}>
                      {getStatusLabel(shopOrderDetails.status)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{isAr ? "الدفع" : "Payment"}</p>
                    <Badge variant="outline">{getStatusLabel(shopOrderDetails.payment_status || "pending")}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{isAr ? "طريقة الدفع" : "Payment Method"}</p>
                    <p className="font-medium">{shopOrderDetails.payment_method || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{isAr ? "المبلغ" : "Total"}</p>
                    <p className="font-bold text-lg">{shopOrderDetails.currency} <AnimatedCounter value={Math.round(Number(shopOrderDetails.total_amount))} className="inline" format /></p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{isAr ? "المجموع الفرعي" : "Subtotal"}</p>
                    <p className="font-medium">{shopOrderDetails.currency} <AnimatedCounter value={Math.round(Number(shopOrderDetails.subtotal || 0))} className="inline" format /></p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{isAr ? "الضريبة" : "Tax"}</p>
                    <p className="font-medium">{shopOrderDetails.currency} <AnimatedCounter value={Math.round(Number(shopOrderDetails.tax_amount || 0))} className="inline" format /></p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{isAr ? "الخصم" : "Discount"}</p>
                    <p className="font-medium">{shopOrderDetails.currency} <AnimatedCounter value={Math.round(Number(shopOrderDetails.discount_amount || 0))} className="inline" format /></p>
                  </div>
                </div>

                {shopOrderDetails.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{isAr ? "ملاحظات" : "Notes"}</p>
                      <p className="text-sm">{shopOrderDetails.notes}</p>
                    </div>
                  </>
                )}

                {/* Products */}
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{isAr ? "المنتجات" : "Products"}</p>
                  <div className="space-y-3">
                    {shopOrderDetails.shop_order_items?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                          {item.shop_products?.image_url ? (
                            <img src={item.shop_products.image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ShoppingBag className="h-5 w-5 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">
                            {isAr ? item.shop_products?.title_ar || item.shop_products?.title : item.shop_products?.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} × {shopOrderDetails.currency} {Number(item.unit_price).toFixed(2)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          {shopOrderDetails.currency} {Number(item.total_price).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Buyer info sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{isAr ? "معلومات المشتري" : "Buyer Info"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{shopOrderDetails.buyer_name || (isAr ? "غير محدد" : "N/A")}</p>
                    <p className="text-sm text-muted-foreground">{shopOrderDetails.buyer_email || "-"}</p>
                  </div>
                </div>
                {shopOrderDetails.shipping_address && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{isAr ? "عنوان الشحن" : "Shipping Address"}</p>
                    <p className="text-sm">{typeof shopOrderDetails.shipping_address === "string" ? shopOrderDetails.shipping_address : JSON.stringify(shopOrderDetails.shipping_address)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isAr ? "الجدول الزمني" : "Timeline"}</CardTitle>
              </CardHeader>
              <CardContent>
                <TimelineItem label={isAr ? "تم الإنشاء" : "Created"} date={shopOrderDetails.created_at} color="bg-chart-5" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
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
                    {companies.map((c: any) => (
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
        <TabsList>
          <TabsTrigger value="company" className="gap-1.5">
            <Building2 className="h-4 w-4" />
            {isAr ? "طلبات الشركات" : "Company Orders"}
            <Badge variant="secondary" className="ms-1">{companyStats.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="shop" className="gap-1.5">
            <ShoppingBag className="h-4 w-4" />
            {isAr ? "طلبات المتجر" : "Shop Orders"}
            <Badge variant="secondary" className="ms-1">{shopStats.total}</Badge>
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

          <Card>
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
                      className="ps-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
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
                  <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                    <SelectItem value="incoming">{isAr ? "وارد" : "Incoming"}</SelectItem>
                    <SelectItem value="outgoing">{isAr ? "صادر" : "Outgoing"}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
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

              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} />
                      </TableHead>
                      <TableHead>{isAr ? "رقم الطلب" : "Order #"}</TableHead>
                      <TableHead>{isAr ? "الشركة" : "Company"}</TableHead>
                      <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
                      <TableHead>{isAr ? "الاتجاه" : "Dir"}</TableHead>
                      <TableHead>{isAr ? "الفئة" : "Category"}</TableHead>
                      <TableHead>{isAr ? "المبلغ" : "Amount"}</TableHead>
                      <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: any) => (
                      <TableRow key={order.id} className={`cursor-pointer hover:bg-muted/50 ${bulk.isSelected(order.id) ? "bg-primary/5" : ""}`} onClick={() => setSelectedOrder(order.id)}>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={bulk.isSelected(order.id)} onCheckedChange={() => bulk.toggleOne(order.id)} />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {order.companies?.logo_url ? (
                              <img src={order.companies.logo_url} alt="" className="h-6 w-6 rounded object-cover" />
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
                        <TableCell className="text-sm">{getCategoryLabel(order.category)}</TableCell>
                        <TableCell className="font-medium">{Number(order.total_amount).toLocaleString()} {order.currency}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[order.status] || "bg-muted text-muted-foreground"}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{format(new Date(order.created_at), "yyyy-MM-dd")}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {orders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>{isAr ? "لا توجد طلبات" : "No orders found"}</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
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

          <Card>
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
                      className="ps-10"
                    />
                  </div>
                </div>
                <Select value={shopStatusFilter} onValueChange={setShopStatusFilter}>
                  <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
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
                    <TableRow>
                      <TableHead>{isAr ? "رقم الطلب" : "Order #"}</TableHead>
                      <TableHead>{isAr ? "المشتري" : "Buyer"}</TableHead>
                      <TableHead>{isAr ? "المنتجات" : "Products"}</TableHead>
                      <TableHead>{isAr ? "المبلغ" : "Amount"}</TableHead>
                      <TableHead>{isAr ? "الدفع" : "Payment"}</TableHead>
                      <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shopOrders.map((order: any) => (
                      <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedShopOrder(order.id)}>
                        <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{order.buyer_name || "-"}</p>
                            <p className="text-xs text-muted-foreground">{order.buyer_email || "-"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{order.shop_order_items?.length || 0} {isAr ? "منتج" : "items"}</TableCell>
                        <TableCell className="font-medium">{order.currency} {Number(order.total_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{getStatusLabel(order.payment_status || "pending")}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[order.status] || "bg-muted text-muted-foreground"}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{format(new Date(order.created_at), "yyyy-MM-dd")}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {shopOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                          <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>{isAr ? "لا توجد طلبات" : "No shop orders found"}</p>
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
    <Card>
      <CardContent className="pt-4">
        <div className="text-center">
          <p className={`text-2xl font-bold ${color || ""}`}>{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineItem({ label, date, color }: { label: string; date: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{format(new Date(date), "yyyy-MM-dd HH:mm")}</p>
      </div>
    </div>
  );
}

function InternalNotesCard({ notes, onSave, isAr }: { notes: string; onSave: (n: string) => void; isAr: boolean }) {
  const [value, setValue] = useState(notes);
  const [editing, setEditing] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isAr ? "ملاحظات داخلية" : "Internal Notes"}
          </CardTitle>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 me-1" />
              {isAr ? "تعديل" : "Edit"}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setEditing(false); setValue(notes); }}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button size="sm" onClick={() => { onSave(value); setEditing(false); }}>
                <Save className="h-4 w-4 me-1" />
                {isAr ? "حفظ" : "Save"}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <Textarea value={value} onChange={(e) => setValue(e.target.value)} rows={4} placeholder={isAr ? "ملاحظات مرئية للمسؤولين فقط..." : "Notes visible to admins only..."} />
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes || (isAr ? "لا توجد ملاحظات" : "No internal notes")}</p>
        )}
      </CardContent>
    </Card>
  );
}
