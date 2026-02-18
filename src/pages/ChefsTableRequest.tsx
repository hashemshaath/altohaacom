import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateChefsTableRequest, ExperienceType } from "@/hooks/useChefsTable";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ChefHat, Building2, Package, MapPin, Send } from "lucide-react";
import { toast } from "sonner";

const productCategories = [
  { value: "meat", en: "Meat Products", ar: "منتجات اللحوم" },
  { value: "rice", en: "Rice & Grains", ar: "الأرز والحبوب" },
  { value: "spices", en: "Spices & Seasonings", ar: "البهارات والتوابل" },
  { value: "pasta", en: "Pasta & Noodles", ar: "المعكرونة والنودلز" },
  { value: "dairy", en: "Dairy Products", ar: "منتجات الألبان" },
  { value: "oils", en: "Oils & Fats", ar: "الزيوت والدهون" },
  { value: "sauces", en: "Sauces & Condiments", ar: "الصلصات والتوابل" },
  { value: "other", en: "Other", ar: "أخرى" },
];

const experienceTypes = [
  { value: "venue", en: "On-Site (Hotel/Venue)", ar: "في موقع محدد (فندق/مكان)" },
  { value: "chef_kitchen", en: "Chef's Own Kitchen", ar: "مطبخ الشيف الخاص" },
  { value: "sample_delivery", en: "Sample Delivery", ar: "توصيل عينات للطهاة" },
];

export default function ChefsTableRequest() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const { user } = useAuth();
  const createRequest = useCreateChefsTableRequest();

  const [companyId, setCompanyId] = useState("");
  const [title, setTitle] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [productName, setProductName] = useState("");
  const [productNameAr, setProductNameAr] = useState("");
  const [productCategory, setProductCategory] = useState("meat");
  const [productDescription, setProductDescription] = useState("");
  const [experienceType, setExperienceType] = useState<ExperienceType>("venue");
  const [preferredVenue, setPreferredVenue] = useState("");
  const [preferredCity, setPreferredCity] = useState("");
  const [chefCount, setChefCount] = useState(3);
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user's company
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  useState(() => {
    if (user?.id) {
      supabase
        .from("companies")
        .select("id, name")
        .then(({ data }) => {
          if (data) setCompanies(data);
          if (data?.length === 1) setCompanyId(data[0].id);
        });
    }
  });

  const handleSubmit = async () => {
    if (!companyId || !title || !productName) {
      toast.error(isAr ? "يرجى ملء الحقول المطلوبة" : "Please fill required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await createRequest.mutateAsync({
        company_id: companyId,
        title,
        title_ar: titleAr || null,
        product_name: productName,
        product_name_ar: productNameAr || null,
        product_category: productCategory,
        product_description: productDescription || null,
        experience_type: experienceType,
        preferred_venue: preferredVenue || null,
        preferred_city: preferredCity || null,
        chef_count: chefCount,
        special_requirements: specialRequirements || null,
      } as any);
      toast.success(isAr ? "تم إرسال الطلب بنجاح" : "Request submitted successfully");
      navigate("/chefs-table");
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead title={isAr ? "طلب تقييم منتج | طاولة الشيف" : "Request Product Evaluation | Chef's Table"} />
      <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
        <Header />
        <main className="container mx-auto max-w-2xl px-4 py-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/chefs-table")} className="mb-4 gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            {isAr ? "العودة" : "Back"}
          </Button>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <ChefHat className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black">{isAr ? "طلب تقييم منتج" : "Request Product Evaluation"}</h1>
              <p className="text-sm text-muted-foreground">{isAr ? "قدّم منتجك لتقييم طهاة محترفين" : "Submit your product for professional chef evaluation"}</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Company Selection */}
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  {isAr ? "الشركة" : "Company"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder={isAr ? "اختر الشركة" : "Select company"} /></SelectTrigger>
                  <SelectContent>
                    {companies.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Request Details */}
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{isAr ? "تفاصيل الطلب" : "Request Details"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{isAr ? "عنوان الطلب (EN)" : "Request Title (EN)"} *</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 rounded-xl" />
                  </div>
                  <div>
                    <Label>{isAr ? "عنوان الطلب (AR)" : "Request Title (AR)"}</Label>
                    <Input value={titleAr} onChange={e => setTitleAr(e.target.value)} className="mt-1 rounded-xl" dir="rtl" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Info */}
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  {isAr ? "معلومات المنتج" : "Product Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{isAr ? "اسم المنتج (EN)" : "Product Name (EN)"} *</Label>
                    <Input value={productName} onChange={e => setProductName(e.target.value)} className="mt-1 rounded-xl" />
                  </div>
                  <div>
                    <Label>{isAr ? "اسم المنتج (AR)" : "Product Name (AR)"}</Label>
                    <Input value={productNameAr} onChange={e => setProductNameAr(e.target.value)} className="mt-1 rounded-xl" dir="rtl" />
                  </div>
                </div>
                <div>
                  <Label>{isAr ? "فئة المنتج" : "Product Category"}</Label>
                  <Select value={productCategory} onValueChange={setProductCategory}>
                    <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {productCategories.map(c => (
                        <SelectItem key={c.value} value={c.value}>{isAr ? c.ar : c.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isAr ? "وصف المنتج" : "Product Description"}</Label>
                  <Textarea value={productDescription} onChange={e => setProductDescription(e.target.value)} className="mt-1 rounded-xl" rows={3} />
                </div>
              </CardContent>
            </Card>

            {/* Experience Type */}
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {isAr ? "نوع التجربة" : "Experience Type"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={experienceType} onValueChange={v => setExperienceType(v as ExperienceType)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {experienceTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {experienceType === "venue" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{isAr ? "المكان المفضل" : "Preferred Venue"}</Label>
                      <Input value={preferredVenue} onChange={e => setPreferredVenue(e.target.value)} className="mt-1 rounded-xl" />
                    </div>
                    <div>
                      <Label>{isAr ? "المدينة" : "City"}</Label>
                      <Input value={preferredCity} onChange={e => setPreferredCity(e.target.value)} className="mt-1 rounded-xl" />
                    </div>
                  </div>
                )}
                <div>
                  <Label>{isAr ? "عدد الطهاة المطلوب" : "Number of Chefs"}</Label>
                  <Input type="number" min={1} max={20} value={chefCount} onChange={e => setChefCount(+e.target.value)} className="mt-1 rounded-xl w-32" />
                </div>
                <div>
                  <Label>{isAr ? "متطلبات خاصة" : "Special Requirements"}</Label>
                  <Textarea value={specialRequirements} onChange={e => setSpecialRequirements(e.target.value)} className="mt-1 rounded-xl" rows={3} />
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="w-full gap-2 rounded-2xl py-7 text-lg font-bold">
              <Send className="h-5 w-5" />
              {isSubmitting ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "إرسال الطلب" : "Submit Request")}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
