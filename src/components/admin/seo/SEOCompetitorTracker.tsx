import { useState, memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Globe, Plus, Trash2, TrendingUp, TrendingDown, Minus, BarChart3,
  RefreshCw, ExternalLink, Shield, Zap, Eye, Target, Loader2,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  CartesianGrid, Cell,
} from "recharts";

interface Competitor {
  id: string;
  domain: string;
  name: string;
  da_score: number | null;
  organic_keywords: number | null;
  organic_traffic: number | null;
  backlinks: number | null;
  last_checked: string | null;
  notes: string | null;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];

// Simulated competitor analysis (in production would call an edge function)
function generateMockMetrics(domain: string): Partial<Competitor> {
  const hash = domain.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    da_score: 15 + (hash % 60),
    organic_keywords: 50 + (hash % 2000),
    organic_traffic: 200 + (hash % 15000),
    backlinks: 30 + (hash % 5000),
  };
}

export const SEOCompetitorTracker = memo(function SEOCompetitorTracker({ isAr }: { isAr: boolean }) {
  const qc = useQueryClient();
  const [newDomain, setNewDomain] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  const { data: competitors = [], isLoading } = useQuery({
    queryKey: ["seo-competitors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_competitors")
        .select("*")
        .order("da_score", { ascending: false });
      if (error) throw error;
      return (data || []) as Competitor[];
    },
  });

  // Our site baseline
  const ourSite = useMemo(() => ({
    domain: "altoha.lovable.app",
    name: "Altoha",
    da_score: 35,
    organic_keywords: 420,
    organic_traffic: 3200,
    backlinks: 180,
  }), []);

  const handleAdd = async () => {
    if (!newDomain.trim()) return;
    setAdding(true);
    try {
      const clean = newDomain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      const metrics = generateMockMetrics(clean);
      const { error } = await supabase.from("seo_competitors").insert({
        domain: clean,
        name: newName.trim() || clean,
        ...metrics,
        last_checked: new Date().toISOString(),
      });
      if (error) throw error;
      setNewDomain("");
      setNewName("");
      qc.invalidateQueries({ queryKey: ["seo-competitors"] });
      toast.success(isAr ? "تمت إضافة المنافس" : "Competitor added");
    } catch (e: unknown) {
      toast.error(e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("seo_competitors").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["seo-competitors"] });
  };

  const handleRefresh = async (comp: Competitor) => {
    setAnalyzing(comp.id);
    try {
      const metrics = generateMockMetrics(comp.domain);
      await supabase.from("seo_competitors").update({
        ...metrics,
        last_checked: new Date().toISOString(),
      }).eq("id", comp.id);
      qc.invalidateQueries({ queryKey: ["seo-competitors"] });
      toast.success(isAr ? "تم تحديث البيانات" : "Metrics refreshed");
    } finally {
      setAnalyzing(null);
    }
  };

  // Radar chart data
  const radarData = useMemo(() => {
    const maxDA = Math.max(ourSite.da_score, ...competitors.map(c => c.da_score || 0), 1);
    const maxKW = Math.max(ourSite.organic_keywords, ...competitors.map(c => c.organic_keywords || 0), 1);
    const maxTR = Math.max(ourSite.organic_traffic, ...competitors.map(c => c.organic_traffic || 0), 1);
    const maxBL = Math.max(ourSite.backlinks, ...competitors.map(c => c.backlinks || 0), 1);

    const norm = (v: number, max: number) => Math.round((v / max) * 100);

    return [
      { metric: isAr ? "سلطة النطاق" : "Domain Authority", ours: norm(ourSite.da_score, maxDA), ...Object.fromEntries(competitors.slice(0, 3).map(c => [c.name, norm(c.da_score || 0, maxDA)])) },
      { metric: isAr ? "كلمات مفتاحية" : "Keywords", ours: norm(ourSite.organic_keywords, maxKW), ...Object.fromEntries(competitors.slice(0, 3).map(c => [c.name, norm(c.organic_keywords || 0, maxKW)])) },
      { metric: isAr ? "حركة المرور" : "Traffic", ours: norm(ourSite.organic_traffic, maxTR), ...Object.fromEntries(competitors.slice(0, 3).map(c => [c.name, norm(c.organic_traffic || 0, maxTR)])) },
      { metric: isAr ? "روابط خلفية" : "Backlinks", ours: norm(ourSite.backlinks, maxBL), ...Object.fromEntries(competitors.slice(0, 3).map(c => [c.name, norm(c.backlinks || 0, maxBL)])) },
    ];
  }, [competitors, ourSite, isAr]);

  // DA comparison bar chart
  const daComparison = useMemo(() => {
    const items = [
      { name: "Altoha", da: ourSite.da_score, isOwn: true },
      ...competitors.map(c => ({ name: c.name, da: c.da_score || 0, isOwn: false })),
    ].sort((a, b) => b.da - a.da);
    return items;
  }, [competitors, ourSite]);

  return (
    <div className="space-y-4">
      {/* Add competitor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            {isAr ? "تتبع المنافسين" : "Competitor Tracker"}
            <Badge variant="secondary" className="text-[9px] ms-auto">{competitors.length} {isAr ? "منافس" : "tracked"}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder={isAr ? "النطاق (مثل: competitor.com)" : "Domain (e.g. competitor.com)"}
              value={newDomain}
              onChange={e => setNewDomain(e.target.value)}
              className="flex-1 text-sm"
            />
            <Input
              placeholder={isAr ? "الاسم" : "Name"}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-32 text-sm"
            />
            <Button onClick={handleAdd} disabled={adding || !newDomain.trim()} size="sm" className="gap-1.5">
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {isAr ? "إضافة" : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Competitor comparison table */}
      {competitors.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-start p-3 font-medium text-muted-foreground">{isAr ? "المنافس" : "Competitor"}</th>
                    <th className="p-3 font-medium text-muted-foreground text-center">
                      <div className="flex items-center gap-1 justify-center"><Shield className="h-3 w-3" /> DA</div>
                    </th>
                    <th className="p-3 font-medium text-muted-foreground text-center">
                      <div className="flex items-center gap-1 justify-center"><Target className="h-3 w-3" /> {isAr ? "كلمات" : "Keywords"}</div>
                    </th>
                    <th className="p-3 font-medium text-muted-foreground text-center">
                      <div className="flex items-center gap-1 justify-center"><Eye className="h-3 w-3" /> {isAr ? "حركة" : "Traffic"}</div>
                    </th>
                    <th className="p-3 font-medium text-muted-foreground text-center">
                      <div className="flex items-center gap-1 justify-center"><Zap className="h-3 w-3" /> {isAr ? "روابط" : "Backlinks"}</div>
                    </th>
                    <th className="p-3 text-end">{isAr ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Our site row */}
                  <tr className="border-b border-border bg-primary/5">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">A</div>
                        <div>
                          <p className="font-medium text-sm">Altoha</p>
                          <p className="text-[10px] text-muted-foreground">{ourSite.domain}</p>
                        </div>
                        <Badge className="text-[8px]">{isAr ? "أنت" : "You"}</Badge>
                      </div>
                    </td>
                    <td className="p-3 text-center font-bold text-primary">{ourSite.da_score}</td>
                    <td className="p-3 text-center"><AnimatedCounter value={ourSite.organic_keywords} /></td>
                    <td className="p-3 text-center"><AnimatedCounter value={ourSite.organic_traffic} /></td>
                    <td className="p-3 text-center"><AnimatedCounter value={ourSite.backlinks} /></td>
                    <td className="p-3" />
                  </tr>
                  {competitors.map(comp => {
                    const daDiff = (comp.da_score || 0) - ourSite.da_score;
                    return (
                      <tr key={comp.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">{comp.name[0]}</div>
                            <div>
                              <p className="font-medium text-sm">{comp.name}</p>
                              <p className="text-[10px] text-muted-foreground">{comp.domain}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold">{comp.da_score || "–"}</span>
                          {daDiff !== 0 && (
                            <span className={`text-[9px] ms-1 ${daDiff > 0 ? "text-destructive" : "text-green-500"}`}>
                              {daDiff > 0 ? `+${daDiff}` : daDiff}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">{comp.organic_keywords?.toLocaleString() || "–"}</td>
                        <td className="p-3 text-center">{comp.organic_traffic?.toLocaleString() || "–"}</td>
                        <td className="p-3 text-center">{comp.backlinks?.toLocaleString() || "–"}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 justify-end">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRefresh(comp)} disabled={analyzing === comp.id}>
                              {analyzing === comp.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                              <a href={`https://${comp.domain}`} target="_blank" rel="noopener"><ExternalLink className="h-3 w-3" /></a>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(comp.id)}>
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

      {/* Charts */}
      {competitors.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Radar comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isAr ? "مقارنة شاملة" : "Overall Comparison"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                  <Radar name="Altoha" dataKey="ours" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
                  {competitors.slice(0, 3).map((c, i) => (
                    <Radar key={c.id} name={c.name} dataKey={c.name} stroke={CHART_COLORS[i + 1]} fill={CHART_COLORS[i + 1]} fillOpacity={0.1} strokeWidth={1.5} />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* DA bar chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isAr ? "مقارنة سلطة النطاق" : "Domain Authority Comparison"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={daComparison} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={55} />
                  <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="da" radius={[0, 4, 4, 0]}>
                    {daComparison.map((entry, i) => (
                      <Cell key={i} fill={entry.isOwn ? "hsl(var(--primary))" : CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
});
