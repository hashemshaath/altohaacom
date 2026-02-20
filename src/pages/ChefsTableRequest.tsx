import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateChefsTableRequest, ExperienceType } from "@/hooks/useChefsTable";
import { useCompanyAccess, useCompanyProfile } from "@/hooks/useCompanyAccess";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, ArrowRight, ChefHat, Building2, Package, MapPin, Send, 
  Globe, Image, Sparkles, CheckCircle2, Users, FileText, Camera,
  Utensils, Flame, Leaf
} from "lucide-react";
import { toast } from "sonner";
import { ProductImageUpload } from "@/components/chefs-table/ProductImageUpload";

// ─── Step Configuration ─────────────────────────

const productCategories = [
  { value: "meat", en: "Meat Products", ar: "منتجات اللحوم", icon: Flame },
  { value: "rice", en: "Rice & Grains", ar: "الأرز والحبوب", icon: Leaf },
  { value: "spices", en: "Spices & Seasonings", ar: "البهارات والتوابل", icon: Sparkles },
  { value: "pasta", en: "Pasta & Noodles", ar: "المعكرونة والنودلز", icon: Utensils },
  { value: "dairy", en: "Dairy Products", ar: "منتجات الألبان", icon: Package },
  { value: "oils", en: "Oils & Fats", ar: "الزيوت والدهون", icon: Package },
  { value: "sauces", en: "Sauces & Condiments", ar: "الصلصات والتوابل", icon: Package },
  { value: "other", en: "Other", ar: "أخرى", icon: Package },
];

const experienceTypes = [
  {
    value: "venue",
    en: "On-Site at a Hotel/Venue",
    ar: "في موقع محدد (فندق/مكان)",
    descEn: "We arrange a professional tasting session at a hotel or designated venue with invited chefs.",
    descAr: "ننظم جلسة تذوق احترافية في فندق أو مكان مخصص مع طهاة مدعوين.",
    icon: Building2,
  },
  {
    value: "chef_kitchen",
    en: "Chef's Own Kitchen",
    ar: "مطبخ الشيف الخاص",
    descEn: "Chefs evaluate your product in their own professional kitchens for authentic cooking conditions.",
    descAr: "يقيّم الطهاة منتجك في مطابخهم المهنية الخاصة لظروف طهي واقعية.",
    icon: ChefHat,
  },
  {
    value: "sample_delivery",
    en: "Sample Delivery to Chefs",
    ar: "توصيل عينات للطهاة",
    descEn: "We ship product samples directly to selected chefs for evaluation at their convenience.",
    descAr: "نشحن عينات المنتج مباشرة للطهاة المختارين لتقييمها في الوقت المناسب لهم.",
    icon: Package,
  },
];

const marketStatusOptions = [
  { value: "existing", en: "Already in the market", ar: "موجود في السوق بالفعل" },
  { value: "new", en: "New product (not yet launched)", ar: "منتج جديد (لم يُطلق بعد)" },
  { value: "reformulated", en: "Reformulated / improved version", ar: "نسخة معاد تركيبها / محسنة" },
];

