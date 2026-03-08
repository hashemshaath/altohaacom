import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Users, Scale, Layers, Globe, Image, Building2, Shield, Gavel, Flame } from "lucide-react";
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

export const ReviewStep = memo(function ReviewStep({ data }: ReviewStepProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const totalWeight = data.criteria.reduce((sum, c) => sum + Number(c.weight), 0);
  const isBalanced = Math.abs(totalWeight - 1) < 0.01;
  const validCategories = data.categories.filter((c) => c.name.trim());
  const validCriteria = data.criteria.filter((c) => c.name.trim());

  // Fetch exhibition name if linked
  const { data: exhibition } = useQuery({
    queryKey: ["review-exhibition", data.exhibitionId],
    queryFn: async () => {
      if (!data.exhibitionId) return null;
      const { data: exh } = await supabase
        .from("exhibitions")
        .select("title, title_ar")
        .eq("id", data.exhibitionId)
        .single();
      return exh;
    },
    enabled: !!data.exhibitionId,
  });

  // Fetch type names
  const { data: types } = useQuery({
    queryKey: ["review-types", data.selectedTypeIds],
    queryFn: async () => {
      if (data.selectedTypeIds.length === 0) return [];
      const { data: t } = await supabase
        .from("competition_types")
        .select("id, name, name_ar")
        .in("id", data.selectedTypeIds);
      return t || [];
    },
    enabled: data.selectedTypeIds.length > 0,
  });

  // Fetch entity names
  const { data: entities } = useQuery({
    queryKey: ["review-entities", data.supervisingBodyIds],
    queryFn: async () => {
      if (data.supervisingBodyIds.length === 0) return [];
      const { data: e } = await supabase
        .from("culinary_entities")
        .select("id, name, name_ar, abbreviation")
        .in("id", data.supervisingBodyIds);
      return e || [];
    },
    enabled: data.supervisingBodyIds.length > 0,
  });

  return (
    <div className="space-y-4">
      {/* Exhibition Link */}
      {data.exhibitionId && exhibition && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              {isAr ? "المعرض المرتبط" : "Linked Exhibition"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{isAr && exhibition.title_ar ? exhibition.title_ar : exhibition.title}</p>
          </CardContent>
        </Card>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {isAr ? "المعلومات الأساسية" : "Basic Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            {data.coverImageUrl && (
              <img src={data.coverImageUrl} alt="" className="h-16 w-24 flex-shrink-0 rounded-md object-cover" />
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
              {isAr ? "العنوان مطلوب" : "Title is required"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Types */}
      {types && types.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="h-4 w-4 text-primary" />
              {isAr ? "أنواع المسابقة" : "Competition Types"} ({types.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {types.map((type) => (
                <Badge key={type.id} variant="secondary">
                  {isAr && type.name_ar ? type.name_ar : type.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            {isAr ? "الجدول والموقع" : "Schedule & Location"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">{isAr ? "التسجيل" : "Registration"}</p>
              <p>{formatDate(data.registrationStart)} → {formatDate(data.registrationEnd)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{isAr ? "المسابقة" : "Competition"}</p>
              <p>{formatDate(data.competitionStart)} → {formatDate(data.competitionEnd)}</p>
            </div>
          </div>

          <Separator className="my-3" />

          <div className="flex flex-wrap items-center gap-2 text-sm">
            {data.isVirtual ? (
              <Badge variant="secondary">
                <Globe className="me-1 h-3 w-3" />
                {isAr ? "افتراضية" : "Virtual"}
              </Badge>
            ) : (
              data.venue && (
                <Badge variant="secondary">
                  <MapPin className="me-1 h-3 w-3" />
                  {data.venue}{data.city ? `, ${data.city}` : ""}
                </Badge>
              )
            )}
            {data.countryCode && (
              <Badge variant="outline">{data.countryCode} · {data.editionYear}</Badge>
            )}
            {data.maxParticipants && (
              <Badge variant="outline">
                <Users className="me-1 h-3 w-3" />
                {isAr ? `${data.maxParticipants} مشارك كحد أقصى` : `Max ${data.maxParticipants}`}
              </Badge>
            )}
          </div>

          {(!data.competitionStart || !data.competitionEnd) && (
            <p className="mt-2 text-sm text-destructive">
              {isAr ? "تواريخ المسابقة مطلوبة" : "Competition dates are required"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Supervising Bodies */}
      {entities && entities.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              {isAr ? "الجهات المشرفة" : "Supervising Bodies"} ({entities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {entities.map((e) => (
                <Badge key={e.id} variant="secondary">
                  {isAr && e.name_ar ? e.name_ar : e.name}
                  {e.abbreviation && ` (${e.abbreviation})`}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Judges */}
      {data.judgeIds.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gavel className="h-4 w-4 text-primary" />
              {isAr ? "لجنة التحكيم" : "Judging Panel"} ({data.judgeIds.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {isAr
                ? `${data.judgeIds.length} حكام تم اختيارهم. سيتم إرسال الدعوات بعد الإنشاء.`
                : `${data.judgeIds.length} judges selected. Invitations will be sent after creation.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Categories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4" />
            {isAr ? "الفئات" : "Categories"} ({validCategories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validCategories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {validCategories.map((cat, i) => (
                <Badge key={i} variant="secondary">
                  {isAr && cat.name_ar ? cat.name_ar : cat.name}
                  {cat.max_participants ? ` (${cat.max_participants})` : ""}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-destructive">
              {isAr ? "مطلوب فئة واحدة على الأقل" : "At least one category is required"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Criteria */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-4 w-4" />
            {isAr ? "معايير التحكيم" : "Judging Criteria"} ({validCriteria.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validCriteria.length > 0 ? (
            <div className="space-y-2">
              {validCriteria.map((crit, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{isAr && crit.name_ar ? crit.name_ar : crit.name}</span>
                  <span className="text-muted-foreground">
                    {isAr ? "الأقصى" : "Max"}: {crit.max_score} · {(Number(crit.weight) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between text-sm font-medium">
                <span>{isAr ? "إجمالي الأوزان" : "Total Weight"}</span>
                <span className={isBalanced ? "text-primary" : "text-destructive"}>
                  {Math.round(totalWeight * 100)}%
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-destructive">
              {isAr ? "مطلوب معيار واحد على الأقل" : "At least one criterion is required"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
