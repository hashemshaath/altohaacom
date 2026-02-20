import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useVerifyQRCode } from "@/hooks/useQRCode";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEOHead } from "@/components/SEOHead";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { QRScanner } from "@/components/qr/QRScanner";
import { generateVCard, downloadVCard, getVerificationUrl } from "@/lib/qrCode";
import {
  Search, Shield, CheckCircle, XCircle, AlertTriangle,
  User, Award, FileText, Building, Calendar, QrCode,
  UserPlus, ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

type CategoryFilter = "all" | "account" | "certificate" | "invoice" | "competition" | "company" | "participant" | "judge" | "team_member" | "exhibition";

export default function Verify() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get("code") || "";
  const [inputCode, setInputCode] = useState(initialCode);
  const [searchedCode, setSearchedCode] = useState(initialCode);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  // Try unified QR code system first
  const { data: qrResult, isLoading: qrLoading } = useVerifyQRCode(searchedCode);

  // Also try legacy certificate verification
  const { data: certResult, isLoading: certLoading } = useQuery({
    queryKey: ["verify-certificate-legacy", searchedCode],
    queryFn: async () => {
      if (!searchedCode) return null;
      const { data, error } = await supabase.rpc("verify_certificate", { p_code: searchedCode.toUpperCase() });
      if (error) throw error;
      if (!data || (data as any[]).length === 0) return null;
      return (data as any[])[0];
    },
    enabled: !!searchedCode && !qrResult,
  });

  // Fetch entity details based on QR result
  const { data: entityDetails } = useQuery({
    queryKey: ["qr-entity-details", qrResult?.entity_type, qrResult?.entity_id],
    queryFn: async () => {
      if (!qrResult) return null;
      switch (qrResult.entity_type) {
        case "user": {
          const { data } = await supabase
            .from("profiles_public")
            .select("full_name, username, specialization, experience_level, location, bio, account_number, avatar_url, country_code, website")
            .eq("username", qrResult.entity_id)
            .maybeSingle();
          return data ? { ...data, type: "user" as const } : null;
        }
        case "certificate": {
          const { data } = await supabase.rpc("verify_certificate", { p_code: qrResult.entity_id });
          const arr = data as any[] | null;
          return arr && arr.length > 0 ? { ...arr[0], type: "certificate" as const } : null;
        }
        case "invoice": {
          const { data } = await supabase
            .from("invoices")
            .select("invoice_number, total_amount, currency, status, due_date, created_at")
            .eq("invoice_number", qrResult.entity_id)
            .maybeSingle();
          return data ? { ...(data as any), type: "invoice" as const } : null;
        }
        case "competition": {
          const { data } = await supabase
            .from("competitions")
            .select("title, title_ar, competition_start, competition_end, venue, city, country, status, competition_number, cover_image_url")
            .eq("id", qrResult.entity_id)
            .maybeSingle();
          return data ? { ...(data as any), type: "competition" as const } : null;
        }
        case "company": {
          const { data } = await supabase
            .from("companies")
            .select("name, name_ar, type, status, company_number, email, phone, city, country, logo_url, website")
            .eq("id", qrResult.entity_id)
            .maybeSingle();
          return data ? { ...(data as any), type: "company" as const } : null;
        }
        case "exhibition": {
          const { data } = await supabase
            .from("exhibitions")
            .select("title, title_ar, start_date, end_date, venue, city, country, status, cover_image_url, slug")
            .eq("id", qrResult.entity_id)
            .maybeSingle();
          return data ? { ...(data as any), type: "exhibition" as const } : null;
        }
        case "participant": {
          const { data: reg } = await supabase
            .from("competition_registrations")
            .select("id, status, registration_number, competition_id, participant_id, category_id, dish_name, registered_at")
            .eq("id", qrResult.entity_id)
            .maybeSingle();
          if (!reg) return null;
          const { data: profile } = await supabase.from("profiles").select("full_name, avatar_url, username").eq("user_id", reg.participant_id).maybeSingle();
          const { data: comp } = await supabase.from("competitions").select("title, title_ar").eq("id", reg.competition_id).maybeSingle();
          let catName = null;
          if (reg.category_id) {
            const { data: cat } = await supabase.from("competition_categories").select("name, name_ar").eq("id", reg.category_id).maybeSingle();
            catName = cat;
          }
          return { ...reg, profile, competition: comp, category: catName, type: "participant" as const };
        }
        case "judge": {
          const { data: ja } = await supabase
            .from("competition_judges")
            .select("id, judge_id, competition_id, assigned_at")
            .eq("id", qrResult.entity_id)
            .maybeSingle();
          if (!ja) return null;
          const { data: profile } = await supabase.from("profiles").select("full_name, avatar_url, username").eq("user_id", ja.judge_id).maybeSingle();
          const { data: comp } = await supabase.from("competitions").select("title, title_ar").eq("id", ja.competition_id).maybeSingle();
          return { ...ja, profile, competition: comp, type: "judge" as const };
        }
        case "team_member": {
          const { data: tm } = await supabase
            .from("competition_team_members")
            .select("id, name, name_ar, role, title, title_ar, competition_id, is_checked_in, checked_in_at, photo_url")
            .eq("id", qrResult.entity_id)
            .maybeSingle();
          if (!tm) return null;
          const { data: comp } = await supabase.from("competitions").select("title, title_ar").eq("id", tm.competition_id).maybeSingle();
          return { ...tm, competition: comp, type: "team_member" as const };
        }
      }
    },
    enabled: !!qrResult,
  });

  const isLoading = qrLoading || certLoading;
  const result = qrResult || (certResult ? { ...certResult, entity_type: "certificate", code: searchedCode.toUpperCase() } : null);
  const notFound = searchedCode && !result && !isLoading;

  const handleVerify = () => {
    setSearchedCode(inputCode.trim());
  };

  const handleSaveContact = () => {
    if (!entityDetails || entityDetails.type !== "user") return;
    const vcard = generateVCard({
      fullName: entityDetails.full_name || "Unknown",
      phone: entityDetails.phone || undefined,
      website: entityDetails.website || undefined,
      location: entityDetails.location || undefined,
      accountNumber: entityDetails.account_number || undefined,
      profileUrl: `https://altoha.com/${entityDetails.username}`,
    });
    downloadVCard(vcard, entityDetails.full_name || "contact");
  };

  const categories: { value: CategoryFilter; label: string; labelAr: string }[] = [
    { value: "all", label: "All", labelAr: "الكل" },
    { value: "account", label: "Accounts", labelAr: "الحسابات" },
    { value: "certificate", label: "Certificates", labelAr: "الشهادات" },
    { value: "invoice", label: "Invoices", labelAr: "الفواتير" },
    { value: "competition", label: "Competitions", labelAr: "المسابقات" },
    { value: "exhibition", label: "Exhibitions", labelAr: "الفعاليات" },
    { value: "company", label: "Companies", labelAr: "الشركات" },
    { value: "participant", label: "Participants", labelAr: "المشاركين" },
    { value: "judge", label: "Judges", labelAr: "الحكام" },
    { value: "team_member", label: "Team", labelAr: "الفريق" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={isAr ? "مركز التحقق" : "Verification Center"}
        description={isAr ? "تحقق من صحة الشهادات والحسابات والفواتير" : "Verify certificates, accounts, invoices and more"}
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
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
              {isAr ? "مركز التحقق والمسح" : "Verification & Scanning Center"}
            </h1>
            <p className="mt-3 text-base text-muted-foreground max-w-2xl mx-auto">
              {isAr
                ? "تحقق من صحة الشهادات والحسابات والفواتير والمزيد باستخدام كود التحقق أو رمز QR"
                : "Verify certificates, accounts, invoices and more using a verification code or QR code"}
            </p>
          </div>
        </section>

        {/* Search & Category Filter */}
        <section className="py-12">
          <div className="container max-w-2xl">
            {/* Category Tabs */}
            <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as CategoryFilter)} className="mb-6">
              <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
                {categories.map((cat) => (
                  <TabsTrigger key={cat.value} value={cat.value} className="text-xs">
                    {isAr ? cat.labelAr : cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Search */}
            <Card className="border-border/50 shadow-lg shadow-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  {isAr ? "أدخل كود التحقق" : "Enter Verification Code"}
                </CardTitle>
                <CardDescription>
                  {isAr
                    ? "أدخل الكود الموجود على الشهادة أو الفاتورة أو بطاقة الحساب"
                    : "Enter the code found on the certificate, invoice, or account card"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder={isAr ? "مثال: ACC1A2B3C4D" : "e.g., ACC1A2B3C4D"}
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    className="font-mono text-lg tracking-widest"
                    maxLength={16}
                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  />
                  <Button onClick={handleVerify} disabled={!inputCode || isLoading}>
                    {isLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    ) : (
                      <>
                        <Search className="h-4 w-4 me-2" />
                        {isAr ? "تحقق" : "Verify"}
                      </>
                    )}
                  </Button>
                </div>
                <div className="mt-3 flex justify-center">
                  <QRScanner onScan={(code) => { setInputCode(code); setSearchedCode(code); }} />
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
                ) : result ? (
                  <VerificationResult
                    result={result}
                    entityDetails={entityDetails}
                    code={searchedCode}
                    onSaveContact={handleSaveContact}
                  />
                ) : notFound ? (
                  <Card className="border-chart-4/30 bg-chart-4/5">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-chart-4/15 flex items-center justify-center ring-2 ring-chart-4/20">
                          <AlertTriangle className="h-8 w-8 text-chart-4" />
                        </div>
                        <div>
                          <CardTitle className="text-chart-4">
                            {isAr ? "لم يتم العثور على نتائج" : "No Results Found"}
                          </CardTitle>
                          <CardDescription>
                            {isAr
                              ? "لم نتمكن من العثور على سجل بهذا الكود. تأكد من صحة الكود وحاول مرة أخرى."
                              : "We couldn't find a record with this code. Please check and try again."}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ) : null}
              </div>
            )}

            {/* Features */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: QrCode, color: "text-primary", bg: "bg-primary/10", title: isAr ? "رموز QR ذكية" : "Smart QR Codes", desc: isAr ? "رمز QR فريد لكل كيان في النظام" : "Unique QR code for every entity in the system" },
                { icon: Shield, color: "text-chart-3", bg: "bg-chart-3/10", title: isAr ? "تحقق فوري" : "Instant Verification", desc: isAr ? "تحقق فوري ومتابعة لعدد مرات المسح" : "Instant verification with scan count tracking" },
                { icon: UserPlus, color: "text-chart-4", bg: "bg-chart-4/10", title: isAr ? "حفظ جهات الاتصال" : "Save Contacts", desc: isAr ? "حفظ بيانات الحساب في دليل الهاتف" : "Save account details to phone contacts" },
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

