import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Megaphone, Eye, MousePointer, DollarSign, Plus, Package, BarChart3, FileText, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/currencyFormatter";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";

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

export default function CompanyAdvertising() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { companyId } = useCompanyAccess();
  const qc = useQueryClient();
  const [requestOpen, setRequestOpen] = useState(false);
  const [form, setForm] = useState({ title: "", title_ar: "", description: "", budget: "", request_type: "campaign", package_id: "" });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["company-ad-campaigns", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from("ad_campaigns").select("id, name, name_ar, status, budget, spent, start_date, end_date, billing_model, total_impressions, total_clicks, total_views, currency, priority, created_at").eq("company_id", companyId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 2,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["company-ad-requests", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from("ad_requests").select("id, title, title_ar, status, request_type, budget, currency, desired_start_date, desired_end_date, admin_notes, reviewed_at, created_at").eq("company_id", companyId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: packages = [] } = useQuery({
    queryKey: ["ad-packages"],
    queryFn: async () => {
      const { data } = await supabase.from("ad_packages").select("id, name, name_ar, tier, price, currency, duration_days, description, description_ar, features, max_impressions, max_clicks, max_campaigns, sort_order").eq("is_active", true).order("sort_order");
      return data || [];
    },
  });

  const submitRequest = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No company");
      const { error } = await supabase.from("ad_requests").insert({
        company_id: companyId,
        title: form.title,
        title_ar: form.title_ar || null,
        description: form.description || null,
        budget: form.budget ? parseFloat(form.budget) : null,
        request_type: form.request_type,
        package_id: form.package_id || null,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-ad-requests"] });
      toast({ title: isAr ? "تم إرسال الطلب" : "Request submitted" });
      setRequestOpen(false);
      setForm({ title: "", title_ar: "", description: "", budget: "", request_type: "campaign", package_id: "" });
    },
    onError: () => toast({ title: isAr ? "حدث خطأ" : "Error", variant: "destructive" }),
  });

  const totalImpressions = campaigns.reduce((s, c) => s + ((c as any).total_impressions || 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + ((c as any).total_clicks || 0), 0);
  const totalSpent = campaigns.reduce((s, c) => s + ((c as any).spent || 0), 0);
  const activeCampaigns = campaigns.filter(c => (c as any).status === "active").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? "الإعلانات" : "Advertising"}</h1>
          <p className="text-sm text-muted-foreground">{isAr ? "إدارة حملاتك الإعلانية على المنصة" : "Manage your advertising campaigns on the platform"}</p>
        </div>
        <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 me-2" />{isAr ? "طلب إعلان جديد" : "New Ad Request"}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{isAr ? "طلب إعلان جديد" : "New Advertising Request"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{isAr ? "العنوان (إنجليزي)" : "Title (English)"}</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
                <Input value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} dir="rtl" />
              </div>
              <div>
                <Label>{isAr ? "النوع" : "Type"}</Label>
                <Select value={form.request_type} onValueChange={v => setForm(f => ({ ...f, request_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="campaign">{isAr ? "حملة إعلانية" : "Campaign"}</SelectItem>
                    <SelectItem value="sponsorship">{isAr ? "رعاية قسم" : "Sponsorship"}</SelectItem>
                    <SelectItem value="popup">{isAr ? "إعلان منبثق" : "Pop-up Ad"}</SelectItem>
                    <SelectItem value="custom">{isAr ? "مخصص" : "Custom"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? "الباقة" : "Package"}</Label>
                <Select value={form.package_id} onValueChange={v => setForm(f => ({ ...f, package_id: v }))}>
                  <SelectTrigger><SelectValue placeholder={isAr ? "اختر باقة" : "Select package"} /></SelectTrigger>
                  <SelectContent>
                    {packages.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{isAr ? p.name_ar || p.name : p.name} — {p.price} {p.currency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? "الميزانية (SAR)" : "Budget (SAR)"}</Label>
                <Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "التفاصيل" : "Details"}</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
              </div>
              <Button className="w-full" onClick={() => submitRequest.mutate()} disabled={!form.title || submitRequest.isPending}>
                {isAr ? "إرسال الطلب" : "Submit Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
           { icon: Megaphone, label: isAr ? "حملات نشطة" : "Active", numValue: activeCampaigns, color: "text-primary" },
           { icon: Eye, label: isAr ? "المشاهدات" : "Impressions", numValue: totalImpressions, color: "text-chart-1" },
           { icon: MousePointer, label: isAr ? "النقرات" : "Clicks", numValue: totalClicks, color: "text-chart-2" },
           { icon: DollarSign, label: isAr ? "المصروف" : "Spent", strValue: formatCurrency(totalSpent, language as "en" | "ar"), color: "text-chart-3" },
         ].map(k => (
          <Card key={k.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-muted ${k.color}`}>
                <k.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                {'numValue' in k ? <AnimatedCounter value={k.numValue as number} className="text-xl font-bold" format /> : <p className="text-xl font-bold">{k.strValue}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns" className="gap-1"><Megaphone className="h-3.5 w-3.5" />{isAr ? "الحملات" : "Campaigns"}</TabsTrigger>
          <TabsTrigger value="requests" className="gap-1"><FileText className="h-3.5 w-3.5" />{isAr ? "الطلبات" : "Requests"}</TabsTrigger>
          <TabsTrigger value="packages" className="gap-1"><Package className="h-3.5 w-3.5" />{isAr ? "الباقات" : "Packages"}</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card>
            <CardContent className="p-0">
              {campaigns.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد حملات بعد" : "No campaigns yet"}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isAr ? "الحملة" : "Campaign"}</TableHead>
                      <TableHead>{isAr ? "النموذج" : "Model"}</TableHead>
                      <TableHead>{isAr ? "الميزانية" : "Budget"}</TableHead>
                      <TableHead>{isAr ? "مشاهدات" : "Imp."}</TableHead>
                      <TableHead>{isAr ? "نقرات" : "Clicks"}</TableHead>
                      <TableHead>CTR</TableHead>
                      <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((c: any) => {
                      const ctr = c.total_impressions > 0 ? ((c.total_clicks / c.total_impressions) * 100).toFixed(2) : "0.00";
                      return (
                        <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/company/advertising/${c.id}`)}>
                          <TableCell className="font-medium">{isAr ? c.name_ar || c.name : c.name}</TableCell>
                           <TableCell><Badge variant="outline">{c.billing_model}</Badge></TableCell>
                           <TableCell>{formatCurrency(Number(c.budget), language as "en" | "ar")} / {formatCurrency(Number(c.spent), language as "en" | "ar")}</TableCell>
                           <TableCell><AnimatedCounter value={c.total_impressions || 0} className="inline" format /></TableCell>
                           <TableCell><AnimatedCounter value={c.total_clicks || 0} className="inline" format /></TableCell>
                           <TableCell>{ctr}%</TableCell>
                           <TableCell><Badge className={statusColors[c.status] || ""}>{c.status}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardContent className="p-0">
              {requests.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد طلبات" : "No requests yet"}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
                      <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                      <TableHead>{isAr ? "الميزانية" : "Budget"}</TableHead>
                      <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{isAr ? r.title_ar || r.title : r.title}</TableCell>
                        <TableCell><Badge variant="outline">{r.request_type}</Badge></TableCell>
                        <TableCell>{r.budget ? `${r.budget} ${r.currency}` : "—"}</TableCell>
                        <TableCell><Badge className={statusColors[r.status] || ""}>{r.status}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{toEnglishDigits(new Date(r.created_at).toLocaleDateString())}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {packages.map((pkg: any) => (
              <Card key={pkg.id} className={`border-2 transition-all hover:shadow-lg ${pkg.tier === "platinum" ? "border-primary" : "border-border/50"}`}>
                <CardContent className="p-5 text-center">
                  <Badge className="mb-2" variant={pkg.tier === "platinum" ? "default" : "secondary"}>
                    {isAr ? pkg.name_ar || pkg.name : pkg.name}
                  </Badge>
                  <p className="text-3xl font-bold my-2"><AnimatedCounter value={Number(pkg.price)} className="inline" format /><span className="text-sm text-muted-foreground ms-1">{pkg.currency}</span></p>
                   <p className="text-xs text-muted-foreground mb-3"><AnimatedCounter value={pkg.duration_days} className="inline" /> {isAr ? "يوم" : "days"}</p>
                   <div className="text-xs text-muted-foreground space-y-1 text-start">
                     <p>• {pkg.max_impressions ? <><AnimatedCounter value={pkg.max_impressions} className="inline" format /> {isAr ? "مشاهدة" : "impressions"}</> : isAr ? "غير محدود" : "Unlimited"}</p>
                     <p>• {pkg.max_clicks ? <><AnimatedCounter value={pkg.max_clicks} className="inline" format /> {isAr ? "نقرة" : "clicks"}</> : isAr ? "غير محدود" : "Unlimited"}</p>
                     <p>• <AnimatedCounter value={pkg.max_campaigns} className="inline" /> {isAr ? "حملة" : "campaigns"}</p>
                     <p>• <AnimatedCounter value={pkg.included_placements?.length || 0} className="inline" /> {isAr ? "موقع" : "placements"}</p>
                   </div>
                   {pkg.price && <p className="text-sm font-bold mt-3 text-primary">{formatCurrency(Number(pkg.price), language as "en" | "ar")}</p>}
                  <p className="text-xs mt-3">{isAr ? pkg.description_ar || pkg.description : pkg.description}</p>
                  <Button className="w-full mt-4" variant={pkg.tier === "platinum" ? "default" : "outline"} onClick={() => { setForm(f => ({ ...f, package_id: pkg.id, title: `${pkg.name} Campaign` })); setRequestOpen(true); }}>
                    {isAr ? "اشترك الآن" : "Subscribe Now"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
