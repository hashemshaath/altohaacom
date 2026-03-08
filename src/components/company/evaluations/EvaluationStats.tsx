import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star, ThumbsUp, Truck, Phone, TrendingUp } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface Props {
  overallAvg: number;
  qualityAvg: number;
  deliveryAvg: number;
  communicationAvg: number;
  valueAvg: number;
  totalCount: number;
  language: string;
}

const renderStars = (rating: number) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`h-4 w-4 ${s <= Math.round(rating) ? "fill-chart-4 text-chart-4" : "text-muted-foreground/30"}`}
      />
    ))}
  </div>
);

export function EvaluationStats({ overallAvg, qualityAvg, deliveryAvg, communicationAvg, valueAvg, totalCount, language }: Props) {
  const isAr = language === "ar";

  const categories = [
    { label: isAr ? "الجودة" : "Quality", value: qualityAvg, icon: ThumbsUp, color: "text-chart-5" },
    { label: isAr ? "التسليم" : "Delivery", value: deliveryAvg, icon: Truck, color: "text-primary" },
    { label: isAr ? "التواصل" : "Communication", value: communicationAvg, icon: Phone, color: "text-chart-3" },
    { label: isAr ? "القيمة" : "Value", value: valueAvg, icon: TrendingUp, color: "text-chart-4" },
  ];

  return (
    <>
      <Card className="border-s-[3px] border-s-chart-4">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-chart-4/10">
            <Star className="h-8 w-8 fill-chart-4 text-chart-4" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{isAr ? "التقييم العام" : "Overall Rating"}</p>
            <div className="flex items-center gap-3 mt-1">
              <AnimatedCounter value={Math.round(overallAvg * 10) / 10} className="text-3xl font-bold" />
              <span className="text-muted-foreground">/5</span>
              {renderStars(overallAvg)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? `بناءً على ${totalCount} تقييم` : `Based on ${totalCount} evaluations`}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => (
          <Card key={cat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <cat.icon className={`h-4 w-4 ${cat.color}`} />
                <p className="text-sm font-medium">{cat.label}</p>
              </div>
              <div className="flex items-center justify-between mb-2">
                <AnimatedCounter value={Math.round(cat.value * 10) / 10} className="text-2xl font-bold" />
                {renderStars(cat.value)}
              </div>
              <Progress value={(cat.value / 5) * 100} className="h-1.5" />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
