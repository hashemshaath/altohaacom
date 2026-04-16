import { defaultOrderForm } from "./orders/ordersAdminTypes";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { SortableTableHead } from "@/components/admin/SortableTableHead";
import { AdminTablePagination } from "@/components/admin/AdminTablePagination";
import { safeLazy } from "@/lib/safeLazy";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

const RevenueAnalyticsWidget = safeLazy(() => import("@/components/admin/RevenueAnalyticsWidget").then(m => ({ default: m.RevenueAnalyticsWidget })));
const PaymentTrackerWidget = safeLazy(() => import("@/components/admin/PaymentTrackerWidget").then(m => ({ default: m.PaymentTrackerWidget })));
const WalletOverviewWidget = safeLazy(() => import("@/components/admin/WalletOverviewWidget").then(m => ({ default: m.WalletOverviewWidget })));
const OrdersRevenueWidget = safeLazy(() => import("@/components/admin/OrdersRevenueWidget").then(m => ({ default: m.OrdersRevenueWidget })));
const OrdersLiveStatsWidget = safeLazy(() => import("@/components/admin/OrdersLiveStatsWidget").then(m => ({ default: m.OrdersLiveStatsWidget })));
const InvoiceTrackerWidget = safeLazy(() => import("@/components/admin/InvoiceTrackerWidget").then(m => ({ default: m.InvoiceTrackerWidget })));
const FinancialSummaryWidget = safeLazy(() => import("@/components/admin/FinancialSummaryWidget").then(m => ({ default: m.FinancialSummaryWidget })));
import { FinanceQuickNav } from "@/components/admin/FinanceQuickNav";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { Checkbox } from "@/components/ui/checkbox";
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
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  Package, Search, Plus, Eye, CheckCircle, XCircle, Clock, ChevronLeft,
  Save, X, Send, MessageSquare, ArrowUpRight, ArrowDownLeft, Truck,
  Building2, ShoppingBag, Edit, Trash2, FileText, Download, Ban, User,
} from "lucide-react";
import { format } from "date-fns";

import { type OrderDirection, type OrderCategory, categoryLabels } from "./orders/ordersAdminTypes";
import { CompanyOrderDetailView } from "./orders/CompanyOrderDetailView";
import { ShopOrderDetailView } from "./orders/ShopOrderDetailView";
import { useOrdersData } from "./orders/useOrdersData";


export default function OrdersAdmin() {
  const {
    isAr,
    activeTab, setActiveTab,
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
    shopSearchQuery, setShopSearchQuery,
    shopStatusFilter, setShopStatusFilter,
    selectedShopOrder, setSelectedShopOrder,
    orders, isLoading,
    orderDetails, communications, companies,
    shopOrders, shopLoading, shopOrderDetails,
    updateStatusMutation, createOrderMutation, updateOrderMutation,
    deleteOrderMutation, updateShopStatusMutation, sendMessageMutation,
    updateInternalNotesMutation,
    getStatusLabelLocal, getCategoryLabelLocal,
    addItemToOrder, removeItemFromOrder, recalcTotal, openEditForm,
    bulk, exportOrdersCSV, bulkStatusChange, bulkDelete,
    companyStats, shopStats,
  } = useOrdersData();

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
            <Badge variant="secondary" className="ms-1 text-xs">{companyStats.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="shop" className="gap-1.5 rounded-xl data-[state=active]:shadow-sm">
            <ShoppingBag className="h-3.5 w-3.5" />
            {isAr ? "طلبات المتجر" : "Shop Orders"}
            <Badge variant="secondary" className="ms-1 text-xs">{shopStats.total}</Badge>
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
          <p className="text-xs uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

