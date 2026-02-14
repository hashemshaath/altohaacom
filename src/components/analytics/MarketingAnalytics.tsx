import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toEnglishDigits } from "@/lib/formatNumber";
import {
  Megaphone, ShoppingCart, UserPlus, MousePointerClick, Eye,
  TrendingUp, ArrowDownToLine, Zap, Target, BarChart3,
} from "lucide-react";

export function MarketingAnalytics() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  // Conversion events summary
  const { data: conversionData } = useQuery({
    queryKey: ["marketing-conversions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversion_events")
        .select("event_name, event_value, event_category, source, medium, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      const events = data || [];

      // Event counts
      const eventCounts = new Map<string, number>();
      const eventValues = new Map<string, number>();
      events.forEach(e => {
        eventCounts.set(e.event_name, (eventCounts.get(e.event_name) || 0) + 1);
        eventValues.set(e.event_name, (eventValues.get(e.event_name) || 0) + (Number(e.event_value) || 0));
      });

      // Source/medium breakdown
      const sourceCounts = new Map<string, number>();
      events.forEach(e => {
        const src = e.source || e.medium || "direct";
        sourceCounts.set(src, (sourceCounts.get(src) || 0) + 1);
      });

      // Key metrics
      const signups = eventCounts.get("sign_up") || 0;
      const purchases = eventCounts.get("purchase") || 0;
      const addToCarts = eventCounts.get("add_to_cart") || 0;
      const pageViews = eventCounts.get("page_view") || 0;
      const totalRevenue = eventValues.get("purchase") || 0;

      // Funnel: views → cart → purchase
      const cartRate = pageViews > 0 ? Math.round((addToCarts / pageViews) * 100) : 0;
      const purchaseRate = addToCarts > 0 ? Math.round((purchases / addToCarts) * 100) : 0;
      const overallRate = pageViews > 0 ? Math.round((purchases / pageViews) * 100) : 0;

      return {
        total: events.length,
        signups,
        purchases,
        addToCarts,
        pageViews,
        totalRevenue,
        cartRate,
        purchaseRate,
        overallRate,
        topEvents: [...eventCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
        topSources: [...sourceCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
      };
    },
    staleTime: 30000,
  });

  // Abandoned carts
  const { data: cartData } = useQuery({
    queryKey: ["marketing-abandoned-carts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("abandoned_carts")
        .select("id, total_amount, recovery_status, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      const carts = data || [];
      const abandoned = carts.filter(c => c.recovery_status === "abandoned");
      const recovered = carts.filter(c => c.recovery_status === "recovered");
      const lostRevenue = abandoned.reduce((s, c) => s + (Number(c.total_amount) || 0), 0);
      const recoveredRevenue = recovered.reduce((s, c) => s + (Number(c.total_amount) || 0), 0);
      return { total: carts.length, abandoned: abandoned.length, recovered: recovered.length, lostRevenue, recoveredRevenue };
    },
    staleTime: 30000,
  });

  // Google tracking config
  const { data: trackingConfigs = [] } = useQuery({
    queryKey: ["marketing-tracking-configs"],
    queryFn: async () => {
      const { data } = await supabase.from("marketing_tracking_config").select("*").order("created_at");
      return data || [];
    },
    staleTime: 60000,
  });

  const eventLabels: Record<string, { en: string; ar: string }> = {
    sign_up: { en: "Sign Up", ar: "تسجيل" },
    purchase: { en: "Purchase", ar: "شراء" },
    add_to_cart: { en: "Add to Cart", ar: "إضافة للسلة" },
    page_view: { en: "Page View", ar: "مشاهدة صفحة" },
    competition_registration: { en: "Competition Reg.", ar: "تسجيل مسابقة" },
  };

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-s-4 border-s-primary">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-primary/10 p-2.5">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "إجمالي التحويلات" : "Total Conversions"}</p>
              <p className="text-2xl font-bold">{toEnglishDigits(`${conversionData?.total ?? 0}`)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-s-4 border-s-chart-5">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-chart-5/10 p-2.5">
              <TrendingUp className="h-5 w-5 text-chart-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "إيرادات التحويلات" : "Conversion Revenue"}</p>
              <p className="text-2xl font-bold">{toEnglishDigits(`${(conversionData?.totalRevenue ?? 0).toLocaleString()}`)} <span className="text-xs font-normal">SAR</span></p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-s-4 border-s-chart-4">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-chart-4/10 p-2.5">
              <UserPlus className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "تسجيلات جديدة" : "Sign Ups"}</p>
              <p className="text-2xl font-bold">{toEnglishDigits(`${conversionData?.signups ?? 0}`)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-s-4 border-s-chart-3">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-chart-3/10 p-2.5">
              <ShoppingCart className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "سلال مهجورة" : "Abandoned Carts"}</p>
              <p className="text-2xl font-bold">{toEnglishDigits(`${cartData?.abandoned ?? 0}`)}</p>
              <p className="text-[10px] text-muted-foreground">{toEnglishDigits(`${(cartData?.lostRevenue ?? 0).toLocaleString()}`)} SAR {isAr ? "مفقود" : "lost"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowDownToLine className="h-4 w-4 text-primary" />
            {isAr ? "قمع التحويل" : "Conversion Funnel"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { label: isAr ? "مشاهدات" : "Page Views", value: conversionData?.pageViews ?? 0, icon: Eye, pct: 100 },
              { label: isAr ? "إضافة للسلة" : "Add to Cart", value: conversionData?.addToCarts ?? 0, icon: ShoppingCart, pct: conversionData?.cartRate ?? 0 },
              { label: isAr ? "شراء" : "Purchase", value: conversionData?.purchases ?? 0, icon: MousePointerClick, pct: conversionData?.overallRate ?? 0 },
              { label: isAr ? "تسجيل" : "Sign Up", value: conversionData?.signups ?? 0, icon: UserPlus, pct: conversionData?.signups && conversionData?.pageViews ? Math.round((conversionData.signups / conversionData.pageViews) * 100) : 0 },
            ].map((step, i) => (
              <div key={i} className="text-center rounded-lg border p-4 space-y-2">
                <step.icon className="h-5 w-5 mx-auto text-primary" />
                <p className="text-xl font-bold">{toEnglishDigits(`${step.value}`)}</p>
                <p className="text-xs text-muted-foreground">{step.label}</p>
                <Badge variant="secondary" className="text-[10px]">{toEnglishDigits(`${step.pct}`)}%</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              {isAr ? "أبرز الأحداث" : "Top Events"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[220px]">
              <div className="space-y-3">
                {(conversionData?.topEvents || []).map(([name, count]: [string, number], i: number) => {
                  const max = conversionData?.topEvents[0]?.[1] || 1;
                  const pct = Math.round((count / max) * 100);
                  const label = eventLabels[name] || { en: name, ar: name };
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{isAr ? label.ar : label.en}</span>
                        <span className="text-muted-foreground">{toEnglishDigits(`${count}`)}</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
                {(conversionData?.topEvents || []).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">{isAr ? "لا توجد بيانات" : "No data yet"}</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              {isAr ? "مصادر الزيارات" : "Traffic Sources"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[220px]">
              <div className="space-y-3">
                {(conversionData?.topSources || []).map(([source, count]: [string, number], i: number) => {
                  const max = conversionData?.topSources[0]?.[1] || 1;
                  const pct = Math.round((count / max) * 100);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium capitalize">{source}</span>
                        <span className="text-muted-foreground">{toEnglishDigits(`${count}`)}</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
                {(conversionData?.topSources || []).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">{isAr ? "لا توجد بيانات" : "No data yet"}</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Google Tracking Status */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              {isAr ? "حالة تكاملات Google" : "Google Integrations Status"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trackingConfigs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isAr ? "لم يتم تكوين أي تكامل بعد. اذهب إلى الإعلانات لإعداد Google Analytics و GTM." : "No integrations configured yet. Go to Advertising to set up Google Analytics & GTM."}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {trackingConfigs.map((cfg: any) => {
                  const platformLabels: Record<string, { en: string; ar: string }> = {
                    google_analytics_4: { en: "Google Analytics 4", ar: "Google Analytics 4" },
                    google_tag_manager: { en: "Google Tag Manager", ar: "Google Tag Manager" },
                    google_ads: { en: "Google Ads", ar: "Google Ads" },
                  };
                  const label = platformLabels[cfg.platform] || { en: cfg.platform, ar: cfg.platform };
                  return (
                    <div key={cfg.id} className="rounded-lg border p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium">{isAr ? label.ar : label.en}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{cfg.tracking_id}</p>
                      </div>
                      <Badge variant={cfg.is_active ? "default" : "secondary"} className="text-[10px]">
                        {cfg.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "معطل" : "Inactive")}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
