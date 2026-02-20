import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEntityMemberships } from "@/hooks/useEntities";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Users, GraduationCap, Briefcase, Crown, User } from "lucide-react";
import { format } from "date-fns";

const membershipTypeLabels: Record<string, { en: string; ar: string; icon: any }> = {
  member: { en: "Member", ar: "عضو", icon: Users },
  student: { en: "Student", ar: "طالب", icon: GraduationCap },
  alumni: { en: "Alumni", ar: "خريج", icon: GraduationCap },
  instructor: { en: "Instructor", ar: "مدرب", icon: Briefcase },
  staff: { en: "Staff", ar: "موظف", icon: Briefcase },
  board_member: { en: "Board Member", ar: "عضو مجلس إدارة", icon: Users },
  honorary: { en: "Honorary", ar: "فخري", icon: Crown },
};

const positionLabels: Record<string, { en: string; ar: string }> = {
  president: { en: "President", ar: "الرئيس" },
  vice_president: { en: "Vice President", ar: "نائب الرئيس" },
  secretary_general: { en: "Secretary General", ar: "الأمين العام" },
  treasurer: { en: "Treasurer", ar: "أمين الصندوق" },
  board_member: { en: "Board Member", ar: "عضو مجلس إدارة" },
  honorary_president: { en: "Honorary President", ar: "الرئيس الفخري" },
  honorary_member: { en: "Honorary Member", ar: "عضو فخري" },
  advisor: { en: "Advisor", ar: "مستشار" },
  director: { en: "Director", ar: "مدير" },
  deputy_director: { en: "Deputy Director", ar: "نائب المدير" },
  coordinator: { en: "Coordinator", ar: "منسق" },
  spokesperson: { en: "Spokesperson", ar: "المتحدث الرسمي" },
  member: { en: "Member", ar: "عضو" },
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
  const { data: memberships, isLoading: loadingMemberships } = useEntityMemberships(entityId);

  // Also fetch positions with profiles
  const { data: positions, isLoading: loadingPositions } = useQuery({
    queryKey: ["entity-positions-public", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_positions")
        .select("*, profiles:user_id(id, user_id, full_name, full_name_ar, avatar_url, experience_level, username)")
        .eq("entity_id", entityId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const isLoading = loadingMemberships || loadingPositions;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  const hasPositions = positions && positions.length > 0;
  const hasMemberships = memberships && memberships.length > 0;

  if (!hasPositions && !hasMemberships) {
    return (
      <div className="py-12 text-center">
        <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{isAr ? "لا يوجد أعضاء بعد" : "No members yet"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Positions with profile cards */}
      {hasPositions && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isAr ? "المناصب القيادية" : "Leadership Positions"} ({positions.length})
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {positions.map((pos: any) => {
              const profile = pos.profiles as any;
              const displayName = isAr && profile?.full_name_ar ? profile.full_name_ar : profile?.full_name || "—";
              const label = positionLabels[pos.position_type];
              const posTitle = pos.position_title
                ? (isAr && pos.position_title_ar ? pos.position_title_ar : pos.position_title)
                : (label ? (isAr ? label.ar : label.en) : pos.position_type);
              const username = profile?.username;

              const card = (
                <Card className={`group overflow-hidden transition-all hover:shadow-md ${username ? "cursor-pointer" : ""}`}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-2 ring-primary/20 bg-primary/5">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={displayName} className="h-12 w-12 rounded-xl object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{displayName}</p>
                      <Badge variant="secondary" className="mt-0.5 text-[10px]">{posTitle}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );

              return username ? (
                <Link key={pos.id} to={`/profile/${username}`} className="block">{card}</Link>
              ) : (
                <div key={pos.id}>{card}</div>
              );
            })}
          </div>
        </div>
      )}

      {/* General Memberships */}
      {hasMemberships && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isAr ? "العضويات" : "Memberships"} ({memberships.length})
          </p>
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
      )}
    </div>
  );
}
