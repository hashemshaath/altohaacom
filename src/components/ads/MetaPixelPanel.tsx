import { useState, useEffect, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Save, CheckCircle, Facebook, Instagram, Share2, ShieldCheck } from "lucide-react";

interface IntegrationConfig {
  integration_type: string;
  config: Record<string, string>;
  is_active: boolean;
}

const metaIntegrations = [
  {
    type: "facebook_pixel",
    icon: Facebook,
    nameEn: "Facebook Pixel",
    nameAr: "بكسل فيسبوك",
    descEn: "Track conversions, build audiences, and optimize ads from Facebook Pixel events",
    descAr: "تتبع التحويلات وبناء الجماهير وتحسين الإعلانات من أحداث بكسل فيسبوك",
    fields: [
      { key: "pixel_id", labelEn: "Pixel ID", labelAr: "معرف البكسل", placeholder: "123456789012345" },
      { key: "access_token", labelEn: "Access Token (CAPI)", labelAr: "رمز الوصول (CAPI)", placeholder: "EAAxxxxxxxx..." },
    ],
  },
  {
    type: "meta_capi",
    icon: ShieldCheck,
    nameEn: "Meta Conversions API (CAPI)",
    nameAr: "واجهة تحويلات ميتا (CAPI)",
    descEn: "Server-side conversion tracking for reliable, cookie-less attribution",
    descAr: "تتبع التحويلات من جانب الخادم لإسناد موثوق بدون ملفات تعريف الارتباط",
    fields: [
      { key: "dataset_id", labelEn: "Dataset ID", labelAr: "معرف مجموعة البيانات", placeholder: "123456789012345" },
      { key: "access_token", labelEn: "System User Token", labelAr: "رمز مستخدم النظام", placeholder: "EAAxxxxxxxx..." },
      { key: "test_event_code", labelEn: "Test Event Code", labelAr: "رمز حدث الاختبار", placeholder: "TEST12345 (optional)" },
    ],
  },
  {
    type: "facebook_catalog",
    icon: Share2,
    nameEn: "Facebook & Instagram Catalog",
    nameAr: "كتالوج فيسبوك وإنستغرام",
    descEn: "Sync your product catalog for dynamic ads and Instagram Shopping",
    descAr: "مزامنة كتالوج المنتجات للإعلانات الديناميكية والتسوق عبر إنستغرام",
    fields: [
      { key: "catalog_id", labelEn: "Catalog ID", labelAr: "معرف الكتالوج", placeholder: "123456789012345" },
      { key: "business_id", labelEn: "Business Manager ID", labelAr: "معرف مدير الأعمال", placeholder: "123456789012345" },
      { key: "feed_url", labelEn: "Product Feed URL", labelAr: "رابط تغذية المنتجات", placeholder: "https://..." },
    ],
  },
  {
    type: "instagram_shopping",
    icon: Instagram,
    nameEn: "Instagram Shopping",
    nameAr: "تسوق إنستغرام",
    descEn: "Enable product tagging and shopping features on Instagram",
    descAr: "تمكين وسم المنتجات وميزات التسوق على إنستغرام",
    fields: [
      { key: "ig_business_account", labelEn: "IG Business Account ID", labelAr: "معرف حساب الأعمال", placeholder: "17841..." },
      { key: "commerce_account", labelEn: "Commerce Account ID", labelAr: "معرف حساب التجارة", placeholder: "Optional" },
    ],
  },
];

export const MetaPixelPanel = memo(function MetaPixelPanel() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const [configs, setConfigs] = useState<Record<string, IntegrationConfig>>({});

  const { data: savedConfigs = [] } = useQuery({
    queryKey: ["integration-settings-meta"],
    queryFn: async () => {
      const { data } = await supabase
        .from("integration_settings")
        .select("id, integration_type, config, is_active, created_by, created_at, updated_at")
        .in("integration_type", metaIntegrations.map(g => g.type));
      return data || [];
    },
  });

  useEffect(() => {
    const map: Record<string, IntegrationConfig> = {};
    savedConfigs.forEach((s: any) => {
      map[s.integration_type] = {
        integration_type: s.integration_type,
        config: (s.config as Record<string, string>) || {},
        is_active: s.is_active,
      };
    });
    metaIntegrations.forEach(g => {
      if (!map[g.type]) map[g.type] = { integration_type: g.type, config: {}, is_active: false };
    });
    setConfigs(map);
  }, [savedConfigs]);

  const saveIntegration = useMutation({
    mutationFn: async (type: string) => {
      const cfg = configs[type];
      if (!cfg) return;
      const { error } = await supabase.from("integration_settings").upsert({
        integration_type: type,
        config: cfg.config as any,
        is_active: cfg.is_active,
        updated_at: new Date().toISOString(),
      }, { onConflict: "integration_type" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integration-settings-meta"] });
      toast({ title: isAr ? "تم الحفظ" : "Saved successfully" });
    },
    onError: () => toast({ title: isAr ? "حدث خطأ" : "Error", variant: "destructive" }),
  });

  const updateConfig = (type: string, key: string, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [type]: { ...prev[type], config: { ...prev[type]?.config, [key]: value } },
    }));
  };

  const toggleActive = (type: string, active: boolean) => {
    setConfigs(prev => ({ ...prev, [type]: { ...prev[type], is_active: active } }));
  };

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-lg font-semibold">{isAr ? "تكاملات ميتا (فيسبوك وإنستغرام)" : "Meta (Facebook & Instagram)"}</h3>
        <p className="text-sm text-muted-foreground">
          {isAr ? "بكسل فيسبوك، واجهة التحويلات CAPI، والكتالوجات" : "Facebook Pixel, Conversions API (CAPI), and Catalogs"}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {metaIntegrations.map(integration => {
          const cfg = configs[integration.type];
          const isActive = cfg?.is_active || false;
          const isSaved = savedConfigs.some((s: any) => s.integration_type === integration.type);
          return (
            <Card key={integration.type} className={`transition-all ${isActive ? "border-primary/30 shadow-sm" : "border-border/50"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                      <integration.icon className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{isAr ? integration.nameAr : integration.nameEn}</CardTitle>
                      {isSaved && isActive && (
                        <Badge variant="secondary" className="text-[9px] mt-0.5 gap-0.5">
                          <CheckCircle className="h-2.5 w-2.5" />
                          {isAr ? "مفعل" : "Active"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Switch checked={isActive} onCheckedChange={v => toggleActive(integration.type, v)} />
                </div>
                <CardDescription className="text-xs mt-1">
                  {isAr ? integration.descAr : integration.descEn}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {integration.fields.map(field => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-xs">{isAr ? field.labelAr : field.labelEn}</Label>
                    <Input
                      className="h-8 text-sm"
                      placeholder={field.placeholder}
                      value={cfg?.config?.[field.key] || ""}
                      onChange={e => updateConfig(integration.type, field.key, e.target.value)}
                    />
                  </div>
                ))}
                <Button
                  size="sm"
                  className="w-full mt-2 gap-1"
                  onClick={() => saveIntegration.mutate(integration.type)}
                  disabled={saveIntegration.isPending}
                >
                  <Save className="h-3.5 w-3.5" />
                  {isAr ? "حفظ" : "Save"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
