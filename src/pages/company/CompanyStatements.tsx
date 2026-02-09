import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompanyStatements() {
  const { language } = useLanguage();
  const { companyId, isLoading: accessLoading } = useCompanyAccess();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === "ar" ? "كشوفات الحساب" : "Account Statements"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {language === "ar" ? "كشوف الحساب والأرصدة" : "Account statements and balances"}
        </p>
      </div>

      {accessLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {language === "ar" ? "الكشف الشامل" : "Full Statement"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "سيتم عرض كشف الحساب قريباً" : "Account statement will be displayed shortly"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
