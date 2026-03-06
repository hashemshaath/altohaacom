import { useState, useEffect, useMemo } from "react";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, CreditCard, Phone, MapPin, Palette, Share2, Building2, Loader2 } from "lucide-react";
import { CompanyPageGuard } from "@/components/company/CompanyPageGuard";
import { FinancialSettingsCard } from "./settings/FinancialSettingsCard";
import { LegalInfoCard } from "./settings/LegalInfoCard";
import { ContactSettingsCard } from "./settings/ContactSettingsCard";
import { SocialLinksCard } from "./settings/SocialLinksCard";
import { AddressSettingsCard } from "./settings/AddressSettingsCard";
import { CompanyInfoSummaryCard } from "./settings/CompanyInfoSummaryCard";
import { BrandingSettingsCard } from "./settings/BrandingSettingsCard";

const DEFAULT_FORM = {
  currency: "SAR",
  payment_terms: 30,
  credit_limit: 0,
  tax_number: "",
  registration_number: "",
  email: "",
  website: "",
  phone: "",
  phone_secondary: "",
  fax: "",
  google_maps_url: "",
  city: "",
  country_code: "",
  district: "",
  district_ar: "",
  street: "",
  street_ar: "",
  postal_code: "",
  national_address: "",
  tagline: "",
  tagline_ar: "",
  description: "",
  description_ar: "",
  founded_year: null as number | null,
};

type SocialLinks = { twitter?: string; instagram?: string; linkedin?: string; facebook?: string; tiktok?: string; snapchat?: string };

