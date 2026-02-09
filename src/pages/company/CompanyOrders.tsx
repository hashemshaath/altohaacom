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

  const getStatusColor = (status: string | null): "default" | "destructive" | "outline" | "secondary" => {
    const colors: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      draft: "secondary",
      pending: "secondary",
      approved: "default",
      in_progress: "default",
      completed: "default",
      rejected: "destructive",
    };
    return colors[status || "pending"] || "secondary";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === "ar" ? "الطلبيات" : "Orders"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {language === "ar" ? "عرض وإدارة جميع الطلبيات" : "View and manage all orders"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {language === "ar" ? "قائمة الطلبيات" : "Orders List"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : orders && orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "رقم الطلب" : "Order #"}</TableHead>
                    <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
                    <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{language === "ar" ? "المبلغ الإجمالي" : "Total"}</TableHead>
                    <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.title}</TableCell>
                      <TableCell className="capitalize">{order.direction}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(order.status || "pending")}>
                          {order.status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.currency} {order.total_amount?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {order.created_at ? format(new Date(order.created_at), "MMM dd, yyyy") : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "لا توجد طلبيات" : "No orders found"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