/** Result display component based on entity type */
function VerificationResult({
  result,
  entityDetails,
  code,
  onSaveContact,
}: {
  result: any;
  entityDetails: any;
  code: string;
  onSaveContact: () => void;
}) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const entityType = result.entity_type;

  const typeLabels: Record<string, { en: string; ar: string; icon: any; color: string }> = {
    user: { en: "User Account", ar: "حساب مستخدم", icon: User, color: "chart-5" },
    certificate: { en: "Certificate", ar: "شهادة", icon: Award, color: "chart-5" },
    invoice: { en: "Invoice", ar: "فاتورة", icon: FileText, color: "primary" },
    competition: { en: "Competition", ar: "مسابقة", icon: Award, color: "chart-3" },
    company: { en: "Company", ar: "شركة", icon: Building, color: "chart-4" },
    exhibition: { en: "Exhibition", ar: "فعالية", icon: Calendar, color: "chart-3" },
    participant: { en: "Contestant", ar: "متسابق", icon: User, color: "primary" },
    judge: { en: "Judge", ar: "حكم", icon: Shield, color: "chart-4" },
    team_member: { en: "Team Member", ar: "عضو فريق", icon: User, color: "chart-3" },
  };

  const typeInfo = typeLabels[entityType] || typeLabels.certificate;
  const Icon = typeInfo.icon;

  return (
    <Card className={`border-chart-5/30 bg-chart-5/5`}>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-chart-5/15 flex items-center justify-center ring-2 ring-chart-5/20 shadow-lg shadow-chart-5/10">
            <CheckCircle className="h-8 w-8 text-chart-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-chart-5">
              {isAr ? "تم التحقق بنجاح" : "Verified Successfully"}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-[10px]">
                <Icon className="h-3 w-3 me-1" />
                {isAr ? typeInfo.ar : typeInfo.en}
              </Badge>
              {result.scan_count > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {isAr ? `${result.scan_count} مسح` : `${result.scan_count} scans`}
                </span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Separator />

        {/* Entity-specific details */}
        {entityType === "user" && entityDetails?.type === "user" && (
          <UserVerificationDetails details={entityDetails} onSaveContact={onSaveContact} />
        )}

        {entityType === "certificate" && (
          <CertificateVerificationDetails details={entityDetails || result} />
        )}

        {entityType === "invoice" && entityDetails?.type === "invoice" && (
          <InvoiceVerificationDetails details={entityDetails} />
        )}

        {entityType === "competition" && entityDetails?.type === "competition" && (
          <CompetitionVerificationDetails details={entityDetails} entityId={result.entity_id} />
        )}

        {entityType === "company" && entityDetails?.type === "company" && (
          <CompanyVerificationDetails details={entityDetails} entityId={result.entity_id} />
        )}

        {entityType === "exhibition" && entityDetails?.type === "exhibition" && (
          <ExhibitionVerificationDetails details={entityDetails} />
        )}

        {entityType === "participant" && entityDetails?.type === "participant" && (
          <ParticipantVerificationDetails details={entityDetails} />
        )}

        {entityType === "judge" && entityDetails?.type === "judge" && (
          <ParticipantVerificationDetails details={entityDetails} />
        )}

        {entityType === "team_member" && entityDetails?.type === "team_member" && (
          <TeamMemberVerificationDetails details={entityDetails} />
        )}

        {/* Code display */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
          <span className="text-xs text-muted-foreground">{isAr ? "كود التحقق" : "Verification Code"}</span>
          <Badge variant="outline" className="font-mono tracking-widest">{code.toUpperCase()}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function UserVerificationDetails({ details, onSaveContact }: { details: any; onSaveContact: () => void }) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">{isAr ? "الاسم" : "Name"}</p>
            <p className="font-semibold">{details.full_name || "N/A"}</p>
            {details.username && <p className="text-xs text-muted-foreground">@{details.username}</p>}
          </div>
        </div>
        {details.specialization && (
          <div className="flex items-start gap-3">
            <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? "التخصص" : "Specialization"}</p>
              <p className="font-semibold">{details.specialization}</p>
            </div>
          </div>
        )}
        {details.location && (
          <div className="flex items-start gap-3">
            <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? "الموقع" : "Location"}</p>
              <p className="font-semibold">{details.location}</p>
            </div>
          </div>
        )}
        {details.account_number && (
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? "رقم الحساب" : "Account Number"}</p>
              <Badge variant="outline" className="font-mono text-xs">{details.account_number}</Badge>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={onSaveContact}>
          <UserPlus className="h-3.5 w-3.5 me-1.5" />
          {isAr ? "حفظ في جهات الاتصال" : "Save to Contacts"}
        </Button>
        {details.username && (
          <Button variant="outline" size="sm" asChild>
            <Link to={`/${details.username}`}>
              <ExternalLink className="h-3.5 w-3.5 me-1.5" />
              {isAr ? "عرض الملف الشخصي" : "View Profile"}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function CertificateVerificationDetails({ details }: { details: any }) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (!details) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex items-start gap-3">
        <User className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="text-sm text-muted-foreground">{isAr ? "المستلم" : "Recipient"}</p>
          <p className="font-semibold">{details.recipient_name}</p>
        </div>
      </div>
      {details.event_name && (
        <div className="flex items-start gap-3">
          <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">{isAr ? "الحدث" : "Event"}</p>
            <p className="font-semibold">{details.event_name}</p>
          </div>
        </div>
      )}
      {details.certificate_number && (
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">{isAr ? "رقم الشهادة" : "Certificate Number"}</p>
            <Badge variant="outline" className="font-mono text-xs">{details.certificate_number}</Badge>
          </div>
        </div>
      )}
      {details.issued_at && (
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">{isAr ? "تاريخ الإصدار" : "Issue Date"}</p>
            <p className="font-semibold">{format(new Date(details.issued_at), "MMMM d, yyyy")}</p>
          </div>
        </div>
      )}
      {details.achievement && (
        <div className="col-span-full flex items-start gap-3">
          <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">{isAr ? "الإنجاز" : "Achievement"}</p>
            <p className="font-semibold">{details.achievement}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function InvoiceVerificationDetails({ details }: { details: any }) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex items-start gap-3">
        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="text-sm text-muted-foreground">{isAr ? "رقم الفاتورة" : "Invoice Number"}</p>
          <p className="font-semibold font-mono">{details.invoice_number}</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="text-sm text-muted-foreground">{isAr ? "المبلغ" : "Amount"}</p>
          <p className="font-semibold">SAR {details.total_amount}</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="text-sm text-muted-foreground">{isAr ? "الحالة" : "Status"}</p>
          <Badge>{details.status}</Badge>
        </div>
      </div>
    </div>
  );
}

function CompetitionVerificationDetails({ details, entityId }: { details: any; entityId: string }) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">{isAr ? "المسابقة" : "Competition"}</p>
            <p className="font-semibold">{isAr ? details.title_ar || details.title : details.title}</p>
          </div>
        </div>
        {details.competition_number && (
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? "رقم المسابقة" : "Competition Number"}</p>
              <Badge variant="outline" className="font-mono text-xs">{details.competition_number}</Badge>
            </div>
          </div>
        )}
        {details.competition_start && (
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? "التاريخ" : "Date"}</p>
              <p className="font-semibold">{format(new Date(details.competition_start), "MMMM d, yyyy")}</p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">{isAr ? "الحالة" : "Status"}</p>
            <Badge>{details.status}</Badge>
          </div>
        </div>
      </div>
      <Button variant="outline" size="sm" asChild>
        <Link to={`/competitions/${entityId}`}>
          <ExternalLink className="h-3.5 w-3.5 me-1.5" />
          {isAr ? "عرض المسابقة" : "View Competition"}
        </Link>
      </Button>
    </div>
  );
}

function CompanyVerificationDetails({ details, entityId }: { details: any; entityId: string }) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">{isAr ? "الشركة" : "Company"}</p>
            <p className="font-semibold">{isAr ? details.name_ar || details.name : details.name}</p>
          </div>
        </div>
        {details.company_number && (
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? "رقم الشركة" : "Company Number"}</p>
              <Badge variant="outline" className="font-mono text-xs">{details.company_number}</Badge>
            </div>
          </div>
        )}
        {details.type && (
          <div className="flex items-start gap-3">
            <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? "النوع" : "Type"}</p>
              <Badge variant="secondary">{details.type}</Badge>
            </div>
          </div>
        )}
        {(details.city || details.country) && (
          <div className="flex items-start gap-3">
            <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? "الموقع" : "Location"}</p>
              <p className="font-semibold">{[details.city, details.country].filter(Boolean).join(", ")}</p>
            </div>
          </div>
        )}
      </div>
      <Button variant="outline" size="sm" asChild>
        <Link to={`/entities/${entityId}`}>
          <ExternalLink className="h-3.5 w-3.5 me-1.5" />
          {isAr ? "عرض الشركة" : "View Company"}
        </Link>
      </Button>
    </div>
  );
}

