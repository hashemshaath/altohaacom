import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, Package } from "lucide-react";
import { CatalogItem, categories } from "./catalogTypes";

interface CatalogTableProps {
  items: CatalogItem[];
  isLoading: boolean;
  language: string;
  onEdit: (item: CatalogItem) => void;
  onDelete: (id: string) => void;
}

export function CatalogTable({ items, isLoading, language, onEdit, onDelete }: CatalogTableProps) {
  const getCategoryLabel = (val: string) => {
    const cat = categories.find((c) => c.value === val);
    return cat ? (language === "ar" ? cat.ar : cat.en) : val;
  };

  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <Skeleton className="m-6 h-64" />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">
              {language === "ar" ? "لا توجد منتجات" : "No products yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {language === "ar" ? "أضف أول منتج إلى الكتالوج" : "Add your first product to the catalog"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "ar" ? "المنتج" : "Product"}</TableHead>
                  <TableHead>{language === "ar" ? "الفئة" : "Category"}</TableHead>
                  <TableHead>{language === "ar" ? "SKU" : "SKU"}</TableHead>
                  <TableHead>{language === "ar" ? "السعر" : "Price"}</TableHead>
                  <TableHead>{language === "ar" ? "الكمية" : "Qty"}</TableHead>
                  <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="text-end">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="h-10 w-10 rounded-md object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.name_ar && <p className="text-xs text-muted-foreground" dir="rtl">{item.name_ar}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{getCategoryLabel(item.category)}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{item.sku || "-"}</TableCell>
                    <TableCell>
                      {item.unit_price != null ? `${item.unit_price.toLocaleString()} ${item.currency || "SAR"}` : "-"}
                      {item.unit && <span className="text-xs text-muted-foreground"> / {item.unit}</span>}
                    </TableCell>
                    <TableCell>{item.quantity_available ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={item.is_active ? "default" : "secondary"} className="w-fit">
                          {item.is_active ? (language === "ar" ? "نشط" : "Active") : (language === "ar" ? "غير نشط" : "Inactive")}
                        </Badge>
                        <Badge variant="outline" className={`w-fit ${item.in_stock ? "text-chart-5 border-chart-5" : "text-destructive border-destructive"}`}>
                          {item.in_stock ? (language === "ar" ? "متوفر" : "In Stock") : (language === "ar" ? "نفد" : "Out")}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(item)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
