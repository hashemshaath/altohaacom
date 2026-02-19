import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRole";
import { Construction } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

/**
 * Shows a maintenance page if maintenance mode is enabled in site settings.
 * Admins bypass this and see the normal site.
 */
export function MaintenanceGuard({ children }: Props) {
  const settings = useSiteSettingsContext();
  const { user } = useAuth();
  const { data: roles = [] } = useUserRoles();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const registration = settings.registration || {};
  const isMaintenanceMode = registration.maintenanceMode === true;
  const isAdmin = roles.includes("supervisor");

  if (isMaintenanceMode && !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center bg-background">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Construction className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">
          {isAr ? "الموقع تحت الصيانة" : "Under Maintenance"}
        </h1>
        <p className="max-w-md text-muted-foreground">
          {isAr
            ? "نعمل حالياً على تحسين المنصة. سنعود قريباً. شكراً لصبركم."
            : "We're currently improving the platform. We'll be back shortly. Thank you for your patience."}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
