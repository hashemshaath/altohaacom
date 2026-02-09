import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompanySettings() {
  const { language } = useLanguage();
  const { isLoading } = useCompanyAccess();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === "ar" ? "الإعدادات" : "Settings"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {language === "ar" ? "إعدادات حساب الشركة" : "Company account settings"}
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {language === "ar" ? "الحساب" : "Account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "سيتم إضافة المزيد من الإعدادات قريباً" : "More settings coming soon"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
