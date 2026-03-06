import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, Merge, ExternalLink, Loader2, X } from "lucide-react";
import type { DupCandidate } from "@/hooks/useEntityDedup";

const TABLE_LABELS: Record<string, { en: string; ar: string }> = {
  organizers: { en: "Organizer", ar: "منظم" },
  companies: { en: "Company", ar: "شركة" },
  culinary_entities: { en: "Entity", ar: "كيان" },
  establishments: { en: "Establishment", ar: "منشأة" },
  exhibitions: { en: "Exhibition", ar: "معرض" },
};

interface DeduplicationPanelProps {
  duplicates: DupCandidate[];
  checking: boolean;
  onMerge?: (candidateId: string, tableName: string) => void;
  onDismiss?: () => void;
  compact?: boolean;
}

export const DeduplicationPanel = memo(function DeduplicationPanel({
  duplicates, checking, onMerge, onDismiss, compact = false,
}: DeduplicationPanelProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (checking) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl border border-primary/20 bg-primary/5 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>{isAr ? "جاري فحص التكرارات..." : "Checking for duplicates..."}</span>
      </div>
    );
  }

  if (!duplicates.length) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-destructive/10 text-destructive border-destructive/30";
    if (score >= 50) return "bg-orange-500/10 text-orange-600 border-orange-500/30";
    return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
  };

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className={compact ? "p-3 space-y-2" : "p-4 space-y-3"}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-semibold">
              {isAr
                ? `⚠️ تم العثور على ${duplicates.length} تطابق محتمل`
                : `⚠️ ${duplicates.length} potential match${duplicates.length > 1 ? 'es' : ''} found`}
            </span>
          </div>
          {onDismiss && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDismiss}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {duplicates.map((dup) => (
          <div
            key={`${dup.table_name}-${dup.record.id}`}
            className="flex items-center gap-3 p-2.5 rounded-xl border bg-background/80"
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={dup.record.logo_url || ""} />
              <AvatarFallback className="text-[10px]">
                {dup.record.name?.slice(0, 2)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-medium truncate">{dup.record.name}</span>
                {dup.record.name_ar && (
                  <span className="text-xs text-muted-foreground truncate">({dup.record.name_ar})</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className="text-[9px] h-4">
                  {TABLE_LABELS[dup.table_name]?.[isAr ? "ar" : "en"] || dup.table_name}
                </Badge>
                {dup.record.identifier && (
                  <Badge variant="secondary" className="text-[9px] h-4 font-mono">
                    {dup.record.identifier}
                  </Badge>
                )}
                {dup.record.city && (
                  <span className="text-[10px] text-muted-foreground">{dup.record.city}</span>
                )}
              </div>
              {!compact && (
                <div className="flex gap-1 flex-wrap mt-1">
                  {dup.reasons.map((r, i) => (
                    <span key={i} className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Badge className={`text-[10px] h-5 ${getScoreColor(dup.score)}`}>
                {Math.round(dup.score)}%
              </Badge>
              {onMerge && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => onMerge(dup.record.id, dup.table_name)}
                >
                  <Merge className="h-3 w-3" />
                  {isAr ? "دمج" : "Merge"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});
