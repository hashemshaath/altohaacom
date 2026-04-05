import { useState, forwardRef, useMemo, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AdvertisingQuickNav } from "@/components/admin/AdvertisingQuickNav";
import { Megaphone, BarChart3, Package, Target, FileText, Brain, Globe, Sparkles, FileBarChart, LayoutGrid, Eye, MousePointer, DollarSign, ExternalLink, AlertTriangle } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { AdCampaignOverviewWidget } from "@/components/admin/AdCampaignOverviewWidget";
import { CampaignPerformanceTracker } from "@/components/admin/CampaignPerformanceTracker";
import { AdRejectionDialog } from "@/components/ads/AdRejectionDialog";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";

// Tab components
import { AdRequestsTab } from "@/components/admin/advertising/AdRequestsTab";
import { AdCampaignsTab } from "@/components/admin/advertising/AdCampaignsTab";
import { AdCreativesTab } from "@/components/admin/advertising/AdCreativesTab";
import { AdPlacementsTab } from "@/components/admin/advertising/AdPlacementsTab";
import { AdPackagesTab } from "@/components/admin/advertising/AdPackagesTab";
import { AdIntegrationsTab } from "@/components/admin/advertising/AdIntegrationsTab";
import { supabase } from "@/integrations/supabase/client";

// Lazy analytics tabs
const AdAnalyticsDashboard = lazy(() => import("@/components/ads/AdAnalyticsDashboard").then(m => ({ default: m.AdAnalyticsDashboard })));
const AdAdvancedReporting = lazy(() => import("@/components/ads/AdAdvancedReporting").then(m => ({ default: m.AdAdvancedReporting })));
const AdAIInsightsPanel = lazy(() => import("@/components/ads/AdAIInsightsPanel").then(m => ({ default: m.AdAIInsightsPanel })));
const AdBehaviorInsights = lazy(() => import("@/components/ads/AdBehaviorInsights").then(m => ({ default: m.AdBehaviorInsights })));

const TabFallback = () => <div className="space-y-3"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-60 rounded-2xl" /></div>;

