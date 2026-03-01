import React from "react";
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
import { toEnglishDigits } from "@/lib/formatNumber";

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
    <div className="space-y-8">
      {/* Profile Hero Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-card shadow-2xl shadow-black/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        {company.cover_image_url && (
          <img src={company.cover_image_url} className="absolute inset-0 h-full w-full object-cover opacity-20 grayscale" alt="" />
        )}
        <div className="absolute -end-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-[100px] animate-pulse" />
        
        <div className="relative flex flex-col gap-8 p-8 md:flex-row md:items-center md:p-12">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary to-primary-variant text-primary-foreground shadow-2xl shadow-primary/20 transition-transform hover:scale-105 duration-500">
            {company.logo_url ? (
              <img src={company.logo_url} className="h-16 w-16 object-contain brightness-0 invert" alt={company.name} />
            ) : (
              <Building2 className="h-12 w-12" />
            )}
          </div>
          
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">{company.name}</h1>
                {getStatusBadge(company.status || null)}
              </div>
              {company.name_ar && language !== "ar" && (
                <p className="mt-1 font-serif text-xl text-muted-foreground/60 italic">{company.name_ar}</p>
              )}
            </div>

            {company.description && (
              <p className="max-w-3xl text-base text-muted-foreground/90 leading-relaxed line-clamp-3">{company.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-bold uppercase tracking-widest text-[10px] px-3 py-1.5">{company.type}</Badge>
              {company.company_number && (
                <Badge variant="outline" className="bg-muted/50 font-mono text-[10px] px-3 py-1.5">
                  <Hash className="me-1.5 h-3 w-3 text-muted-foreground" />
                  {company.company_number}
                </Badge>
              )}
              {company.country_code && (
                <Badge variant="outline" className="bg-muted/50 font-bold text-[10px] px-3 py-1.5">
                  {countryFlag(company.country_code)} {getCountryName(company.country_code)}
                </Badge>
              )}
            </div>

            {company.operating_countries && company.operating_countries.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <Earth className="h-3 w-3" />
                  {language === "ar" ? "مناطق العمل:" : "Regions:"}
                </span>
                {(company.operating_countries as string[]).map((cc) => (
                  <Badge key={cc} variant="secondary" className="rounded-xl bg-muted/40 text-[10px] font-bold px-2 py-0.5">
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
        <div className="flex justify-center md:justify-start">
          <QRCodeDisplay
            code={qrCode.code}
            label={language === "ar" ? "رمز QR للشركة" : "Company QR Code"}
            size={160}
            className="rounded-[2rem] border-border/40 bg-card/50 p-6 backdrop-blur-md shadow-xl transition-all hover:scale-105"
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
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Contact Information */}
        <Card className="animate-fade-in group rounded-[2rem] border-border/40 shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg font-bold">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Phone className="h-4 w-4" />
              </div>
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
        <Card className="animate-fade-in group rounded-[2rem] border-border/40 shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1" style={{ animationDelay: "0.05s" }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg font-bold">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CreditCard className="h-4 w-4" />
              </div>
              {language === "ar" ? "معلومات مالية" : "Financial Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {language === "ar" ? "حد الائتمان" : "Credit Limit"}
              </p>
              <p className="mt-1 text-xl font-bold text-primary">
                SAR {toEnglishDigits(company.credit_limit?.toLocaleString() || "0")}
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
          <Card className="animate-fade-in group rounded-[2rem] border-border/40 shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-lg font-bold">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="h-4 w-4" />
                </div>
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
          <Card className="animate-fade-in group rounded-[2rem] border-border/40 shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1" style={{ animationDelay: "0.15s" }}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-lg font-bold">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Shield className="h-4 w-4" />
                </div>
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

const InfoRow = React.memo(function InfoRow({
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
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted">
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
});
