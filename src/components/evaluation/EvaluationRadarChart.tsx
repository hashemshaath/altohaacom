import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  title: string;
  data: Array<{ name: string; score: number; maxScore: number; fullMark: number }>;
  evaluatorData?: Array<{ name: string; scores: Array<{ name: string; score: number }> }>;
  isAr?: boolean;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function EvaluationRadarChart({ title, data, evaluatorData, isAr }: Props) {
  if (!data.length) return null;

  // If multiple evaluators, overlay their radars
  if (evaluatorData && evaluatorData.length > 0) {
    const chartData = data.map(d => {
      const point: any = { criterion: d.name, fullMark: d.fullMark };
      evaluatorData.forEach(ev => {
        const found = ev.scores.find(s => s.name === d.name);
        point[ev.name] = found?.score || 0;
      });
      // Average
      point["average"] = d.score;
      return point;
    });

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis 
                dataKey="criterion" 
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} 
              />
              <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
              <Radar
                name={isAr ? "المتوسط" : "Average"}
                dataKey="average"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              {evaluatorData.map((ev, i) => (
                <Radar
                  key={ev.name}
                  name={ev.name}
                  dataKey={ev.name}
                  stroke={COLORS[(i + 1) % COLORS.length]}
                  fill={COLORS[(i + 1) % COLORS.length]}
                  fillOpacity={0.05}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              ))}
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  // Single radar (average)
  const chartData = data.map(d => ({
    criterion: d.name,
    score: d.score,
    fullMark: d.fullMark,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis 
              dataKey="criterion" 
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} 
            />
            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
            <Radar
              name={isAr ? "التقييم" : "Score"}
              dataKey="score"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
