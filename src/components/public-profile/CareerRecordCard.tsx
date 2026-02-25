import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
import { memo } from "react";

interface CareerRecordCardProps {
  record: any;
  icon: any;
  iconBg: string;
  iconColor: string;
  isAr: boolean;
  pickText: (ar?: string | null, en?: string | null) => string;
  formatRange: (start: string | null, end: string | null, isCurrent: boolean) => string;
  extraBadges?: { label: string; className?: string }[];
}

export const CareerRecordCard = memo(function CareerRecordCard({
  record, icon: Icon, iconBg, iconColor, isAr, pickText, formatRange, extraBadges,
}: CareerRecordCardProps) {
  const title = pickText(record.title_ar, record.title);
  const entity = pickText(record.entity_name_ar, record.entity_name);
  const desc = pickText(record.description_ar, record.description);
  const period = formatRange(record.start_date, record.end_date, !!record.is_current);

  return (
    <Card className="rounded-2xl border-border/25 hover:shadow-md transition-all duration-300 hover:border-border/40 hover:-translate-y-0.5 group/card">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg} group-hover/card:scale-110 transition-transform duration-300`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm">{title || "—"}</h4>
              {record.is_current && (
                <Badge className="bg-chart-3/10 text-chart-3 text-[10px] h-5">
                  {isAr ? "مستمر" : "Ongoing"}
                </Badge>
              )}
            </div>
            {entity && (
              record.entity_id ? (
                <Link to={`/entities/${record.entity_id}`} className="text-xs text-primary font-medium hover:underline flex items-center gap-1 mt-0.5">
                  {entity}<ExternalLink className="h-2.5 w-2.5" />
                </Link>
              ) : <p className="text-xs text-muted-foreground mt-0.5">{entity}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-muted-foreground">
              {period && (
                <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{period}</span>
              )}
              {record.employment_type && (
                <Badge variant="outline" className="text-[9px] h-4">{record.employment_type}</Badge>
              )}
              {record.education_level && (
                <Badge variant="outline" className="text-[9px] h-4">{record.education_level}</Badge>
              )}
              {pickText(record.field_of_study_ar, record.field_of_study) && (
                <span>{pickText(record.field_of_study_ar, record.field_of_study)}</span>
              )}
              {record.location && (
                <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{record.location}</span>
              )}
              {extraBadges?.map((b, i) => (
                <Badge key={i} variant="outline" className={`text-[9px] h-4 ${b.className || ""}`}>{b.label}</Badge>
              ))}
            </div>
            {desc && (
              <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed" dir={isAr ? "rtl" : "ltr"}>
                {desc}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
