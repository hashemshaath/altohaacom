import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import type { Database } from "@/integrations/supabase/types";
import {
  type OrderStatus,
  type OrderFormType,
  defaultOrderForm,
  getStatusLabel,
  getCategoryLabel,
} from "./ordersAdminTypes";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

type CompanyOrderStatus = Database["public"]["Tables"]["company_orders"]["Row"]["status"];
type CompanyOrderDirection = Database["public"]["Tables"]["company_orders"]["Row"]["direction"];
type CompanyOrderCategory = Database["public"]["Tables"]["company_orders"]["Row"]["category"];
type ShopOrderStatus = Database["public"]["Tables"]["shop_orders"]["Row"]["status"];

export function useOrdersData() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [activeTab, setActiveTab] = useState("company");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [orderForm, setOrderForm] = useState<OrderFormType>({ ...defaultOrderForm });
  const [newItem, setNewItem] = useState({ name: "", quantity: 1, price: 0 });
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [shopSearchQuery, setShopSearchQuery] = useState("");
  const [shopStatusFilter, setShopStatusFilter] = useState("all");
  const [selectedShopOrder, setSelectedShopOrder] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // ============ QUERIES ============

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["all-orders", searchQuery, statusFilter, directionFilter, categoryFilter],
    queryFn: async () => {
      let query = supabase.from("company_orders")
        .select("*, companies:company_id (id, name, name_ar, logo_url)")
        .order("created_at", { ascending: false });
      if (searchQuery) query = query.or(`order_number.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
      if (statusFilter !== "all") query = query.eq("status", statusFilter as CompanyOrderStatus);
      if (directionFilter !== "all") query = query.eq("direction", directionFilter as CompanyOrderDirection);
      if (categoryFilter !== "all") query = query.eq("category", categoryFilter as CompanyOrderCategory);
      const { data, error } = await query.limit(200);
      if (error) throw handleSupabaseError(error);
      return data;
    },
  });

  const { data: orderDetails } = useQuery({
    queryKey: ["order", selectedOrder],
    queryFn: async () => {
      if (!selectedOrder) return null;
      const { data, error } = await supabase.from("company_orders")
        .select("*, companies:company_id (id, name, name_ar, logo_url, email, phone)")
        .eq("id", selectedOrder).single();
      if (error) throw handleSupabaseError(error);
      return data;
    },
    enabled: !!selectedOrder,
  });

  const { data: communications = [] } = useQuery({
    queryKey: ["order-communications", selectedOrder],
    queryFn: async () => {
      if (!selectedOrder) return [];
      const { data, error } = await supabase.from("order_communications")
        .select("id, order_id, message, sender_type, sender_id, created_at")
        .eq("order_id", selectedOrder).order("created_at", { ascending: true });
      if (error) throw handleSupabaseError(error);
      return data;
    },
    enabled: !!selectedOrder,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies")
        .select("id, name, name_ar").eq("status", "active").order("name");
      if (error) throw handleSupabaseError(error);
      return data;
    },
  });

  const { data: shopOrders = [], isLoading: shopLoading } = useQuery({
    queryKey: ["shop-orders-admin", shopSearchQuery, shopStatusFilter],
    queryFn: async () => {
      let query = supabase.from("shop_orders")
        .select("*, shop_order_items(*, shop_products(title, title_ar, image_url))")
        .order("created_at", { ascending: false });
      if (shopSearchQuery) query = query.or(`order_number.ilike.%${shopSearchQuery}%,buyer_name.ilike.%${shopSearchQuery}%,buyer_email.ilike.%${shopSearchQuery}%`);
      if (shopStatusFilter !== "all") query = query.eq("status", shopStatusFilter as ShopOrderStatus);
      const { data, error } = await query.limit(200);
      if (error) throw handleSupabaseError(error);
      return data;
    },
  });

  const { data: shopOrderDetails } = useQuery({
    queryKey: ["shop-order-detail", selectedShopOrder],
    queryFn: async () => {
      if (!selectedShopOrder) return null;
      const { data, error } = await supabase.from("shop_orders")
        .select("*, shop_order_items(*, shop_products(title, title_ar, image_url))")
        .eq("id", selectedShopOrder).single();
      if (error) throw handleSupabaseError(error);
      return data;
    },
    enabled: !!selectedShopOrder,
  });

  // ============ MUTATIONS ============

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: OrderStatus; reason?: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === "approved") updates.approved_at = new Date().toISOString();
      if (status === "rejected") {
        updates.rejected_at = new Date().toISOString();
        if (reason) updates.rejection_reason = reason;
      }
      if (status === "completed") updates.completed_at = new Date().toISOString();
      const { error } = await supabase.from("company_orders").update(updates).eq("id", id);
      if (error) throw handleSupabaseError(error);
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
        direction: orderForm.direction, category: orderForm.category,
        title: orderForm.title, title_ar: orderForm.title_ar || null,
        description: orderForm.description || null, description_ar: orderForm.description_ar || null,
        total_amount: orderForm.total_amount, subtotal: orderForm.subtotal,
        tax_amount: orderForm.tax_amount, discount_amount: orderForm.discount_amount,
        currency: orderForm.currency, order_date: orderForm.order_date,
        delivery_date: orderForm.delivery_date || null, due_date: orderForm.due_date || null,
        notes: orderForm.notes || null, internal_notes: orderForm.internal_notes || null,
        items: orderForm.items.length > 0 ? JSON.stringify(orderForm.items) : "[]",
        status: "pending", created_by: user?.id,
      });
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-orders"] });
      setShowOrderForm(false);
      setOrderForm({ ...defaultOrderForm });
      toast({ title: isAr ? "تم إنشاء الطلب" : "Order created" });
    },
    onError: (e: Error) => {
      toast({ title: isAr ? "خطأ" : "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async () => {
      if (!editingOrder) return;
      const { error } = await supabase.from("company_orders").update({
        title: orderForm.title, title_ar: orderForm.title_ar || null,
        description: orderForm.description || null, description_ar: orderForm.description_ar || null,
        total_amount: orderForm.total_amount, subtotal: orderForm.subtotal,
        tax_amount: orderForm.tax_amount, discount_amount: orderForm.discount_amount,
        currency: orderForm.currency, delivery_date: orderForm.delivery_date || null,
        due_date: orderForm.due_date || null, notes: orderForm.notes || null,
        internal_notes: orderForm.internal_notes || null,
        items: orderForm.items.length > 0 ? JSON.stringify(orderForm.items) : "[]",
        direction: orderForm.direction, category: orderForm.category,
      }).eq("id", editingOrder);
      if (error) throw handleSupabaseError(error);
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
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-orders"] });
      setSelectedOrder(null);
      toast({ title: isAr ? "تم حذف الطلب" : "Order deleted" });
    },
  });

  const updateShopStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("shop_orders").update({ status: status as ShopOrderStatus }).eq("id", id);
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-orders-admin"] });
      queryClient.invalidateQueries({ queryKey: ["shop-order-detail", selectedShopOrder] });
      toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder || !newMessage.trim()) return;
      const { error } = await supabase.from("order_communications").insert({
        order_id: selectedOrder, message: newMessage, sender_type: "admin", sender_id: user?.id,
      });
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-communications", selectedOrder] });
      setNewMessage("");
    },
  });

  const updateInternalNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase.from("company_orders").update({ internal_notes: notes }).eq("id", id);
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", selectedOrder] });
      toast({ title: isAr ? "تم حفظ الملاحظات" : "Notes saved" });
    },
  });

  // ============ HELPERS ============

  const getStatusLabelLocal = (status: string) => getStatusLabel(status, isAr);
  const getCategoryLabelLocal = (category: string) => getCategoryLabel(category, isAr);

  const addItemToOrder = useCallback(() => {
    if (!newItem.name.trim()) return;
    const updatedItems = [...orderForm.items, { ...newItem }];
    const subtotal = updatedItems.reduce((sum, i) => sum + i.quantity * i.price, 0);
    setOrderForm(prev => ({ ...prev, items: updatedItems, subtotal, total_amount: subtotal + prev.tax_amount - prev.discount_amount }));
    setNewItem({ name: "", quantity: 1, price: 0 });
  }, [newItem, orderForm.items, orderForm.tax_amount, orderForm.discount_amount]);

  const removeItemFromOrder = useCallback((idx: number) => {
    const updatedItems = orderForm.items.filter((_, i) => i !== idx);
    const subtotal = updatedItems.reduce((sum, i) => sum + i.quantity * i.price, 0);
    setOrderForm(prev => ({ ...prev, items: updatedItems, subtotal, total_amount: subtotal + prev.tax_amount - prev.discount_amount }));
  }, [orderForm.items, orderForm.tax_amount, orderForm.discount_amount]);

  const recalcTotal = useCallback((field: string, value: number) => {
    setOrderForm(prev => {
      const updated = { ...prev, [field]: value };
      updated.total_amount = updated.subtotal + updated.tax_amount - updated.discount_amount;
      return updated;
    });
  }, []);

  const openEditForm = (order: Record<string, unknown>) => {
    setEditingOrder(order.id as string);
    setOrderForm({
      company_id: order.company_id as string,
      direction: (order.direction as OrderFormType["direction"]) || "outgoing",
      category: (order.category as OrderFormType["category"]) || "other",
      title: (order.title as string) || "", title_ar: (order.title_ar as string) || "",
      description: (order.description as string) || "", description_ar: (order.description_ar as string) || "",
      total_amount: Number(order.total_amount) || 0, subtotal: Number(order.subtotal) || 0,
      tax_amount: Number(order.tax_amount) || 0, discount_amount: Number(order.discount_amount) || 0,
      currency: (order.currency as string) || "SAR",
      order_date: (order.order_date as string) || "", delivery_date: (order.delivery_date as string) || "",
      due_date: (order.due_date as string) || "", notes: (order.notes as string) || "",
      internal_notes: (order.internal_notes as string) || "",
      items: Array.isArray(order.items) ? order.items : [],
    });
    setShowOrderForm(true);
    setSelectedOrder(null);
  };

  const bulk = useAdminBulkActions(orders);

  const { exportCSV: exportOrdersCSV } = useCSVExport({
    columns: [
      { header: isAr ? "رقم الطلب" : "Order #", accessor: (o: typeof orders[number]) => o.order_number },
      { header: isAr ? "الشركة" : "Company", accessor: (o: typeof orders[number]) => o.companies?.name || "" },
      { header: isAr ? "العنوان" : "Title", accessor: (o: typeof orders[number]) => o.title },
      { header: isAr ? "الاتجاه" : "Direction", accessor: (o: typeof orders[number]) => o.direction },
      { header: isAr ? "الفئة" : "Category", accessor: (o: typeof orders[number]) => getCategoryLabelLocal(o.category) },
      { header: isAr ? "المبلغ" : "Amount", accessor: (o: typeof orders[number]) => o.total_amount },
      { header: isAr ? "العملة" : "Currency", accessor: (o: typeof orders[number]) => o.currency },
      { header: isAr ? "الحالة" : "Status", accessor: (o: typeof orders[number]) => getStatusLabelLocal(o.status) },
      { header: isAr ? "التاريخ" : "Date", accessor: (o: typeof orders[number]) => o.created_at?.split("T")[0] || "" },
    ],
    filename: "orders",
  });

  const bulkStatusChange = async (status: string) => {
    const ids = [...bulk.selected];
    const { error } = await supabase.from("company_orders").update({ status: status as CompanyOrderStatus }).in("id", ids);
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

  const companyStats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    inProgress: orders.filter((o) => o.status === "in_progress" || o.status === "approved").length,
    completed: orders.filter((o) => o.status === "completed").length,
    incoming: orders.filter((o) => o.direction === "incoming").length,
    outgoing: orders.filter((o) => o.direction === "outgoing").length,
  }), [orders]);

  const shopStats = useMemo(() => ({
    total: shopOrders.length,
    pending: shopOrders.filter((o) => o.status === "pending").length,
    confirmed: shopOrders.filter((o) => ["confirmed", "processing"].includes(o.status)).length,
    shipped: shopOrders.filter((o) => o.status === "shipped").length,
    delivered: shopOrders.filter((o) => o.status === "delivered").length,
  }), [shopOrders]);

  return {
    isAr,
    // Tab
    activeTab, setActiveTab,
    // Company orders
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    directionFilter, setDirectionFilter,
    categoryFilter, setCategoryFilter,
    selectedOrder, setSelectedOrder,
    showOrderForm, setShowOrderForm,
    editingOrder, setEditingOrder,
    orderForm, setOrderForm,
    newItem, setNewItem,
    rejectionReason, setRejectionReason,
    showRejectDialog, setShowRejectDialog,
    newMessage, setNewMessage,
    // Shop orders
    shopSearchQuery, setShopSearchQuery,
    shopStatusFilter, setShopStatusFilter,
    selectedShopOrder, setSelectedShopOrder,
    // Data
    orders, isLoading,
    orderDetails, communications, companies,
    shopOrders, shopLoading, shopOrderDetails,
    // Mutations
    updateStatusMutation, createOrderMutation, updateOrderMutation,
    deleteOrderMutation, updateShopStatusMutation, sendMessageMutation,
    updateInternalNotesMutation,
    // Helpers
    getStatusLabelLocal, getCategoryLabelLocal,
    addItemToOrder, removeItemFromOrder, recalcTotal, openEditForm,
    bulk, exportOrdersCSV, bulkStatusChange, bulkDelete,
    // Stats
    companyStats, shopStats,
  };
}
