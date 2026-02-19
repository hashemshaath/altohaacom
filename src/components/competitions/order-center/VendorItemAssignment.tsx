import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Truck } from "lucide-react";
import { ITEM_STATUS_LABELS, getStatusLabel } from "./OrderStatusLabels";
import { ORDER_CATEGORIES } from "./OrderCenterCategories";

interface ListGroup {
  id: string;
  title: string;
  title_ar: string | null;
  items: any[];
}

interface Company {
  id: string;
  name: string;
  name_ar: string | null;
}

interface Props {
  grouped: ListGroup[];
  companies: Company[];
  filterCategory: string;
  onFilterChange: (v: string) => void;
  onAssign: (itemId: string, companyId: string | null) => void;
  isOrganizer?: boolean;
  isAr: boolean;
  language: string;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export function VendorItemAssignment({ grouped, companies, filterCategory, onFilterChange, onAssign, isOrganizer, isAr, language, selectedIds, onToggleSelect }: Props) {
  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">{isAr ? "تعيين الموردين" : "Assign Vendors"}</h4>
        <div className="ms-auto">
          <Select value={filterCategory} onValueChange={onFilterChange}>
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">{isAr ? "جميع الفئات" : "All Categories"}</SelectItem>
              {ORDER_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value} className="text-xs">
                  {isAr ? cat.labelAr : cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items */}
      {!grouped.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Truck className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">{isAr ? "لا توجد عناصر لتعيين موردين" : "No items to assign vendors"}</p>
          </CardContent>
        </Card>
      ) : (
        grouped.map(list => (
          <Card key={list.id} className="border-border/60 overflow-hidden">
            <CardHeader className="py-3 px-4 bg-muted/30 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {isAr && list.title_ar ? list.title_ar : list.title}
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  {list.items.filter(i => (i as any).assigned_vendor_id).length}/{list.items.length} {isAr ? "معين" : "assigned"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {list.items.map(item => {
                const name = item.item_id && (item as any).requirement_items
                  ? (isAr && (item as any).requirement_items.name_ar ? (item as any).requirement_items.name_ar : (item as any).requirement_items.name)
                  : (isAr && item.custom_name_ar ? item.custom_name_ar : item.custom_name);
                const currentVendor = (item as any).assigned_vendor_id;
                return (
                  <div key={item.id} className={`flex items-center gap-2 sm:gap-3 border-b last:border-0 px-3 sm:px-4 py-2.5 transition-colors ${currentVendor ? "bg-chart-1/5" : ""} ${selectedIds?.has(item.id) ? "ring-1 ring-inset ring-primary/30 bg-primary/5" : ""}`}>
                    {isOrganizer && onToggleSelect && (
                      <Checkbox
                        checked={selectedIds?.has(item.id) || false}
                        onCheckedChange={() => onToggleSelect(item.id)}
                        className="shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{name || "—"}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{item.quantity} {item.unit}</span>
                        <Badge variant="outline" className="text-[9px] h-4">
                          {getStatusLabel(ITEM_STATUS_LABELS, item.status || "pending", language)}
                        </Badge>
                      </div>
                    </div>
                    {isOrganizer ? (
                      <Select
                        value={currentVendor || "none"}
                        onValueChange={(v) => onAssign(item.id, v === "none" ? null : v)}
                      >
                        <SelectTrigger className="h-7 w-40 text-[10px]">
                          <Building2 className="me-1 h-3 w-3 shrink-0" />
                          <SelectValue placeholder={isAr ? "تعيين مورد..." : "Assign vendor..."} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">{isAr ? "بدون مورد" : "No vendor"}</SelectItem>
                          {companies?.map(c => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">
                              {isAr && c.name_ar ? c.name_ar : c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : currentVendor ? (
                      <Badge variant="secondary" className="text-[10px]">
                        <Building2 className="me-1 h-3 w-3" />
                        {(() => {
                          const c = companies?.find(c => c.id === currentVendor);
                          return c ? (isAr && c.name_ar ? c.name_ar : c.name) : "—";
                        })()}
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">{isAr ? "غير معين" : "Unassigned"}</span>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