export default function ChefsTableRequest() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const { user } = useAuth();
  const createRequest = useCreateChefsTableRequest();
  const { companyId: registeredCompanyId, isLoading: companyLoading } = useCompanyAccess();

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Company info
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyNameAr, setCompanyNameAr] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandNameAr, setBrandNameAr] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");

  // Product info
  const [productName, setProductName] = useState("");
  const [productNameAr, setProductNameAr] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [marketStatus, setMarketStatus] = useState("");
  const [productWebsite, setProductWebsite] = useState("");
  const [productImages, setProductImages] = useState<string[]>([]);
  // Experience
  const [experienceType, setExperienceType] = useState<ExperienceType | "">("");
  const [preferredVenue, setPreferredVenue] = useState("");
  const [preferredCity, setPreferredCity] = useState("");
  const [chefCount, setChefCount] = useState(3);
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [goals, setGoals] = useState("");

  // Fetch registered company
  const { data: companyProfile } = useCompanyProfile(registeredCompanyId);

  // Auto-detect registered company
  useEffect(() => {
    if (registeredCompanyId && companyProfile) {
      setIsRegistered(true);
      setCompanyId(registeredCompanyId);
      setCompanyName(companyProfile.name || "");
      setCompanyNameAr(companyProfile.name_ar || "");
      setBrandName(companyProfile.name || "");
      setContactEmail(companyProfile.email || user?.email || "");
      setContactPhone(companyProfile.phone || "");
      setWebsite(companyProfile.website || "");
    } else if (!companyLoading && !registeredCompanyId) {
      setIsRegistered(false);
    }
  }, [registeredCompanyId, companyProfile, companyLoading, user]);

  const totalSteps = 4;

  const canProceed = () => {
    switch (step) {
      case 0: // Company
        if (isRegistered) return !!companyId;
        return !!companyName && !!contactName && !!contactEmail;
      case 1: // Product
        return !!productName && !!productCategory && !!marketStatus;
      case 2: // Experience
        return !!experienceType;
      case 3: // Review
        return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const requestData: any = {
        company_id: companyId || undefined,
        title: `${productName} — ${brandName || companyName}`,
        title_ar: productNameAr ? `${productNameAr} — ${brandNameAr || companyNameAr}` : null,
        product_name: productName,
        product_name_ar: productNameAr || null,
        product_category: productCategory,
        product_images: productImages.length > 0 ? productImages : [],
        product_description: [
          productDescription,
          marketStatus ? `Market Status: ${marketStatus}` : "",
          goals ? `Goals: ${goals}` : "",
          website ? `Company Website: ${website}` : "",
          productWebsite ? `Product Website: ${productWebsite}` : "",
          !isRegistered ? `Company: ${companyName}, Contact: ${contactName}, Email: ${contactEmail}, Phone: ${contactPhone}` : "",
        ].filter(Boolean).join("\n\n"),
        experience_type: experienceType || "venue",
        preferred_venue: preferredVenue || null,
        preferred_city: preferredCity || null,
        chef_count: chefCount,
        special_requirements: specialRequirements || null,
      };
      await createRequest.mutateAsync(requestData);
      toast.success(isAr ? "تم إرسال طلبك بنجاح! سنتواصل معك قريبًا." : "Your request has been submitted! We'll be in touch soon.");
      navigate("/chefs-table");
    } catch {
      toast.error(isAr ? "حدث خطأ، يرجى المحاولة مرة أخرى" : "Something went wrong, please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead title={isAr ? "طلب تقييم منتج | طاولة الشيف" : "Request Product Evaluation | Chef's Table"} />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-3xl px-4 py-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/chefs-table")} className="mb-6 gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            {isAr ? "العودة" : "Back"}
          </Button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 ring-4 ring-primary/5 mb-4">
              <ChefHat className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-serif text-2xl font-black md:text-3xl">{isAr ? "اطلب تقييم منتجك" : "Request Product Evaluation"}</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
              {isAr
                ? "أجب على بعض الأسئلة البسيطة وسنتولى الباقي — من اختيار الطهاة إلى إعداد التقرير الكامل"
                : "Answer a few simple questions and we'll handle the rest — from selecting chefs to delivering your full report"}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-10 flex items-center justify-center gap-2">
            {[
              { en: "Company", ar: "الشركة", icon: Building2 },
              { en: "Product", ar: "المنتج", icon: Package },
              { en: "Experience", ar: "التجربة", icon: ChefHat },
              { en: "Review", ar: "المراجعة", icon: FileText },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                    i === step
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                      : i < step
                      ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{isAr ? s.ar : s.en}</span>
                </button>
                {i < 3 && <div className={`h-px w-6 ${i < step ? "bg-primary/40" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="animate-fade-in">
            {step === 0 && (
              <StepCompany
                isAr={isAr}
                isRegistered={isRegistered}
                companyName={companyName}
                companyLoading={companyLoading}
                companyNameState={companyName}
                setCompanyName={setCompanyName}
                companyNameAr={companyNameAr}
                setCompanyNameAr={setCompanyNameAr}
                brandName={brandName}
                setBrandName={setBrandName}
                brandNameAr={brandNameAr}
                setBrandNameAr={setBrandNameAr}
                contactName={contactName}
                setContactName={setContactName}
                contactEmail={contactEmail}
                setContactEmail={setContactEmail}
                contactPhone={contactPhone}
                setContactPhone={setContactPhone}
                website={website}
                setWebsite={setWebsite}
              />
            )}
            {step === 1 && (
              <StepProduct
                isAr={isAr}
                productName={productName}
                setProductName={setProductName}
                productNameAr={productNameAr}
                setProductNameAr={setProductNameAr}
                productCategory={productCategory}
                setProductCategory={setProductCategory}
                productDescription={productDescription}
                setProductDescription={setProductDescription}
                marketStatus={marketStatus}
                setMarketStatus={setMarketStatus}
                productWebsite={productWebsite}
                setProductWebsite={setProductWebsite}
                productImages={productImages}
                setProductImages={setProductImages}
                userId={user?.id || "anon"}
              />
            )}
            {step === 2 && (
              <StepExperience
                isAr={isAr}
                experienceType={experienceType}
                setExperienceType={setExperienceType}
                preferredVenue={preferredVenue}
                setPreferredVenue={setPreferredVenue}
                preferredCity={preferredCity}
                setPreferredCity={setPreferredCity}
                chefCount={chefCount}
                setChefCount={setChefCount}
                specialRequirements={specialRequirements}
                setSpecialRequirements={setSpecialRequirements}
                goals={goals}
                setGoals={setGoals}
              />
            )}
            {step === 3 && (
              <StepReview
                isAr={isAr}
                companyName={companyName}
                brandName={brandName}
                productName={productName}
                productCategory={productCategory}
                marketStatus={marketStatus}
                experienceType={experienceType}
                chefCount={chefCount}
                goals={goals}
                productImages={productImages}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="gap-2 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" />
              {isAr ? "السابق" : "Previous"}
            </Button>

            {step < totalSteps - 1 ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="gap-2 rounded-xl"
              >
                {isAr ? "التالي" : "Next"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !canProceed()}
                size="lg"
                className="gap-2 rounded-2xl px-8 font-bold shadow-lg shadow-primary/30"
              >
                <Send className="h-5 w-5" />
                {isSubmitting ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "إرسال الطلب" : "Submit Request")}
              </Button>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

// ─── Step Components ────────────────────────────

function StepCompany({ isAr, isRegistered, companyName, companyLoading, companyNameState, setCompanyName, companyNameAr, setCompanyNameAr, brandName, setBrandName, brandNameAr, setBrandNameAr, contactName, setContactName, contactEmail, setContactEmail, contactPhone, setContactPhone, website, setWebsite }: any) {
  if (companyLoading) {
    return <Card className="border-border/40"><CardContent className="p-8 text-center text-muted-foreground">{isAr ? "جاري التحقق من حسابك..." : "Checking your account..."}</CardContent></Card>;
  }

  return (
    <div className="space-y-5">
      {isRegistered ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">{isAr ? "تم اكتشاف شركتك تلقائيًا!" : "Your company detected automatically!"}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "تم سحب معلوماتك من النظام" : "Your information has been pulled from the system"}</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-card/80 p-4 border border-border/40">
              <p className="font-bold">{companyName}</p>
              {website && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Globe className="h-3 w-3" />{website}</p>}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-chart-4/30 bg-chart-4/5">
            <CardContent className="p-5">
              <p className="text-sm font-bold mb-1">{isAr ? "👋 لست مسجلاً كشركة؟ لا مشكلة!" : "👋 Not registered as a company? No problem!"}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "أدخل معلومات شركتك أدناه وسنتعامل مع الباقي" : "Enter your company details below and we'll take care of the rest"}</p>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                {isAr ? "معلومات الشركة" : "Company Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold">{isAr ? "اسم الشركة (بالإنجليزية)" : "Company Name (English)"} *</Label>
                  <Input value={companyNameState} onChange={e => setCompanyName(e.target.value)} className="mt-1.5 rounded-xl" placeholder={isAr ? "مثال: Premium Foods Co." : "e.g. Premium Foods Co."} />
                </div>
                <div>
                  <Label className="text-xs font-bold">{isAr ? "اسم الشركة (بالعربية)" : "Company Name (Arabic)"}</Label>
                  <Input value={companyNameAr} onChange={e => setCompanyNameAr(e.target.value)} className="mt-1.5 rounded-xl" dir="rtl" placeholder="مثال: شركة الأغذية الممتازة" />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Brand Name — for both registered and unregistered */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {isAr ? "العلامة التجارية" : "Brand Name"}
          </CardTitle>
          <CardDescription className="text-xs">{isAr ? "اسم العلامة التجارية للمنتج المراد تقييمه" : "The brand name of the product to be evaluated"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold">{isAr ? "اسم العلامة (EN)" : "Brand Name (EN)"}</Label>
              <Input value={brandName} onChange={e => setBrandName(e.target.value)} className="mt-1.5 rounded-xl" placeholder={isAr ? "مثال: FreshCut" : "e.g. FreshCut"} />
            </div>
            <div>
              <Label className="text-xs font-bold">{isAr ? "اسم العلامة (AR)" : "Brand Name (AR)"}</Label>
              <Input value={brandNameAr} onChange={e => setBrandNameAr(e.target.value)} className="mt-1.5 rounded-xl" dir="rtl" placeholder="مثال: فريش كت" />
            </div>
          </div>
        </CardContent>
      </Card>

      {!isRegistered && (
        <>
          {/* Contact Person */}
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {isAr ? "الشخص المسؤول" : "Contact Person"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs font-bold">{isAr ? "الاسم الكامل" : "Full Name"} *</Label>
                <Input value={contactName} onChange={e => setContactName(e.target.value)} className="mt-1.5 rounded-xl" placeholder={isAr ? "مثال: أحمد محمد" : "e.g. Ahmed Mohammed"} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold">{isAr ? "البريد الإلكتروني" : "Email"} *</Label>
                  <Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="mt-1.5 rounded-xl" placeholder="email@company.com" />
                </div>
                <div>
                  <Label className="text-xs font-bold">{isAr ? "رقم الهاتف" : "Phone Number"}</Label>
                  <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="mt-1.5 rounded-xl" placeholder="+966 5XX XXX XXXX" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Website */}
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                {isAr ? "الموقع الإلكتروني" : "Website"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input value={website} onChange={e => setWebsite(e.target.value)} className="rounded-xl" placeholder="https://www.example.com" />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StepProduct({ isAr, productName, setProductName, productNameAr, setProductNameAr, productCategory, setProductCategory, productDescription, setProductDescription, marketStatus, setMarketStatus, productWebsite, setProductWebsite, productImages, setProductImages, userId }: any) {
  return (
    <div className="space-y-5">
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{isAr ? "ما المنتج الذي تريد تقييمه؟" : "What product would you like evaluated?"}</CardTitle>
          <CardDescription className="text-xs">{isAr ? "أخبرنا عن المنتج الذي تود أن يجربه طهاتنا المحترفون" : "Tell us about the product you'd like our professional chefs to try"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold">{isAr ? "اسم المنتج (EN)" : "Product Name (EN)"} *</Label>
              <Input value={productName} onChange={e => setProductName(e.target.value)} className="mt-1.5 rounded-xl" placeholder={isAr ? "مثال: Premium Lamb Cuts" : "e.g. Premium Lamb Cuts"} />
            </div>
            <div>
              <Label className="text-xs font-bold">{isAr ? "اسم المنتج (AR)" : "Product Name (AR)"}</Label>
              <Input value={productNameAr} onChange={e => setProductNameAr(e.target.value)} className="mt-1.5 rounded-xl" dir="rtl" placeholder="مثال: قطع لحم ضأن ممتازة" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Selection as visual cards */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{isAr ? "ما فئة المنتج؟" : "What category is your product?"} *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {productCategories.map(c => (
              <button
                key={c.value}
                onClick={() => setProductCategory(c.value)}
                className={`rounded-xl border p-3 text-start transition-all hover:shadow-md ${
                  productCategory === c.value
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border/40 bg-card/60 hover:border-primary/30"
                }`}
              >
                <c.icon className={`h-5 w-5 mb-2 ${productCategory === c.value ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-xs font-bold">{isAr ? c.ar : c.en}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Status */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{isAr ? "هل المنتج موجود في السوق؟" : "Is this product already on the market?"} *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {marketStatusOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setMarketStatus(opt.value)}
                className={`w-full rounded-xl border p-3 text-start transition-all ${
                  marketStatus === opt.value
                    ? "border-primary bg-primary/10"
                    : "border-border/40 hover:border-primary/30"
                }`}
              >
                <p className="text-sm font-bold">{isAr ? opt.ar : opt.en}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{isAr ? "أخبرنا المزيد عن منتجك" : "Tell us more about your product"}</CardTitle>
          <CardDescription className="text-xs">{isAr ? "ما الذي يميز منتجك؟ من هو الجمهور المستهدف؟" : "What makes your product unique? Who is the target audience?"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={productDescription}
            onChange={e => setProductDescription(e.target.value)}
            className="rounded-xl min-h-[100px]"
            placeholder={isAr ? "صف منتجك ومميزاته والجمهور المستهدف..." : "Describe your product, its features, and target audience..."}
          />
          <div>
            <Label className="text-xs font-bold">{isAr ? "رابط صفحة المنتج (اختياري)" : "Product Page URL (optional)"}</Label>
            <Input value={productWebsite} onChange={e => setProductWebsite(e.target.value)} className="mt-1.5 rounded-xl" placeholder="https://www.example.com/product" />
          </div>
        </CardContent>
      </Card>

      {/* Product Images */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            {isAr ? "صور المنتج" : "Product Images"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr ? "أضف صور المنتج والتغليف لمساعدة الطهاة في التقييم" : "Add product & packaging photos to help chefs evaluate"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductImageUpload
            images={productImages}
            onImagesChange={setProductImages}
            userId={userId}
            maxImages={5}
            isAr={isAr}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StepExperience({ isAr, experienceType, setExperienceType, preferredVenue, setPreferredVenue, preferredCity, setPreferredCity, chefCount, setChefCount, specialRequirements, setSpecialRequirements, goals, setGoals }: any) {
  return (
    <div className="space-y-5">
      {/* Experience Type as visual cards */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{isAr ? "كيف تفضل أن يتم التقييم؟" : "How would you like the evaluation done?"} *</CardTitle>
          <CardDescription className="text-xs">{isAr ? "اختر الطريقة الأنسب لمنتجك وميزانيتك" : "Choose the method that best suits your product and budget"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {experienceTypes.map(t => (
              <button
                key={t.value}
                onClick={() => setExperienceType(t.value as ExperienceType)}
                className={`w-full rounded-xl border p-4 text-start transition-all flex items-start gap-4 ${
                  experienceType === t.value
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border/40 hover:border-primary/30"
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${experienceType === t.value ? "bg-primary/20" : "bg-muted"}`}>
                  <t.icon className={`h-5 w-5 ${experienceType === t.value ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-sm font-bold">{isAr ? t.ar : t.en}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{isAr ? t.descAr : t.descEn}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {experienceType === "venue" && (
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {isAr ? "الموقع المفضل" : "Preferred Location"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold">{isAr ? "الفندق/المكان" : "Hotel/Venue"}</Label>
              <Input value={preferredVenue} onChange={e => setPreferredVenue(e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-bold">{isAr ? "المدينة" : "City"}</Label>
              <Input value={preferredCity} onChange={e => setPreferredCity(e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chef Count & Goals */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{isAr ? "تفاصيل إضافية" : "Additional Details"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs font-bold">{isAr ? "كم عدد الطهاة الذين تريدهم للتقييم؟" : "How many chefs would you like for the evaluation?"}</Label>
            <div className="flex items-center gap-3 mt-2">
              {[3, 5, 7, 10].map(n => (
                <button
                  key={n}
                  onClick={() => setChefCount(n)}
                  className={`h-10 w-12 rounded-xl border font-bold text-sm transition-all ${
                    chefCount === n ? "border-primary bg-primary/10 text-primary" : "border-border/40 hover:border-primary/30"
                  }`}
                >
                  {n}
                </button>
              ))}
              <Input
                type="number"
                min={1}
                max={20}
                value={chefCount}
                onChange={e => setChefCount(+e.target.value)}
                className="h-10 w-20 rounded-xl text-center"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold">{isAr ? "ما أهدافك من هذا التقييم؟" : "What are your goals for this evaluation?"}</Label>
            <Textarea
              value={goals}
              onChange={e => setGoals(e.target.value)}
              className="mt-1.5 rounded-xl"
              rows={3}
              placeholder={isAr
                ? "مثال: نريد التحقق من جودة المنتج قبل إطلاقه في السوق، والحصول على توصيات من طهاة معروفين..."
                : "e.g. We want to validate product quality before market launch, get endorsements from well-known chefs..."}
            />
          </div>

          <div>
            <Label className="text-xs font-bold">{isAr ? "متطلبات أو ملاحظات خاصة" : "Special Requirements or Notes"}</Label>
            <Textarea
              value={specialRequirements}
              onChange={e => setSpecialRequirements(e.target.value)}
              className="mt-1.5 rounded-xl"
              rows={2}
              placeholder={isAr ? "أي شيء آخر تود إخبارنا به..." : "Anything else you'd like us to know..."}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StepReview({ isAr, companyName, brandName, productName, productCategory, marketStatus, experienceType, chefCount, goals, productImages }: any) {
  const categoryLabel = productCategories.find(c => c.value === productCategory);
  const expLabel = experienceTypes.find(t => t.value === experienceType);
  const marketLabel = marketStatusOptions.find(m => m.value === marketStatus);

  const items = [
    { label: isAr ? "الشركة" : "Company", value: companyName },
    { label: isAr ? "العلامة التجارية" : "Brand", value: brandName },
    { label: isAr ? "المنتج" : "Product", value: productName },
    { label: isAr ? "الفئة" : "Category", value: categoryLabel ? (isAr ? categoryLabel.ar : categoryLabel.en) : "" },
    { label: isAr ? "حالة السوق" : "Market Status", value: marketLabel ? (isAr ? marketLabel.ar : marketLabel.en) : "" },
    { label: isAr ? "نوع التجربة" : "Experience Type", value: expLabel ? (isAr ? expLabel.ar : expLabel.en) : "" },
    { label: isAr ? "عدد الطهاة" : "Number of Chefs", value: chefCount },
  ].filter(i => i.value);

  return (
    <div className="space-y-5">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <div>
              <p className="font-bold">{isAr ? "راجع طلبك قبل الإرسال" : "Review Your Request Before Submitting"}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "تأكد من صحة المعلومات — يمكنك الرجوع وتعديل أي خطوة" : "Make sure everything looks right — you can go back and edit any step"}</p>
            </div>
          </div>

          <div className="space-y-3 mt-6">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-card/80 border border-border/40 px-4 py-3">
                <span className="text-xs font-bold text-muted-foreground">{item.label}</span>
                <span className="text-sm font-bold">{item.value}</span>
              </div>
            ))}
          </div>

          {goals && (
            <div className="mt-4 rounded-xl bg-card/80 border border-border/40 p-4">
              <p className="text-xs font-bold text-muted-foreground mb-1">{isAr ? "الأهداف" : "Goals"}</p>
              <p className="text-sm text-foreground">{goals}</p>
            </div>
          )}

          {productImages && productImages.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold text-muted-foreground mb-2">{isAr ? "صور المنتج" : "Product Images"}</p>
              <div className="grid grid-cols-5 gap-2">
                {productImages.map((url: string, i: number) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border/40">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* What happens next */}
      <Card className="border-border/40">
        <CardContent className="p-6">
          <h3 className="font-bold text-sm mb-4">{isAr ? "ماذا يحدث بعد الإرسال؟" : "What happens after you submit?"}</h3>
          <div className="space-y-3">
            {[
              { en: "Our team reviews your request within 24-48 hours", ar: "فريقنا يراجع طلبك خلال 24-48 ساعة" },
              { en: "We select the best specialist chefs for your product category", ar: "نختار أفضل الطهاة المتخصصين لفئة منتجك" },
              { en: "Chefs are invited and a session is scheduled", ar: "يتم دعوة الطهاة وجدولة الجلسة" },
              { en: "You receive a full report with scores, media, and endorsements", ar: "تحصل على تقرير كامل بالدرجات والوسائط والتوصيات" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</div>
                <p className="text-xs text-muted-foreground">{isAr ? s.ar : s.en}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
