import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAllCountries } from "@/hooks/useCountries";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  Users,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  Shield,
  Package,
} from "lucide-react";

type CompanyType = "sponsor" | "supplier" | "partner" | "vendor";

const STEPS = ["company_info", "contact_details", "branding", "services", "review"] as const;
type Step = typeof STEPS[number];

export default function RegisterCompany() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: countries = [] } = useAllCountries();
  const isAr = language === "ar";

  const [currentStep, setCurrentStep] = useState<Step>("company_info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    name_ar: "",
    type: "supplier" as CompanyType,
    description: "",
    description_ar: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    address_ar: "",
    city: "",
    country: "",
    country_code: "",
    postal_code: "",
    registration_number: "",
    tax_number: "",
    classifications: [] as string[],
    contact_name: "",
    contact_name_ar: "",
    contact_email: "",
    contact_phone: "",
    contact_title: "",
    contact_department: "management",
    logo_url: "",
    cover_image_url: "",
  });

  const stepIndex = STEPS.indexOf(currentStep);

  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const companyTypes: { value: CompanyType; label: string; labelAr: string; desc: string; descAr: string }[] = [
    { value: "sponsor", label: "Sponsor", labelAr: "راعي", desc: "Sponsor events and competitions", descAr: "رعاية الفعاليات والمسابقات" },
    { value: "supplier", label: "Supplier", labelAr: "مورد", desc: "Supply food, equipment, or materials", descAr: "توريد الغذاء والمعدات والمواد" },
    { value: "partner", label: "Partner", labelAr: "شريك", desc: "Strategic partnership", descAr: "شراكة استراتيجية" },
    { value: "vendor", label: "Vendor", labelAr: "بائع", desc: "Sell products or services", descAr: "بيع المنتجات أو الخدمات" },
  ];

  const classificationOptions = [
    { value: "food_production", label: "Food Production", labelAr: "إنتاج غذائي" },
    { value: "equipment", label: "Equipment & Tools", labelAr: "معدات وأدوات" },
    { value: "catering", label: "Catering Services", labelAr: "خدمات تقديم الطعام" },
    { value: "logistics", label: "Logistics & Delivery", labelAr: "الخدمات اللوجستية والتوصيل" },
    { value: "packaging", label: "Packaging", labelAr: "التغليف" },
    { value: "ingredients", label: "Raw Ingredients", labelAr: "المواد الخام" },
    { value: "technology", label: "Technology & Software", labelAr: "التكنولوجيا والبرمجيات" },
    { value: "marketing", label: "Marketing & Media", labelAr: "التسويق والإعلام" },
    { value: "consulting", label: "Consulting", labelAr: "استشارات" },
    { value: "training", label: "Training & Education", labelAr: "التدريب والتعليم" },
  ];

  const toggleClassification = (value: string) => {
    setForm((prev) => ({
      ...prev,
      classifications: prev.classifications.includes(value)
        ? prev.classifications.filter((c) => c !== value)
        : [...prev.classifications, value],
    }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "company_info":
        return !!(form.name && form.type && form.country_code && form.registration_number);
      case "contact_details":
        return !!(form.email && form.phone && form.contact_name && form.contact_email);
      case "branding":
        return true;
      case "services":
        return true;
      case "review":
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: isAr ? "يرجى تسجيل الدخول أولاً" : "Please sign in first", variant: "destructive" });
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create company
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: form.name,
          name_ar: form.name_ar || null,
          type: form.type,
          description: form.description || null,
          description_ar: form.description_ar || null,
          email: form.email,
          phone: form.phone,
          website: form.website || null,
          address: form.address || null,
          address_ar: form.address_ar || null,
          city: form.city || null,
          country: form.country || null,
          country_code: form.country_code || null,
          postal_code: form.postal_code || null,
          registration_number: form.registration_number || null,
          tax_number: form.tax_number || null,
          classifications: form.classifications.length > 0 ? form.classifications : null,
          logo_url: form.logo_url || null,
          cover_image_url: form.cover_image_url || null,
          status: "pending",
          created_by: user.id,
        })
        .select("id, company_number")
        .single();

      if (companyError) throw companyError;

      // Create contact for the registering user
      const { error: contactError } = await supabase
        .from("company_contacts")
        .insert({
          company_id: company.id,
          user_id: user.id,
          name: form.contact_name,
          name_ar: form.contact_name_ar || null,
          email: form.contact_email,
          phone: form.contact_phone || null,
          title: form.contact_title || null,
          department: form.contact_department,
          is_primary: true,
          can_login: true,
        });

      if (contactError) throw contactError;

      setIsSubmitted(true);
      toast({
        title: isAr ? "تم تقديم التسجيل بنجاح" : "Registration submitted successfully",
        description: isAr
          ? `رقم شركتكم: ${company.company_number}`
          : `Your company number: ${company.company_number}`,
      });
      // Notify admins about new company registration
      import("@/lib/notificationTriggers").then(({ notifyAdminCompanyRegistration }) => {
        notifyAdminCompanyRegistration({
          companyName: form.name,
          companyNameAr: form.name_ar || undefined,
          submittedBy: form.contact_name || user?.email || "User",
        });
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: isAr ? "فشل في التسجيل" : "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container max-w-lg py-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">{isAr ? "تم تقديم التسجيل بنجاح!" : "Registration Submitted!"}</h1>
            <p className="mt-3 text-muted-foreground">
              {isAr
                ? "تم استلام طلب تسجيل شركتكم وهو قيد المراجعة. سنقوم بإبلاغكم عبر البريد الإلكتروني عند تفعيل حسابكم."
                : "Your company registration has been received and is under review. We'll notify you via email once your account is activated."}
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button onClick={() => navigate("/dashboard")}>{isAr ? "لوحة التحكم" : "Dashboard"}</Button>
              <Button variant="outline" onClick={() => navigate("/")}>{isAr ? "الرئيسية" : "Home"}</Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead title={isAr ? "تسجيل شركة" : "Register Company"} description="Register your company" />
      <Header />
      <main className="flex-1">
        <div className="container max-w-3xl py-8">
          {/* Title */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">{isAr ? "تسجيل شركة جديدة" : "Register Your Company"}</h1>
            <p className="mt-2 text-muted-foreground">
              {isAr ? "أكمل النموذج لتسجيل شركتك في المنصة" : "Complete the form to register your company on the platform"}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="mb-8 flex items-center justify-center gap-2">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <button
                  onClick={() => i < stepIndex && setCurrentStep(step)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    i <= stepIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < stepIndex ? <CheckCircle className="h-4 w-4" /> : i + 1}
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 ${i < stepIndex ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <Card>
            {currentStep === "company_info" && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {isAr ? "معلومات الشركة" : "Company Information"}
                  </CardTitle>
                  <CardDescription>{isAr ? "المعلومات الأساسية عن شركتك" : "Basic information about your company"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{isAr ? "اسم الشركة (إنجليزي) *" : "Company Name (English) *"}</Label>
                      <Input value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder={isAr ? "الاسم بالإنجليزية" : "Company name"} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "اسم الشركة (عربي)" : "Company Name (Arabic)"}</Label>
                      <Input value={form.name_ar} onChange={(e) => updateForm("name_ar", e.target.value)} placeholder={isAr ? "الاسم بالعربية" : "Arabic name"} dir="rtl" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{isAr ? "نوع الشركة *" : "Company Type *"}</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {companyTypes.map((ct) => (
                        <button
                          key={ct.value}
                          onClick={() => updateForm("type", ct.value)}
                          className={`rounded-xl border p-3 text-start transition-colors ${
                            form.type === ct.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <p className="font-medium">{isAr ? ct.labelAr : ct.label}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{isAr ? ct.descAr : ct.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{isAr ? "البلد *" : "Country *"}</Label>
                    <CountrySelector
                      value={form.country_code}
                      onChange={(code) => {
                        const c = countries.find((ct) => ct.code === code);
                        updateForm("country_code", code);
                        updateForm("country", c?.name || "");
                      }}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{isAr ? "المدينة" : "City"}</Label>
                      <Input value={form.city} onChange={(e) => updateForm("city", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "الرمز البريدي" : "Postal Code"}</Label>
                      <Input value={form.postal_code} onChange={(e) => updateForm("postal_code", e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{isAr ? "العنوان" : "Address"}</Label>
                    <Input value={form.address} onChange={(e) => updateForm("address", e.target.value)} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{isAr ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
                      <Textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                      <Textarea value={form.description_ar} onChange={(e) => updateForm("description_ar", e.target.value)} rows={3} dir="rtl" />
                    </div>
                  </div>
                </CardContent>
              </>
            )}

            {currentStep === "contact_details" && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    {isAr ? "معلومات الاتصال" : "Contact Details"}
                  </CardTitle>
                  <CardDescription>{isAr ? "بيانات الاتصال بالشركة والمسؤول" : "Company and primary contact information"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <Separator />
                  <p className="text-sm font-medium text-muted-foreground">{isAr ? "بيانات الشركة" : "Company Contact"}</p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{isAr ? "البريد الإلكتروني *" : "Email *"}</Label>
                      <Input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} placeholder="info@company.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "الهاتف *" : "Phone *"}</Label>
                      <Input value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} placeholder="+966 ..." />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{isAr ? "الموقع الإلكتروني" : "Website"}</Label>
                      <Input value={form.website} onChange={(e) => updateForm("website", e.target.value)} placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "رقم السجل التجاري *" : "Commercial Registration Number *"}</Label>
                      <Input value={form.registration_number} onChange={(e) => updateForm("registration_number", e.target.value)} placeholder={isAr ? "رقم السجل التجاري" : "Commercial registration number"} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{isAr ? "الرقم الضريبي" : "Tax Number"}</Label>
                    <Input value={form.tax_number} onChange={(e) => updateForm("tax_number", e.target.value)} />
                  </div>

                  <Separator />
                  <p className="text-sm font-medium text-muted-foreground">{isAr ? "المسؤول الرئيسي" : "Primary Contact Person"}</p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{isAr ? "الاسم (إنجليزي) *" : "Full Name (English) *"}</Label>
                      <Input value={form.contact_name} onChange={(e) => updateForm("contact_name", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "الاسم (عربي)" : "Full Name (Arabic)"}</Label>
                      <Input value={form.contact_name_ar} onChange={(e) => updateForm("contact_name_ar", e.target.value)} dir="rtl" />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{isAr ? "البريد الإلكتروني *" : "Contact Email *"}</Label>
                      <Input type="email" value={form.contact_email} onChange={(e) => updateForm("contact_email", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "هاتف المسؤول" : "Contact Phone"}</Label>
                      <Input value={form.contact_phone} onChange={(e) => updateForm("contact_phone", e.target.value)} />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{isAr ? "المسمى الوظيفي" : "Job Title"}</Label>
                      <Input value={form.contact_title} onChange={(e) => updateForm("contact_title", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "القسم" : "Department"}</Label>
                      <Select value={form.contact_department} onValueChange={(v) => updateForm("contact_department", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="management">{isAr ? "الإدارة" : "Management"}</SelectItem>
                          <SelectItem value="sales">{isAr ? "المبيعات" : "Sales"}</SelectItem>
                          <SelectItem value="operations">{isAr ? "العمليات" : "Operations"}</SelectItem>
                          <SelectItem value="finance">{isAr ? "المالية" : "Finance"}</SelectItem>
                          <SelectItem value="marketing">{isAr ? "التسويق" : "Marketing"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </>
            )}

            {currentStep === "branding" && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {isAr ? "الهوية البصرية" : "Branding & Identity"}
                  </CardTitle>
                  <CardDescription>{isAr ? "شعار الشركة وصورة الغلاف" : "Company logo and cover image"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>{isAr ? "رابط شعار الشركة" : "Company Logo URL"}</Label>
                    <Input
                      value={form.logo_url}
                      onChange={(e) => updateForm("logo_url", e.target.value)}
                      placeholder="https://example.com/logo.png"
                      dir="ltr"
                    />
                    {form.logo_url && (
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/50 p-2">
                          <img src={form.logo_url} alt="Logo preview" className="max-h-full max-w-full object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
                        </div>
                        <p className="text-xs text-muted-foreground">{isAr ? "معاينة الشعار" : "Logo Preview"}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {isAr ? "أدخل رابط مباشر لصورة شعار الشركة (PNG, SVG مفضل)" : "Enter a direct URL to your company logo image (PNG, SVG preferred)"}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>{isAr ? "رابط صورة الغلاف" : "Cover Image URL"}</Label>
                    <Input
                      value={form.cover_image_url}
                      onChange={(e) => updateForm("cover_image_url", e.target.value)}
                      placeholder="https://example.com/cover.jpg"
                      dir="ltr"
                    />
                    {form.cover_image_url && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-border">
                        <img src={form.cover_image_url} alt="Cover preview" className="h-32 w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {isAr ? "صورة الغلاف تظهر في أعلى صفحة الشركة (نسبة 16:9 مفضلة)" : "Cover image appears at the top of your company page (16:9 ratio preferred)"}
                    </p>
                  </div>
                </CardContent>
              </>
            )}

            {currentStep === "services" && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    {isAr ? "الخدمات والتصنيفات" : "Services & Classifications"}
                  </CardTitle>
                  <CardDescription>{isAr ? "اختر التصنيفات التي تنطبق على شركتك" : "Select the classifications that apply to your company"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {classificationOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => toggleClassification(opt.value)}
                        className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                          form.classifications.includes(opt.value)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {isAr ? opt.labelAr : opt.label}
                      </button>
                    ))}
                  </div>
                  {form.classifications.length === 0 && (
                    <p className="mt-4 text-sm text-muted-foreground">
                      {isAr ? "يمكنك تخطي هذه الخطوة وإضافة التصنيفات لاحقاً" : "You can skip this step and add classifications later"}
                    </p>
                  )}
                </CardContent>
              </>
            )}

            {currentStep === "review" && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {isAr ? "مراجعة التسجيل" : "Review Registration"}
                  </CardTitle>
                  <CardDescription>{isAr ? "راجع المعلومات قبل التقديم" : "Review your information before submitting"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="font-medium">{form.name}</span>
                      {form.name_ar && <span className="text-muted-foreground">({form.name_ar})</span>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{companyTypes.find((t) => t.value === form.type)?.[isAr ? "labelAr" : "label"]}</Badge>
                      {form.country_code && <Badge variant="secondary">{form.country}</Badge>}
                      {form.city && <Badge variant="secondary">{form.city}</Badge>}
                    </div>
                    {form.description && <p className="text-sm text-muted-foreground">{form.description}</p>}
                  </div>

                  <div className="rounded-xl border p-4 space-y-2">
                    <p className="text-sm font-medium">{isAr ? "معلومات الاتصال" : "Contact"}</p>
                    <div className="grid gap-1 text-sm">
                      {form.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3" />{form.email}</div>}
                      {form.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3" />{form.phone}</div>}
                      {form.website && <div className="flex items-center gap-2"><Globe className="h-3 w-3" />{form.website}</div>}
                    </div>
                  </div>

                  <div className="rounded-xl border p-4 space-y-2">
                    <p className="text-sm font-medium">{isAr ? "المسؤول الرئيسي" : "Primary Contact"}</p>
                    <div className="grid gap-1 text-sm">
                      <div className="flex items-center gap-2"><Users className="h-3 w-3" />{form.contact_name}</div>
                      <div className="flex items-center gap-2"><Mail className="h-3 w-3" />{form.contact_email}</div>
                    </div>
                  </div>

                  {form.classifications.length > 0 && (
                    <div className="rounded-xl border p-4 space-y-2">
                      <p className="text-sm font-medium">{isAr ? "التصنيفات" : "Classifications"}</p>
                      <div className="flex flex-wrap gap-1">
                        {form.classifications.map((c) => (
                          <Badge key={c} variant="secondary" className="text-xs">
                            {classificationOptions.find((o) => o.value === c)?.[isAr ? "labelAr" : "label"]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-primary mt-0.5" />
                      <p className="text-sm">
                        {isAr
                          ? "سيتم مراجعة طلبكم من قبل فريقنا. ستتلقون إشعاراً عند الموافقة على حسابكم."
                          : "Your application will be reviewed by our team. You'll receive a notification once your account is approved."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between border-t p-6">
              <Button
                variant="ghost"
                onClick={() => stepIndex > 0 ? setCurrentStep(STEPS[stepIndex - 1]) : navigate(-1)}
              >
                {isAr ? <ArrowRight className="me-2 h-4 w-4" /> : <ArrowLeft className="me-2 h-4 w-4" />}
                {isAr ? "السابق" : "Back"}
              </Button>

              {currentStep === "review" ? (
                <Button onClick={handleSubmit} disabled={isSubmitting || !user}>
                  {isSubmitting ? (
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="me-2 h-4 w-4" />
                  )}
                  {isAr ? "تقديم التسجيل" : "Submit Registration"}
                </Button>
              ) : (
                <Button onClick={() => setCurrentStep(STEPS[stepIndex + 1])} disabled={!canProceed()}>
                  {isAr ? "التالي" : "Next"}
                  {isAr ? <ArrowLeft className="ms-2 h-4 w-4" /> : <ArrowRight className="ms-2 h-4 w-4" />}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
