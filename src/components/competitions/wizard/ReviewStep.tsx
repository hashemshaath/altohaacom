import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Users, Scale, Layers, Globe, Image } from "lucide-react";
import { format } from "date-fns";
import type { CompetitionFormData } from "./types";

interface ReviewStepProps {
  data: CompetitionFormData;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "PPp");
  } catch {
    return dateStr;
  }
}

export function ReviewStep({ data }: ReviewStepProps) {
  const { language } = useLanguage();
  const totalWeight = data.criteria.reduce((sum, c) => sum + Number(c.weight), 0);
  const isBalanced = Math.abs(totalWeight - 1) < 0.01;
  const validCategories = data.categories.filter((c) => c.name.trim());
  const validCriteria = data.criteria.filter((c) => c.name.trim());

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {language === "ar" ? "المعلومات الأساسية" : "Basic Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            {data.coverImageUrl && (
              <img
                src={data.coverImageUrl}
                alt=""
                className="h-16 w-24 flex-shrink-0 rounded-md object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">{data.title || "Untitled"}</h3>
              {data.titleAr && <p className="text-sm text-muted-foreground" dir="rtl">{data.titleAr}</p>}
              {data.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{data.description}</p>
              )}
            </div>
          </div>
          {!data.title && (
            <p className="text-sm text-destructive">
              {language === "ar" ? "العنوان مطلوب" : "Title is required"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            {language === "ar" ? "الجدول والموقع" : "Schedule & Location"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">
                {language === "ar" ? "التسجيل" : "Registration"}
              </p>
              <p>{formatDate(data.registrationStart)} → {formatDate(data.registrationEnd)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">
                {language === "ar" ? "المسابقة" : "Competition"}
              </p>
              <p>{formatDate(data.competitionStart)} → {formatDate(data.competitionEnd)}</p>
            </div>
          </div>

          <Separator className="my-3" />

          <div className="flex flex-wrap items-center gap-2 text-sm">
            {data.isVirtual ? (
              <Badge variant="secondary">
                <Globe className="mr-1 h-3 w-3" />
                {language === "ar" ? "افتراضية" : "Virtual"}
              </Badge>
            ) : (
              data.venue && (
                <Badge variant="secondary">
                  <MapPin className="mr-1 h-3 w-3" />
                  {data.venue}{data.city ? `, ${data.city}` : ""}
                </Badge>
              )
            )}
            {data.countryCode && (
              <Badge variant="outline">{data.countryCode} · {data.editionYear}</Badge>
            )}
            {data.maxParticipants && (
              <Badge variant="outline">
                <Users className="mr-1 h-3 w-3" />
                {language === "ar" ? `${data.maxParticipants} مشارك كحد أقصى` : `Max ${data.maxParticipants}`}
              </Badge>
            )}
          </div>

          {(!data.competitionStart || !data.competitionEnd) && (
            <p className="mt-2 text-sm text-destructive">
              {language === "ar" ? "تواريخ المسابقة مطلوبة" : "Competition dates are required"}
            </p>
          )}
          {data.countryCode.length !== 2 && (
            <p className="mt-1 text-sm text-destructive">
              {language === "ar" ? "رمز الدولة مطلوب (حرفين)" : "Country code required (2 letters)"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4" />
            {language === "ar" ? "الفئات" : "Categories"} ({validCategories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validCategories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {validCategories.map((cat, i) => (
                <Badge key={i} variant="secondary">
                  {language === "ar" && cat.name_ar ? cat.name_ar : cat.name}
                  {cat.max_participants ? ` (${cat.max_participants})` : ""}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-destructive">
              {language === "ar" ? "مطلوب فئة واحدة على الأقل" : "At least one category is required"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Criteria */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-4 w-4" />
            {language === "ar" ? "معايير التحكيم" : "Judging Criteria"} ({validCriteria.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validCriteria.length > 0 ? (
            <div className="space-y-2">
              {validCriteria.map((crit, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{language === "ar" && crit.name_ar ? crit.name_ar : crit.name}</span>
                  <span className="text-muted-foreground">
                    {language === "ar" ? "الأقصى" : "Max"}: {crit.max_score} · {(Number(crit.weight) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between text-sm font-medium">
                <span>{language === "ar" ? "إجمالي الأوزان" : "Total Weight"}</span>
                <span className={isBalanced ? "text-primary" : "text-destructive"}>
                  {Math.round(totalWeight * 100)}%
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-destructive">
              {language === "ar" ? "مطلوب معيار واحد على الأقل" : "At least one criterion is required"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
