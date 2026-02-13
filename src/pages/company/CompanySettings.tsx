import { useState, useEffect } from "react";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, CreditCard, Bell, Globe } from "lucide-react";

export default function CompanySettings() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ["companySettings", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const [form, setForm] = useState({
    currency: "SAR",
    payment_terms: 30,
    credit_limit: 0,
    tax_number: "",
    registration_number: "",
  });

  useEffect(() => {
    if (company) {
      setForm({
        currency: company.currency || "SAR",
        payment_terms: company.payment_terms || 30,
        credit_limit: company.credit_limit || 0,
        tax_number: company.tax_number || "",
        registration_number: company.registration_number || "",
      });
    }
  }, [company]);

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
        })
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companySettings"] });
      toast({ title: language === "ar" ? "تم الحفظ" : "Settings saved" });
    },
    onError: () => toast({ variant: "destructive", title: language === "ar" ? "فشل الحفظ" : "Failed to save" }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            {language === "ar" ? "الإعدادات" : "Settings"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {language === "ar" ? "إعدادات حساب الشركة" : "Company account settings"}
          </p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {saveMutation.isPending ? (language === "ar" ? "جارٍ الحفظ..." : "Saving...") : (language === "ar" ? "حفظ" : "Save")}
        </Button>
      </div>

      {/* Financial Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            {language === "ar" ? "الإعدادات المالية" : "Financial Settings"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{language === "ar" ? "العملة" : "Currency"}</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR - ريال سعودي</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                  <SelectItem value="KWD">KWD - Kuwaiti Dinar</SelectItem>
                  <SelectItem value="BHD">BHD - Bahraini Dinar</SelectItem>
                  <SelectItem value="QAR">QAR - Qatari Riyal</SelectItem>
                  <SelectItem value="OMR">OMR - Omani Rial</SelectItem>
                  <SelectItem value="TND">TND - Tunisian Dinar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "شروط الدفع (أيام)" : "Payment Terms (days)"}</Label>
              <Input
                type="number"
                value={form.payment_terms}
                onChange={(e) => setForm({ ...form, payment_terms: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "الحد الائتماني" : "Credit Limit"}</Label>
              <Input
                type="number"
                value={form.credit_limit}
                onChange={(e) => setForm({ ...form, credit_limit: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal / Tax */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            {language === "ar" ? "المعلومات القانونية" : "Legal Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{language === "ar" ? "الرقم الضريبي" : "Tax Number"}</Label>
              <Input
                value={form.tax_number}
                onChange={(e) => setForm({ ...form, tax_number: e.target.value })}
                placeholder={language === "ar" ? "أدخل الرقم الضريبي" : "Enter tax number"}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "رقم السجل التجاري" : "Registration Number"}</Label>
              <Input
                value={form.registration_number}
                onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
                placeholder={language === "ar" ? "أدخل رقم السجل" : "Enter registration number"}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Info Summary */}
      {company && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{language === "ar" ? "معلومات الشركة" : "Company Info"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === "ar" ? "رقم الشركة" : "Company Number"}</span>
                <span className="font-mono">{company.company_number || "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === "ar" ? "النوع" : "Type"}</span>
                <span className="capitalize">{company.type}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === "ar" ? "الحالة" : "Status"}</span>
                <span className="capitalize">{company.status || "active"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === "ar" ? "البريد الإلكتروني" : "Email"}</span>
                <span>{company.email || "—"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
