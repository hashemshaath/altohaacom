import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star, TrendingUp, Award, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  overallScore: number;
  maxScore: number;
  evaluatorCount: number;
  criteriaCount: number;
  categoryScores: Array<{ name: string; score: number; weight: number }>;
  isAr?: boolean;
}

function getScoreColor(score: number, max: number): string {
  const pct = (score / max) * 100;
  if (pct >= 80) return "text-chart-5";
  if (pct >= 60) return "text-chart-4";
  if (pct >= 40) return "text-primary";
  return "text-destructive";
}

function getScoreLabel(score: number, max: number, isAr?: boolean): string {
  const pct = (score / max) * 100;
  if (pct >= 90) return isAr ? "استثنائي" : "Exceptional";
  if (pct >= 80) return isAr ? "ممتاز" : "Excellent";
  if (pct >= 70) return isAr ? "جيد جداً" : "Very Good";
  if (pct >= 60) return isAr ? "جيد" : "Good";
  if (pct >= 50) return isAr ? "مقبول" : "Acceptable";
  return isAr ? "يحتاج تحسين" : "Needs Improvement";
}

export const EvaluationScoreCard = memo(function EvaluationScoreCard({ overallScore, maxScore, evaluatorCount, criteriaCount, categoryScores, isAr }: Props) {
  const pct = (overallScore / maxScore) * 100;

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <Card className="border-s-4 border-s-primary">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${pct * 2.64} 264`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black">{overallScore.toFixed(1)}</span>
                <span className="text-[10px] text-muted-foreground">/{maxScore}</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className={`${getScoreColor(overallScore, maxScore)} font-bold`}>
                  {getScoreLabel(overallScore, maxScore, isAr)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {isAr ? "التقييم الشامل" : "Overall Evaluation Score"}
              </p>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {evaluatorCount} {isAr ? "مقيّم" : "evaluators"}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" />
                  {criteriaCount} {isAr ? "معيار" : "criteria"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid gap-3 sm:grid-cols-2">
        {categoryScores.map(cat => (
          <Card key={cat.name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{cat.name}</p>
                <span className="text-xs text-muted-foreground">{cat.weight}%</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-xl font-black ${getScoreColor(cat.score, 10)}`}>
                  {cat.score.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">/10</span>
              </div>
              <Progress value={cat.score * 10} className="h-1.5" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});
