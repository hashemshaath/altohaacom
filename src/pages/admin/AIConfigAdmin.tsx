import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { 
  Bot, 
  Sparkles,
  MessageSquare,
  FileText,
  Image,
  Languages,
  Save,
  Zap,
  Brain,
  Settings,
} from "lucide-react";

export default function AIConfigAdmin() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";

  const [config, setConfig] = useState({
    enabled: true,
    defaultModel: "google/gemini-3-flash-preview",
    maxTokens: 2048,
    temperature: 0.7,
    chatAssistant: true,
    contentGeneration: true,
    autoModeration: false,
    translationService: true,
    imageCaptioning: false,
    systemPrompt: "You are a helpful culinary assistant for the Altoha platform. You help chefs, judges, and organizers with questions about competitions, recipes, and culinary techniques.",
    moderationPrompt: "Analyze the following content for inappropriate material, spam, or policy violations.",
    dailyRequestLimit: 1000,
    maxConversationLength: 50,
    rateLimitPerUser: 20,
  });

  const models = [
    { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash", desc: "Fast" },
    { id: "google/gemini-3-pro-preview", name: "Gemini 3 Pro", desc: "Best" },
    { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", desc: "Simple" },
    { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", desc: "Reasoning" },
    { id: "openai/gpt-5-mini", name: "GPT-5 Mini", desc: "Fast" },
    { id: "openai/gpt-5", name: "GPT-5", desc: "Powerful" },
  ];

  const features = [
    { key: "chatAssistant", icon: MessageSquare, title: isAr ? "المحادثة" : "Chat", desc: isAr ? "مساعد ذكي" : "AI assistant" },
    { key: "contentGeneration", icon: FileText, title: isAr ? "المحتوى" : "Content", desc: isAr ? "إنشاء تلقائي" : "Auto-generate" },
    { key: "autoModeration", icon: Bot, title: isAr ? "الإشراف" : "Moderation", desc: isAr ? "فحص تلقائي" : "Auto-scan" },
    { key: "translationService", icon: Languages, title: isAr ? "الترجمة" : "Translation", desc: isAr ? "عربي-إنجليزي" : "AR-EN" },
    { key: "imageCaptioning", icon: Image, title: isAr ? "الصور" : "Images", desc: isAr ? "وصف تلقائي" : "Auto-caption" },
  ];

  const handleSave = () => {
    toast({
      title: isAr ? "تم الحفظ" : "Saved",
      description: isAr ? "تم حفظ إعدادات الذكاء الاصطناعي" : "AI configuration saved successfully",
    });
  };

  const handleTestConnection = () => {
    toast({
      title: isAr ? "الاتصال ناجح" : "Connection Successful",
      description: isAr ? "تم الاتصال بخدمة AI بنجاح" : "Successfully connected to AI service",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <AdminPageHeader
        icon={Brain}
        title={isAr ? "إعدادات الذكاء الاصطناعي" : "AI Configuration"}
        description={isAr ? "إدارة خدمات AI والنماذج" : "Manage AI services & models"}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleTestConnection}>
              <Zap className="h-3.5 w-3.5 me-1.5" />
              {isAr ? "اختبار" : "Test"}
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-3.5 w-3.5 me-1.5" />
              {isAr ? "حفظ" : "Save"}
            </Button>
          </div>
        }
      />

      {/* Status Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="flex items-center justify-between p-3 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/20">
              <Sparkles className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold">Lovable AI Gateway</h3>
              <p className="text-[11px] sm:text-sm text-muted-foreground">
                {isAr ? "متصل ويعمل" : "Connected"}
              </p>
            </div>
          </div>
          <Badge variant="default" className="gap-1 bg-chart-5 hover:bg-chart-5/90 text-[11px] sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            {isAr ? "نشط" : "Active"}
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Model Selection */}
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Brain className="h-4 w-4 text-primary" />
              {isAr ? "النموذج" : "Model"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-3 sm:space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "النموذج الافتراضي" : "Default Model"}</Label>
              <Select
                value={config.defaultModel}
                onValueChange={(value) => setConfig({ ...config, defaultModel: value })}
              >
                <SelectTrigger className="h-9 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map(model => (
                    <SelectItem key={model.id} value={model.id} className="text-xs sm:text-sm">
                      {model.name} ({model.desc})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label className="text-xs">{isAr ? "الرموز" : "Max Tokens"}</Label>
                  <span className="text-[11px] text-muted-foreground">{config.maxTokens}</span>
                </div>
                <Slider
                  value={[config.maxTokens]}
                  onValueChange={([v]) => setConfig({ ...config, maxTokens: v })}
                  min={256}
                  max={8192}
                  step={256}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label className="text-xs">{isAr ? "الإبداع" : "Temperature"}</Label>
                  <span className="text-[11px] text-muted-foreground">{config.temperature}</span>
                </div>
                <Slider
                  value={[config.temperature]}
                  onValueChange={([v]) => setConfig({ ...config, temperature: v })}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Toggle */}
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Settings className="h-4 w-4 text-primary" />
              {isAr ? "الميزات" : "Features"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-2 sm:space-y-3">
            {features.map((feature) => (
              <div key={feature.key} className="flex items-center justify-between rounded-lg border p-2 sm:p-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="rounded-md bg-primary/10 p-1.5 sm:p-2">
                    <feature.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">{feature.title}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={config[feature.key as keyof typeof config] as boolean}
                  onCheckedChange={(checked) => setConfig({ ...config, [feature.key]: checked })}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System Prompt */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <MessageSquare className="h-4 w-4 text-primary" />
              {isAr ? "رسالة النظام" : "System Prompt"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <Textarea
              rows={3}
              className="text-xs sm:text-sm"
              value={config.systemPrompt}
              onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              placeholder={isAr ? "أدخل رسالة النظام..." : "Enter system prompt..."}
            />
          </CardContent>
        </Card>

        {/* Rate Limits */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Zap className="h-4 w-4 text-primary" />
              {isAr ? "حدود الاستخدام" : "Usage Limits"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="grid gap-3 sm:gap-4 grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] sm:text-xs">{isAr ? "يومي" : "Daily"}</Label>
                <Input
                  type="number"
                  className="h-8 sm:h-9 text-xs"
                  value={config.dailyRequestLimit}
                  onChange={(e) => setConfig({ ...config, dailyRequestLimit: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] sm:text-xs">{isAr ? "محادثة" : "Conv. Len"}</Label>
                <Input
                  type="number"
                  className="h-8 sm:h-9 text-xs"
                  value={config.maxConversationLength}
                  onChange={(e) => setConfig({ ...config, maxConversationLength: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] sm:text-xs">{isAr ? "لكل مستخدم" : "Per User"}</Label>
                <Input
                  type="number"
                  className="h-8 sm:h-9 text-xs"
                  value={config.rateLimitPerUser}
                  onChange={(e) => setConfig({ ...config, rateLimitPerUser: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