function ExhibitionVerificationDetails({ details }: { details: any }) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">{isAr ? "الفعالية" : "Exhibition"}</p>
            <p className="font-semibold">{isAr ? details.title_ar || details.title : details.title}</p>
          </div>
        </div>
        {details.start_date && (
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? "التاريخ" : "Date"}</p>
              <p className="font-semibold">{format(new Date(details.start_date), "MMM d")} – {format(new Date(details.end_date), "MMM d, yyyy")}</p>
            </div>
          </div>
        )}
        {(details.city || details.country) && (
          <div className="flex items-start gap-3">
            <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? "الموقع" : "Location"}</p>
              <p className="font-semibold">{[details.city, details.country].filter(Boolean).join(", ")}</p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">{isAr ? "الحالة" : "Status"}</p>
            <Badge>{details.status}</Badge>
          </div>
        </div>
      </div>
      {details.slug && (
        <Button variant="outline" size="sm" asChild>
          <Link to={`/exhibitions/${details.slug}`}>
            <ExternalLink className="h-3.5 w-3.5 me-1.5" />
            {isAr ? "عرض الفعالية" : "View Exhibition"}
          </Link>
        </Button>
      )}
    </div>
  );
}

function ParticipantVerificationDetails({ details }: { details: any }) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">
              {details.type === "judge" ? (isAr ? "الحكم" : "Judge") : (isAr ? "المتسابق" : "Contestant")}
            </p>
            <p className="font-semibold">{details.profile?.full_name || "N/A"}</p>
          </div>
        </div>
        {details.competition && (
          <div className="flex items-start gap-3">
            <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? "المسابقة" : "Competition"}</p>
              <p className="font-semibold">{isAr ? details.competition.title_ar || details.competition.title : details.competition.title}</p>
            </div>
          </div>
        )}
        {details.category && (
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? "الفئة" : "Category"}</p>
              <p className="font-semibold">{isAr ? details.category.name_ar || details.category.name : details.category.name}</p>
            </div>
          </div>
        )}
        {details.registration_number && (
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? "رقم التسجيل" : "Registration #"}</p>
              <Badge variant="outline" className="font-mono text-xs">{details.registration_number}</Badge>
            </div>
          </div>
        )}
        {details.status && (
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? "الحالة" : "Status"}</p>
              <Badge>{details.status === "approved" ? (isAr ? "مؤكد" : "Confirmed") : details.status}</Badge>
            </div>
          </div>
        )}
      </div>
      {details.competition_id && (
        <Button variant="outline" size="sm" asChild>
          <Link to={`/competitions/${details.competition_id}`}>
            <ExternalLink className="h-3.5 w-3.5 me-1.5" />
            {isAr ? "عرض المسابقة" : "View Competition"}
          </Link>
        </Button>
      )}
    </div>
  );
}

