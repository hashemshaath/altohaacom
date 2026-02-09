import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
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
import { useToast } from "@/hooks/use-toast";
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
} from "lucide-react";
import { format } from "date-fns";

type OrderStatus = "draft" | "pending" | "approved" | "rejected" | "in_progress" | "completed" | "cancelled";
type OrderDirection = "outgoing" | "incoming";
type OrderCategory = "promotional" | "equipment" | "materials" | "services" | "catering" | "venue" | "transport" | "other";

interface Order {
  id: string;
  order_number: string;
  company_id: string;
  direction: OrderDirection;
  category: OrderCategory;
  title: string;
  title_ar: string | null;
  total_amount: number;
  currency: string;
  status: OrderStatus;
  order_date: string;
  delivery_date: string | null;
  created_at: string;
}

const statusColors: Record<OrderStatus, string> = {
  draft: "bg-gray-500",
  pending: "bg-yellow-500",
  approved: "bg-blue-500",
  rejected: "bg-red-500",
  in_progress: "bg-purple-500",
  completed: "bg-green-500",
  cancelled: "bg-gray-600",
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

export default function OrdersAdmin() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["all-orders", searchQuery, statusFilter, directionFilter, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from("company_orders")
        .select(`
          *,
          companies:company_id (id, name, name_ar, logo_url)
        `)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`order_number.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as OrderStatus);
      }
      if (directionFilter !== "all") {
        query = query.eq("direction", directionFilter as OrderDirection);
      }
      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter as OrderCategory);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Fetch selected order details
  const { data: orderDetails } = useQuery({
    queryKey: ["order", selectedOrder],
    queryFn: async () => {
      if (!selectedOrder) return null;
      const { data, error } = await supabase
        .from("company_orders")
        .select(`
          *,
          companies:company_id (id, name, name_ar, logo_url, email, phone)
        `)
        .eq("id", selectedOrder)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedOrder,
  });

  // Fetch order communications
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

  // Fetch companies for form
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

  // Update order status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const updates: any = { status };
      if (status === "approved") {
        updates.approved_at = new Date().toISOString();
      } else if (status === "rejected") {
        updates.rejected_at = new Date().toISOString();
      } else if (status === "completed") {
        updates.completed_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("company_orders")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", selectedOrder] });
      toast({ title: language === "ar" ? "تم تحديث الحالة" : "Status updated" });
    },
  });

  // Send message
  const [newMessage, setNewMessage] = useState("");
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder || !newMessage.trim()) return;
      const { error } = await supabase.from("order_communications").insert({
        order_id: selectedOrder,
        message: newMessage,
        sender_type: "admin",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-communications", selectedOrder] });
      setNewMessage("");
      toast({ title: language === "ar" ? "تم إرسال الرسالة" : "Message sent" });
    },
  });

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, { en: string; ar: string }> = {
      draft: { en: "Draft", ar: "مسودة" },
      pending: { en: "Pending", ar: "قيد الانتظار" },
      approved: { en: "Approved", ar: "معتمد" },
      rejected: { en: "Rejected", ar: "مرفوض" },
      in_progress: { en: "In Progress", ar: "قيد التنفيذ" },
      completed: { en: "Completed", ar: "مكتمل" },
      cancelled: { en: "Cancelled", ar: "ملغي" },
    };
    return language === "ar" ? labels[status].ar : labels[status].en;
  };

  const getCategoryLabel = (category: OrderCategory) => {
    return language === "ar" ? categoryLabels[category].ar : categoryLabels[category].en;
  };

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    inProgress: orders.filter(o => o.status === "in_progress" || o.status === "approved").length,
    completed: orders.filter(o => o.status === "completed").length,
    incoming: orders.filter(o => o.direction === "incoming").length,
    outgoing: orders.filter(o => o.direction === "outgoing").length,
  };

  if (selectedOrder && orderDetails) {
    return (
      <div className="space-y-6">
        {/* Header */}
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
            {orderDetails.status === "pending" && (
              <>
                <Button onClick={() => updateStatusMutation.mutate({ id: orderDetails.id, status: "approved" })}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {language === "ar" ? "اعتماد" : "Approve"}
                </Button>
                <Button variant="destructive" onClick={() => updateStatusMutation.mutate({ id: orderDetails.id, status: "rejected" })}>
                  <XCircle className="h-4 w-4 mr-2" />
                  {language === "ar" ? "رفض" : "Reject"}
                </Button>
              </>
            )}
            {orderDetails.status === "approved" && (
              <Button onClick={() => updateStatusMutation.mutate({ id: orderDetails.id, status: "in_progress" })}>
                <Truck className="h-4 w-4 mr-2" />
                {language === "ar" ? "بدء التنفيذ" : "Start Processing"}
              </Button>
            )}
            {orderDetails.status === "in_progress" && (
              <Button onClick={() => updateStatusMutation.mutate({ id: orderDetails.id, status: "completed" })}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {language === "ar" ? "إكمال" : "Complete"}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{language === "ar" ? "تفاصيل الطلب" : "Order Details"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{language === "ar" ? "الحالة" : "Status"}</p>
                    <Badge className={statusColors[orderDetails.status as OrderStatus]}>
                      {getStatusLabel(orderDetails.status as OrderStatus)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{language === "ar" ? "الاتجاه" : "Direction"}</p>
                    <Badge variant={orderDetails.direction === "incoming" ? "default" : "secondary"}>
                      {orderDetails.direction === "incoming"
                        ? (language === "ar" ? "وارد" : "Incoming")
                        : (language === "ar" ? "صادر" : "Outgoing")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{language === "ar" ? "الفئة" : "Category"}</p>
                    <p className="font-medium">{getCategoryLabel(orderDetails.category as OrderCategory)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{language === "ar" ? "المبلغ" : "Amount"}</p>
                    <p className="font-bold text-lg">{Number(orderDetails.total_amount).toLocaleString()} {orderDetails.currency}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{language === "ar" ? "تاريخ الطلب" : "Order Date"}</p>
                    <p className="font-medium">{format(new Date(orderDetails.order_date), "yyyy-MM-dd")}</p>
                  </div>
                  {orderDetails.delivery_date && (
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "تاريخ التسليم" : "Delivery Date"}</p>
                      <p className="font-medium">{format(new Date(orderDetails.delivery_date), "yyyy-MM-dd")}</p>
                    </div>
                  )}
                </div>

                {orderDetails.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{language === "ar" ? "الوصف" : "Description"}</p>
                      <p>{orderDetails.description}</p>
                    </div>
                  </>
                )}

                {orderDetails.items && Array.isArray(orderDetails.items) && orderDetails.items.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{language === "ar" ? "العناصر" : "Items"}</p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{language === "ar" ? "الصنف" : "Item"}</TableHead>
                            <TableHead>{language === "ar" ? "الكمية" : "Qty"}</TableHead>
                            <TableHead>{language === "ar" ? "السعر" : "Price"}</TableHead>
                            <TableHead>{language === "ar" ? "المجموع" : "Total"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(orderDetails.items as any[]).map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{item.price}</TableCell>
                              <TableCell>{item.quantity * item.price}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Communications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {language === "ar" ? "المراسلات" : "Communications"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] mb-4">
                  <div className="space-y-4">
                    {communications.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.sender_type === "admin"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p>{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {format(new Date(msg.created_at), "yyyy-MM-dd HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))}
                    {communications.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        {language === "ar" ? "لا توجد رسائل" : "No messages yet"}
                      </p>
                    )}
                  </div>
                </ScrollArea>
                <div className="flex gap-2">
                  <Input
                    placeholder={language === "ar" ? "اكتب رسالة..." : "Type a message..."}
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

          {/* Company Info Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{language === "ar" ? "معلومات الشركة" : "Company Info"}</CardTitle>
              </CardHeader>
              <CardContent>
                {orderDetails.companies && (
                  <div className="flex items-center gap-3">
                    {orderDetails.companies.logo_url ? (
                      <img
                        src={orderDetails.companies.logo_url}
                        alt={orderDetails.companies.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{orderDetails.companies.name}</p>
                      {orderDetails.companies.email && (
                        <p className="text-sm text-muted-foreground">{orderDetails.companies.email}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{language === "ar" ? "الجدول الزمني" : "Timeline"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{language === "ar" ? "تم الإنشاء" : "Created"}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(orderDetails.created_at), "yyyy-MM-dd HH:mm")}
                      </p>
                    </div>
                  </div>
                  {orderDetails.approved_at && (
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{language === "ar" ? "تم الاعتماد" : "Approved"}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(orderDetails.approved_at), "yyyy-MM-dd HH:mm")}
                        </p>
                      </div>
                    </div>
                  )}
                  {orderDetails.rejected_at && (
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{language === "ar" ? "تم الرفض" : "Rejected"}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(orderDetails.rejected_at), "yyyy-MM-dd HH:mm")}
                        </p>
                      </div>
                    </div>
                  )}
                  {orderDetails.completed_at && (
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{language === "ar" ? "مكتمل" : "Completed"}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(orderDetails.completed_at), "yyyy-MM-dd HH:mm")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          {language === "ar" ? "إدارة الطلبات" : "Order Management"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === "ar" ? "إدارة طلبات الشركات الواردة والصادرة" : "Manage incoming and outgoing company orders"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "إجمالي" : "Total"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "قيد الانتظار" : "Pending"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.inProgress}</p>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "جاري" : "In Progress"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "مكتمل" : "Completed"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.incoming}</p>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "وارد" : "Incoming"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{stats.outgoing}</p>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "صادر" : "Outgoing"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{language === "ar" ? "جميع الطلبات" : "All Orders"}</CardTitle>
            <Button onClick={() => setShowOrderForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {language === "ar" ? "طلب جديد" : "New Order"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === "ar" ? "بحث برقم الطلب أو العنوان..." : "Search by order number or title..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={language === "ar" ? "الحالة" : "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "ar" ? "جميع الحالات" : "All Status"}</SelectItem>
                <SelectItem value="pending">{language === "ar" ? "قيد الانتظار" : "Pending"}</SelectItem>
                <SelectItem value="approved">{language === "ar" ? "معتمد" : "Approved"}</SelectItem>
                <SelectItem value="in_progress">{language === "ar" ? "جاري" : "In Progress"}</SelectItem>
                <SelectItem value="completed">{language === "ar" ? "مكتمل" : "Completed"}</SelectItem>
                <SelectItem value="rejected">{language === "ar" ? "مرفوض" : "Rejected"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={language === "ar" ? "الاتجاه" : "Direction"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
                <SelectItem value="incoming">{language === "ar" ? "وارد" : "Incoming"}</SelectItem>
                <SelectItem value="outgoing">{language === "ar" ? "صادر" : "Outgoing"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={language === "ar" ? "الفئة" : "Category"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "ar" ? "جميع الفئات" : "All Categories"}</SelectItem>
                {Object.entries(categoryLabels).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {language === "ar" ? value.ar : value.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "ar" ? "رقم الطلب" : "Order #"}</TableHead>
                  <TableHead>{language === "ar" ? "الشركة" : "Company"}</TableHead>
                  <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
                  <TableHead>{language === "ar" ? "الاتجاه" : "Direction"}</TableHead>
                  <TableHead>{language === "ar" ? "الفئة" : "Category"}</TableHead>
                  <TableHead>{language === "ar" ? "المبلغ" : "Amount"}</TableHead>
                  <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedOrder(order.id)}
                  >
                    <TableCell className="font-mono">{order.order_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {order.companies?.logo_url ? (
                          <img src={order.companies.logo_url} alt="" className="h-6 w-6 rounded object-cover" />
                        ) : (
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="truncate max-w-[150px]">{order.companies?.name || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{order.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {order.direction === "incoming" ? (
                          <ArrowDownLeft className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-blue-600" />
                        )}
                        <span className="text-sm">
                          {order.direction === "incoming"
                            ? (language === "ar" ? "وارد" : "In")
                            : (language === "ar" ? "صادر" : "Out")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryLabel(order.category as OrderCategory)}</TableCell>
                    <TableCell>{Number(order.total_amount).toLocaleString()} {order.currency}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status as OrderStatus]}>
                        {getStatusLabel(order.status as OrderStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(order.created_at), "yyyy-MM-dd")}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{language === "ar" ? "لا توجد طلبات" : "No orders found"}</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
