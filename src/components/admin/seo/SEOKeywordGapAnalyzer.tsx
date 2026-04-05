import { useState, memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Target, Sparkles, TrendingUp, Lightbulb, Search, BookOpen, Loader2, Zap, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CHART_COLORS } from "@/lib/chartConfig";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis,
} from "recharts";

interface TrackedKeyword {
  id: string;
  keyword: string;
  target_page: string | null;
  current_position: number | null;
  impressions?: number | null;
  clicks?: number | null;
  ctr?: number | null;
  search_volume?: number | null;
}

interface GapOpportunity {
  keyword: string;
  type: "quick_win" | "low_hanging" | "content_gap" | "expansion";
  currentPos: number | null;
  estimatedTraffic: number;
  difficulty: "easy" | "medium" | "hard";
  suggestedAction: string;
  suggestedActionAr: string;
  priority: number;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];

const TYPE_LABELS = {
  quick_win: { en: "Quick Win", ar: "فوز سريع", color: "text-green-500", icon: Zap },
  low_hanging: { en: "Low Hanging", ar: "سهل التحقيق", color: "text-chart-1", icon: Target },
  content_gap: { en: "Content Gap", ar: "فجوة محتوى", color: "text-amber-500", icon: BookOpen },
  expansion: { en: "Expansion", ar: "توسع", color: "text-chart-3", icon: TrendingUp },
};

