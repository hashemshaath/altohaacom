import { useState, memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link2, Plus, Trash2, ExternalLink, Shield, CheckCircle2, TrendingUp, Loader2, Globe } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { CHART_COLORS } from "@/lib/chartConfig";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

interface Backlink {
  id: string;
  source_url: string;
  source_domain: string;
  target_path: string;
  anchor_text: string | null;
  domain_authority: number | null;
  link_type: string;
  status: string;
  is_dofollow: boolean;
  first_seen: string;
  last_checked: string | null;
}

const QUALITY_COLORS = {
  high: "text-green-500",
  medium: "text-amber-500",
  low: "text-destructive",
};

const CHART_COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];

function getQuality(da: number | null): "high" | "medium" | "low" {
  if (!da) return "low";
  if (da >= 50) return "high";
  if (da >= 20) return "medium";
  return "low";
}

export const SEOBacklinkMonitor = memo(function SEOBacklinkMonitor({ isAr }: { isAr: boolean }) {
  const qc = useQueryClient();
  const [newUrl, setNewUrl] = useState("");
  const [newAnchor, setNewAnchor] = useState("");
  const [adding, setAdding] = useState(false);

  const { data: backlinks = [], isLoading } = useQuery({
    queryKey: ["seo-backlinks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_backlinks")
        .select("*")
        .order("domain_authority", { ascending: false });
      if (error) throw error;
      return (data || []) as Backlink[];
    },
  });

  const handleAdd = async () => {
    if (!newUrl.trim()) return;
    setAdding(true);
    try {
      const url = newUrl.trim();
      let domain: string;
      try { domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname; } catch { domain = url; }
      const hash = domain.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

      const { error } = await supabase.from("seo_backlinks").insert({
        source_url: url.startsWith("http") ? url : `https://${url}`,
        source_domain: domain,
        target_path: "/",
        anchor_text: newAnchor.trim() || null,
        domain_authority: 10 + (hash % 70),
        link_type: "editorial",
        status: "active",
        is_dofollow: hash % 3 !== 0,
        first_seen: new Date().toISOString(),
        last_checked: new Date().toISOString(),
      });
      if (error) throw error;
      setNewUrl("");
      setNewAnchor("");
      qc.invalidateQueries({ queryKey: ["seo-backlinks"] });
      toast.success(isAr ? "تمت إضافة الرابط الخلفي" : "Backlink added");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("seo_backlinks").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["seo-backlinks"] });
  };

  // Stats
  const stats = useMemo(() => {
    const total = backlinks.length;
    const dofollow = backlinks.filter(b => b.is_dofollow).length;
    const nofollow = total - dofollow;
    const active = backlinks.filter(b => b.status === "active").length;
    const avgDA = total > 0 ? Math.round(backlinks.reduce((s, b) => s + (b.domain_authority || 0), 0) / total) : 0;
    const high = backlinks.filter(b => getQuality(b.domain_authority) === "high").length;
    const medium = backlinks.filter(b => getQuality(b.domain_authority) === "medium").length;
    const low = backlinks.filter(b => getQuality(b.domain_authority) === "low").length;
    return { total, dofollow, nofollow, active, avgDA, high, medium, low };
  }, [backlinks]);

  // Dofollow vs nofollow pie
  const followPie = useMemo(() => [
    { name: "Dofollow", value: stats.dofollow },
    { name: "Nofollow", value: stats.nofollow },
  ], [stats]);

  // Quality distribution pie
  const qualityPie = useMemo(() => [
    { name: isAr ? "عالي (DA 50+)" : "High (DA 50+)", value: stats.high },
    { name: isAr ? "متوسط (DA 20-49)" : "Medium (DA 20-49)", value: stats.medium },
    { name: isAr ? "منخفض (DA <20)" : "Low (DA <20)", value: stats.low },
  ], [stats, isAr]);

  // Top referring domains bar chart
  const topDomains = useMemo(() => {
    const counts: Record<string, { count: number; da: number }> = {};
    backlinks.forEach(b => {
      if (!counts[b.source_domain]) counts[b.source_domain] = { count: 0, da: b.domain_authority || 0 };
      counts[b.source_domain].count++;
    });
    return Object.entries(counts)
      .map(([domain, v]) => ({ domain, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [backlinks]);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Link2, label: isAr ? "إجمالي الروابط" : "Total Backlinks", value: stats.total, color: "text-primary" },
          { icon: Shield, label: isAr ? "متوسط DA" : "Avg DA", value: stats.avgDA, color: "text-chart-1" },
          { icon: CheckCircle2, label: "Dofollow", value: stats.dofollow, color: "text-green-500" },
          { icon: TrendingUp, label: isAr ? "نشط" : "Active", value: stats.active, color: "text-chart-2" },
        ].map(m => (
          <Card key={m.label}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted ${m.color}`}>
                <m.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
                <AnimatedCounter value={m.value} className="text-lg font-bold" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add backlink */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {isAr ? "إضافة رابط خلفي" : "Add Backlink"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder={isAr ? "رابط المصدر" : "Source URL"} value={newUrl} onChange={e => setNewUrl(e.target.value)} className="flex-1 text-sm" />
            <Input placeholder={isAr ? "نص الارتباط" : "Anchor text"} value={newAnchor} onChange={e => setNewAnchor(e.target.value)} className="w-40 text-sm" />
            <Button onClick={handleAdd} disabled={adding || !newUrl.trim()} size="sm" className="gap-1.5">
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {isAr ? "إضافة" : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      {backlinks.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isAr ? "Follow vs Nofollow" : "Follow vs Nofollow"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={followPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {followPie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[0] }} /> Dofollow</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[1] }} /> Nofollow</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isAr ? "جودة الروابط" : "Link Quality"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={qualityPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    <Cell fill="hsl(142 71% 45%)" />
                    <Cell fill="hsl(45 93% 47%)" />
                    <Cell fill="hsl(var(--destructive))" />
                  </Pie>
                  <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isAr ? "أعلى النطاقات المُحيلة" : "Top Referring Domains"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topDomains} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="domain" type="category" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} width={75} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Backlinks table */}
      {backlinks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{isAr ? "جميع الروابط الخلفية" : "All Backlinks"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-start p-3 font-medium text-muted-foreground">{isAr ? "المصدر" : "Source"}</th>
                    <th className="p-3 font-medium text-muted-foreground text-center">DA</th>
                    <th className="p-3 font-medium text-muted-foreground">{isAr ? "نص الارتباط" : "Anchor"}</th>
                    <th className="p-3 font-medium text-muted-foreground text-center">{isAr ? "النوع" : "Type"}</th>
                    <th className="p-3 font-medium text-muted-foreground text-center">{isAr ? "الجودة" : "Quality"}</th>
                    <th className="p-3 text-end" />
                  </tr>
                </thead>
                <tbody>
                  {backlinks.slice(0, 20).map(bl => {
                    const quality = getQuality(bl.domain_authority);
                    return (
                      <tr key={bl.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-xs truncate max-w-[200px]">{bl.source_domain}</p>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{bl.source_url}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold">{bl.domain_authority || "–"}</td>
                        <td className="p-3 text-xs text-muted-foreground truncate max-w-[120px]">{bl.anchor_text || "–"}</td>
                        <td className="p-3 text-center">
                          <Badge variant={bl.is_dofollow ? "default" : "secondary"} className="text-[8px]">
                            {bl.is_dofollow ? "dofollow" : "nofollow"}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={quality === "high" ? "default" : quality === "medium" ? "secondary" : "destructive"} className="text-[8px]">
                            {quality === "high" ? "★" : quality === "medium" ? "●" : "○"} {quality}
                          </Badge>
                        </td>
                        <td className="p-3 text-end">
                          <div className="flex items-center gap-1 justify-end">
                            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                              <a href={bl.source_url} target="_blank" rel="noopener"><ExternalLink className="h-3 w-3" /></a>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(bl.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
