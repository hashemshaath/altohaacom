import { memo } from "react";
import { useEntityDegrees } from "@/hooks/useEntities";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, ShieldCheck, Calendar } from "lucide-react";
import { format } from "date-fns";

const degreeTypeLabels: Record<string, { en: string; ar: string }> = {
  diploma: { en: "Diploma", ar: "دبلوم" },
  certificate: { en: "Certificate", ar: "شهادة" },
  associate: { en: "Associate", ar: "مشارك" },
  bachelor: { en: "Bachelor", ar: "بكالوريوس" },
  master: { en: "Master", ar: "ماجستير" },
  doctorate: { en: "Doctorate", ar: "دكتوراه" },
  professional_cert: { en: "Professional Certificate", ar: "شهادة مهنية" },
  workshop_cert: { en: "Workshop Certificate", ar: "شهادة ورشة عمل" },
};

interface Props {
  entityId: string;
}

export const EntityDegreesTab = memo(function EntityDegreesTab({ entityId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: degrees, isLoading } = useEntityDegrees(entityId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!degrees?.length) {
    return (
      <div className="py-12 text-center">
        <Award className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{isAr ? "لا توجد شهادات بعد" : "No degrees/qualifications yet"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {degrees.map(d => {
        const name = isAr && d.degree_name_ar ? d.degree_name_ar : d.degree_name;
        const field = isAr && d.field_of_study_ar ? d.field_of_study_ar : d.field_of_study;
        const typeLabel = degreeTypeLabels[d.degree_type];

        return (
          <Card key={d.id} className="transition-all hover:shadow-sm">
            <CardContent className="flex items-start gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20">
                <Award className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{name}</span>
                  {d.is_verified && (
                    <Badge className="bg-chart-3/20 text-chart-3 gap-1">
                      <ShieldCheck className="h-3 w-3" />{isAr ? "موثق" : "Verified"}
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {typeLabel && <Badge variant="secondary">{isAr ? typeLabel.ar : typeLabel.en}</Badge>}
                  {field && <Badge variant="outline">{field}</Badge>}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                  {d.graduation_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(d.graduation_date), "MMM yyyy")}
                    </span>
                  )}
                  {d.gpa && <span>GPA: {d.gpa}</span>}
                  {d.honors && <span>{d.honors}</span>}
                  {d.certificate_number && <span className="font-mono">#{d.certificate_number}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