const AdvertisingAdmin = forwardRef<HTMLDivElement>(function AdvertisingAdmin(_props, ref) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const [rejectionTarget, setRejectionTarget] = useState<{ type: "request" | "campaign" | "creative"; id: string } | null>(null);

  // ─── Data fetching ───
  const { data: campaigns = [] } = useQuery({
    queryKey: ["admin-ad-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ad_campaigns").select("*, companies(name, name_ar, logo_url)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["admin-ad-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ad_requests").select("*, companies(name, name_ar, logo_url)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: placements = [] } = useQuery({
    queryKey: ["admin-ad-placements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ad_placements").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: packages = [] } = useQuery({
    queryKey: ["admin-ad-packages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ad_packages").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: creatives = [] } = useQuery({
    queryKey: ["admin-ad-creatives"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ad_creatives").select("*, ad_campaigns(name, companies(name, name_ar)), ad_placements(name, name_ar)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // ─── Computed ───
  const pendingRequests = useMemo(() => requests.filter(r => r.status === "pending" || r.status === "under_review"), [requests]);
  const pendingCampaigns = useMemo(() => campaigns.filter(c => c.status === "pending_approval"), [campaigns]);
  const pendingCreatives = useMemo(() => creatives.filter(c => c.status === "pending"), [creatives]);
  const totalPending = pendingRequests.length + pendingCampaigns.length + pendingCreatives.length;

  const kpis = useMemo(() => {
    const active = campaigns.filter(c => c.status === "active").length;
    const totalSpent = campaigns.reduce((s, c) => s + (c.spent || 0), 0);
    const totalImpressions = campaigns.reduce((s, c) => s + (c.total_impressions || 0), 0);
    const totalClicks = campaigns.reduce((s, c) => s + (c.total_clicks || 0), 0);
    return [
      { icon: Megaphone, label: isAr ? "حملات نشطة" : "Active", value: active, color: "text-primary" },
      { icon: Eye, label: isAr ? "مشاهدات" : "Impressions", value: totalImpressions, color: "text-chart-1" },
      { icon: MousePointer, label: isAr ? "نقرات" : "Clicks", value: totalClicks, color: "text-chart-2" },
      { icon: DollarSign, label: isAr ? "الإيرادات" : "Revenue", value: totalSpent, color: "text-chart-3", isCurrency: true },
    ];
  }, [campaigns, isAr]);

  // ─── Mutations ───
  const sendNotification = async (title: string, titleAr: string, body: string, bodyAr: string, type: string, metadata: Record<string, unknown>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("notifications").insert([{ user_id: user.id, title, title_ar: titleAr, body, body_ar: bodyAr, type, metadata: metadata as any }]);
    } catch { /* non-blocking */ }
  };

  const approveRequest = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase.from("ad_requests").update({ status, admin_notes: notes || null, reviewed_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      const req = requests.find(r => r.id === id);
      if (req) await sendNotification(`Ad request "${req.title}" ${status}`, `طلب إعلان "${req.title_ar || req.title}" ${status === "approved" ? "تمت الموافقة" : "تم الرفض"}`, status === "approved" ? "Your ad request has been approved." : `Rejected. Reason: ${notes || "N/A"}`, status === "approved" ? "تمت الموافقة على طلب الإعلان." : `تم الرفض. السبب: ${notes || "غير محدد"}`, "ad_status_change", { request_id: id, status, company_id: req.company_id });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ad-requests"] }); toast({ title: isAr ? "تم التحديث" : "Updated" }); },
  });

  const approveCampaign = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const update: Record<string, unknown> = { status };
      if (status === "approved" || status === "active") update.approved_at = new Date().toISOString();
      if (reason) update.rejection_reason = reason;
      const { error } = await supabase.from("ad_campaigns").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ad-campaigns"] }); toast({ title: isAr ? "تم التحديث" : "Updated" }); },
  });

  const approveCreative = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const update: Record<string, unknown> = { status };
      if (reason) update.rejection_reason = reason;
      const { error } = await supabase.from("ad_creatives").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ad-creatives"] }); toast({ title: isAr ? "تم التحديث" : "Updated" }); },
  });

  const toggleCreativeActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("ad_creatives").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ad-creatives"] }),
  });

  const togglePlacement = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("ad_placements").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ad-placements"] }),
  });

  const generateInvoice = useMutation({
    mutationFn: async (campaign: any) => {
      const amount = campaign.spent || 0;
      if (amount <= 0) throw new Error("No spend to invoice");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const taxRate = 15;
      const taxAmount = amount * (taxRate / 100);
      const { error } = await supabase.from("invoices").insert({
        user_id: user.id, company_id: campaign.company_id,
        title: `Ad Campaign: ${campaign.name}`, title_ar: `حملة إعلانية: ${campaign.name_ar || campaign.name}`,
        description: `Advertising charges for campaign "${campaign.name}" (${campaign.billing_model})`,
        description_ar: `رسوم إعلانية للحملة "${campaign.name_ar || campaign.name}" (${campaign.billing_model})`,
        currency: campaign.currency || "SAR", subtotal: amount, tax_rate: taxRate, tax_amount: taxAmount, amount: amount + taxAmount, status: "sent",
        items: [{ name: `Campaign: ${campaign.name}`, description: `${campaign.total_impressions || 0} impressions, ${campaign.total_clicks || 0} clicks`, quantity: 1, unit_price: amount }],
        issued_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => toast({ title: isAr ? "تم إنشاء الفاتورة" : "Invoice generated" }),
    onError: (e: Error) => toast({ title: isAr ? "خطأ" : "Error", description: e instanceof Error ? e.message : String(e), variant: "destructive" }),
  });

  // ─── Rejection handler ───
  const handleRejectionConfirm = (reason: string) => {
    if (!rejectionTarget) return;
    if (rejectionTarget.type === "request") approveRequest.mutate({ id: rejectionTarget.id, status: "rejected", notes: reason });
    else if (rejectionTarget.type === "campaign") approveCampaign.mutate({ id: rejectionTarget.id, status: "rejected", reason });
    else if (rejectionTarget.type === "creative") approveCreative.mutate({ id: rejectionTarget.id, status: "rejected", reason });
    setRejectionTarget(null);
  };

  // ─── Bulk & CSV ───
  const bulkCampaigns = useAdminBulkActions(campaigns);
  const { exportCSV: exportCampaignsCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الشركة" : "Company", accessor: (r) => isAr ? r.companies?.name_ar : r.companies?.name },
      { header: isAr ? "الحملة" : "Campaign", accessor: (r) => isAr ? r.name_ar || r.name : r.name },
      { header: isAr ? "النموذج" : "Model", accessor: (r) => r.billing_model },
      { header: isAr ? "الميزانية" : "Budget", accessor: (r) => r.budget },
      { header: isAr ? "المصروف" : "Spent", accessor: (r) => r.spent },
      { header: isAr ? "المشاهدات" : "Impressions", accessor: (r) => r.total_impressions || 0 },
      { header: isAr ? "النقرات" : "Clicks", accessor: (r) => r.total_clicks || 0 },
      { header: isAr ? "الحالة" : "Status", accessor: (r) => r.status },
    ],
    filename: "ad-campaigns",
  });

  // ─── Tab config ───
  const tabs = [
    { value: "requests", icon: FileText, label: isAr ? "الطلبات" : "Requests", badge: pendingRequests.length },
    { value: "campaigns", icon: Megaphone, label: isAr ? "الحملات" : "Campaigns", badge: pendingCampaigns.length },
    { value: "creatives", icon: LayoutGrid, label: isAr ? "المواد" : "Creatives", badge: pendingCreatives.length },
    { value: "placements", icon: Target, label: isAr ? "المواقع" : "Placements" },
    { value: "packages", icon: Package, label: isAr ? "الباقات" : "Packages" },
    { value: "analytics", icon: BarChart3, label: isAr ? "التحليلات" : "Analytics" },
    { value: "reports", icon: FileBarChart, label: isAr ? "التقارير" : "Reports" },
    { value: "ai-insights", icon: Sparkles, label: "AI" },
    { value: "behavior", icon: Brain, label: isAr ? "السلوك" : "Behavior" },
    { value: "integrations", icon: Globe, label: isAr ? "تكاملات" : "Integrations" },
  ];

  return (
    <div ref={ref} className="space-y-4">
      {/* Header */}
      <AdminPageHeader
        icon={Megaphone}
        title={isAr ? "مركز الإعلانات" : "Advertising Center"}
        description={isAr ? "إدارة شاملة للحملات والمواد الإعلانية والتحليلات" : "Full management of campaigns, creatives, analytics & integrations"}
        actions={
          <div className="flex items-center gap-2">
            {totalPending > 0 && (
              <Badge variant="destructive" className="gap-1 text-xs rounded-xl">
                <AlertTriangle className="h-3 w-3" />
                {totalPending} {isAr ? "بانتظار المراجعة" : "pending review"}
              </Badge>
            )}
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-xl gap-1" asChild>
              <Link to="/advertise">
                <ExternalLink className="h-3 w-3" />
                {isAr ? "بوابة المعلنين" : "Advertiser Portal"}
              </Link>
            </Button>
          </div>
        }
      />

      <AdvertisingQuickNav />

      {/* Overview Widget */}
      <AdCampaignOverviewWidget />

      {/* Active Campaign Tracker */}
      <CampaignPerformanceTracker />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="rounded-2xl border-border/40 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-2.5 p-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-muted shrink-0 transition-transform duration-300 group-hover:scale-110 ${kpi.color}`}>
                <kpi.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                <AnimatedCounter value={kpi.value} className="text-lg font-bold" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="requests">
        <div className="relative">
          <TabsList className="flex h-auto w-auto gap-1 overflow-x-auto scrollbar-none justify-start p-1.5 rounded-2xl border border-border/40 bg-muted/30 backdrop-blur">
            {tabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1 shrink-0 whitespace-nowrap text-xs rounded-xl data-[state=active]:shadow-sm">
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.badge ? <Badge variant="destructive" className="ms-0.5 h-4 px-1 text-[9px]">{tab.badge}</Badge> : null}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="pointer-events-none absolute inset-y-0 end-0 w-8 bg-gradient-to-l rtl:bg-gradient-to-r from-background to-transparent sm:hidden" />
        </div>

        <TabsContent value="requests">
          <AdRequestsTab
            requests={requests}
            onApprove={(id) => approveRequest.mutate({ id, status: "approved" })}
            onReject={(id) => setRejectionTarget({ type: "request", id })}
          />
        </TabsContent>

        <TabsContent value="campaigns">
          <AdCampaignsTab
            campaigns={campaigns}
            bulkActions={bulkCampaigns}
            onApprove={(id, status) => approveCampaign.mutate({ id, status })}
            onReject={(id) => setRejectionTarget({ type: "campaign", id })}
            onInvoice={(c) => generateInvoice.mutate(c)}
            onExportCSV={exportCampaignsCSV}
            invoicePending={generateInvoice.isPending}
          />
        </TabsContent>

        <TabsContent value="creatives">
          <AdCreativesTab
            creatives={creatives}
            onApprove={(id) => approveCreative.mutate({ id, status: "approved" })}
            onReject={(id) => setRejectionTarget({ type: "creative", id })}
            onToggleActive={(id, active) => toggleCreativeActive.mutate({ id, is_active: active })}
          />
        </TabsContent>

        <TabsContent value="placements">
          <AdPlacementsTab
            placements={placements}
            onToggle={(id, active) => togglePlacement.mutate({ id, is_active: active })}
          />
        </TabsContent>

        <TabsContent value="packages">
          <AdPackagesTab packages={packages} />
        </TabsContent>

        <TabsContent value="analytics">
          <Suspense fallback={<TabFallback />}><AdAnalyticsDashboard /></Suspense>
        </TabsContent>

        <TabsContent value="reports">
          <Suspense fallback={<TabFallback />}><AdAdvancedReporting /></Suspense>
        </TabsContent>

        <TabsContent value="ai-insights">
          <Suspense fallback={<TabFallback />}><AdAIInsightsPanel /></Suspense>
        </TabsContent>

        <TabsContent value="behavior">
          <Suspense fallback={<TabFallback />}><AdBehaviorInsights /></Suspense>
        </TabsContent>

        <TabsContent value="integrations">
          <AdIntegrationsTab />
        </TabsContent>
      </Tabs>

      {/* Rejection Dialog */}
      <AdRejectionDialog
        open={!!rejectionTarget}
        onOpenChange={(open) => !open && setRejectionTarget(null)}
        onConfirm={handleRejectionConfirm}
        title={isAr ? "تأكيد الرفض" : "Confirm Rejection"}
      />
    </div>
  );
});

export default AdvertisingAdmin;
