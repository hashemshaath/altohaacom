import { useMemo, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Building2, TrendingUp, CheckCircle, Clock, AlertTriangle,
  Star, Package, BarChart3,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface Props {
  competitionId: string;
  isOrganizer?: boolean;
}

interface VendorMetrics {
  id: string;
  name: string;
  nameAr: string;
  logoUrl: string | null;
  totalItems: number;
  delivered: number;
  pending: number;
  overdue: number;
  deliveryRate: number;
  avgDeliveryDays: number | null;
  categories: string[];
}

export function VendorPerformance({ competitionId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: lists } = useQuery({
    queryKey: ["vendor-perf-lists", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_lists")
        .select("id, category")
        .eq("competition_id", competitionId);
      if (error) throw error;
      return data;
    },
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["vendor-perf-items", competitionId],
    queryFn: async () => {
      if (!lists?.length) return [];
      const { data, error } = await supabase
        .from("requirement_list_items")
        .select("id, list_id, status, deadline, delivered_at, assigned_at, assigned_vendor_id, requirement_items(category)")
        .in("list_id", lists.map(l => l.id));
      if (error) throw error;
      return data as any[];
    },
    enabled: !!lists?.length,
  });

  const { data: companies } = useQuery({
    queryKey: ["vendor-perf-companies"],
    queryFn: async () => {
      const vendorIds = [...new Set((items || []).map(i => i.assigned_vendor_id).filter(Boolean))];
      if (!vendorIds.length) return [];
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, name_ar, logo_url")
        .in("id", vendorIds);
      if (error) throw error;
      return data;
    },
    enabled: !!(items?.length),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Build vendor metrics
  const vendorMap = new Map<string, VendorMetrics>();
  const categoryMap = new Map<string, string>();
  lists?.forEach(l => categoryMap.set(l.id, l.category));

  (items || []).forEach(item => {
    const vendorId = item.assigned_vendor_id;
    if (!vendorId) return;
    const company = companies?.find(c => c.id === vendorId);
    if (!company) return;

    if (!vendorMap.has(vendorId)) {
      vendorMap.set(vendorId, {
        id: vendorId,
        name: company.name,
        nameAr: company.name_ar || company.name,
        logoUrl: company.logo_url,
        totalItems: 0,
        delivered: 0,
        pending: 0,
        overdue: 0,
        deliveryRate: 0,
        avgDeliveryDays: null,
        categories: [],
      });
    }

    const metrics = vendorMap.get(vendorId)!;
    metrics.totalItems++;
    if (item.status === "delivered") {
      metrics.delivered++;
      if (item.assigned_at && item.delivered_at) {
        const days = Math.round(
          (new Date(item.delivered_at).getTime() - new Date(item.assigned_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        metrics.avgDeliveryDays = metrics.avgDeliveryDays !== null
          ? Math.round((metrics.avgDeliveryDays * (metrics.delivered - 1) + days) / metrics.delivered)
          : days;
      }
    } else {
      metrics.pending++;
      if (item.deadline && new Date(item.deadline) < new Date()) {
        metrics.overdue++;
      }
    }

    const cat = categoryMap.get(item.list_id) || "general";
    if (!metrics.categories.includes(cat)) metrics.categories.push(cat);
  });

  const vendors = Array.from(vendorMap.values())
    .map(v => ({ ...v, deliveryRate: v.totalItems > 0 ? Math.round((v.delivered / v.totalItems) * 100) : 0 }))
    .sort((a, b) => b.totalItems - a.totalItems);

  const { totalAssigned, totalDelivered, totalOverdue, avgRate } = useMemo(() => {
    const ta = vendors.reduce((s, v) => s + v.totalItems, 0);
    const td = vendors.reduce((s, v) => s + v.delivered, 0);
    return {
      totalAssigned: ta, totalDelivered: td,
      totalOverdue: vendors.reduce((s, v) => s + v.overdue, 0),
      avgRate: ta > 0 ? Math.round((td / ta) * 100) : 0,
    };
  }, [vendors]);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <Building2 className="mx-auto mb-1 h-5 w-5 text-primary" />
            <AnimatedCounter value={vendors.length} className="text-xl" />
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "الموردين" : "Vendors"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <Package className="mx-auto mb-1 h-5 w-5 text-chart-1" />
            <AnimatedCounter value={totalAssigned} className="text-xl" />
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "عناصر معينة" : "Assigned"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <CheckCircle className="mx-auto mb-1 h-5 w-5 text-chart-5" />
            <AnimatedCounter value={avgRate} className="text-xl" suffix="%" />
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "معدل التسليم" : "Delivery Rate"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <AlertTriangle className="mx-auto mb-1 h-5 w-5 text-destructive" />
            <AnimatedCounter value={totalOverdue} className="text-xl font-bold" />
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "متأخرة" : "Overdue"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Cards */}
      {!vendors.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">{isAr ? "لا توجد بيانات أداء بعد" : "No performance data yet"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? "قم بتعيين موردين للعناصر لمتابعة الأداء" : "Assign vendors to items to track performance"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {vendors.map((vendor, index) => {
            const ratingColor = vendor.deliveryRate >= 80 ? "text-chart-5" : vendor.deliveryRate >= 50 ? "text-chart-4" : "text-destructive";
            const ratingBg = vendor.deliveryRate >= 80 ? "bg-chart-5/10" : vendor.deliveryRate >= 50 ? "bg-chart-4/10" : "bg-destructive/10";
            return (
              <Card key={vendor.id} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${ratingBg} shrink-0`}>
                        {vendor.logoUrl ? (
                          <img src={vendor.logoUrl} alt="" className="h-8 w-8 rounded object-cover" />
                        ) : (
                          <Building2 className={`h-5 w-5 ${ratingColor}`} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{isAr ? vendor.nameAr : vendor.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{vendor.totalItems} {isAr ? "عنصر" : "items"}</span>
                          {vendor.avgDeliveryDays !== null && (
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              {vendor.avgDeliveryDays} {isAr ? "يوم" : "days avg"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-end shrink-0">
                      <p className={`text-lg font-bold ${ratingColor}`}>{vendor.deliveryRate}%</p>
                      <p className="text-[10px] text-muted-foreground">{isAr ? "معدل التسليم" : "delivery rate"}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Progress value={vendor.deliveryRate} className="h-2" />
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-[10px]">
                    <span className="flex items-center gap-0.5 text-chart-5">
                      <CheckCircle className="h-3 w-3" /> {vendor.delivered} {isAr ? "تم" : "done"}
                    </span>
                    <span className="flex items-center gap-0.5 text-muted-foreground">
                      <Clock className="h-3 w-3" /> {vendor.pending} {isAr ? "معلق" : "pending"}
                    </span>
                    {vendor.overdue > 0 && (
                      <span className="flex items-center gap-0.5 text-destructive">
                        <AlertTriangle className="h-3 w-3" /> {vendor.overdue} {isAr ? "متأخر" : "overdue"}
                      </span>
                    )}
                    {index === 0 && vendors.length > 1 && (
                      <Badge variant="outline" className="text-[9px] h-4 ms-auto border-chart-4/40 text-chart-4">
                        <Star className="h-2.5 w-2.5 me-0.5" /> {isAr ? "الأعلى" : "Top Vendor"}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
