import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Award,
  Search,
  CheckCircle,
  XCircle,
  Shield,
  Calendar,
  User,
  Building,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

export default function CertificateVerify() {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get("code") || "";
  const [verificationCode, setVerificationCode] = useState(initialCode);
  const [searchedCode, setSearchedCode] = useState(initialCode);

  // Fetch certificate by verification code
  const { data: certificate, isLoading, error, refetch } = useQuery({
    queryKey: ["verify-certificate", searchedCode],
    queryFn: async () => {
      if (!searchedCode) return null;
      
      // Use secure RPC function that doesn't expose email fields
      const { data, error } = await supabase
        .rpc("verify_certificate", { p_code: searchedCode.toUpperCase() });
      
      if (error) throw error;
      if (!data || (data as any[]).length === 0) return null;
      
      return (data as any[])[0];
    },
    enabled: !!searchedCode,
  });

  // Log verification attempt
  const logVerification = useMutation({
    mutationFn: async (certificateId: string) => {
      await supabase.from("certificate_verifications").insert({
        certificate_id: certificateId,
        verification_code: searchedCode.toUpperCase(),
      });
    },
  });

  const handleVerify = () => {
    setSearchedCode(verificationCode);
    if (certificate) {
      logVerification.mutate(certificate.id);
    }
  };

  const isVerified = certificate && certificate.status === "issued";
  const isRevoked = certificate && certificate.status === "revoked";
  const notFound = searchedCode && !certificate && !isLoading;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background py-16">
          <div className="absolute -top-32 start-1/4 h-64 w-64 rounded-full bg-primary/8 blur-[100px] animate-pulse" />
          <div className="absolute -top-20 end-1/3 h-48 w-48 rounded-full bg-accent/10 blur-[80px] animate-pulse [animation-delay:1s]" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="container relative text-center">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/5 shadow-lg">
                <Shield className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h1 className="font-serif text-3xl font-bold md:text-4xl">
              {language === "ar" ? "التحقق من الشهادة" : "Certificate Verification"}
            </h1>
            <p className="mt-3 text-base text-muted-foreground max-w-2xl mx-auto">
              {language === "ar"
                ? "تحقق من صحة الشهادات الصادرة عن منظمتنا باستخدام كود التحقق الفريد"
                : "Verify the authenticity of certificates issued by our organization using the unique verification code"}
            </p>
          </div>
        </section>

        {/* Verification Form */}
        <section className="py-12">
          <div className="container max-w-2xl">
            <Card className="border-border/50 shadow-lg shadow-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  {language === "ar" ? "أدخل كود التحقق" : "Enter Verification Code"}
                </CardTitle>
                <CardDescription>
                  {language === "ar"
                    ? "يمكنك العثور على كود التحقق في أسفل الشهادة"
                    : "You can find the verification code at the bottom of the certificate"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder={language === "ar" ? "مثال: A1B2C3D4" : "e.g., A1B2C3D4"}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                    className="font-mono text-lg tracking-widest"
                    maxLength={8}
                  />
                  <Button onClick={handleVerify} disabled={!verificationCode || isLoading}>
                    {isLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    ) : (
                      <>
                        <Search className="h-4 w-4 me-2" />
                        {language === "ar" ? "تحقق" : "Verify"}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {searchedCode && (
              <div className="mt-8">
                {isLoading ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </CardContent>
                  </Card>
                ) : isVerified ? (
                  <Card className="border-chart-5/30 bg-chart-5/5">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-chart-5/15 flex items-center justify-center ring-2 ring-chart-5/20 shadow-lg shadow-chart-5/10">
                          <CheckCircle className="h-8 w-8 text-chart-5" />
                        </div>
                        <div>
                          <CardTitle className="text-chart-5">
                            {language === "ar" ? "شهادة صالحة ومُصدقة" : "Valid & Verified Certificate"}
                          </CardTitle>
                          <CardDescription>
                            {language === "ar"
                              ? "تم التحقق من صحة هذه الشهادة"
                              : "This certificate has been verified as authentic"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <Separator />
                      
                      {/* Certificate Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">
                                {language === "ar" ? "المستلم" : "Recipient"}
                              </p>
                              <p className="font-semibold">{certificate.recipient_name}</p>
                              {certificate.recipient_name_ar && (
                                <p className="text-sm" dir="rtl">{certificate.recipient_name_ar}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">
                                {language === "ar" ? "نوع الشهادة" : "Certificate Type"}
                              </p>
                              <Badge className="mt-1">
                                {certificate.type.replace("_", " ").toUpperCase()}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">
                                {language === "ar" ? "رقم الشهادة" : "Certificate Number"}
                              </p>
                              <p className="font-mono font-semibold">{certificate.certificate_number}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {certificate.event_name && (
                            <div className="flex items-start gap-3">
                              <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  {language === "ar" ? "الحدث" : "Event"}
                                </p>
                                <p className="font-semibold">{certificate.event_name}</p>
                                {certificate.event_location && (
                                  <p className="text-sm text-muted-foreground">{certificate.event_location}</p>
                                )}
                              </div>
                            </div>
                          )}

                          {certificate.event_date && (
                            <div className="flex items-start gap-3">
                              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  {language === "ar" ? "التاريخ" : "Date"}
                                </p>
                                <p className="font-semibold">
                                  {format(new Date(certificate.event_date), "MMMM d, yyyy")}
                                </p>
                              </div>
                            </div>
                          )}

                          {certificate.issued_at && (
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  {language === "ar" ? "تاريخ الإصدار" : "Issue Date"}
                                </p>
                                <p className="font-semibold">
                                  {format(new Date(certificate.issued_at), "MMMM d, yyyy")}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {certificate.achievement && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {language === "ar" ? "الإنجاز" : "Achievement"}
                            </p>
                            <p className="font-semibold">{certificate.achievement}</p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ) : isRevoked ? (
                  <Card className="border-destructive/30 bg-destructive/5">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-destructive/15 flex items-center justify-center ring-2 ring-destructive/20">
                          <XCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <div>
                          <CardTitle className="text-destructive">
                            {language === "ar" ? "شهادة ملغاة" : "Certificate Revoked"}
                          </CardTitle>
                          <CardDescription>
                            {language === "ar"
                              ? "تم إلغاء هذه الشهادة ولم تعد صالحة"
                              : "This certificate has been revoked and is no longer valid"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ) : notFound ? (
                  <Card className="border-chart-4/30 bg-chart-4/5">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-chart-4/15 flex items-center justify-center ring-2 ring-chart-4/20">
                          <AlertTriangle className="h-8 w-8 text-chart-4" />
                        </div>
                        <div>
                          <CardTitle className="text-chart-4">
                            {language === "ar" ? "لم يتم العثور على الشهادة" : "Certificate Not Found"}
                          </CardTitle>
                          <CardDescription>
                            {language === "ar"
                              ? "لم نتمكن من العثور على شهادة بهذا الكود. تأكد من صحة الكود وحاول مرة أخرى."
                              : "We couldn't find a certificate with this code. Please check the code and try again."}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {language === "ar"
                          ? "إذا كنت تعتقد أن هذا خطأ، يرجى الاتصال بنا للمساعدة."
                          : "If you believe this is an error, please contact us for assistance."}
                      </p>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            )}

            {/* Info Section */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Shield, color: "text-primary", bg: "bg-primary/10", title: language === "ar" ? "آمن ومُشفر" : "Secure & Encrypted", desc: language === "ar" ? "جميع الشهادات محمية بتشفير قوي" : "All certificates are protected with strong encryption" },
                { icon: CheckCircle, color: "text-chart-3", bg: "bg-chart-3/10", title: language === "ar" ? "تحقق فوري" : "Instant Verification", desc: language === "ar" ? "احصل على نتائج التحقق فوراً" : "Get verification results instantly" },
                { icon: Award, color: "text-chart-4", bg: "bg-chart-4/10", title: language === "ar" ? "معتمد رسمياً" : "Officially Certified", desc: language === "ar" ? "شهادات صادرة من جهات معتمدة" : "Certificates issued by authorized bodies" },
              ].map((item) => (
                <Card key={item.title} className="border-border/50 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                  <CardContent className="pt-6 text-center">
                    <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${item.bg}`}>
                      <item.icon className={`h-7 w-7 ${item.color}`} />
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
