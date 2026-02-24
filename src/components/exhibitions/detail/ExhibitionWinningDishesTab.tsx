import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users } from "lucide-react";

interface Props {
  winningDishes: any[];
  isAr: boolean;
}

export const ExhibitionWinningDishesTab = memo(function ExhibitionWinningDishesTab({ winningDishes, isAr }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {winningDishes.map((dish: any, i: number) => {
        const comp = dish.competition;
        const compTitle = comp ? (isAr && comp.title_ar ? comp.title_ar : comp.title) : "";
        const participantName = dish.participant?.full_name || dish.team_name || (isAr ? "متسابق" : "Contestant");
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
        return (
          <Card key={dish.id} className="overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-0.5 active:scale-[0.98]">
            {dish.dish_image_url ? (
              <div className="relative h-44 overflow-hidden">
                <img src={dish.dish_image_url} alt={dish.dish_name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-3 start-3"><Badge className="bg-chart-4/90 text-chart-4-foreground text-sm font-bold shadow-md">{medal}</Badge></div>
                <div className="absolute bottom-3 start-3 end-3"><p className="font-bold text-lg leading-tight text-white drop-shadow-md">{dish.dish_name}</p></div>
              </div>
            ) : (
              <div className="relative h-32 bg-gradient-to-br from-chart-4/20 via-chart-4/10 to-background flex items-center justify-center">
                <Trophy className="h-10 w-10 text-chart-4/30" />
                <div className="absolute top-3 start-3"><Badge className="bg-chart-4/90 text-chart-4-foreground text-sm font-bold shadow-md">{medal}</Badge></div>
                <div className="absolute bottom-3 start-3 end-3"><p className="font-bold text-lg leading-tight">{dish.dish_name}</p></div>
              </div>
            )}
            <CardContent className="p-4 space-y-2">
              {dish.dish_description && <p className="text-xs text-muted-foreground line-clamp-2">{dish.dish_description}</p>}
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center"><Users className="h-3 w-3 text-primary" /></div>
                <span className="text-sm font-medium truncate">{participantName}</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px]">{compTitle}</Badge>
                <span className="text-xs font-bold text-chart-4">{dish.totalScore.toFixed(1)} {isAr ? "نقطة" : "pts"}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});
