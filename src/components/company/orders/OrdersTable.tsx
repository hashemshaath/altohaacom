import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Eye, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { CompanyOrder, ORDER_CATEGORIES } from "./orderTypes";
import { OrderStatusBadge } from "./OrderStatusBadge";

interface OrdersTableProps {
  orders: CompanyOrder[];
  isLoading: boolean;
  language: string;
  onView: (order: CompanyOrder) => void;
}

export function OrdersTable({ orders, isLoading, language, onView }: OrdersTableProps) {
  const isAr = language === "ar";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAr ? "قائمة الطلبيات" : "Orders List"}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? "رقم الطلب" : "Order #"}</TableHead>
                  <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
                  <TableHead>{isAr ? "النوع" : "Direction"}</TableHead>
                  <TableHead>{isAr ? "الفئة" : "Category"}</TableHead>
                  <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isAr ? "المبلغ" : "Total"}</TableHead>
                  <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                  <TableHead className="text-end">{isAr ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const catInfo = ORDER_CATEGORIES.find(c => c.value === order.category);
                  return (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onView(order)}>
                      <TableCell className="font-mono text-sm font-medium">{order.order_number}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{order.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {order.direction === "outgoing" ? (isAr ? "صادر" : "Outgoing") : (isAr ? "وارد" : "Incoming")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {catInfo ? (isAr ? catInfo.ar : catInfo.en) : order.category}
                        </Badge>
                      </TableCell>
                      <TableCell><OrderStatusBadge status={order.status} language={language} /></TableCell>
                      <TableCell className="font-medium">
                        {order.currency || "SAR"} {order.total_amount?.toLocaleString() || "0"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.created_at ? format(new Date(order.created_at), "MMM dd, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell className="text-end">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onView(order); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
              <ShoppingCart className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{isAr ? "لا توجد طلبيات" : "No orders found"}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