export const SEOKeywordGapAnalyzer = memo(function SEOKeywordGapAnalyzer({ isAr }: { isAr: boolean }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [aiOpportunities, setAiOpportunities] = useState<GapOpportunity[] | null>(null);

  const { data: keywords = [] } = useQuery({
    queryKey: ["seo-tracked-keywords"],
    queryFn: async () => {
      const { data } = await supabase.from("seo_tracked_keywords").select("*").order("current_position", { ascending: true });
      return (data || []) as unknown as TrackedKeyword[];
    },
  });

  // Auto-detect opportunities from existing keyword data
  const autoOpportunities = useMemo((): GapOpportunity[] => {
    const ops: GapOpportunity[] = [];

    keywords.forEach(kw => {
      const pos = kw.current_position;
      const impressions = kw.impressions || 0;
      const clicks = kw.clicks || 0;
      const ctr = kw.ctr || 0;

      // Quick wins: ranking 4-10, high impressions
      if (pos && pos >= 4 && pos <= 10 && impressions > 50) {
        ops.push({
          keyword: kw.keyword,
          type: "quick_win",
          currentPos: pos,
          estimatedTraffic: Math.round(impressions * 0.15),
          difficulty: "easy",
          priority: 95 - pos,
          suggestedAction: `Optimize on-page SEO to move from #${pos} to top 3. Add internal links, improve meta title.`,
          suggestedActionAr: `حسّن SEO للصفحة للانتقال من #${pos} إلى أفضل 3. أضف روابط داخلية وحسّن العنوان.`,
        });
      }

      // Low hanging: ranking 11-20
      if (pos && pos >= 11 && pos <= 20) {
        ops.push({
          keyword: kw.keyword,
          type: "low_hanging",
          currentPos: pos,
          estimatedTraffic: Math.round(impressions * 0.05),
          difficulty: "medium",
          priority: 80 - pos,
          suggestedAction: `Currently page 2 (#${pos}). Create supporting content and build internal links to target page.`,
          suggestedActionAr: `حالياً في الصفحة الثانية (#${pos}). أنشئ محتوى داعم وروابط داخلية.`,
        });
      }

      // High impressions, low CTR
      if (impressions > 100 && ctr < 2) {
        ops.push({
          keyword: kw.keyword,
          type: "content_gap",
          currentPos: pos,
          estimatedTraffic: Math.round(impressions * 0.08),
          difficulty: "easy",
          priority: 85,
          suggestedAction: `High impressions (${impressions}) but CTR only ${ctr}%. Rewrite meta title & description to be more compelling.`,
          suggestedActionAr: `ظهور عالي (${impressions}) لكن CTR فقط ${ctr}%. أعد كتابة العنوان والوصف ليكونا أكثر جاذبية.`,
        });
      }
    });

    // Sort by priority
    return ops.sort((a, b) => b.priority - a.priority);
  }, [keywords]);

  // AI-powered analysis
  const handleAIAnalysis = async () => {
    setAnalyzing(true);
    try {
      const keywordSummary = keywords.slice(0, 20).map(k => ({
        keyword: k.keyword,
        position: k.current_position,
        impressions: k.impressions,
        clicks: k.clicks,
        ctr: k.ctr,
      }));

      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: [{
            role: "user",
            content: `You are an SEO keyword gap analyst for a culinary/food industry platform called "Altoha". Analyze these tracked keywords and identify 5-8 NEW keyword opportunities we should target. For each, provide: keyword, type (quick_win/low_hanging/content_gap/expansion), estimatedTraffic (number), difficulty (easy/medium/hard), and suggestedAction (brief strategy).

Current keywords data:
${JSON.stringify(keywordSummary, null, 2)}

The platform covers: cooking competitions, recipes, chef profiles, culinary education, restaurant reviews, food industry jobs, and culinary events in the Middle East.

Return ONLY valid JSON array of objects with fields: keyword, type, estimatedTraffic, difficulty, suggestedAction, suggestedActionAr (Arabic translation of action).`,
          }],
          model: "google/gemini-2.5-flash",
        },
      });
      if (error) throw error;

      const content = data?.choices?.[0]?.message?.content || data?.content || "";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAiOpportunities(parsed.map((o, i) => ({
          ...o,
          currentPos: null,
          priority: 90 - i * 5,
        })));
      }
    } catch (e: unknown) {
      console.error("AI analysis failed:", e);
    } finally {
      setAnalyzing(false);
    }
  };

  const allOpportunities = [...autoOpportunities, ...(aiOpportunities || [])].sort((a, b) => b.priority - a.priority);

  // Position distribution for scatter plot
  const positionData = useMemo(() =>
    keywords
      .filter(k => k.current_position && k.impressions)
      .map(k => ({
        keyword: k.keyword,
        position: k.current_position!,
        impressions: k.impressions!,
        clicks: k.clicks || 0,
      }))
  , [keywords]);

  // Opportunity type breakdown
  const typeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    allOpportunities.forEach(o => { counts[o.type] = (counts[o.type] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ type, count, label: isAr ? TYPE_LABELS[type as keyof typeof TYPE_LABELS]?.ar : TYPE_LABELS[type as keyof typeof TYPE_LABELS]?.en }));
  }, [allOpportunities, isAr]);

  return (
    <div className="space-y-4">
      {/* Header with AI trigger */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            {isAr ? "محلل فجوات الكلمات المفتاحية" : "Keyword Gap Analyzer"}
          </h3>
          <p className="text-xs text-muted-foreground">{isAr ? "اكتشف فرص التصنيف المخفية" : "Discover hidden ranking opportunities"}</p>
        </div>
        <Button onClick={handleAIAnalysis} disabled={analyzing} size="sm" className="gap-1.5">
          {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {isAr ? "تحليل AI" : "AI Analysis"}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isAr ? "فرص مكتشفة" : "Opportunities Found", value: allOpportunities.length, icon: Lightbulb, color: "text-primary" },
          { label: isAr ? "فوز سريع" : "Quick Wins", value: allOpportunities.filter(o => o.type === "quick_win").length, icon: Zap, color: "text-green-500" },
          { label: isAr ? "حركة مُقدرة" : "Est. Traffic Gain", value: allOpportunities.reduce((s, o) => s + o.estimatedTraffic, 0), icon: Eye, color: "text-chart-1" },
          { label: isAr ? "كلمات مُتتبعة" : "Tracked Keywords", value: keywords.length, icon: Search, color: "text-chart-2" },
        ].map(m => (
          <Card key={m.label}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted ${m.color}`}>
                <m.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
                <p className="text-lg font-bold">{m.value.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Position vs Impressions scatter */}
      {positionData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "الموقع مقابل الظهور" : "Position vs Impressions"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="position" name="Position" type="number" reversed tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} label={{ value: isAr ? "الموقع" : "Position", position: "bottom", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis dataKey="impressions" name="Impressions" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <ZAxis dataKey="clicks" range={[30, 200]} name="Clicks" />
                <RechartsTooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: any, name: string) => [value, name]}
                  labelFormatter={(label) => `#${label}`}
                />
                <Scatter data={positionData} fill="hsl(var(--primary))" fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Opportunity type breakdown */}
      {typeBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "توزيع الفرص" : "Opportunity Breakdown"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={typeBreakdown} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {typeBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Opportunities list */}
      {allOpportunities.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{isAr ? "الفرص المُكتشفة" : "Discovered Opportunities"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {allOpportunities.slice(0, 15).map((op, i) => {
              const typeInfo = TYPE_LABELS[op.type];
              const Icon = typeInfo?.icon || Lightbulb;
              return (
                <div key={`${op.keyword}-${i}`} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/30">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background ${typeInfo?.color || "text-primary"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{op.keyword}</p>
                      <Badge variant="secondary" className="text-[8px]">{isAr ? typeInfo?.ar : typeInfo?.en}</Badge>
                      <Badge variant={op.difficulty === "easy" ? "default" : op.difficulty === "medium" ? "secondary" : "destructive"} className="text-[8px]">
                        {op.difficulty}
                      </Badge>
                      {op.currentPos && <span className="text-[10px] text-muted-foreground">#{op.currentPos}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{isAr ? op.suggestedActionAr : op.suggestedAction}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> ~{op.estimatedTraffic.toLocaleString()} {isAr ? "زيارة/شهر" : "visits/mo"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {allOpportunities.length === 0 && !analyzing && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Target className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">{isAr ? "لا توجد فرص مكتشفة بعد" : "No opportunities found yet"}</p>
            <p className="text-xs text-muted-foreground mt-1">{isAr ? "أضف كلمات مفتاحية في تبويب Keywords أولاً، أو اضغط تحليل AI" : "Add keywords in the Keywords tab first, or run AI Analysis"}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
