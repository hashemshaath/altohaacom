import { useEntityPrograms, useEnrollInProgram, useMyEnrollments } from "@/hooks/useEntities";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Calendar, Clock, DollarSign, Users, GraduationCap } from "lucide-react";
import { format } from "date-fns";

const programTypeLabels: Record<string, { en: string; ar: string }> = {
  diploma: { en: "Diploma", ar: "دبلوم" },
  degree: { en: "Degree", ar: "درجة علمية" },
  certificate: { en: "Certificate", ar: "شهادة" },
  course: { en: "Course", ar: "دورة" },
  workshop: { en: "Workshop", ar: "ورشة عمل" },
  bootcamp: { en: "Bootcamp", ar: "معسكر تدريبي" },
  apprenticeship: { en: "Apprenticeship", ar: "تدريب مهني" },
};

const levelLabels: Record<string, { en: string; ar: string }> = {
  beginner: { en: "Beginner", ar: "مبتدئ" },
  intermediate: { en: "Intermediate", ar: "متوسط" },
  advanced: { en: "Advanced", ar: "متقدم" },
  professional: { en: "Professional", ar: "احترافي" },
  bachelor: { en: "Bachelor", ar: "بكالوريوس" },
  master: { en: "Master", ar: "ماجستير" },
  doctorate: { en: "Doctorate", ar: "دكتوراه" },
};

interface Props {
  entityId: string;
}

export function EntityProgramsTab({ entityId }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const { data: programs, isLoading } = useEntityPrograms(entityId);
  const { data: myEnrollments } = useMyEnrollments();
  const enrollMutation = useEnrollInProgram();

  const enrolledProgramIds = new Set(myEnrollments?.map(e => e.program_id) || []);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map(i => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!programs?.length) {
    return (
      <div className="py-12 text-center">
        <GraduationCap className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{isAr ? "لا توجد برامج متاحة حالياً" : "No programs available yet"}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {programs.map(program => {
        const name = isAr && program.name_ar ? program.name_ar : program.name;
        const desc = isAr && program.description_ar ? program.description_ar : program.description;
        const typeLabel = programTypeLabels[program.program_type];
        const lvlLabel = program.level ? levelLabels[program.level] : null;
        const isEnrolled = enrolledProgramIds.has(program.id);

        return (
          <Card key={program.id} className="overflow-hidden transition-all hover:shadow-md">
            {program.image_url && (
              <img src={program.image_url} alt={name} className="h-36 w-full object-cover" />
            )}
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{name}</CardTitle>
                {program.is_featured && <Badge className="bg-chart-4/20 text-chart-4 shrink-0">★</Badge>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {typeLabel && <Badge variant="secondary">{isAr ? typeLabel.ar : typeLabel.en}</Badge>}
                {lvlLabel && <Badge variant="outline">{isAr ? lvlLabel.ar : lvlLabel.en}</Badge>}
                <Badge variant={program.status === "open" ? "default" : "secondary"}>{program.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {desc && <p className="line-clamp-2 text-sm text-muted-foreground">{desc}</p>}
              
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                {program.duration_months && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {program.duration_months} {isAr ? "شهر" : "months"}
                  </div>
                )}
                {program.max_students && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {isAr ? "الحد الأقصى" : "Max"} {program.max_students}
                  </div>
                )}
                {program.start_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(program.start_date), "MMM d, yyyy")}
                  </div>
                )}
                {program.tuition_fee && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {program.tuition_fee} {program.currency}
                  </div>
                )}
              </div>

              {user && program.status === "open" && (
                <Button
                  size="sm"
                  className="w-full"
                  variant={isEnrolled ? "outline" : "default"}
                  disabled={isEnrolled || enrollMutation.isPending}
                  onClick={() => enrollMutation.mutate(program.id)}
                >
                  <BookOpen className="me-2 h-4 w-4" />
                  {isEnrolled ? (isAr ? "مسجل" : "Enrolled") : (isAr ? "سجل الآن" : "Enroll Now")}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
