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
import { BarChart3, Globe, Tag, Target, Save, CheckCircle } from "lucide-react";

interface IntegrationConfig {
  integration_type: string;
  config: Record<string, string>;
  is_active: boolean;
}

const googleIntegrations = [
  {
    type: "google_analytics",
    icon: BarChart3,
    nameEn: "Google Analytics 4",
    nameAr: "تحليلات جوجل 4",
    descEn: "Track user behavior, traffic sources, and ad performance with GA4",
    descAr: "تتبع سلوك المستخدمين ومصادر الحركة وأداء الإعلانات مع GA4",
    fields: [
      { key: "measurement_id", labelEn: "Measurement ID", labelAr: "معرف القياس", placeholder: "G-XXXXXXXXXX" },
      { key: "stream_id", labelEn: "Stream ID", labelAr: "معرف البث", placeholder: "Optional" },
    ],
  },
  {
    type: "google_tag_manager",
    icon: Tag,
    nameEn: "Google Tag Manager",
    nameAr: "إدارة علامات جوجل",
    descEn: "Manage marketing tags and conversion tracking centrally",
    descAr: "إدارة علامات التسويق وتتبع التحويلات مركزياً",
    fields: [
      { key: "container_id", labelEn: "Container ID", labelAr: "معرف الحاوية", placeholder: "GTM-XXXXXXX" },
    ],
  },
  {
    type: "google_ads",
    icon: Target,
    nameEn: "Google Ads",
    nameAr: "إعلانات جوجل",
    descEn: "Enable Google Ads conversion tracking and remarketing",
    descAr: "تمكين تتبع تحويلات إعلانات جوجل وإعادة الاستهداف",
    fields: [
      { key: "conversion_id", labelEn: "Conversion ID", labelAr: "معرف التحويل", placeholder: "AW-XXXXXXXXX" },
      { key: "conversion_label", labelEn: "Conversion Label", labelAr: "تسمية التحويل", placeholder: "Optional" },
      { key: "remarketing_tag", labelEn: "Remarketing Tag", labelAr: "علامة إعادة الاستهداف", placeholder: "Optional" },
    ],
  },
  {
    type: "google_adsense",
    icon: Globe,
    nameEn: "Google AdSense",
    nameAr: "جوجل أدسنس",
    descEn: "Serve Google AdSense ads alongside platform ads",
    descAr: "عرض إعلانات جوجل أدسنس جنباً إلى جنب مع إعلانات المنصة",
    fields: [
      { key: "publisher_id", labelEn: "Publisher ID", labelAr: "معرف الناشر", placeholder: "ca-pub-XXXXXXXXXXXXXXXX" },
      { key: "ad_slot", labelEn: "Default Ad Slot", labelAr: "شريحة الإعلان الافتراضية", placeholder: "Optional" },
    ],
  },
  {
    type: "google_places",
    icon: Globe,
    nameEn: "Google Places API",
    nameAr: "واجهة أماكن جوجل",
    descEn: "Enable smart content import for entities & companies using Google Maps data",
    descAr: "تمكين الاستيراد الذكي للكيانات والشركات باستخدام بيانات خرائط جوجل",
    fields: [
      { key: "api_key", labelEn: "API Key", labelAr: "مفتاح API", placeholder: "AIzaSy..." },
    ],
  },
];

export const GoogleIntegrationPanel = memo(function GoogleIntegrationPanel() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const [configs, setConfigs] = useState<Record<string, IntegrationConfig>>({});

  const { data: savedConfigs = [] } = useQuery({
    queryKey: ["integration-settings-google"],
    queryFn: async () => {
      const { data } = await supabase
        .from("integration_settings")
        .select("id, integration_type, config, is_active, created_by, created_at, updated_at")
        .in("integration_type", googleIntegrations.map(g => g.type));
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
    // Fill defaults
    googleIntegrations.forEach(g => {
      if (!map[g.type]) {
        map[g.type] = { integration_type: g.type, config: {}, is_active: false };
      }
    });
    setConfigs(map);
  }, [savedConfigs]);

  const saveIntegration = useMutation({
    mutationFn: async (type: string) => {
      const cfg = configs[type];
      if (!cfg) return;
      // Save to integration_settings
      const { error } = await supabase.from("integration_settings").upsert({
        integration_type: type,
        config: cfg.config as any,
        is_active: cfg.is_active,
        updated_at: new Date().toISOString(),
      }, { onConflict: "integration_type" });
      if (error) throw error;

      // Also sync to marketing_tracking_config for script injection
      const platformMap: Record<string, string> = {
        google_analytics: "google_analytics_4",
        google_tag_manager: "google_tag_manager",
        google_ads: "google_ads",
      };
      const platform = platformMap[type];
      if (platform) {
        const trackingIdKey = type === "google_analytics" ? "measurement_id"
          : type === "google_tag_manager" ? "container_id"
          : "conversion_id";
        await supabase.from("marketing_tracking_config").update({
          tracking_id: cfg.config?.[trackingIdKey] || null,
          is_active: cfg.is_active,
          config: cfg.config as any,
          updated_at: new Date().toISOString(),
        }).eq("platform", platform);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integration-settings-google"] });
      toast({ title: isAr ? "تم الحفظ" : "Saved successfully" });
    },
    onError: () => toast({ title: isAr ? "حدث خطأ" : "Error", variant: "destructive" }),
  });

  const updateConfig = (type: string, key: string, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        config: { ...prev[type]?.config, [key]: value },
      },
    }));
  };

  const toggleActive = (type: string, active: boolean) => {
    setConfigs(prev => ({
      ...prev,
      [type]: { ...prev[type], is_active: active },
    }));
  };

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-lg font-semibold">{isAr ? "تكاملات جوجل" : "Google Integrations"}</h3>
        <p className="text-sm text-muted-foreground">
          {isAr ? "ربط منصتك مع خدمات جوجل للتحليلات والإعلانات" : "Connect your platform with Google services for analytics and advertising"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {googleIntegrations.map(integration => {
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
