import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Plug, 
  Check, 
  X, 
  ExternalLink,
  Mail,
  MessageSquare,
  CreditCard,
  Cloud,
  Calendar,
  FileText,
  Share2,
  Phone,
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: any;
  category: string;
  connected: boolean;
  configFields?: { key: string; label: string; labelAr: string; type: string; placeholder?: string }[];
}

const integrations: Integration[] = [
  {
    id: "google_analytics",
    name: "Google Analytics",
    nameAr: "تحليلات جوجل",
    description: "Track website traffic and user behavior",
    descriptionAr: "تتبع حركة المرور وسلوك المستخدمين",
    icon: Cloud,
    category: "analytics",
    connected: false,
    configFields: [
      { key: "tracking_id", label: "Tracking ID", labelAr: "معرف التتبع", type: "text", placeholder: "G-XXXXXXXXXX" },
    ],
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    nameAr: "تقويم جوجل",
    description: "Sync competitions and events with Google Calendar",
    descriptionAr: "مزامنة المسابقات والفعاليات مع تقويم جوجل",
    icon: Calendar,
    category: "google",
    connected: false,
    configFields: [
      { key: "client_id", label: "Client ID", labelAr: "معرف العميل", type: "text" },
      { key: "client_secret", label: "Client Secret", labelAr: "سر العميل", type: "password" },
    ],
  },
  {
    id: "google_drive",
    name: "Google Drive",
    nameAr: "جوجل درايف",
    description: "Store and manage media files in Google Drive",
    descriptionAr: "تخزين وإدارة ملفات الوسائط في جوجل درايف",
    icon: FileText,
    category: "google",
    connected: false,
    configFields: [
      { key: "api_key", label: "API Key", labelAr: "مفتاح API", type: "password" },
    ],
  },
  {
    id: "resend",
    name: "Resend",
    nameAr: "Resend",
    description: "Send transactional emails to users",
    descriptionAr: "إرسال رسائل بريد إلكتروني للمستخدمين",
    icon: Mail,
    category: "email",
    connected: false,
    configFields: [
      { key: "api_key", label: "API Key", labelAr: "مفتاح API", type: "password" },
      { key: "from_email", label: "From Email", labelAr: "البريد المرسل", type: "email", placeholder: "noreply@altoha.com" },
    ],
  },
  {
    id: "twilio",
    name: "Twilio",
    nameAr: "Twilio",
    description: "Send SMS and WhatsApp notifications",
    descriptionAr: "إرسال رسائل SMS و WhatsApp",
    icon: Phone,
    category: "sms",
    connected: false,
    configFields: [
      { key: "account_sid", label: "Account SID", labelAr: "معرف الحساب", type: "text" },
      { key: "auth_token", label: "Auth Token", labelAr: "رمز المصادقة", type: "password" },
      { key: "phone_number", label: "Phone Number", labelAr: "رقم الهاتف", type: "text", placeholder: "+1234567890" },
    ],
  },
  {
    id: "stripe",
    name: "Stripe",
    nameAr: "Stripe",
    description: "Process payments and subscriptions",
    descriptionAr: "معالجة المدفوعات والاشتراكات",
    icon: CreditCard,
    category: "payment",
    connected: false,
    configFields: [
      { key: "publishable_key", label: "Publishable Key", labelAr: "المفتاح العام", type: "text" },
      { key: "secret_key", label: "Secret Key", labelAr: "المفتاح السري", type: "password" },
      { key: "webhook_secret", label: "Webhook Secret", labelAr: "سر Webhook", type: "password" },
    ],
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    nameAr: "واتساب للأعمال",
    description: "Send WhatsApp notifications",
    descriptionAr: "إرسال إشعارات عبر واتساب",
    icon: MessageSquare,
    category: "messaging",
    connected: false,
    configFields: [
      { key: "phone_number_id", label: "Phone Number ID", labelAr: "معرف رقم الهاتف", type: "text" },
      { key: "access_token", label: "Access Token", labelAr: "رمز الوصول", type: "password" },
    ],
  },
  {
    id: "social_share",
    name: "Social Sharing",
    nameAr: "المشاركة الاجتماعية",
    description: "Enable sharing to social platforms",
    descriptionAr: "تفعيل المشاركة على منصات التواصل",
    icon: Share2,
    category: "social",
    connected: true,
    configFields: [],
  },
];

