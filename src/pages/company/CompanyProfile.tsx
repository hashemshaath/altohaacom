import { useCompanyAccess, useCompanyProfile } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { countryFlag } from "@/lib/countryFlag";
import { useAllCountries } from "@/hooks/useCountries";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { useEntityQRCode } from "@/hooks/useQRCode";
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  Building2,
  CreditCard,
  FileText,
  Hash,
  Shield,
  Earth,
} from "lucide-react";

export default function CompanyProfile() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();
  const { data: company, isLoading } = useCompanyProfile(companyId);
  const { data: countries = [] } = useAllCountries();
  const { data: qrCode } = useEntityQRCode("company", companyId || undefined, "company");

  const getCountryName = (code: string | null) => {
    if (!code) return null;
    const c = countries.find((ct) => ct.code === code);
    return c ? (language === "ar" ? c.name_ar || c.name : c.name) : code;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
        </div>
      </div>
    );
  }

  if (!company) return null;

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20 hover:bg-chart-5/20">{language === "ar" ? "نشط" : "Active"}</Badge>;
      case "suspended":
        return <Badge variant="destructive">{language === "ar" ? "معلّق" : "Suspended"}</Badge>;
      default:
        return <Badge variant="secondary">{language === "ar" ? "قيد المراجعة" : "Pending"}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-card p-6">
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{company.name}</h1>
            {company.name_ar && language !== "ar" && (
              <p className="text-sm text-muted-foreground">{company.name_ar}</p>
            )}
            {company.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{company.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {getStatusBadge(company.status || null)}
              <Badge variant="outline">{company.type}</Badge>
              {company.company_number && (
                <Badge variant="outline" className="font-mono text-xs">
                  <Hash className="mr-1 h-3 w-3" />
                  {company.company_number}
                </Badge>
              )}
              {(company as any).country_code && (
                <Badge variant="outline">
                  {countryFlag((company as any).country_code)} {getCountryName((company as any).country_code)}
                </Badge>
              )}
            </div>
            {(company as any).operating_countries && (company as any).operating_countries.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Earth className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{language === "ar" ? "يعمل في:" : "Operates in:"}</span>
                {((company as any).operating_countries as string[]).map((cc) => (
                  <Badge key={cc} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {countryFlag(cc)} {getCountryName(cc)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code */}
      {qrCode && (
        <QRCodeDisplay
          code={qrCode.code}
          label={language === "ar" ? "رمز QR للشركة" : "Company QR Code"}
          size={140}
          vCardData={{
            fullName: company.name,
            phone: company.phone || undefined,
            email: company.email || undefined,
            organization: company.name,
            website: company.website || undefined,
            location: company.city || undefined,
            accountNumber: company.company_number || undefined,
          }}
        />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-4 w-4 text-primary" />
              {language === "ar" ? "معلومات الاتصال" : "Contact Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={Phone} label={language === "ar" ? "الهاتف" : "Phone"} value={company.phone} />
            <InfoRow icon={Mail} label={language === "ar" ? "البريد" : "Email"} value={company.email} isLink={`mailto:${company.email}`} />
            <InfoRow
              icon={Globe}
              label={language === "ar" ? "الموقع" : "Website"}
              value={company.website}
              isLink={company.website || undefined}
            />
          </CardContent>
        </Card>

        {/* Financial */}
        <Card className="animate-fade-in" style={{ animationDelay: "0.05s" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-4 w-4 text-primary" />
              {language === "ar" ? "معلومات مالية" : "Financial Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {language === "ar" ? "حد الائتمان" : "Credit Limit"}
              </p>
              <p className="mt-1 text-xl font-bold text-primary">
                SAR {company.credit_limit?.toLocaleString() || "0"}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {language === "ar" ? "شروط الدفع" : "Payment Terms"}
              </p>
              <p className="mt-1 font-medium">
                {company.payment_terms ? `${company.payment_terms} ${language === "ar" ? "يوم" : "days"}` : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        {(company.address || company.city || company.country) && (
          <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-4 w-4 text-primary" />
                {language === "ar" ? "العنوان" : "Address"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {[company.address, company.city, company.country].filter(Boolean).join(", ")}
              </p>
              {company.postal_code && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {language === "ar" ? "الرمز البريدي:" : "Postal Code:"} {company.postal_code}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Registration */}
        {(company.registration_number || company.tax_number) && (
          <Card className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-4 w-4 text-primary" />
                {language === "ar" ? "معلومات التسجيل" : "Registration Info"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {company.registration_number && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {language === "ar" ? "رقم التسجيل" : "Registration Number"}
                  </p>
                  <p className="mt-1 font-mono font-medium">{company.registration_number}</p>
                </div>
              )}
              {company.tax_number && (
                <>
                  {company.registration_number && <Separator />}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {language === "ar" ? "رقم الضريبة" : "Tax Number"}
                    </p>
                    <p className="mt-1 font-mono font-medium">{company.tax_number}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  isLink,
}: {
  icon: any;
  label: string;
  value: string | null | undefined;
  isLink?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {isLink ? (
          <a href={isLink} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline truncate block">
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium truncate">{value}</p>
        )}
      </div>
    </div>
  );
}
