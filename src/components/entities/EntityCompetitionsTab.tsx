import { Link } from "react-router-dom";
import { useEntityCompetitions } from "@/hooks/useEntities";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const participationLabels: Record<string, { en: string; ar: string }> = {
  participant: { en: "Participant", ar: "مشارك" },
  organizer: { en: "Organizer", ar: "منظم" },
  sponsor: { en: "Sponsor", ar: "راعي" },
  host: { en: "Host", ar: "مستضيف" },
  partner: { en: "Partner", ar: "شريك" },
};

interface Props {
  entityId: string;
}

export function EntityCompetitionsTab({ entityId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: participations, isLoading } = useEntityCompetitions(entityId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!participations?.length) {
    return (
      <div className="py-12 text-center">
        <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{isAr ? "لا توجد مشاركات في مسابقات بعد" : "No competition participations yet"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {participations.map(p => {
        const comp = p.competitions as any;
        if (!comp) return null;
        const name = isAr && comp.title_ar ? comp.title_ar : comp.title;
        const pLabel = participationLabels[p.participation_type] || participationLabels.participant;

        return (
          <Card key={p.id} className="transition-all hover:shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              {comp.cover_image_url ? (
                <img src={comp.cover_image_url} alt={name} className="h-14 w-20 shrink-0 rounded-md object-cover" />
              ) : (
                <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{name}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Badge variant="secondary">{isAr ? pLabel.ar : pLabel.en}</Badge>
                  <Badge variant="outline">{comp.status}</Badge>
                  {p.student_count > 0 && (
                    <Badge variant="outline">{p.student_count} {isAr ? "طالب" : "students"}</Badge>
                  )}
                </div>
                {comp.competition_start && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(comp.competition_start), "MMM d, yyyy")}
                  </p>
                )}
              </div>
              <Button size="sm" variant="ghost" asChild>
                <Link to={`/competitions/${p.competition_id}`}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
