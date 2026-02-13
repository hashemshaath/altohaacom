import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
} from "lucide-react";
import { format } from "date-fns";

export default function CompanyOrders() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["companyOrders", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_orders")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const pending = orders?.filter(o => o.status === "pending").length || 0;
  const completed = orders?.filter(o => o.status === "completed").length || 0;
  const rejected = orders?.filter(o => o.status === "rejected").length || 0;

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">{language === "ar" ? "مكتمل" : "Completed"}</Badge>;
      case "approved":
      case "in_progress":
        return <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20">{status === "approved" ? (language === "ar" ? "معتمد" : "Approved") : (language === "ar" ? "قيد التنفيذ" : "In Progress")}</Badge>;
      case "rejected":
        return <Badge variant="destructive">{language === "ar" ? "مرفوض" : "Rejected"}</Badge>;
      case "draft":
        return <Badge variant="outline">{language === "ar" ? "مسودة" : "Draft"}</Badge>;
      default:
        return <Badge variant="secondary">{language === "ar" ? "قيد الانتظار" : "Pending"}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          {language === "ar" ? "الطلبيات" : "Orders"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {language === "ar" ? "عرض وإدارة جميع الطلبيات" : "View and manage all orders"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat icon={Package} label={language === "ar" ? "الإجمالي" : "Total"} value={orders?.length || 0} accent="border-s-primary" isLoading={isLoading} />
        <MiniStat icon={Clock} label={language === "ar" ? "قيد الانتظار" : "Pending"} value={pending} accent="border-s-amber-500" isLoading={isLoading} />
        <MiniStat icon={CheckCircle2} label={language === "ar" ? "مكتمل" : "Completed"} value={completed} accent="border-s-emerald-500" isLoading={isLoading} />
        <MiniStat icon={XCircle} label={language === "ar" ? "مرفوض" : "Rejected"} value={rejected} accent="border-s-destructive" isLoading={isLoading} />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "ar" ? "قائمة الطلبيات" : "Orders List"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "رقم الطلب" : "Order #"}</TableHead>
                    <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
                    <TableHead>{language === "ar" ? "النوع" : "Direction"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{language === "ar" ? "المبلغ" : "Total"}</TableHead>
                    <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm font-medium">{order.order_number}</TableCell>
                      <TableCell className="font-medium">{order.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{order.direction}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="font-medium">
                        SAR {order.total_amount?.toLocaleString() || "0"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.created_at ? format(new Date(order.created_at), "MMM dd, yyyy") : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
                <ShoppingCart className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {language === "ar" ? "لا توجد طلبيات" : "No orders found"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, accent, isLoading }: { icon: any; label: string; value: number; accent: string; isLoading: boolean }) {
  return (
    <Card className={`border-s-[3px] ${accent}`}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-muted p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          {isLoading ? <Skeleton className="h-6 w-8 mt-0.5" /> : <p className="text-xl font-bold">{value}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
