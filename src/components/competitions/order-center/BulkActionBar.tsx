import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, X, Truck, RefreshCw } from "lucide-react";
import { ITEM_STATUS_LABELS } from "./OrderStatusLabels";

interface Props {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkStatusChange: (status: string) => void;
  onBulkVendorAssign?: (vendorId: string) => void;
  vendors?: Array<{ id: string; name: string; name_ar: string | null }>;
  isAr: boolean;
  isLoading?: boolean;
}

export const BulkActionBar = memo(function BulkActionBar({
  selectedCount,
  onClearSelection,
  onBulkStatusChange,
  onBulkVendorAssign,
  vendors,
  isAr,
  isLoading,
}: Props) {
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkVendor, setBulkVendor] = useState("");

  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-16 md:bottom-4 z-30 mx-auto max-w-2xl animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-card p-2.5 shadow-lg backdrop-blur-sm flex-wrap sm:flex-nowrap">
        <Badge variant="default" className="shrink-0 gap-1">
          <CheckSquare className="h-3 w-3" />
          {selectedCount} {isAr ? "محدد" : "selected"}
        </Badge>

        {/* Bulk Status */}
        <Select value={bulkStatus} onValueChange={(v) => { setBulkStatus(v); onBulkStatusChange(v); setBulkStatus(""); }}>
          <SelectTrigger className="h-7 w-28 text-[10px]">
            <RefreshCw className="me-1 h-3 w-3" />
            <SelectValue placeholder={isAr ? "تغيير الحالة" : "Set status"} />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ITEM_STATUS_LABELS).map(([key, val]) => (
              <SelectItem key={key} value={key} className="text-xs">
                {isAr ? val.ar : val.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Bulk Vendor */}
        {onBulkVendorAssign && vendors && vendors.length > 0 && (
          <Select value={bulkVendor} onValueChange={(v) => { setBulkVendor(v); onBulkVendorAssign(v); setBulkVendor(""); }}>
            <SelectTrigger className="h-7 w-32 text-[10px]">
              <Truck className="me-1 h-3 w-3" />
              <SelectValue placeholder={isAr ? "تعيين مورد" : "Assign vendor"} />
            </SelectTrigger>
            <SelectContent>
              {vendors.map((v) => (
                <SelectItem key={v.id} value={v.id} className="text-xs">
                  {isAr && v.name_ar ? v.name_ar : v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="ms-auto">
          <Button variant="ghost" size="sm" onClick={onClearSelection} className="h-7 text-[10px]" disabled={isLoading}>
            <X className="me-1 h-3 w-3" />
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
        </div>
      </div>
    </div>
  );
}
