import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { History, User, Shield, Edit, UserCheck, UserX } from "lucide-react";

interface Props {
  userId: string;
  isAr: boolean;
}

const ACTION_META: Record<string, { icon: typeof Edit; labelEn: string; labelAr: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  update_profile: { icon: Edit, labelEn: "Profile Updated", labelAr: "تحديث الملف الشخصي", variant: "secondary" },
  update_roles: { icon: Shield, labelEn: "Roles Changed", labelAr: "تغيير الأدوار", variant: "outline" },
  active_user: { icon: UserCheck, labelEn: "Account Activated", labelAr: "تفعيل الحساب", variant: "default" },
  suspended_user: { icon: UserX, labelEn: "Account Suspended", labelAr: "إيقاف الحساب", variant: "destructive" },
  banned_user: { icon: UserX, labelEn: "Account Banned", labelAr: "حظر الحساب", variant: "destructive" },
  reset_password: { icon: Shield, labelEn: "Password Reset", labelAr: "إعادة تعيين كلمة المرور", variant: "outline" },
  send_invitation: { icon: User, labelEn: "Invitation Sent", labelAr: "إرسال دعوة", variant: "secondary" },
};

export function UserModificationHistory({ userId, isAr }: Props) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["userModHistory", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_actions")
        .select("*")
        .eq("target_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      // Get admin names
      const adminIds = [...new Set(data?.map((a) => a.admin_id) || [])];
      const { data: adminProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username")
        .in("user_id", adminIds);

      const adminMap = new Map(adminProfiles?.map((p) => [p.user_id, p]) || []);

      return (data || []).map((action) => ({
        ...action,
        admin: adminMap.get(action.admin_id),
      }));
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="py-8 text-center">
        <History className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">
          {isAr ? "لا يوجد سجل تعديلات بعد" : "No modification history yet"}
        </p>
      </div>
    );
  }

  const formatDetails = (details: any): string => {
    if (!details) return "";
    if (details.roles) return `${isAr ? "الأدوار:" : "Roles:"} ${details.roles.join(", ")}`;
    
    const fields: string[] = [];
    const fieldLabels: Record<string, { en: string; ar: string }> = {
      full_name: { en: "Full Name", ar: "الاسم الكامل" },
      display_name: { en: "Display Name", ar: "الاسم المعروض" },
      username: { en: "Username", ar: "اسم المستخدم" },
      bio: { en: "Bio", ar: "النبذة" },
      country_code: { en: "Country", ar: "الدولة" },
      city: { en: "City", ar: "المدينة" },
      specialization: { en: "Specialization", ar: "التخصص" },
      membership_tier: { en: "Membership", ar: "العضوية" },
      account_status: { en: "Status", ar: "الحالة" },
      gender: { en: "Gender", ar: "الجنس" },
      date_of_birth: { en: "Date of Birth", ar: "تاريخ الميلاد" },
      preferred_language: { en: "Language", ar: "اللغة" },
      education_level: { en: "Education", ar: "المستوى التعليمي" },
      experience_level: { en: "Experience", ar: "مستوى الخبرة" },
      years_of_experience: { en: "Years of Exp.", ar: "سنوات الخبرة" },
    };

    Object.entries(details).forEach(([key, value]) => {
      if (value !== null && value !== undefined && key !== "suspended_reason" && key !== "suspended_at") {
        const label = fieldLabels[key];
        if (label) {
          fields.push(`${isAr ? label.ar : label.en}: ${value}`);
        }
      }
    });
    return fields.join(" · ");
  };

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3 pe-4">
        {history.map((action: any) => {
          const meta = ACTION_META[action.action_type] || ACTION_META.update_profile;
          const Icon = meta.icon;
          return (
            <div key={action.id} className="flex gap-3 rounded-lg border p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={meta.variant} className="text-[10px]">
                    {isAr ? meta.labelAr : meta.labelEn}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(action.created_at), "MMM d, yyyy HH:mm")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isAr ? "بواسطة:" : "By:"} {action.admin?.full_name || action.admin?.username || action.admin_id.slice(0, 8)}
                </p>
                {action.details && (
                  <p className="text-xs text-muted-foreground/80 truncate">
                    {formatDetails(action.details)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
