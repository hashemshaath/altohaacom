import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Megaphone, BarChart3, Package, LayoutGrid, CheckCircle, XCircle,
  Eye, MousePointer, DollarSign, TrendingUp, Clock, FileText, Plus,
  Settings2, Target, Sparkles, Brain, Globe,
} from "lucide-react";
import { AdAnalyticsDashboard } from "@/components/ads/AdAnalyticsDashboard";
import { AdBehaviorInsights } from "@/components/ads/AdBehaviorInsights";
import { GoogleIntegrationPanel } from "@/components/ads/GoogleIntegrationPanel";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  pending_approval: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  under_review: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  approved: "bg-green-500/10 text-green-600 border-green-500/20",
  active: "bg-green-500/10 text-green-600 border-green-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
  paused: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  completed: "bg-muted text-muted-foreground border-border",
  draft: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export default function AdvertisingAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();

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

  // Approve/reject mutations
  const approveRequest = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase.from("ad_requests").update({
        status, admin_notes: notes || null, reviewed_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ad-requests"] });
      toast({ title: isAr ? "تم التحديث" : "Updated" });
    },
  });

  const approveCampaign = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const update: Record<string, unknown> = { status };
      if (status === "approved" || status === "active") {
        update.approved_at = new Date().toISOString();
      }
      if (reason) update.rejection_reason = reason;
      const { error } = await supabase.from("ad_campaigns").update(update).eq("id", id);
      if (error) throw error;
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
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ad-creatives"] });
      toast({ title: isAr ? "تم التحديث" : "Updated" });
    },
  });

  const togglePlacement = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("ad_placements").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ad-placements"] }),
  });

  const kpis = [
    { icon: Megaphone, label: isAr ? "الحملات النشطة" : "Active Campaigns", value: stats?.activeCampaigns || 0, color: "text-primary" },
    { icon: Eye, label: isAr ? "إجمالي المشاهدات" : "Total Impressions", value: (stats?.totalImpressions || 0).toLocaleString(), color: "text-chart-1" },
    { icon: MousePointer, label: isAr ? "إجمالي النقرات" : "Total Clicks", value: (stats?.totalClicks || 0).toLocaleString(), color: "text-chart-2" },
    { icon: DollarSign, label: isAr ? "الإيرادات" : "Revenue", value: `${(stats?.totalRevenue || 0).toLocaleString()} SAR`, color: "text-chart-3" },
  ];

  const pendingRequests = requests.filter(r => r.status === "pending" || r.status === "under_review");
  const pendingCampaigns = campaigns.filter(c => c.status === "pending_approval");
  const pendingCreatives = creatives.filter(c => c.status === "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? "مركز الإعلانات" : "Advertising Center"}</h1>
          <p className="text-sm text-muted-foreground">{isAr ? "إدارة الإعلانات والحملات والتحليلات" : "Manage ads, campaigns, and analytics"}</p>
        </div>
        {pendingRequests.length > 0 && (
          <Badge variant="destructive" className="gap-1">
            <Clock className="h-3 w-3" />
            {pendingRequests.length} {isAr ? "طلب بانتظار المراجعة" : "pending requests"}
          </Badge>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-muted ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-xl font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="requests">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="requests" className="gap-1">
            <FileText className="h-3.5 w-3.5" />
            {isAr ? "الطلبات" : "Requests"}
            {pendingRequests.length > 0 && <Badge variant="destructive" className="ms-1 h-5 px-1.5 text-[10px]">{pendingRequests.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1">
            <Megaphone className="h-3.5 w-3.5" />
            {isAr ? "الحملات" : "Campaigns"}
            {pendingCampaigns.length > 0 && <Badge variant="destructive" className="ms-1 h-5 px-1.5 text-[10px]">{pendingCampaigns.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="creatives" className="gap-1">
            <LayoutGrid className="h-3.5 w-3.5" />
            {isAr ? "المواد الإعلانية" : "Creatives"}
            {pendingCreatives.length > 0 && <Badge variant="destructive" className="ms-1 h-5 px-1.5 text-[10px]">{pendingCreatives.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="placements" className="gap-1">
            <Target className="h-3.5 w-3.5" />
            {isAr ? "المواقع الإعلانية" : "Placements"}
          </TabsTrigger>
          <TabsTrigger value="packages" className="gap-1">
            <Package className="h-3.5 w-3.5" />
            {isAr ? "الباقات" : "Packages"}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1">
            <BarChart3 className="h-3.5 w-3.5" />
            {isAr ? "التحليلات" : "Analytics"}
          </TabsTrigger>
          <TabsTrigger value="behavior" className="gap-1">
            <Brain className="h-3.5 w-3.5" />
            {isAr ? "السلوك" : "Behavior"}
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1">
            <Globe className="h-3.5 w-3.5" />
            {isAr ? "التكاملات" : "Integrations"}
          </TabsTrigger>
        </TabsList>

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
                        <TableCell>{req.budget ? `${req.budget} ${req.currency}` : "—"}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[req.status] || ""}>{req.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {(req.status === "pending" || req.status === "under_review") && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 text-green-600" onClick={() => approveRequest.mutate({ id: req.id, status: "approved" })}>
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-red-600" onClick={() => approveRequest.mutate({ id: req.id, status: "rejected", notes: "Does not meet guidelines" })}>
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
          <Card>
            <CardHeader><CardTitle>{isAr ? "الحملات الإعلانية" : "Ad Campaigns"}</CardTitle></CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد حملات" : "No campaigns yet"}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
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
                      <TableRow key={c.id}>
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
                              <Button size="sm" variant="ghost" className="h-7 text-green-600" onClick={() => approveCampaign.mutate({ id: c.id, status: "active" })}>
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-red-600" onClick={() => approveCampaign.mutate({ id: c.id, status: "rejected", reason: "Does not meet guidelines" })}>
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                          {c.status === "active" && (
                            <Button size="sm" variant="ghost" className="h-7" onClick={() => approveCampaign.mutate({ id: c.id, status: "paused" })}>
                              {isAr ? "إيقاف" : "Pause"}
                            </Button>
                          )}
                          {c.status === "paused" && (
                            <Button size="sm" variant="ghost" className="h-7" onClick={() => approveCampaign.mutate({ id: c.id, status: "active" })}>
                              {isAr ? "تفعيل" : "Resume"}
                            </Button>
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
                        <p className="text-xs text-muted-foreground mb-3">
                          {cr.impressions?.toLocaleString()} {isAr ? "مشاهدة" : "views"} · {cr.clicks?.toLocaleString()} {isAr ? "نقرة" : "clicks"}
                        </p>
                        {cr.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1" onClick={() => approveCreative.mutate({ id: cr.id, status: "approved" })}>
                              <CheckCircle className="h-3.5 w-3.5 me-1" />{isAr ? "موافقة" : "Approve"}
                            </Button>
                            <Button size="sm" variant="destructive" className="flex-1" onClick={() => approveCreative.mutate({ id: cr.id, status: "rejected", reason: "Content guidelines" })}>
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
                      <TableCell>{p.base_cpm} SAR</TableCell>
                      <TableCell>{p.base_cpc} SAR</TableCell>
                      <TableCell>{p.is_premium ? <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Premium</Badge> : "—"}</TableCell>
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

        {/* Behavior Tab */}
        <TabsContent value="behavior">
          <AdBehaviorInsights />
        </TabsContent>

        {/* Google Integrations Tab */}
        <TabsContent value="integrations">
          <GoogleIntegrationPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
