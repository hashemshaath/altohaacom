import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star, Building2 } from "lucide-react";

interface VendorInfo {
  name: string;
  nameAr: string;
  count: number;
  delivered: number;
}

interface Props {
  vendorSummary: [string, VendorInfo][];
  isAr: boolean;
}

export const VendorSummaryCard = memo(function VendorSummaryCard({ vendorSummary, isAr }: Props) {
  if (vendorSummary.length === 0) return null;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 px-4 pt-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Star className="h-4 w-4 text-chart-4" />
          {isAr ? "ملخص الموردين" : "Vendor Summary"}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        {vendorSummary.map(([vendorId, info]) => {
          const fulfillment = info.count > 0 ? Math.round((info.delivered / info.count) * 100) : 0;
          return (
            <div key={vendorId} className="flex items-center justify-between py-1.5 border-b last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{isAr ? info.nameAr : info.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {info.count} {isAr ? "عنصر" : "items"} · {info.delivered} {isAr ? "تم التسليم" : "delivered"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={fulfillment} className="h-1.5 w-16" />
                <span className="text-xs font-medium w-8 text-end">{fulfillment}%</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