function CompanySettingsContent() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { companyId } = useCompanyAccess();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ["companySettings", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase.from("companies").select("*").eq("id", companyId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const [form, setForm] = useState(DEFAULT_FORM);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});

  useEffect(() => {
    if (company) {
      setForm({
        currency: company.currency || "SAR",
        payment_terms: company.payment_terms || 30,
        credit_limit: company.credit_limit || 0,
        tax_number: company.tax_number || "",
        registration_number: company.registration_number || "",
        email: company.email || "",
        website: company.website || "",
        phone: company.phone || "",
        phone_secondary: company.phone_secondary || "",
        fax: company.fax || "",
        google_maps_url: company.google_maps_url || "",
        city: company.city || "",
        country_code: company.country_code || "",
        district: company.district || "",
        district_ar: company.district_ar || "",
        street: company.street || "",
        street_ar: company.street_ar || "",
        postal_code: company.postal_code || "",
        national_address: company.national_address || "",
        tagline: company.tagline || "",
        tagline_ar: company.tagline_ar || "",
        description: company.description || "",
        description_ar: company.description_ar || "",
        founded_year: company.founded_year || null,
      });
      setSocialLinks((company.social_links as SocialLinks) || {});
    }
  }, [company]);

  const hasChanges = useMemo(() => {
    if (!company) return false;
    const orig = {
      currency: company.currency || "SAR",
      payment_terms: company.payment_terms || 30,
      credit_limit: company.credit_limit || 0,
      tax_number: company.tax_number || "",
      registration_number: company.registration_number || "",
      email: company.email || "",
      website: company.website || "",
      phone: company.phone || "",
      phone_secondary: company.phone_secondary || "",
      fax: company.fax || "",
      google_maps_url: company.google_maps_url || "",
      city: company.city || "",
      country_code: company.country_code || "",
      district: company.district || "",
      district_ar: company.district_ar || "",
      street: company.street || "",
      street_ar: company.street_ar || "",
      postal_code: company.postal_code || "",
      national_address: company.national_address || "",
      tagline: company.tagline || "",
      tagline_ar: company.tagline_ar || "",
      description: company.description || "",
      description_ar: company.description_ar || "",
      founded_year: company.founded_year || null,
    };
    return JSON.stringify(form) !== JSON.stringify(orig) ||
      JSON.stringify(socialLinks) !== JSON.stringify((company.social_links as SocialLinks) || {});
  }, [form, socialLinks, company]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No company");
      const { error } = await supabase
        .from("companies")
        .update({
          currency: form.currency,
          payment_terms: form.payment_terms,
          credit_limit: form.credit_limit,
          tax_number: form.tax_number || null,
          registration_number: form.registration_number || null,
          email: form.email || null,
          website: form.website || null,
          phone: form.phone || null,
          phone_secondary: form.phone_secondary || null,
          fax: form.fax || null,
          google_maps_url: form.google_maps_url || null,
          city: form.city || null,
          country_code: form.country_code || null,
          district: form.district || null,
          district_ar: form.district_ar || null,
          street: form.street || null,
          street_ar: form.street_ar || null,
          postal_code: form.postal_code || null,
          national_address: form.national_address || null,
          tagline: form.tagline || null,
          tagline_ar: form.tagline_ar || null,
          description: form.description || null,
          description_ar: form.description_ar || null,
          founded_year: form.founded_year || null,
          social_links: socialLinks as any,
        })
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companySettings"] });
      queryClient.invalidateQueries({ queryKey: ["companyProfile"] });
      toast({ title: isAr ? "✅ تم حفظ الإعدادات بنجاح" : "✅ Settings saved successfully" });
    },
    onError: () => toast({ variant: "destructive", title: isAr ? "فشل الحفظ" : "Failed to save" }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  const TABS = [
    { value: "financial", icon: CreditCard, label: isAr ? "المالية" : "Financial", labelAr: "المالية" },
    { value: "contact", icon: Phone, label: isAr ? "الاتصال" : "Contact", labelAr: "الاتصال" },
    { value: "address", icon: MapPin, label: isAr ? "العنوان" : "Address", labelAr: "العنوان" },
    { value: "branding", icon: Palette, label: isAr ? "الهوية" : "Branding", labelAr: "الهوية" },
    { value: "social", icon: Share2, label: isAr ? "التواصل" : "Social", labelAr: "التواصل" },
    { value: "overview", icon: Building2, label: isAr ? "نظرة عامة" : "Overview", labelAr: "نظرة عامة" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            {isAr ? "إعدادات الشركة" : "Company Settings"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground ms-[52px]">
            {isAr ? "إدارة جميع إعدادات حساب الشركة من مكان واحد" : "Manage all company account settings in one place"}
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !hasChanges}
          className="rounded-xl gap-2 min-w-[140px]"
          size="lg"
        >
          {saveMutation.isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Save className="h-4 w-4" />}
          {saveMutation.isPending
            ? (isAr ? "جارٍ الحفظ..." : "Saving...")
            : (isAr ? "حفظ التغييرات" : "Save Changes")}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="w-full h-auto flex-wrap justify-start gap-1 bg-muted/30 p-1.5 rounded-2xl">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-2"
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-5">
          <TabsContent value="financial" className="space-y-5 mt-0">
            <FinancialSettingsCard form={form} setForm={setForm} isAr={isAr} />
            <LegalInfoCard form={form} setForm={setForm} isAr={isAr} />
          </TabsContent>

          <TabsContent value="contact" className="mt-0">
            <ContactSettingsCard form={form} setForm={setForm} isAr={isAr} />
          </TabsContent>

          <TabsContent value="address" className="mt-0">
            <AddressSettingsCard form={form} setForm={setForm} isAr={isAr} />
          </TabsContent>

          <TabsContent value="branding" className="mt-0">
            <BrandingSettingsCard form={form} setForm={setForm} isAr={isAr} />
          </TabsContent>

          <TabsContent value="social" className="mt-0">
            <SocialLinksCard socialLinks={socialLinks} setSocialLinks={setSocialLinks} isAr={isAr} />
          </TabsContent>

          <TabsContent value="overview" className="mt-0">
            {company && <CompanyInfoSummaryCard company={company} isAr={isAr} />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default function CompanySettings() {
  return (
    <CompanyPageGuard page="settings">
      <CompanySettingsContent />
    </CompanyPageGuard>
  );
}