function TeamMemberVerificationDetails({ details }: { details: any }) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">{isAr ? "عضو الفريق" : "Team Member"}</p>
            <p className="font-semibold">{isAr ? details.name_ar || details.name : details.name}</p>
          </div>
        </div>
        {details.role && (
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? "الدور" : "Role"}</p>
              <Badge variant="secondary">{details.role}</Badge>
            </div>
          </div>
        )}
        {(details.title || details.title_ar) && (
          <div className="flex items-start gap-3">
            <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? "المسمى" : "Title"}</p>
              <p className="font-semibold">{isAr ? details.title_ar || details.title : details.title}</p>
            </div>
          </div>
        )}
        {details.competition && (
          <div className="flex items-start gap-3">
            <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? "المسابقة" : "Competition"}</p>
              <p className="font-semibold">{isAr ? details.competition.title_ar || details.competition.title : details.competition.title}</p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">{isAr ? "تسجيل الحضور" : "Check-in"}</p>
            <Badge variant={details.is_checked_in ? "default" : "secondary"}>
              {details.is_checked_in ? (isAr ? "تم التسجيل" : "Checked In") : (isAr ? "لم يسجل بعد" : "Not Checked In")}
            </Badge>
          </div>
        </div>
      </div>
      {details.competition_id && (
        <Button variant="outline" size="sm" asChild>
          <Link to={`/competitions/${details.competition_id}`}>
            <ExternalLink className="h-3.5 w-3.5 me-1.5" />
            {isAr ? "عرض المسابقة" : "View Competition"}
          </Link>
        </Button>
      )}
    </div>
  );
}
