import { useCompanyAccess, useCompanyProfile } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Mail, MapPin, Globe } from "lucide-react";

export default function CompanyProfile() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();
  const { data: company, isLoading } = useCompanyProfile(companyId);

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (!company) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{company.name}</h1>
        <p className="mt-2 text-muted-foreground">{company.description}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "معلومات الاتصال" : "Contact Information"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {company.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{company.phone}</span>
              </div>
            )}
            {company.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{company.email}</span>
              </div>
            )}
            {company.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {company.website}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Company Details */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "تفاصيل الشركة" : "Company Details"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "النوع" : "Type"}</p>
              <Badge className="mt-2">{company.type}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "الحالة" : "Status"}</p>
              <Badge variant={company.status === "active" ? "default" : "secondary"} className="mt-2">
                {company.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        {(company.address || company.city || company.country) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {language === "ar" ? "العنوان" : "Address"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                {[company.address, company.city, company.country].filter(Boolean).join(", ")}
              </p>
              {company.postal_code && <p className="text-sm text-muted-foreground">{company.postal_code}</p>}
            </CardContent>
          </Card>
        )}

        {/* Financial Info */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "معلومات مالية" : "Financial Information"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "حد الائتمان" : "Credit Limit"}</p>
              <p className="mt-2 font-medium">{company.currency} {company.credit_limit?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "شروط الدفع (أيام)" : "Payment Terms (Days)"}</p>
              <p className="mt-2 font-medium">{company.payment_terms || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Registration Info */}
        {(company.registration_number || company.tax_number) && (
          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "معلومات التسجيل" : "Registration Info"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {company.registration_number && (
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "رقم التسجيل" : "Registration Number"}</p>
                  <p className="mt-2 font-medium">{company.registration_number}</p>
                </div>
              )}
              {company.tax_number && (
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "رقم الضريبة" : "Tax Number"}</p>
                  <p className="mt-2 font-medium">{company.tax_number}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