export default function IntegrationsAdmin() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [integrationStates, setIntegrationStates] = useState<Record<string, boolean>>(
    Object.fromEntries(integrations.map(i => [i.id, i.connected]))
  );
  const [configValues, setConfigValues] = useState<Record<string, Record<string, string>>>({});
  const [activeConfig, setActiveConfig] = useState<string | null>(null);

  const categories = [
    { id: "all", label: language === "ar" ? "الكل" : "All" },
    { id: "google", label: language === "ar" ? "جوجل" : "Google" },
    { id: "email", label: language === "ar" ? "البريد" : "Email" },
    { id: "sms", label: language === "ar" ? "الرسائل" : "SMS" },
    { id: "payment", label: language === "ar" ? "الدفع" : "Payment" },
    { id: "analytics", label: language === "ar" ? "التحليلات" : "Analytics" },
    { id: "social", label: language === "ar" ? "التواصل" : "Social" },
  ];

  const handleToggle = (id: string, connected: boolean) => {
    if (connected && !integrationStates[id]) {
      setActiveConfig(id);
    } else {
      setIntegrationStates(prev => ({ ...prev, [id]: connected }));
      toast({
        title: connected 
          ? (language === "ar" ? "تم التفعيل" : "Enabled") 
          : (language === "ar" ? "تم التعطيل" : "Disabled"),
        description: connected
          ? (language === "ar" ? "تم تفعيل التكامل بنجاح" : "Integration enabled successfully")
          : (language === "ar" ? "تم تعطيل التكامل" : "Integration disabled"),
      });
    }
  };

  const handleSaveConfig = (integrationId: string) => {
    setIntegrationStates(prev => ({ ...prev, [integrationId]: true }));
    setActiveConfig(null);
    toast({
      title: language === "ar" ? "تم الحفظ" : "Saved",
      description: language === "ar" ? "تم حفظ إعدادات التكامل" : "Integration settings saved",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">
          {language === "ar" ? "التكاملات والربط" : "Integrations"}
        </h1>
        <p className="text-muted-foreground">
          {language === "ar" 
            ? "ربط المنصة مع الخدمات والأدوات الخارجية" 
            : "Connect platform with external services and tools"}
        </p>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="flex-wrap h-auto">
          {categories.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id}>{cat.label}</TabsTrigger>
          ))}
        </TabsList>

        {categories.map(cat => (
          <TabsContent key={cat.id} value={cat.id} className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {integrations
                .filter(i => cat.id === "all" || i.category === cat.id)
                .map((integration) => (
                  <Card key={integration.id} className={cn(
                    "transition-all",
                    integrationStates[integration.id] && "ring-2 ring-primary"
                  )}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <integration.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {language === "ar" ? integration.nameAr : integration.name}
                            </CardTitle>
                            <Badge 
                              variant={integrationStates[integration.id] ? "default" : "secondary"}
                              className="mt-1"
                            >
                              {integrationStates[integration.id] 
                                ? (language === "ar" ? "متصل" : "Connected")
                                : (language === "ar" ? "غير متصل" : "Not Connected")}
                            </Badge>
                          </div>
                        </div>
                        <Switch
                          checked={integrationStates[integration.id]}
                          onCheckedChange={(checked) => handleToggle(integration.id, checked)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {language === "ar" ? integration.descriptionAr : integration.description}
                      </p>

                      {activeConfig === integration.id && integration.configFields && integration.configFields.length > 0 && (
                        <div className="space-y-3 border-t pt-4">
                          {integration.configFields.map(field => (
                            <div key={field.key} className="space-y-1">
                              <Label className="text-xs">
                                {language === "ar" ? field.labelAr : field.label}
                              </Label>
                              <Input
                                type={field.type}
                                placeholder={field.placeholder}
                                value={configValues[integration.id]?.[field.key] || ""}
                                onChange={(e) => setConfigValues(prev => ({
                                  ...prev,
                                  [integration.id]: {
                                    ...prev[integration.id],
                                    [field.key]: e.target.value
                                  }
                                }))}
                              />
                            </div>
                          ))}
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" onClick={() => handleSaveConfig(integration.id)}>
                              <Check className="me-1 h-3 w-3" />
                              {language === "ar" ? "حفظ" : "Save"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setActiveConfig(null)}>
                              <X className="me-1 h-3 w-3" />
                              {language === "ar" ? "إلغاء" : "Cancel"}
                            </Button>
                          </div>
                        </div>
                      )}

                      {integrationStates[integration.id] && activeConfig !== integration.id && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setActiveConfig(integration.id)}
                        >
                          <Settings className="me-2 h-3 w-3" />
                          {language === "ar" ? "إعدادات" : "Configure"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
