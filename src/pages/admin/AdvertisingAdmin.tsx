import { useState, forwardRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  Megaphone, BarChart3, Package, LayoutGrid, CheckCircle, XCircle,
  Eye, MousePointer, DollarSign, Clock, FileText,
  Target, Brain, Globe, Sparkles, FileBarChart,
} from "lucide-react";
import { AdAnalyticsDashboard } from "@/components/ads/AdAnalyticsDashboard";
import { AdBehaviorInsights } from "@/components/ads/AdBehaviorInsights";
import { GoogleIntegrationPanel } from "@/components/ads/GoogleIntegrationPanel";
import { MetaPixelPanel } from "@/components/ads/MetaPixelPanel";
import { TikTokPixelPanel } from "@/components/ads/TikTokPixelPanel";
import { SnapPixelPanel } from "@/components/ads/SnapPixelPanel";
import { AdAIInsightsPanel } from "@/components/ads/AdAIInsightsPanel";
import { AdAdvancedReporting } from "@/components/ads/AdAdvancedReporting";
import { AdRejectionDialog } from "@/components/ads/AdRejectionDialog";
import { AdCampaignAnalyticsWidget } from "@/components/admin/AdCampaignAnalyticsWidget";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  pending_approval: "bg-warning/10 text-warning border-warning/20",
  under_review: "bg-primary/10 text-primary border-primary/20",
  approved: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  active: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  paused: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  completed: "bg-muted text-muted-foreground border-border",
  draft: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const AdvertisingAdmin = forwardRef<HTMLDivElement>(function AdvertisingAdmin(_props, ref) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();

  // Rejection dialog state
  const [rejectionTarget, setRejectionTarget] = useState<{ type: "request" | "campaign" | "creative"; id: string } | null>(null);

  // Fetch campaigns
  const { data: campaigns = [] } = useQuery({
    queryKey: ["admin-ad-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ad_campaigns").select("*, companies(name, name_ar, logo_url)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch requests
  const { data: requests = [] } = useQuery({
    queryKey: ["admin-ad-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ad_requests").select("*, companies(name, name_ar, logo_url)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch placements
  const { data: placements = [] } = useQuery({
    queryKey: ["admin-ad-placements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ad_placements").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  // Fetch packages
  const { data: packages = [] } = useQuery({
    queryKey: ["admin-ad-packages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ad_packages").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  // Fetch creatives
  const { data: creatives = [] } = useQuery({
    queryKey: ["admin-ad-creatives"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ad_creatives").select("*, ad_campaigns(name, companies(name, name_ar)), ad_placements(name, name_ar)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Impressions/clicks aggregate
  const { data: stats } = useQuery({
    queryKey: ["admin-ad-stats"],
    queryFn: async () => {
      const [impRes, clickRes] = await Promise.all([
        supabase.from("ad_impressions").select("id", { count: "exact", head: true }),
        supabase.from("ad_clicks").select("id", { count: "exact", head: true }),
      ]);
      return {
        totalImpressions: impRes.count || 0,
        totalClicks: clickRes.count || 0,
        activeCampaigns: campaigns.filter(c => c.status === "active").length,
        totalRevenue: campaigns.reduce((sum, c) => sum + (c.spent || 0), 0),
      };
    },
    enabled: campaigns.length >= 0,
  });

  // Approve/reject mutations with notification integration
  const sendNotification = async (title: string, titleAr: string, body: string, bodyAr: string, type: string, metadata: Record<string, unknown>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("notifications").insert([{
        user_id: user.id, title, title_ar: titleAr, body, body_ar: bodyAr, type, metadata: metadata as any,
      }]);
    } catch { /* non-blocking */ }
  };

  const approveRequest = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase.from("ad_requests").update({
        status, admin_notes: notes || null, reviewed_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
      const req = requests.find(r => r.id === id);
      if (req) {
        await sendNotification(
          `Ad request "${req.title}" ${status}`,
          `طلب إعلان "${req.title_ar || req.title}" ${status === "approved" ? "تمت الموافقة" : "تم الرفض"}`,
          status === "approved" ? "Your ad request has been approved." : `Your ad request was rejected. Reason: ${notes || "N/A"}`,
          status === "approved" ? "تمت الموافقة على طلب الإعلان الخاص بك." : `تم رفض طلب الإعلان. السبب: ${notes || "غير محدد"}`,
          "ad_status_change",
          { request_id: id, status, company_id: req.company_id }
        );
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ad-requests"] });
      toast({ title: isAr ? "تم التحديث" : "Updated" });
    },
  });

  const approveCampaign = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const update: Record<string, unknown> = { status };
      if (status === "approved" || status === "active") update.approved_at = new Date().toISOString();
      if (reason) update.rejection_reason = reason;
      const { error } = await supabase.from("ad_campaigns").update(update).eq("id", id);
      if (error) throw error;
      const camp = campaigns.find(c => c.id === id);
      if (camp) {
        const statusLabel = { active: "activated", paused: "paused", rejected: "rejected", completed: "completed" }[status] || status;
        await sendNotification(
          `Campaign "${camp.name}" ${statusLabel}`,
          `الحملة "${camp.name_ar || camp.name}" ${status === "active" ? "تم التفعيل" : status === "paused" ? "تم الإيقاف" : status === "rejected" ? "تم الرفض" : status}`,
          reason ? `Status changed to ${statusLabel}. Reason: ${reason}` : `Campaign status changed to ${statusLabel}.`,
          reason ? `تغيرت الحالة إلى ${statusLabel}. السبب: ${reason}` : `تغيرت حالة الحملة إلى ${statusLabel}.`,
          "ad_status_change",
          { campaign_id: id, status, company_id: camp.company_id }
        );
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ad-campaigns"] });
      toast({ title: isAr ? "تم التحديث" : "Updated" });
    },
  });

  const approveCreative = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const update: Record<string, unknown> = { status };
      if (reason) update.rejection_reason = reason;
      const { error } = await supabase.from("ad_creatives").update(update).eq("id", id);
      if (error) throw error;
      await sendNotification(
        `Creative ${status === "approved" ? "approved" : "rejected"}`,
        `المادة الإعلانية ${status === "approved" ? "تمت الموافقة" : "تم الرفض"}`,
        reason ? `Reason: ${reason}` : `Your creative has been ${status}.`,
        reason ? `السبب: ${reason}` : `تم ${status === "approved" ? "قبول" : "رفض"} المادة الإعلانية.`,
        "ad_status_change",
        { creative_id: id, status }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ad-creatives"] });
      toast({ title: isAr ? "تم التحديث" : "Updated" });
    },
  });

  const toggleCreativeActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("ad_creatives").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ad-creatives"] }),
  });

  const generateInvoice = useMutation({
    mutationFn: async (campaign: any) => {
      const amount = campaign.spent || 0;
      if (amount <= 0) throw new Error("No spend to invoice");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const taxRate = 15;
      const taxAmount = amount * (taxRate / 100);
      const total = amount + taxAmount;
      const { error } = await supabase.from("invoices").insert({
        user_id: user.id,
        company_id: campaign.company_id,
        title: `Ad Campaign: ${campaign.name}`,
        title_ar: `حملة إعلانية: ${campaign.name_ar || campaign.name}`,
        description: `Advertising charges for campaign "${campaign.name}" (${campaign.billing_model})`,
        description_ar: `رسوم إعلانية للحملة "${campaign.name_ar || campaign.name}" (${campaign.billing_model})`,
        currency: campaign.currency || "SAR",
        subtotal: amount,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        amount: total,
        status: "sent",
        items: [{ name: `Campaign: ${campaign.name}`, description: `${campaign.total_impressions || 0} impressions, ${campaign.total_clicks || 0} clicks`, quantity: 1, unit_price: amount }],
        issued_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => toast({ title: isAr ? "تم إنشاء الفاتورة" : "Invoice generated" }),
    onError: (e: any) => toast({ title: isAr ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const togglePlacement = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("ad_placements").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ad-placements"] }),
  });

  const handleRejectionConfirm = (reason: string) => {
    if (!rejectionTarget) return;
    if (rejectionTarget.type === "request") {
      approveRequest.mutate({ id: rejectionTarget.id, status: "rejected", notes: reason });
    } else if (rejectionTarget.type === "campaign") {
      approveCampaign.mutate({ id: rejectionTarget.id, status: "rejected", reason });
    } else if (rejectionTarget.type === "creative") {
      approveCreative.mutate({ id: rejectionTarget.id, status: "rejected", reason });
    }
    setRejectionTarget(null);
  };

  const kpis = [
    { icon: Megaphone, label: isAr ? "نشطة" : "Active", value: stats?.activeCampaigns || 0, color: "text-primary" },
    { icon: Eye, label: isAr ? "مشاهدات" : "Impressions", value: (stats?.totalImpressions || 0).toLocaleString(), color: "text-chart-1" },
    { icon: MousePointer, label: isAr ? "نقرات" : "Clicks", value: (stats?.totalClicks || 0).toLocaleString(), color: "text-chart-2" },
    { icon: DollarSign, label: isAr ? "الإيرادات" : "Revenue", value: `${(stats?.totalRevenue || 0).toLocaleString()}`, color: "text-chart-3" },
  ];

  const pendingRequests = requests.filter(r => r.status === "pending" || r.status === "under_review");
  const pendingCampaigns = campaigns.filter(c => c.status === "pending_approval");
  const pendingCreatives = creatives.filter(c => c.status === "pending");

  const bulkCampaigns = useAdminBulkActions(campaigns);

  const { exportCSV: exportCampaignsCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الشركة" : "Company", accessor: (r: any) => isAr ? r.companies?.name_ar : r.companies?.name },
      { header: isAr ? "الحملة" : "Campaign", accessor: (r: any) => isAr ? r.name_ar || r.name : r.name },
      { header: isAr ? "النموذج" : "Model", accessor: (r: any) => r.billing_model },
      { header: isAr ? "الميزانية" : "Budget", accessor: (r: any) => r.budget },
      { header: isAr ? "المصروف" : "Spent", accessor: (r: any) => r.spent },
      { header: isAr ? "المشاهدات" : "Impressions", accessor: (r: any) => r.total_impressions || 0 },
      { header: isAr ? "النقرات" : "Clicks", accessor: (r: any) => r.total_clicks || 0 },
      { header: isAr ? "الحالة" : "Status", accessor: (r: any) => r.status },
    ],
    filename: "ad-campaigns",
  });

  return (
    <div ref={ref} className="space-y-4 sm:space-y-6">
      <AdminPageHeader
        icon={Megaphone}
        title={isAr ? "مركز الإعلانات" : "Advertising Center"}
        description={isAr ? "إدارة الإعلانات والحملات" : "Manage ads, campaigns & analytics"}
        actions={
          pendingRequests.length > 0 ? (
            <Badge variant="destructive" className="gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {pendingRequests.length} {isAr ? "معلقة" : "pending"}
            </Badge>
          ) : undefined
        }
      />

      {/* Ad Campaign Analytics */}
      <AdCampaignAnalyticsWidget />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-2.5 p-3 sm:p-4">
              <div className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-muted shrink-0 ${kpi.color}`}>
                <kpi.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-sm sm:text-xl font-bold truncate">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="requests">
        <div className="relative">
          <TabsList className="flex h-auto w-auto gap-1 overflow-x-auto scrollbar-none bg-transparent justify-start p-0 sm:flex-wrap">
            <TabsTrigger value="requests" className="gap-1 shrink-0 whitespace-nowrap text-xs sm:text-sm">
              <FileText className="h-3.5 w-3.5" />
              {isAr ? "الطلبات" : "Requests"}
              {pendingRequests.length > 0 && <Badge variant="destructive" className="ms-0.5 h-4 px-1 text-[9px]">{pendingRequests.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1 shrink-0 whitespace-nowrap text-xs sm:text-sm">
              <Megaphone className="h-3.5 w-3.5" />
              {isAr ? "الحملات" : "Campaigns"}
              {pendingCampaigns.length > 0 && <Badge variant="destructive" className="ms-0.5 h-4 px-1 text-[9px]">{pendingCampaigns.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="creatives" className="gap-1 shrink-0 whitespace-nowrap text-xs sm:text-sm">
              <LayoutGrid className="h-3.5 w-3.5" />
              {isAr ? "المواد" : "Creatives"}
              {pendingCreatives.length > 0 && <Badge variant="destructive" className="ms-0.5 h-4 px-1 text-[9px]">{pendingCreatives.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="placements" className="gap-1 shrink-0 whitespace-nowrap text-xs sm:text-sm">
              <Target className="h-3.5 w-3.5" />
              {isAr ? "المواقع" : "Placements"}
            </TabsTrigger>
            <TabsTrigger value="packages" className="gap-1 shrink-0 whitespace-nowrap text-xs sm:text-sm">
              <Package className="h-3.5 w-3.5" />
              {isAr ? "الباقات" : "Packages"}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1 shrink-0 whitespace-nowrap text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5" />
              {isAr ? "التحليلات" : "Analytics"}
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-1 shrink-0 whitespace-nowrap text-xs sm:text-sm">
              <FileBarChart className="h-3.5 w-3.5" />
              {isAr ? "التقارير" : "Reports"}
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="gap-1 shrink-0 whitespace-nowrap text-xs sm:text-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {isAr ? "AI" : "AI"}
            </TabsTrigger>
            <TabsTrigger value="behavior" className="gap-1 shrink-0 whitespace-nowrap text-xs sm:text-sm">
              <Brain className="h-3.5 w-3.5" />
              {isAr ? "السلوك" : "Behavior"}
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-1 shrink-0 whitespace-nowrap text-xs sm:text-sm">
              <Globe className="h-3.5 w-3.5" />
              {isAr ? "تكاملات" : "Integrations"}
            </TabsTrigger>
          </TabsList>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent sm:hidden" />
        </div>

        {/* Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader><CardTitle>{isAr ? "طلبات الإعلانات" : "Ad Requests"}</CardTitle></CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد طلبات" : "No requests yet"}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isAr ? "الشركة" : "Company"}</TableHead>
                      <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
                      <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                      <TableHead>{isAr ? "الميزانية" : "Budget"}</TableHead>
                      <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{isAr ? "الإجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((req: any) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{isAr ? req.companies?.name_ar : req.companies?.name}</TableCell>
                        <TableCell>{isAr ? req.title_ar || req.title : req.title}</TableCell>
                        <TableCell><Badge variant="outline">{req.request_type}</Badge></TableCell>
                        <TableCell>{req.budget ? `SAR ${req.budget}` : "—"}</TableCell>
                        <TableCell><Badge className={statusColors[req.status] || ""}>{req.status}</Badge></TableCell>
                        <TableCell>
                          {(req.status === "pending" || req.status === "under_review") && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 text-chart-2" onClick={() => approveRequest.mutate({ id: req.id, status: "approved" })}>
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => setRejectionTarget({ type: "request", id: req.id })}>
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns">
          <BulkActionBar
            count={bulkCampaigns.count}
            onClear={bulkCampaigns.clearSelection}
            onExport={() => exportCampaignsCSV(bulkCampaigns.selectedItems)}
          />
          <Card>
            <CardHeader><CardTitle>{isAr ? "الحملات الإعلانية" : "Ad Campaigns"}</CardTitle></CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد حملات" : "No campaigns yet"}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"><Checkbox checked={bulkCampaigns.isAllSelected} onCheckedChange={bulkCampaigns.toggleAll} /></TableHead>
                      <TableHead>{isAr ? "الشركة" : "Company"}</TableHead>
                      <TableHead>{isAr ? "الحملة" : "Campaign"}</TableHead>
                      <TableHead>{isAr ? "النموذج" : "Model"}</TableHead>
                      <TableHead>{isAr ? "الميزانية / المصروف" : "Budget / Spent"}</TableHead>
                      <TableHead>{isAr ? "المشاهدات" : "Impressions"}</TableHead>
                      <TableHead>{isAr ? "النقرات" : "Clicks"}</TableHead>
                      <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{isAr ? "إجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((c: any) => (
                      <TableRow key={c.id} className={bulkCampaigns.isSelected(c.id) ? "bg-primary/5" : ""}>
                        <TableCell><Checkbox checked={bulkCampaigns.isSelected(c.id)} onCheckedChange={() => bulkCampaigns.toggleOne(c.id)} /></TableCell>
                        <TableCell>{isAr ? c.companies?.name_ar : c.companies?.name}</TableCell>
                        <TableCell className="font-medium">{isAr ? c.name_ar || c.name : c.name}</TableCell>
                        <TableCell><Badge variant="outline">{c.billing_model}</Badge></TableCell>
                        <TableCell>{c.budget} / {c.spent} {c.currency}</TableCell>
                        <TableCell>{(c.total_impressions || 0).toLocaleString()}</TableCell>
                        <TableCell>{(c.total_clicks || 0).toLocaleString()}</TableCell>
                        <TableCell><Badge className={statusColors[c.status] || ""}>{c.status}</Badge></TableCell>
                        <TableCell>
                          {c.status === "pending_approval" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 text-chart-2" onClick={() => approveCampaign.mutate({ id: c.id, status: "active" })}>
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => setRejectionTarget({ type: "campaign", id: c.id })}>
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                          {c.status === "active" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7" onClick={() => approveCampaign.mutate({ id: c.id, status: "paused" })}>
                                {isAr ? "إيقاف" : "Pause"}
                              </Button>
                              <Button size="sm" variant="outline" className="h-7" onClick={() => generateInvoice.mutate(c)} disabled={generateInvoice.isPending}>
                                <DollarSign className="h-3 w-3 me-1" />{isAr ? "فوترة" : "Invoice"}
                              </Button>
                            </div>
                          )}
                          {c.status === "paused" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7" onClick={() => approveCampaign.mutate({ id: c.id, status: "active" })}>
                                {isAr ? "تفعيل" : "Resume"}
                              </Button>
                              <Button size="sm" variant="outline" className="h-7" onClick={() => generateInvoice.mutate(c)} disabled={generateInvoice.isPending}>
                                <DollarSign className="h-3 w-3 me-1" />{isAr ? "فوترة" : "Invoice"}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Creatives Tab */}
        <TabsContent value="creatives">
          <Card>
            <CardHeader><CardTitle>{isAr ? "المواد الإعلانية" : "Ad Creatives"}</CardTitle></CardHeader>
            <CardContent>
              {creatives.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد مواد إعلانية" : "No creatives yet"}</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {creatives.map((cr: any) => (
                    <Card key={cr.id} className="overflow-hidden">
                      {cr.image_url && (
                        <div className="aspect-video bg-muted">
                          <img src={cr.image_url} alt={cr.title || "Ad"} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-sm truncate">{cr.title || (isAr ? "بدون عنوان" : "Untitled")}</h3>
                          <Badge className={statusColors[cr.status] || ""}>{cr.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{isAr ? cr.ad_placements?.name_ar : cr.ad_placements?.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {cr.impressions?.toLocaleString()} {isAr ? "مشاهدة" : "views"} · {cr.clicks?.toLocaleString()} {isAr ? "نقرة" : "clicks"}
                        </p>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs">{isAr ? "مفعل" : "Active"}</Label>
                          <Switch checked={cr.is_active} onCheckedChange={(checked) => toggleCreativeActive.mutate({ id: cr.id, is_active: checked })} />
                        </div>
                        {cr.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1" onClick={() => approveCreative.mutate({ id: cr.id, status: "approved" })}>
                              <CheckCircle className="h-3.5 w-3.5 me-1" />{isAr ? "موافقة" : "Approve"}
                            </Button>
                            <Button size="sm" variant="destructive" className="flex-1" onClick={() => setRejectionTarget({ type: "creative", id: cr.id })}>
                              <XCircle className="h-3.5 w-3.5 me-1" />{isAr ? "رفض" : "Reject"}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Placements Tab */}
        <TabsContent value="placements">
          <Card>
            <CardHeader><CardTitle>{isAr ? "المواقع الإعلانية" : "Ad Placements"}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "الموقع" : "Placement"}</TableHead>
                    <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                    <TableHead>{isAr ? "الصفحة" : "Page"}</TableHead>
                    <TableHead>{isAr ? "الأبعاد" : "Size"}</TableHead>
                    <TableHead>CPM</TableHead>
                    <TableHead>CPC</TableHead>
                    <TableHead>{isAr ? "مميز" : "Premium"}</TableHead>
                    <TableHead>{isAr ? "مفعل" : "Active"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {placements.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{isAr ? p.name_ar || p.name : p.name}</TableCell>
                      <TableCell><Badge variant="outline">{p.placement_type}</Badge></TableCell>
                      <TableCell>{p.page_location}</TableCell>
                      <TableCell>{p.width && p.height ? `${p.width}×${p.height}` : "—"}</TableCell>
                      <TableCell>SAR {p.base_cpm}</TableCell>
                      <TableCell>SAR {p.base_cpc}</TableCell>
                      <TableCell>{p.is_premium ? <Badge variant="secondary">Premium</Badge> : "—"}</TableCell>
                      <TableCell>
                        <Switch checked={p.is_active} onCheckedChange={(checked) => togglePlacement.mutate({ id: p.id, is_active: checked })} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages">
          <Card>
            <CardHeader><CardTitle>{isAr ? "باقات الإعلانات" : "Ad Packages"}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {packages.map((pkg: any) => (
                  <Card key={pkg.id} className={`border-2 ${pkg.tier === "platinum" ? "border-primary" : "border-border/50"}`}>
                    <CardContent className="p-5 text-center">
                      <Badge className="mb-2" variant={pkg.tier === "platinum" ? "default" : "secondary"}>
                        {isAr ? pkg.name_ar || pkg.name : pkg.name}
                      </Badge>
                      <p className="text-3xl font-bold my-2">{pkg.price}<span className="text-sm text-muted-foreground ms-1">{pkg.currency}</span></p>
                      <p className="text-xs text-muted-foreground mb-3">{pkg.duration_days} {isAr ? "يوم" : "days"}</p>
                      <div className="text-xs text-muted-foreground space-y-1 text-start">
                        <p>• {pkg.max_impressions ? `${pkg.max_impressions.toLocaleString()} ${isAr ? "مشاهدة" : "impressions"}` : isAr ? "مشاهدات غير محدودة" : "Unlimited impressions"}</p>
                        <p>• {pkg.max_clicks ? `${pkg.max_clicks.toLocaleString()} ${isAr ? "نقرة" : "clicks"}` : isAr ? "نقرات غير محدودة" : "Unlimited clicks"}</p>
                        <p>• {pkg.max_campaigns} {isAr ? "حملة" : "campaigns"}</p>
                        <p>• {pkg.included_placements?.length || 0} {isAr ? "موقع إعلاني" : "placements"}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <AdAnalyticsDashboard />
        </TabsContent>

        {/* Advanced Reports Tab */}
        <TabsContent value="reports">
          <AdAdvancedReporting />
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights">
          <AdAIInsightsPanel />
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior">
          <AdBehaviorInsights />
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-8">
          <GoogleIntegrationPanel />
          <MetaPixelPanel />
          <TikTokPixelPanel />
          <SnapPixelPanel />
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
