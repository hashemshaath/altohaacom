import { useLanguage } from "@/i18n/LanguageContext";
import { UserCareerTimeline } from "@/components/admin/UserCareerTimeline";

interface ProfileCareerTabProps {
  userId: string;
}

export function ProfileCareerTab({ userId }: ProfileCareerTabProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {isAr
          ? "أضف سجلك المهني والتعليمي والعضويات والجوائز لبناء ملفك الاحترافي."
          : "Add your professional experience, education, memberships, and awards to build your professional profile."}
      </p>
      <UserCareerTimeline userId={userId} isAr={isAr} />
    </div>
  );
}
