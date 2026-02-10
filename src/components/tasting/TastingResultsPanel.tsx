import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { TastingEntry, TastingCriterion, TastingScore, EvalMethod } from "@/hooks/useTasting";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Trophy, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface Props {
  entries: TastingEntry[];
  criteria: TastingCriterion[];
  scores: TastingScore[];
  evalMethod: EvalMethod;
}

export function TastingResultsPanel({ entries, criteria, scores, evalMethod }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const rankings = useMemo(() => {
    return entries.map(entry => {
      const entryScores = scores.filter(s => s.entry_id === entry.id);
      let total = 0;
      let count = 0;

      criteria.forEach(crit => {
        const critScores = entryScores.filter(s => s.criterion_id === crit.id);
        critScores.forEach(s => {
          if (evalMethod === "numeric" && s.score != null) {
            total += Number(s.score) * crit.weight;
            count++;
          } else if (evalMethod === "stars" && s.stars != null) {
            total += Number(s.stars) * crit.weight;
            count++;
          } else if (evalMethod === "pass_fail" && s.passed != null) {
            total += s.passed ? crit.weight : 0;
            count++;
          }
        });
      });

      const avg = count > 0 ? total / count : 0;
      return {
        id: entry.id,
        name: isAr && entry.dish_name_ar ? entry.dish_name_ar : entry.dish_name,
        chef: isAr && entry.chef_name_ar ? entry.chef_name_ar : entry.chef_name,
        total: Math.round(avg * 100) / 100,
        scoreCount: entryScores.length,
      };
    }).sort((a, b) => b.total - a.total);
  }, [entries, criteria, scores, evalMethod, isAr]);

  const radarData = useMemo(() => {
    if (entries.length === 0 || criteria.length < 3) return null;
    const topEntries = rankings.slice(0, 3);
    return criteria.map(crit => {
      const row: any = { criterion: isAr && crit.name_ar ? crit.name_ar : crit.name };
      topEntries.forEach(entry => {
        const entryScores = scores.filter(s => s.entry_id === entry.id && s.criterion_id === crit.id);
        let avg = 0;
        if (entryScores.length > 0) {
          const vals = entryScores.map(s =>
            evalMethod === "numeric" ? Number(s.score ?? 0) :
            evalMethod === "stars" ? Number(s.stars ?? 0) :
            s.passed ? 1 : 0
          );
          avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        }
        row[entry.name] = Math.round(avg * 10) / 10;
      });
      return row;
    });
  }, [rankings, criteria, scores, evalMethod, entries, isAr]);

  if (scores.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BarChart3 className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">{isAr ? "لا توجد نتائج بعد" : "No results yet"}</p>
        </CardContent>
      </Card>
    );
  }

  const medalColors = ["text-chart-4", "text-muted-foreground", "text-chart-3"];

  return (
    <div className="space-y-6">
      {/* Rankings */}
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Trophy className="h-4 w-4 text-primary" />
            {isAr ? "الترتيب العام" : "Overall Rankings"}
          </h3>
        </div>
        <CardContent className="p-0">
          <div className="divide-y">
            {rankings.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${i < 3 ? "bg-primary/10" : "bg-muted"}`}>
                  {i < 3 ? <Award className={`h-4 w-4 ${medalColors[i]}`} /> : <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  {r.chef && <p className="text-xs text-muted-foreground">{r.chef}</p>}
                </div>
                <div className="text-end">
                  <p className="text-lg font-bold">{r.total}</p>
                  <p className="text-xs text-muted-foreground">{r.scoreCount} {isAr ? "تقييم" : "scores"}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-4 w-4 text-primary" />
            {isAr ? "مقارنة الدرجات" : "Score Comparison"}
          </h3>
        </div>
        <CardContent className="p-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankings}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Radar Chart for top 3 */}
      {radarData && rankings.length >= 2 && (
        <Card className="overflow-hidden">
          <div className="border-b bg-muted/30 px-4 py-3">
            <h3 className="text-sm font-semibold">{isAr ? "مقارنة تفصيلية (أفضل 3)" : "Detailed Comparison (Top 3)"}</h3>
          </div>
          <CardContent className="p-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis />
                  {rankings.slice(0, 3).map((entry, i) => (
                    <Radar
                      key={entry.id}
                      name={entry.name}
                      dataKey={entry.name}
                      stroke={`hsl(var(--chart-${i + 1}))`}
                      fill={`hsl(var(--chart-${i + 1}))`}
                      fillOpacity={0.15}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
