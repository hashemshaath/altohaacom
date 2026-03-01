import { useState, useEffect } from "react";
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
import { Save, CheckCircle, Camera, ShieldCheck, LayoutGrid } from "lucide-react";

interface IntegrationConfig {
  integration_type: string;
  config: Record<string, string>;
  is_active: boolean;
}

const snapIntegrations = [
  {
    type: "snap_pixel",
    icon: Camera,
    nameEn: "Snap Pixel",
    nameAr: "بكسل سناب شات",
    descEn: "Measure cross-device ad performance and optimize Snapchat campaigns",
    descAr: "قياس أداء الإعلانات عبر الأجهزة وتحسين حملات سناب شات",
    fields: [
      { key: "pixel_id", labelEn: "Pixel ID", labelAr: "معرف البكسل", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx" },
    ],
  },
  {
    type: "snap_capi",
    icon: ShieldCheck,
    nameEn: "Snap Conversions API (CAPI)",
    nameAr: "واجهة تحويلات سناب شات (CAPI)",
    descEn: "Server-side integration for reliable Snapchat conversion tracking without cookies",
    descAr: "تكامل من جانب الخادم لتتبع تحويلات سناب شات بشكل موثوق بدون كوكيز",
    fields: [
      { key: "pixel_id", labelEn: "Pixel ID", labelAr: "معرف البكسل", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx" },
      { key: "access_token", labelEn: "CAPI Token", labelAr: "رمز CAPI", placeholder: "eyJhbGci..." },
      { key: "test_mode", labelEn: "Test Mode", labelAr: "وضع الاختبار", placeholder: "true / false" },
    ],
  },
  {
    type: "snap_catalog",
    icon: LayoutGrid,
    nameEn: "Snapchat Product Catalog",
    nameAr: "كتالوج منتجات سناب شات",
    descEn: "Sync products for dynamic Snapchat ads and Shopping Lens",
    descAr: "مزامنة المنتجات للإعلانات الديناميكية وعدسة التسوق في سناب شات",
    fields: [
      { key: "catalog_id", labelEn: "Catalog ID", labelAr: "معرف الكتالوج", placeholder: "Catalog ID" },
      { key: "organization_id", labelEn: "Organization ID", labelAr: "معرف المنظمة", placeholder: "Org ID" },
      { key: "feed_url", labelEn: "Product Feed URL", labelAr: "رابط تغذية المنتجات", placeholder: "https://..." },
    ],
  },
];

export function SnapPixelPanel() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const [configs, setConfigs] = useState<Record<string, IntegrationConfig>>({});

  const { data: savedConfigs = [] } = useQuery({
    queryKey: ["integration-settings-snap"],
    queryFn: async () => {
      const { data } = await supabase
        .from("integration_settings")
        .select("*")
        .in("integration_type", snapIntegrations.map(g => g.type));
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
    snapIntegrations.forEach(g => {
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
      qc.invalidateQueries({ queryKey: ["integration-settings-snap"] });
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
        <h3 className="text-lg font-semibold">{isAr ? "تكاملات سناب شات" : "Snapchat Integrations"}</h3>
        <p className="text-sm text-muted-foreground">
          {isAr ? "بكسل سناب شات، واجهة التحويلات CAPI، وكتالوج المنتجات" : "Snap Pixel, Conversions API (CAPI), and Product Catalog"}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {snapIntegrations.map(integration => {
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
