import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Save, Type, Package, FileBarChart, Store, Palette,
  Image, AlignLeft, AlignCenter, AlignRight, Bold, Stamp, Droplets,
} from "lucide-react";

export default function InvoiceCustomization() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["invoice-settings-global"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_settings")
        .select("*")
        .is("company_id", null)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState<Record<string, any>>({});

  // Merge settings into form on load
  const s = { ...settings, ...form };

  const updateField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!settings?.id) throw new Error("No settings found");
      const { error } = await supabase
        .from("invoice_settings")
        .update({
          ...form,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice-settings-global"] });
      setForm({});
      toast({ title: isAr ? "تم حفظ الإعدادات" : "Settings saved" });
    },
    onError: (err) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const hasChanges = Object.keys(form).length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            {isAr ? "تخصيص الفواتير" : "Invoice Customization"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isAr ? "تخصيص محتوى الفاتورة وتصميمها وطريقة إصدارها" : "Customize invoice content, design, and issuance method"}
          </p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={!hasChanges || saveMutation.isPending}>
          <Save className="me-2 h-4 w-4" />
          {isAr ? "حفظ التغييرات" : "Save Changes"}
          {hasChanges && <Badge variant="secondary" className="ms-2 text-[10px]">{Object.keys(form).length}</Badge>}
        </Button>
      </div>

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="content" className="gap-1.5">
            <Type className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? "المحتوى" : "Content"}</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5">
            <Package className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? "المنتجات" : "Products"}</span>
          </TabsTrigger>
          <TabsTrigger value="order" className="gap-1.5">
            <FileBarChart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? "الطلب" : "Order"}</span>
          </TabsTrigger>
          <TabsTrigger value="store" className="gap-1.5">
            <Store className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? "المتجر" : "Store"}</span>
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? "التصميم" : "Design"}</span>
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Invoice Content ── */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "عنوان الفاتورة" : "Invoice Title"}</CardTitle>
              <CardDescription>{isAr ? "العنوان المعروض للعميل في الفاتورة" : "The title displayed to the customer on the invoice"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{isAr ? "العنوان (إنجليزي)" : "Title (English)"}</Label>
                  <Input
                    value={s.invoice_title ?? "Invoice"}
                    onChange={(e) => updateField("invoice_title", e.target.value)}
                    placeholder="Invoice"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
                  <Input
                    value={s.invoice_title_ar ?? "فاتورة"}
                    onChange={(e) => updateField("invoice_title_ar", e.target.value)}
                    placeholder="فاتورة"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isAr ? "نمط العنوان" : "Title Style"}</Label>
                <div className="flex gap-2">
                  {[
                    { val: "default", label: isAr ? "افتراضي" : "Default" },
                    { val: "custom", label: isAr ? "مخصص" : "Custom" },
                  ].map((opt) => (
                    <Button
                      key={opt.val}
                      variant={(s.title_style ?? "default") === opt.val ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateField("title_style", opt.val)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "اسم المتجر" : "Store Name"}</CardTitle>
              <CardDescription>{isAr ? "تخصيص النص المعروض قبل اسم المتجر في قسم \"صدر بواسطة\"" : "Customize the text displayed before the store name in the \"Issued by\" section"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{isAr ? "بادئة (إنجليزي)" : "Prefix (English)"}</Label>
                  <Input
                    value={s.store_name_prefix ?? "E-commerce store"}
                    onChange={(e) => updateField("store_name_prefix", e.target.value)}
                    placeholder="E-commerce store"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "بادئة (عربي)" : "Prefix (Arabic)"}</Label>
                  <Input
                    value={s.store_name_prefix_ar ?? "متجر إلكتروني"}
                    onChange={(e) => updateField("store_name_prefix_ar", e.target.value)}
                    placeholder="متجر إلكتروني"
                    dir="rtl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 2: Product Information ── */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "معلومات المنتج" : "Product Information"}</CardTitle>
              <CardDescription>{isAr ? "اختر المعلومات التي تريد عرضها لكل منتج في الفاتورة" : "Choose which product details to show on the invoice"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "show_product_image", en: "Show product image", ar: "عرض صورة المنتج" },
                { key: "show_product_description", en: "Show product description", ar: "عرض وصف المنتج" },
                { key: "show_gtin_code", en: "Show GTIN code", ar: "عرض رمز GTIN" },
                { key: "show_mpn_code", en: "Show MPN code", ar: "عرض رمز MPN" },
                { key: "show_product_weight", en: "Show product weight", ar: "عرض وزن المنتج" },
                { key: "show_product_stock_number", en: "Show product stock number", ar: "عرض رقم مخزون المنتج" },
                { key: "show_product_barcode", en: "Show product barcode", ar: "عرض باركود المنتج" },
              ].map((toggle) => (
                <div key={toggle.key} className="flex items-center justify-between rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/30">
                  <Label htmlFor={toggle.key} className="cursor-pointer font-medium">
                    {isAr ? toggle.ar : toggle.en}
                  </Label>
                  <Switch
                    id={toggle.key}
                    checked={s[toggle.key] ?? false}
                    onCheckedChange={(checked) => updateField(toggle.key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 3: Order and Invoice Information ── */}
        <TabsContent value="order" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "معلومات الطلب والفاتورة" : "Order and Invoice Information"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "show_invoice_barcode", en: "Show invoice barcode", ar: "عرض باركود الفاتورة" },
                {
                  key: "issue_english_copy",
                  en: "Issue a copy of the invoice in English",
                  ar: "إصدار نسخة من الفاتورة بالإنجليزية",
                  desc: isAr
                    ? "عند التفعيل، سيظهر خيار إضافي لطباعة الفاتورة بالإنجليزية"
                    : "When activated, an additional option to print the invoice in English will appear",
                },
                { key: "show_invoice_acknowledgment", en: "Show invoice acknowledgment / order summary", ar: "عرض إقرار الفاتورة / ملخص الطلب" },
                { key: "show_order_note", en: "Show order note", ar: "عرض ملاحظة الطلب" },
                { key: "show_return_policy", en: "Show return and exchange policy", ar: "عرض سياسة الإرجاع والاستبدال" },
              ].map((toggle) => (
                <div key={toggle.key} className="flex items-center justify-between rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/30">
                  <div>
                    <Label htmlFor={toggle.key} className="cursor-pointer font-medium">
                      {isAr ? toggle.ar : toggle.en}
                    </Label>
                    {"desc" in toggle && toggle.desc && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{toggle.desc}</p>
                    )}
                  </div>
                  <Switch
                    id={toggle.key}
                    checked={s[toggle.key] ?? false}
                    onCheckedChange={(checked) => updateField(toggle.key, checked)}
                  />
                </div>
              ))}

              {s.show_return_policy && (
                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div className="space-y-2">
                    <Label>{isAr ? "سياسة الإرجاع (إنجليزي)" : "Return Policy (English)"}</Label>
                    <Textarea
                      value={s.return_policy_text ?? ""}
                      onChange={(e) => updateField("return_policy_text", e.target.value)}
                      rows={3}
                      placeholder={isAr ? "أدخل سياسة الإرجاع..." : "Enter return policy..."}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "سياسة الإرجاع (عربي)" : "Return Policy (Arabic)"}</Label>
                    <Textarea
                      value={s.return_policy_text_ar ?? ""}
                      onChange={(e) => updateField("return_policy_text_ar", e.target.value)}
                      rows={3}
                      dir="rtl"
                      placeholder="أدخل سياسة الإرجاع..."
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "إرسال الفاتورة تلقائياً" : "Send Invoice Automatically"}</CardTitle>
              <CardDescription>
                {isAr ? "اختر حالات الطلب التي يتم فيها إرسال الفاتورة تلقائياً" : "Choose the order statuses in which you want the invoice to be sent automatically"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <Label htmlFor="auto_send_invoice" className="cursor-pointer font-medium">
                  {isAr ? "إرسال تفاصيل الفاتورة/الطلب تلقائياً" : "Send the invoice/order details automatically"}
                </Label>
                <Switch
                  id="auto_send_invoice"
                  checked={s.auto_send_invoice ?? false}
                  onCheckedChange={(checked) => updateField("auto_send_invoice", checked)}
                />
              </div>

              {s.auto_send_invoice && (
                <div className="space-y-2 pt-2">
                  <Label>{isAr ? "متى يتم الإرسال" : "When to send the invoice"}</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { val: "pending", en: "Pending", ar: "قيد الانتظار" },
                      { val: "sent", en: "Sent", ar: "مرسلة" },
                      { val: "paid", en: "Paid", ar: "مدفوعة" },
                      { val: "shipped", en: "Shipped", ar: "تم الشحن" },
                      { val: "delivered", en: "Delivered", ar: "تم التسليم" },
                    ].map((status) => {
                      const current: string[] = s.auto_send_statuses ?? ["paid"];
                      const active = current.includes(status.val);
                      return (
                        <Button
                          key={status.val}
                          variant={active ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const updated = active
                              ? current.filter((v: string) => v !== status.val)
                              : [...current, status.val];
                            updateField("auto_send_statuses", updated);
                          }}
                        >
                          {isAr ? status.ar : status.en}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 4: Store and Contact Information ── */}
        <TabsContent value="store" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "معلومات المتجر والتواصل" : "Store and Contact Information"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <Label htmlFor="show_store_address" className="cursor-pointer font-medium">
                  {isAr ? "عرض عنوان المتجر" : "Show store address"}
                </Label>
                <Switch
                  id="show_store_address"
                  checked={s.show_store_address ?? true}
                  onCheckedChange={(checked) => updateField("show_store_address", checked)}
                />
              </div>

              {s.show_store_address && (
                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div className="space-y-2">
                    <Label>{isAr ? "العنوان (إنجليزي)" : "Address (English)"}</Label>
                    <Textarea
                      value={s.store_address ?? ""}
                      onChange={(e) => updateField("store_address", e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "العنوان (عربي)" : "Address (Arabic)"}</Label>
                    <Textarea
                      value={s.store_address_ar ?? ""}
                      onChange={(e) => updateField("store_address_ar", e.target.value)}
                      rows={2}
                      dir="rtl"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <Label htmlFor="show_contact_info" className="cursor-pointer font-medium">
                  {isAr ? "عرض معلومات التواصل" : "Show contact information"}
                </Label>
                <Switch
                  id="show_contact_info"
                  checked={s.show_contact_info ?? true}
                  onCheckedChange={(checked) => updateField("show_contact_info", checked)}
                />
              </div>

              {s.show_contact_info && (
                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div className="space-y-2">
                    <Label>{isAr ? "البريد الإلكتروني" : "Contact Email"}</Label>
                    <Input
                      type="email"
                      value={s.contact_email ?? ""}
                      onChange={(e) => updateField("contact_email", e.target.value)}
                      placeholder="billing@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "رقم الهاتف" : "Contact Phone"}</Label>
                    <Input
                      value={s.contact_phone ?? ""}
                      onChange={(e) => updateField("contact_phone", e.target.value)}
                      placeholder="+966 ..."
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 5: Design and Branding ── */}
        <TabsContent value="design" className="space-y-6">
          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                {isAr ? "الشعار" : "Logo"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{isAr ? "رابط الشعار" : "Logo URL"}</Label>
                <Input
                  value={s.logo_url ?? ""}
                  onChange={(e) => updateField("logo_url", e.target.value)}
                  placeholder="https://..."
                />
              </div>

              {s.logo_url && (
                <div className="flex justify-center rounded-lg border border-dashed p-4">
                  <img src={s.logo_url} alt="Logo" className="max-h-20 object-contain" />
                </div>
              )}

              <div className="space-y-2">
                <Label>{isAr ? "حجم الشعار" : "Logo Size"} ({s.logo_size ?? 80}%)</Label>
                <Slider
                  value={[s.logo_size ?? 80]}
                  onValueChange={([v]) => updateField("logo_size", v)}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>{isAr ? "موضع الشعار" : "Logo Position"}</Label>
                <div className="flex gap-2">
                  {[
                    { val: "right", icon: AlignRight, label: isAr ? "يمين" : "Right" },
                    { val: "center", icon: AlignCenter, label: isAr ? "وسط" : "Center" },
                    { val: "left", icon: AlignLeft, label: isAr ? "يسار" : "Left" },
                  ].map((pos) => (
                    <Button
                      key={pos.val}
                      variant={(s.logo_position ?? "right") === pos.val ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateField("logo_position", pos.val)}
                      className="gap-1.5"
                    >
                      <pos.icon className="h-3.5 w-3.5" />
                      {pos.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fonts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bold className="h-4 w-4" />
                {isAr ? "الخطوط" : "Fonts"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{isAr ? "الخط الرئيسي" : "Main Font"}</Label>
                  <div className="flex gap-2">
                    {[
                      { val: "bold", label: isAr ? "عريض" : "Bold" },
                      { val: "regular", label: isAr ? "عادي" : "Regular" },
                    ].map((opt) => (
                      <Button
                        key={opt.val}
                        variant={(s.main_font_weight ?? "bold") === opt.val ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateField("main_font_weight", opt.val)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "الخط الفرعي" : "Sub Font"}</Label>
                  <div className="flex gap-2">
                    {[
                      { val: "bold", label: isAr ? "عريض" : "Bold" },
                      { val: "regular", label: isAr ? "عادي" : "Regular" },
                    ].map((opt) => (
                      <Button
                        key={opt.val}
                        variant={(s.sub_font_weight ?? "regular") === opt.val ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateField("sub_font_weight", opt.val)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isAr ? "اللون الرئيسي" : "Primary Color"}</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={s.primary_color ?? "#10b981"}
                    onChange={(e) => updateField("primary_color", e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border p-1"
                  />
                  <Input
                    value={s.primary_color ?? "#10b981"}
                    onChange={(e) => updateField("primary_color", e.target.value)}
                    className="max-w-32"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Watermark */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                {isAr ? "العلامة المائية" : "Watermark"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{isAr ? "رابط العلامة المائية" : "Watermark URL"}</Label>
                <Input
                  value={s.watermark_url ?? ""}
                  onChange={(e) => updateField("watermark_url", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              {s.watermark_url && (
                <>
                  <div className="flex justify-center rounded-lg border border-dashed p-4">
                    <img src={s.watermark_url} alt="Watermark" className="max-h-16 object-contain" style={{ opacity: (s.watermark_opacity ?? 30) / 100 }} />
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "الشفافية" : "Transparency"} ({s.watermark_opacity ?? 30}%)</Label>
                    <Slider
                      value={[s.watermark_opacity ?? 30]}
                      onValueChange={([v]) => updateField("watermark_opacity", v)}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Stamp */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stamp className="h-4 w-4" />
                {isAr ? "ختم الفاتورة" : "Invoice Stamp"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{isAr ? "رابط الختم" : "Stamp URL"}</Label>
                <Input
                  value={s.stamp_url ?? ""}
                  onChange={(e) => updateField("stamp_url", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              {s.stamp_url && (
                <>
                  <div className="flex justify-center rounded-lg border border-dashed p-4">
                    <img src={s.stamp_url} alt="Stamp" className="max-h-16 object-contain" style={{ opacity: (s.stamp_opacity ?? 30) / 100 }} />
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "الشفافية" : "Transparency"} ({s.stamp_opacity ?? 30}%)</Label>
                    <Slider
                      value={[s.stamp_opacity ?? 30]}
                      onValueChange={([v]) => updateField("stamp_opacity", v)}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "موضع الختم" : "Stamp Position"}</Label>
                    <div className="flex gap-2">
                      {[
                        { val: "right", icon: AlignRight, label: isAr ? "يمين" : "Right" },
                        { val: "center", icon: AlignCenter, label: isAr ? "وسط" : "Center" },
                        { val: "left", icon: AlignLeft, label: isAr ? "يسار" : "Left" },
                      ].map((pos) => (
                        <Button
                          key={pos.val}
                          variant={(s.stamp_position ?? "right") === pos.val ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateField("stamp_position", pos.val)}
                          className="gap-1.5"
                        >
                          <pos.icon className="h-3.5 w-3.5" />
                          {pos.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
