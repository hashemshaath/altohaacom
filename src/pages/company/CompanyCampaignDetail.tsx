import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currencyFormatter";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  ArrowLeft, Eye, MousePointer, DollarSign, TrendingUp, Plus,
  Image, Video, ExternalLink, Pause, Play, BarChart3, Megaphone,
  Clock, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  pending_approval: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  active: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  paused: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  completed: "bg-muted text-muted-foreground border-border",
  draft: "bg-muted text-muted-foreground border-border",
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "active": case "approved": return <CheckCircle2 className="h-4 w-4 text-chart-2" />;
    case "paused": return <Pause className="h-4 w-4 text-chart-4" />;
    case "rejected": return <XCircle className="h-4 w-4 text-destructive" />;
    case "pending": case "pending_approval": return <Clock className="h-4 w-4 text-warning" />;
    default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function CompanyCampaignDetail() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { companyId } = useCompanyAccess();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [creativeOpen, setCreativeOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", title_ar: "", body_text: "", body_text_ar: "",
    cta_text: "", cta_text_ar: "", destination_url: "", image_url: "",
    format: "banner", placement_id: "",
  });

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaign-detail", campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("id", campaignId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });

  const { data: creatives = [] } = useQuery({
    queryKey: ["campaign-creatives", campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from("ad_creatives")
        .select("*, ad_placements(name, name_ar, placement_type, width, height)")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!campaignId,
  });

  const { data: placements = [] } = useQuery({
    queryKey: ["ad-placements-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ad_placements")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
  });

  // Daily performance mock from impressions/clicks aggregation
  const { data: dailyStats = [] } = useQuery({
    queryKey: ["campaign-daily-stats", campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      // Aggregate impressions by day
      const { data: impressions } = await supabase
        .from("ad_impressions")
        .select("created_at")
        .eq("campaign_id", campaignId)
        .order("created_at");

      const { data: clicks } = await supabase
        .from("ad_clicks")
        .select("created_at")
        .eq("campaign_id", campaignId)
        .order("created_at");

      const dayMap: Record<string, { date: string; impressions: number; clicks: number }> = {};
      (impressions || []).forEach((i: any) => {
        const d = new Date(i.created_at).toISOString().split("T")[0];
        if (!dayMap[d]) dayMap[d] = { date: d, impressions: 0, clicks: 0 };
        dayMap[d].impressions++;
      });
      (clicks || []).forEach((c: any) => {
        const d = new Date(c.created_at).toISOString().split("T")[0];
        if (!dayMap[d]) dayMap[d] = { date: d, impressions: 0, clicks: 0 };
        dayMap[d].clicks++;
      });
      return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!campaignId,
  });

  const addCreative = useMutation({
    mutationFn: async () => {
      if (!campaignId || !form.placement_id) throw new Error("Missing data");
      const { error } = await supabase.from("ad_creatives").insert({
        campaign_id: campaignId,
        placement_id: form.placement_id,
        title: form.title || null,
        title_ar: form.title_ar || null,
        body_text: form.body_text || null,
        body_text_ar: form.body_text_ar || null,
        cta_text: form.cta_text || null,
        cta_text_ar: form.cta_text_ar || null,
        destination_url: form.destination_url,
        image_url: form.image_url || null,
        format: form.format,
        status: "pending_approval",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaign-creatives"] });
      toast({ title: isAr ? "تم إضافة الإعلان" : "Creative added" });
      setCreativeOpen(false);
      setForm({ title: "", title_ar: "", body_text: "", body_text_ar: "", cta_text: "", cta_text_ar: "", destination_url: "", image_url: "", format: "banner", placement_id: "" });
    },
    onError: () => toast({ title: isAr ? "حدث خطأ" : "Error", variant: "destructive" }),
  });

  const toggleCreative = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("ad_creatives").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaign-creatives"] }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{isAr ? "الحملة غير موجودة" : "Campaign not found"}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/company/advertising")}>
          <ArrowLeft className="h-4 w-4 me-2" />{isAr ? "العودة" : "Back"}
        </Button>
      </div>
    );
  }

  const ctr = (campaign as any).total_impressions > 0
    ? (((campaign as any).total_clicks / (campaign as any).total_impressions) * 100).toFixed(2)
    : "0.00";

  const budgetUsed = (campaign as any).budget > 0
    ? (((campaign as any).spent || 0) / (campaign as any).budget * 100).toFixed(0)
    : "0";

  // Creative performance for pie chart
  const creativePieData = creatives
    .filter((c: any) => (c.impressions || 0) > 0)
    .map((c: any) => ({
      name: isAr ? c.title_ar || c.title || c.format : c.title || c.format,
      value: c.impressions || 0,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/company/advertising")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold truncate">
              {isAr ? (campaign as any).name_ar || campaign.name : campaign.name}
            </h1>
            <Badge className={statusColors[campaign.status] || ""}>
              <StatusIcon status={campaign.status} />
              <span className="ms-1">{campaign.status}</span>
            </Badge>
          </div>
          {campaign.description && (
            <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>{isAr ? "نموذج الفوترة:" : "Billing:"} <Badge variant="outline" className="text-[10px]">{campaign.billing_model}</Badge></span>
            {campaign.start_date && <span>{isAr ? "من" : "From"} {new Date(campaign.start_date).toLocaleDateString()}</span>}
            {campaign.end_date && <span>{isAr ? "إلى" : "To"} {new Date(campaign.end_date).toLocaleDateString()}</span>}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: Eye, label: isAr ? "المشاهدات" : "Impressions", numValue: (campaign as any).total_impressions || 0, color: "text-chart-1" },
          { icon: MousePointer, label: isAr ? "النقرات" : "Clicks", numValue: (campaign as any).total_clicks || 0, color: "text-chart-2" },
          { icon: TrendingUp, label: "CTR", strValue: `${ctr}%`, color: "text-chart-3" },
          { icon: DollarSign, label: isAr ? "المصروف" : "Spent", strValue: formatCurrency(Number((campaign as any).spent || 0), language as "en" | "ar"), color: "text-chart-4" },
          { icon: BarChart3, label: isAr ? "استهلاك الميزانية" : "Budget Used", strValue: `${budgetUsed}%`, color: "text-primary" },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted ${k.color}`}>
                <k.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{k.label}</p>
                {'numValue' in k ? <AnimatedCounter value={k.numValue as number} className="text-lg font-bold" format /> : <p className="text-lg font-bold">{k.strValue}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance" className="gap-1"><BarChart3 className="h-3.5 w-3.5" />{isAr ? "الأداء" : "Performance"}</TabsTrigger>
          <TabsTrigger value="creatives" className="gap-1"><Image className="h-3.5 w-3.5" />{isAr ? "الإعلانات" : "Creatives"} <Badge variant="secondary" className="text-[10px] ms-1">{creatives.length}</Badge></TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4 mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Daily trend */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{isAr ? "الأداء اليومي" : "Daily Performance"}</CardTitle>
              </CardHeader>
              <CardContent>
                {dailyStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Line type="monotone" dataKey="impressions" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name={isAr ? "مشاهدات" : "Impressions"} />
                      <Line type="monotone" dataKey="clicks" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name={isAr ? "نقرات" : "Clicks"} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                    {isAr ? "لا توجد بيانات بعد" : "No data yet"}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Creative distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{isAr ? "توزيع الإعلانات" : "Creative Distribution"}</CardTitle>
              </CardHeader>
              <CardContent>
                {creativePieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={creativePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value">
                        {creativePieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                    {isAr ? "لا توجد بيانات" : "No data"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Creatives Tab */}
        <TabsContent value="creatives" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={creativeOpen} onOpenChange={setCreativeOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />{isAr ? "إضافة إعلان" : "Add Creative"}</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{isAr ? "إعلان إبداعي جديد" : "New Creative"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{isAr ? "العنوان (EN)" : "Title (EN)"}</Label>
                      <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div>
                      <Label>{isAr ? "العنوان (AR)" : "Title (AR)"}</Label>
                      <Input value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} dir="rtl" />
                    </div>
                  </div>
                  <div>
                    <Label>{isAr ? "موضع الإعلان" : "Placement"} *</Label>
                    <Select value={form.placement_id} onValueChange={v => setForm(f => ({ ...f, placement_id: v }))}>
                      <SelectTrigger><SelectValue placeholder={isAr ? "اختر الموضع" : "Select placement"} /></SelectTrigger>
                      <SelectContent>
                        {placements.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {isAr ? p.name_ar || p.name : p.name} ({p.width}×{p.height})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{isAr ? "التنسيق" : "Format"}</Label>
                    <Select value={form.format} onValueChange={v => setForm(f => ({ ...f, format: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="banner">{isAr ? "بانر" : "Banner"}</SelectItem>
                        <SelectItem value="video">{isAr ? "فيديو" : "Video"}</SelectItem>
                        <SelectItem value="popup">{isAr ? "منبثق" : "Pop-up"}</SelectItem>
                        <SelectItem value="native">{isAr ? "أصلي" : "Native"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{isAr ? "نص الزر (EN)" : "CTA (EN)"}</Label>
                      <Input value={form.cta_text} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))} placeholder="Learn More" />
                    </div>
                    <div>
                      <Label>{isAr ? "نص الزر (AR)" : "CTA (AR)"}</Label>
                      <Input value={form.cta_text_ar} onChange={e => setForm(f => ({ ...f, cta_text_ar: e.target.value }))} dir="rtl" placeholder="اعرف المزيد" />
                    </div>
                  </div>
                  <div>
                    <Label>{isAr ? "رابط الوجهة" : "Destination URL"} *</Label>
                    <Input value={form.destination_url} onChange={e => setForm(f => ({ ...f, destination_url: e.target.value }))} placeholder="https://..." dir="ltr" />
                  </div>
                  <div>
                    <Label>{isAr ? "رابط الصورة" : "Image URL"}</Label>
                    <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." dir="ltr" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{isAr ? "نص الإعلان (EN)" : "Body (EN)"}</Label>
                      <Textarea value={form.body_text} onChange={e => setForm(f => ({ ...f, body_text: e.target.value }))} rows={2} />
                    </div>
                    <div>
                      <Label>{isAr ? "نص الإعلان (AR)" : "Body (AR)"}</Label>
                      <Textarea value={form.body_text_ar} onChange={e => setForm(f => ({ ...f, body_text_ar: e.target.value }))} rows={2} dir="rtl" />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => addCreative.mutate()}
                    disabled={!form.destination_url || !form.placement_id || addCreative.isPending}
                  >
                    {addCreative.isPending ? (isAr ? "جاري الإضافة..." : "Adding...") : (isAr ? "إضافة الإعلان" : "Add Creative")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {creatives.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
                  <Image className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">{isAr ? "لا توجد إعلانات بعد" : "No creatives yet"}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {creatives.map((c: any, idx: number) => {
                const placement = c.ad_placements;
                const creativeCtr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : "0.00";
                return (
                  <Card
                    key={c.id}
                    className="group overflow-hidden animate-fade-in border-border/50 transition-all hover:shadow-lg hover:-translate-y-1"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    {/* Image preview */}
                    {c.image_url ? (
                      <div className="relative h-40 bg-muted overflow-hidden">
                        <img src={c.image_url} alt={c.title || "Creative"} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                        <Badge className={`absolute top-2 end-2 text-[10px] ${statusColors[c.status] || ""}`}>
                          <StatusIcon status={c.status} />
                          <span className="ms-1">{c.status}</span>
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex h-24 items-center justify-center bg-muted/50 relative">
                        {c.format === "video" ? <Video className="h-8 w-8 text-muted-foreground" /> : <Image className="h-8 w-8 text-muted-foreground" />}
                        <Badge className={`absolute top-2 end-2 text-[10px] ${statusColors[c.status] || ""}`}>
                          <StatusIcon status={c.status} />
                          <span className="ms-1">{c.status}</span>
                        </Badge>
                      </div>
                    )}

                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-sm truncate">
                          {isAr ? c.title_ar || c.title || c.format : c.title || c.format}
                        </h3>
                        {placement && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {isAr ? placement.name_ar || placement.name : placement.name} • {placement.placement_type}
                          </p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-muted/50 p-2">
                          <p className="text-[10px] text-muted-foreground">{isAr ? "مشاهدات" : "Imp."}</p>
                          <AnimatedCounter value={c.impressions || 0} className="text-sm font-bold" format />
                        </div>
                        <div className="rounded-xl bg-muted/50 p-2">
                          <p className="text-[10px] text-muted-foreground">{isAr ? "نقرات" : "Clicks"}</p>
                          <AnimatedCounter value={c.clicks || 0} className="text-sm font-bold" format />
                        </div>
                        <div className="rounded-xl bg-muted/50 p-2">
                          <p className="text-[10px] text-muted-foreground">CTR</p>
                          <p className="text-sm font-bold">{creativeCtr}%</p>
                        </div>
                      </div>

                      {c.rejection_reason && (
                        <p className="text-[10px] text-destructive bg-destructive/5 rounded p-2">
                          {isAr ? "سبب الرفض:" : "Rejection:"} {c.rejection_reason}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1 text-xs"
                          onClick={() => toggleCreative.mutate({ id: c.id, is_active: !c.is_active })}
                        >
                          {c.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          {c.is_active ? (isAr ? "إيقاف" : "Pause") : (isAr ? "تشغيل" : "Activate")}
                        </Button>
                        {c.destination_url && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                            <a href={c.destination_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
