import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompanyWorkingHours() {
  const { language } = useLanguage();
  const { isLoading } = useCompanyAccess();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === "ar" ? "ساعات العمل" : "Working Hours"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {language === "ar" ? "ساعات عمل الشركة والفروع" : "Company and branch working hours"}
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {language === "ar" ? "الجدول الزمني" : "Schedule"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "سيتم عرض ساعات العمل قريباً" : "Working hours will be displayed shortly"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
