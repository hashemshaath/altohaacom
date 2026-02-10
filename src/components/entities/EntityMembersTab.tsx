import { useEntityMemberships } from "@/hooks/useEntities";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, GraduationCap, Briefcase } from "lucide-react";
import { format } from "date-fns";

const membershipTypeLabels: Record<string, { en: string; ar: string; icon: any }> = {
  member: { en: "Member", ar: "عضو", icon: Users },
  student: { en: "Student", ar: "طالب", icon: GraduationCap },
  alumni: { en: "Alumni", ar: "خريج", icon: GraduationCap },
  instructor: { en: "Instructor", ar: "مدرب", icon: Briefcase },
  staff: { en: "Staff", ar: "موظف", icon: Briefcase },
  board_member: { en: "Board Member", ar: "عضو مجلس إدارة", icon: Users },
  honorary: { en: "Honorary", ar: "فخري", icon: Users },
};

const statusColors: Record<string, string> = {
  active: "bg-chart-3/20 text-chart-3",
  pending: "bg-chart-4/20 text-chart-4",
  graduated: "bg-primary/20 text-primary",
  expired: "bg-muted text-muted-foreground",
  suspended: "bg-destructive/20 text-destructive",
};

interface Props {
  entityId: string;
}

export function EntityMembersTab({ entityId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: memberships, isLoading } = useEntityMemberships(entityId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!memberships?.length) {
    return (
      <div className="py-12 text-center">
        <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{isAr ? "لا يوجد أعضاء بعد" : "No members yet"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {memberships.map(m => {
        const typeInfo = membershipTypeLabels[m.membership_type] || membershipTypeLabels.member;
        const Icon = typeInfo.icon;
        return (
          <Card key={m.id} className="transition-all hover:shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{isAr ? typeInfo.ar : typeInfo.en}</Badge>
                  <Badge className={`text-xs ${statusColors[m.status] || ""}`}>{m.status}</Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                  {m.department && <span>{isAr && m.department_ar ? m.department_ar : m.department}</span>}
                  {m.title && <span>{isAr && m.title_ar ? m.title_ar : m.title}</span>}
                  {m.student_id && <span className="font-mono">ID: {m.student_id}</span>}
                </div>
                <div className="mt-0.5 flex gap-x-4 text-xs text-muted-foreground">
                  {m.enrollment_date && <span>{isAr ? "التحق:" : "Enrolled:"} {format(new Date(m.enrollment_date), "MMM yyyy")}</span>}
                  {m.graduation_date && <span>{isAr ? "تخرج:" : "Graduated:"} {format(new Date(m.graduation_date), "MMM yyyy")}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
